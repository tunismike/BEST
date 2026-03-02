export interface ContentItem {
  id: string;
  title: string;
  category?: string;
  description?: string;
  link?: string;
  media?: string;
  htmlFile?: string;
}

export type ReviewStatus = 'unreviewed' | 'use' | 'like' | 'remove';

export interface ContentReview {
  review_id: string;
  item_id: string;
  reviewer_name: string;
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
  reviewer_name: string;
  comment: string;
  updated_at: string;
}

export interface EffectiveItem extends ContentItem {
  status: ReviewStatus; // The current user's status
  voteCounts: Record<ReviewStatus, number>; // Aggregate votes
  allVotes: { reviewerName: string; status: ReviewStatus }[]; // List of specific votes
  isEdited: boolean;
  comment: string; // The current user's comment
  allComments: { reviewerName: string; text: string; updatedAt: string }[]; // All comments
  statusUpdatedAt?: string;
  editUpdatedAt?: string;
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';
