import type { ContentItem, ContentReview, ContentEdit, ContentComment, EffectiveItem } from '../types';

export function mergeItems(
  baseline: ContentItem[],
  reviews: ContentReview[],
  edits: ContentEdit[],
  comments: ContentComment[]
): EffectiveItem[] {
  const reviewMap = new Map(reviews.map((r) => [r.item_id, r]));
  const editMap = new Map(edits.map((e) => [e.item_id, e]));
  const commentMap = new Map(comments.map((c) => [c.item_id, c]));

  return baseline.map((item) => {
    const review = reviewMap.get(item.id);
    const edit = editMap.get(item.id);
    const commentRow = commentMap.get(item.id);

    const effective: EffectiveItem = {
      ...item,
      status: review?.status ?? 'unreviewed',
      isEdited: !!edit,
      comment: commentRow?.comment ?? '',
      statusUpdatedAt: review?.updated_at,
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
}
