/**
 * Types for bus review feature
 */

export interface Review {
  id: number;
  busId: number;
  userId?: string;
  rating: number; // 1-5
  comment?: string;
  tags?: string[];
  travelDate?: string; // ISO date string
  status: ReviewStatus;
  createdAt: string; // ISO datetime string
}

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SubmitReviewRequest {
  busId: number;
  rating: number;
  comment?: string;
  tags?: string[];
  travelDate?: string;
}

export interface RatingSummary {
  averageRating: number;
  reviewCount: number;
  formattedRating: string;
}

export interface ReviewFeatureStatus {
  enabled: boolean;
  requireLogin: boolean;
  autoApprove: boolean;
}

export interface HasReviewedResponse {
  hasReviewed: boolean;
}

// Available review tags
export const REVIEW_TAGS = [
  'punctual',
  'clean',
  'crowded',
  'ac-working',
  'staff-friendly',
  'comfortable',
  'delayed',
  'unsafe',
] as const;

export type ReviewTag = typeof REVIEW_TAGS[number];

// Tag display labels (for i18n, use these as keys)
export const REVIEW_TAG_LABELS: Record<ReviewTag, string> = {
  'punctual': 'Punctual',
  'clean': 'Clean',
  'crowded': 'Crowded',
  'ac-working': 'AC Working',
  'staff-friendly': 'Staff Friendly',
  'comfortable': 'Comfortable',
  'delayed': 'Delayed',
  'unsafe': 'Unsafe',
};
