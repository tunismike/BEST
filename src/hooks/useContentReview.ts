import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { mergeItems } from '../utils/merge';
import type {
  ContentItem,
  ContentReview,
  ContentEdit,
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
  categories: string[];
}

export function useContentReview(reviewId: string): UseContentReviewReturn {
  const [baseline, setBaseline] = useState<ContentItem[]>([]);
  const [reviews, setReviews] = useState<ContentReview[]>([]);
  const [edits, setEdits] = useState<ContentEdit[]>([]);
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
          const [reviewsRes, editsRes] = await Promise.all([
            supabase.from('content_reviews').select('*').eq('review_id', reviewId),
            supabase.from('content_edits').select('*').eq('review_id', reviewId),
          ]);

          if (cancelled) return;
          if (reviewsRes.error) throw new Error(reviewsRes.error.message);
          if (editsRes.error) throw new Error(editsRes.error.message);

          setReviews((reviewsRes.data ?? []) as ContentReview[]);
          setEdits((editsRes.data ?? []) as ContentEdit[]);
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
    return () => {
      cancelled = true;
    };
  }, [reviewId]);

  const items = mergeItems(baseline, reviews, edits);

  const categories = Array.from(
    new Set(baseline.map((b) => b.category).filter((c): c is string => !!c))
  );

  const setStatus = useCallback(
    (itemId: string, status: ReviewStatus) => {
      // Optimistic update
      setReviews((prev) => {
        const existing = prev.findIndex((r) => r.item_id === itemId);
        const row: ContentReview = {
          review_id: reviewId,
          item_id: itemId,
          status,
          updated_at: new Date().toISOString(),
        };
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = row;
          return next;
        }
        return [...prev, row];
      });

      if (!supabase) {
        setSaveState(itemId, 'saved');
        return;
      }

      setSaveState(itemId, 'saving');

      supabase
        .from('content_reviews')
        .upsert(
          { review_id: reviewId, item_id: itemId, status },
          { onConflict: 'review_id,item_id' }
        )
        .then(({ error }) => {
          if (error) {
            setSaveState(itemId, 'error');
            setReviews((prev) => prev.filter((r) => r.item_id !== itemId || r.status !== status));
          } else {
            setSaveState(itemId, 'saved');
          }
        });
    },
    [reviewId, setSaveState]
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

  return {
    items,
    isLoading,
    loadError,
    saveStates,
    setStatus,
    saveEdits,
    resetEdits,
    categories,
  };
}
