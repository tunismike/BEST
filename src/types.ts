export interface ContentItem {
  id: string;
  title: string;
  category?: string;
  description?: string;
  link?: string;
  media?: string;
}

export type ReviewStatus = 'unreviewed' | 'use' | 'like' | 'remove';

export interface ContentReview {
  review_id: string;
  item_id: string;
  status: ReviewStatus;
  updated_at: string;
}

export interface ContentEdit {
  review_id: string;
  item_id: string;
  title: string | null;
  category: string | null;
  description: string | null;
  link: string | null;
  updated_at: string;
}

export interface ContentComment {
  review_id: string;
  item_id: string;
  comment: string;
  updated_at: string;
}

export interface EffectiveItem extends ContentItem {
  status: ReviewStatus;
  isEdited: boolean;
  comment: string;
  statusUpdatedAt?: string;
  editUpdatedAt?: string;
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';
