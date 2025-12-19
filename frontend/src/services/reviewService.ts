import { api } from './api';
import type { 
  Review, 
  SubmitReviewRequest, 
  RatingSummary, 
  ReviewFeatureStatus, 
  HasReviewedResponse 
} from '../types/review';

/**
 * Service for bus review operations
 */
export const reviewService = {
  /**
   * Check if reviews feature is enabled
   */
  async getFeatureStatus(): Promise<ReviewFeatureStatus> {
    const response = await api.get<ReviewFeatureStatus>('/api/reviews/feature-status');
    return response.data;
  },

  /**
   * Submit a new review for a bus
   */
  async submitReview(request: SubmitReviewRequest): Promise<Review> {
    const response = await api.post<Review>('/api/reviews', request);
    return response.data;
  },

  /**
   * Get all approved reviews for a bus
   */
  async getReviewsForBus(busId: number): Promise<Review[]> {
    const response = await api.get<Review[]>(`/api/reviews/bus/${busId}`);
    return response.data;
  },

  /**
   * Get rating summary for a bus
   */
  async getRatingSummary(busId: number): Promise<RatingSummary> {
    const response = await api.get<RatingSummary>(`/api/reviews/bus/${busId}/summary`);
    return response.data;
  },

  /**
   * Get all reviews by current user
   */
  async getMyReviews(): Promise<Review[]> {
    const response = await api.get<Review[]>('/api/reviews/my-reviews');
    return response.data;
  },

  /**
   * Check if user has already reviewed a bus
   */
  async hasReviewedBus(busId: number): Promise<boolean> {
    const response = await api.get<HasReviewedResponse>(`/api/reviews/bus/${busId}/has-reviewed`);
    return response.data.hasReviewed;
  },

  /**
   * Delete user's own review
   */
  async deleteReview(reviewId: number): Promise<void> {
    await api.delete(`/api/reviews/${reviewId}`);
  },

  // ============ Admin Methods ============

  /**
   * Get all pending reviews (admin only)
   */
  async getPendingReviews(): Promise<Review[]> {
    const response = await api.get<Review[]>('/api/reviews/admin/pending');
    return response.data;
  },

  /**
   * Approve a review (admin only)
   */
  async approveReview(reviewId: number): Promise<Review> {
    const response = await api.put<Review>(`/api/reviews/admin/${reviewId}/approve`);
    return response.data;
  },

  /**
   * Reject a review (admin only)
   */
  async rejectReview(reviewId: number): Promise<Review> {
    const response = await api.put<Review>(`/api/reviews/admin/${reviewId}/reject`);
    return response.data;
  },
};

export default reviewService;
