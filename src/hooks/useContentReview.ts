import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import type {
  ContentItem,
  ContentReview,
  ContentEdit,
  ContentComment,
  EffectiveItem,
  ReviewStatus,
  SaveState,
} from '../types';

interface UseContentReviewReturn {
  items: EffectiveItem[];
  isLoading: boolean;
  loadError: string | null;
  saveStates: Record<string, SaveState>;
  setStatus: (itemId: string, status: ReviewStatus) => void;
  saveEdits: (
    itemId: string,
    edits: { title?: string; category?: string; description?: string; link?: string }
  ) => void;
  resetEdits: (itemId: string) => void;
  saveComment: (itemId: string, comment: string) => void;
  categories: string[];
}

export function useContentReview(reviewId: string, reviewerName: string): UseContentReviewReturn {
  const [baseline, setBaseline] = useState<ContentItem[]>([]);
  const [reviews, setReviews] = useState<ContentReview[]>([]);
  const [edits, setEdits] = useState<ContentEdit[]>([]);
  const [comments, setComments] = useState<ContentComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});

  const savedTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const setSaveState = useCallback((itemId: string, state: SaveState) => {
    setSaveStates((prev) => ({ ...prev, [itemId]: state }));

    if (state === 'saved') {
      const existing = savedTimers.current[itemId];
      if (existing) clearTimeout(existing);
      savedTimers.current[itemId] = setTimeout(() => {
        setSaveStates((prev) => {
          if (prev[itemId] === 'saved') return { ...prev, [itemId]: 'idle' };
          return prev;
        });
      }, 2000);
    }
  }, []);

  useEffect(() => {
    return () => {
      Object.values(savedTimers.current).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const baselineRes = await fetch(import.meta.env.BASE_URL + 'content.json');
        if (!baselineRes.ok) throw new Error('Failed to load content.json');
        const baselineData: ContentItem[] = await baselineRes.json();

        if (cancelled) return;
        setBaseline(baselineData);

        if (supabase) {
          console.log(`[useContentReview] Fetching for reviewId: ${reviewId}`);
          const [reviewsRes, editsRes, commentsRes] = await Promise.all([
            supabase.from('content_reviews').select('*').eq('review_id', reviewId),
            supabase.from('content_edits').select('*').eq('review_id', reviewId),
            supabase.from('content_comments').select('*').eq('review_id', reviewId),
          ]);

          if (cancelled) return;
          if (reviewsRes.error) throw new Error(reviewsRes.error.message);
          if (editsRes.error) throw new Error(editsRes.error.message);
          // Comments table might not exist yet — don't fail on it
          if (commentsRes.error && !commentsRes.error.message.includes('does not exist')) {
            throw new Error(commentsRes.error.message);
          }

          console.log(`[useContentReview] Supabase Reviews returned:`, reviewsRes.data);
          setReviews((reviewsRes.data ?? []) as ContentReview[]);
          setEdits((editsRes.data ?? []) as ContentEdit[]);
          setComments((commentsRes.data ?? []) as ContentComment[]);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    // Set up realtime subscriptions
    let reviewsSubscription: any;
    let commentsSubscription: any;

    if (supabase) {
      reviewsSubscription = supabase
        .channel('public:content_reviews')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'content_reviews', filter: `review_id=eq.${reviewId}` }, (payload) => {
          console.log(`[useContentReview] Realtime Reviews Update:`, payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setReviews((prev) => {
              const row = payload.new as ContentReview;
              const next = [...prev];
              const idx = next.findIndex((r) => r.item_id === row.item_id && r.reviewer_name === row.reviewer_name);
              if (idx >= 0) next[idx] = row;
              else next.push(row);
              return next;
            });
          } else if (payload.eventType === 'DELETE') {
            setReviews((prev) => {
              const old = payload.old as Partial<ContentReview>;
              return prev.filter(r => !(r.item_id === old.item_id && r.reviewer_name === old.reviewer_name));
            });
          }
        })
        .subscribe();

      commentsSubscription = supabase
        .channel('public:content_comments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'content_comments', filter: `review_id=eq.${reviewId}` }, (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setComments((prev) => {
              const row = payload.new as ContentComment;
              const next = [...prev];
              const idx = next.findIndex((c) => c.item_id === row.item_id && c.reviewer_name === row.reviewer_name);
              if (idx >= 0) next[idx] = row;
              else next.push(row);
              return next;
            });
          } else if (payload.eventType === 'DELETE') {
            setComments((prev) => {
              const old = payload.old as Partial<ContentComment>;
              return prev.filter(c => !(c.item_id === old.item_id && c.reviewer_name === old.reviewer_name));
            });
          }
        })
        .subscribe();
    }


    return () => {
      cancelled = true;
      reviewsSubscription?.unsubscribe();
      commentsSubscription?.unsubscribe();
    };
  }, [reviewId]);

  // Derive EffectiveItem array directly inside the hook to incorporate grouping by reviewer
  const items: EffectiveItem[] = baseline.map((item) => {
    const itemReviews = reviews.filter((r) => r.item_id === item.id);
    const itemComments = comments.filter((c) => c.item_id === item.id);
    const edit = edits.find((e) => e.item_id === item.id);

    // My status
    const myReview = itemReviews.find((r) => r.reviewer_name === reviewerName);
    const myStatus = myReview?.status ?? 'unreviewed';

    // Aggregate counts
    const voteCounts: Record<ReviewStatus, number> = { unreviewed: 0, use: 0, like: 0, remove: 0 };
    itemReviews.forEach((r) => {
      voteCounts[r.status] = (voteCounts[r.status] || 0) + 1;
    });

    const allVotes = itemReviews.map((r) => ({
      reviewerName: r.reviewer_name,
      status: r.status,
    }));

    // My comment
    const myCommentRow = itemComments.find((c) => c.reviewer_name === reviewerName);
    const myComment = myCommentRow?.comment ?? '';

    // All comments
    const allComments = itemComments
      .filter((c) => !!c.comment)
      .map((c) => ({
        reviewerName: c.reviewer_name,
        text: c.comment,
        updatedAt: c.updated_at
      }))
      .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

    const effective: EffectiveItem = {
      ...item,
      status: myStatus,
      voteCounts,
      allVotes,
      isEdited: !!edit,
      comment: myComment,
      allComments,
      statusUpdatedAt: myReview?.updated_at,
      editUpdatedAt: edit?.updated_at,
    };

    if (edit) {
      if (edit.title != null) effective.title = edit.title;
      if (edit.category != null) effective.category = edit.category;
      if (edit.description != null) effective.description = edit.description;
      if (edit.link != null) effective.link = edit.link;
    }

    return effective;
  });

  const categories = Array.from(
    new Set(baseline.map((b) => b.category).filter((c): c is string => !!c))
  );

  const setStatus = useCallback(
    (itemId: string, status: ReviewStatus) => {
      // Optimistic update
      setReviews((prev) => {
        const existingRowIndex = prev.findIndex((r) => r.item_id === itemId && r.reviewer_name === reviewerName);

        let shouldRemove = false;
        if (existingRowIndex >= 0) {
          // If the user clicked the same status that's already saved, toggle to unreviewed
          shouldRemove = status === 'unreviewed';
        }

        const row: ContentReview = {
          review_id: reviewId,
          item_id: itemId,
          reviewer_name: reviewerName,
          status,
          updated_at: new Date().toISOString(),
        };

        if (existingRowIndex >= 0) {
          const next = [...prev];
          if (shouldRemove) {
            next.splice(existingRowIndex, 1);
          } else {
            next[existingRowIndex] = row;
          }
          return next;
        }

        if (status === 'unreviewed') {
          return prev;
        }

        return [...prev, row];
      });

      if (!supabase) {
        setSaveState(itemId, 'saved');
        return;
      }

      setSaveState(itemId, 'saving');

      if (status === 'unreviewed') {
        supabase
          .from('content_reviews')
          .delete()
          .eq('review_id', reviewId)
          .eq('item_id', itemId)
          .eq('reviewer_name', reviewerName)
          .then(({ error }) => {
            if (error) {
              setSaveState(itemId, 'error');
            } else {
              setSaveState(itemId, 'saved');
            }
          });
      } else {
        supabase
          .from('content_reviews')
          .upsert(
            { review_id: reviewId, item_id: itemId, reviewer_name: reviewerName, status },
            { onConflict: 'review_id,item_id,reviewer_name' }
          )
          .then(({ error }) => {
            if (error) {
              setSaveState(itemId, 'error');
              setReviews((prev) => prev.filter((r) => r.item_id !== itemId || r.reviewer_name !== reviewerName || r.status !== status));
            } else {
              setSaveState(itemId, 'saved');
            }
          });
      }
    },
    [reviewId, reviewerName, setSaveState]
  );

  const saveEdits = useCallback(
    (
      itemId: string,
      editData: { title?: string; category?: string; description?: string; link?: string }
    ) => {
      const row = {
        review_id: reviewId,
        item_id: itemId,
        title: editData.title ?? null,
        category: editData.category ?? null,
        description: editData.description ?? null,
        link: editData.link ?? null,
      };

      const now = new Date().toISOString();
      const editRow: ContentEdit = { ...row, updated_at: now };

      if (!supabase) {
        setEdits((prev) => {
          const idx = prev.findIndex((e) => e.item_id === itemId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = editRow;
            return next;
          }
          return [...prev, editRow];
        });
        setSaveState(itemId, 'saved');
        return;
      }

      setSaveState(itemId, 'saving');

      supabase
        .from('content_edits')
        .upsert(row, { onConflict: 'review_id,item_id' })
        .then(({ error, data }) => {
          if (error) {
            setSaveState(itemId, 'error');
          } else {
            setSaveState(itemId, 'saved');
            const returnedRow: ContentEdit = {
              ...row,
              updated_at: (data as ContentEdit[] | null)?.[0]?.updated_at ?? now,
            };
            setEdits((prev) => {
              const idx = prev.findIndex((e) => e.item_id === itemId);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = returnedRow;
                return next;
              }
              return [...prev, returnedRow];
            });
          }
        });
    },
    [reviewId, setSaveState]
  );

  const resetEdits = useCallback(
    (itemId: string) => {
      if (!supabase) {
        setEdits((prev) => prev.filter((e) => e.item_id !== itemId));
        setSaveState(itemId, 'saved');
        return;
      }

      setSaveState(itemId, 'saving');

      supabase
        .from('content_edits')
        .delete()
        .eq('review_id', reviewId)
        .eq('item_id', itemId)
        .then(({ error }) => {
          if (error) {
            setSaveState(itemId, 'error');
          } else {
            setSaveState(itemId, 'saved');
            setEdits((prev) => prev.filter((e) => e.item_id !== itemId));
          }
        });
    },
    [reviewId, setSaveState]
  );

  const saveComment = useCallback(
    (itemId: string, comment: string) => {
      const now = new Date().toISOString();
      const row: ContentComment = {
        review_id: reviewId,
        item_id: itemId,
        reviewer_name: reviewerName,
        comment,
        updated_at: now,
      };

      // Optimistic update
      setComments((prev) => {
        const idx = prev.findIndex((c) => c.item_id === itemId && c.reviewer_name === reviewerName);
        if (comment === '') {
          // Remove empty comments
          return idx >= 0 ? prev.filter((c) => !(c.item_id === itemId && c.reviewer_name === reviewerName)) : prev;
        }
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = row;
          return next;
        }
        return [...prev, row];
      });

      if (!supabase) {
        setSaveState(itemId, 'saved');
        return;
      }

      setSaveState(itemId, 'saving');

      if (comment === '') {
        // Delete empty comment
        supabase
          .from('content_comments')
          .delete()
          .eq('review_id', reviewId)
          .eq('item_id', itemId)
          .eq('reviewer_name', reviewerName)
          .then(({ error }) => {
            setSaveState(itemId, error ? 'error' : 'saved');
          });
      } else {
        supabase
          .from('content_comments')
          .upsert(
            { review_id: reviewId, item_id: itemId, reviewer_name: reviewerName, comment },
            { onConflict: 'review_id,item_id,reviewer_name' }
          )
          .then(({ error }) => {
            setSaveState(itemId, error ? 'error' : 'saved');
          });
      }
    },
    [reviewId, reviewerName, setSaveState]
  );

  return {
    items,
    isLoading,
    loadError,
    saveStates,
    setStatus,
    saveEdits,
    resetEdits,
    saveComment,
    categories,
  };
}
