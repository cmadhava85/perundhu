import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Clock, MessageSquare, User, Calendar } from 'lucide-react';
import reviewService from '../../services/reviewService';
import type { Review } from '../../types/review';
import { StarRatingDisplay } from './StarRatingDisplay';

/**
 * Admin dashboard for reviewing and moderating pending reviews
 */
export const ReviewModerationDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [pendingReviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeReviewId, setActiveReviewId] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchPendingReviews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const reviews = await reviewService.getPendingReviews();
      setReviews(reviews);
    } catch (err) {
      console.error('Failed to fetch pending reviews:', err);
      setError(t('review.loadError', 'Failed to load pending reviews'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const handleApprove = async (reviewId: number) => {
    setProcessingId(reviewId);
    try {
      await reviewService.approveReview(reviewId);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      setActiveReviewId(null);
    } catch (err) {
      console.error('Failed to approve review:', err);
      setError(t('review.approveError', 'Failed to approve review'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (reviewId: number) => {
    setProcessingId(reviewId);
    try {
      await reviewService.rejectReview(reviewId);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      setActiveReviewId(null);
    } catch (err) {
      console.error('Failed to reject review:', err);
      setError(t('review.rejectError', 'Failed to reject review'));
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-900 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6" />
            {t('review.moderation', 'Review Moderation')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {pendingReviews.length} {t('review.pendingReviews', 'pending reviews')}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {pendingReviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <CheckCircle className="w-16 h-16 mx-auto mb-3 text-green-500 opacity-50" />
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
            {t('review.noModeration', 'All reviews are moderated!')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {t('review.noMorePending', 'No more reviews pending approval')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingReviews.map((review) => (
            <div
              key={review.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden 
                         hover:shadow-lg transition-all"
            >
              {/* Review Card Header */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <StarRatingDisplay rating={review.rating} size="md" showValue={true} />
                    <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-1 rounded-full">
                      {t('review.pending', 'Pending')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{review.userId ? `${review.userId.slice(0, 8)}...` : 'Anonymous'}</span>
                  </p>
                </div>
                <button
                  onClick={() => setActiveReviewId(activeReviewId === review.id ? null : review.id)}
                  className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 
                             transition-colors touch-manipulation"
                >
                  {activeReviewId === review.id ? t('common.hide', 'Hide') : t('common.view', 'View')}
                </button>
              </div>

              {/* Review Details - Expandable */}
              {activeReviewId === review.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
                  {/* Comment */}
                  {review.comment && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        {t('review.comment', 'Comment')}
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                        {review.comment}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {review.tags && review.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        {t('review.tags', 'Tags')}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {review.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 
                                       text-blue-700 dark:text-blue-300 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                        {t('review.submitted', 'Submitted')}
                      </p>
                      <p className="text-gray-900 dark:text-white flex items-center gap-1 mt-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                    {review.travelDate && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                          {t('review.travelDate', 'Travel Date')}
                        </p>
                        <p className="text-gray-900 dark:text-white mt-1">
                          {new Date(review.travelDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleApprove(review.id)}
                      disabled={processingId === review.id}
                      className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium
                                 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                                 transition-colors flex items-center justify-center gap-2 touch-manipulation"
                    >
                      {processingId === review.id ? (
                        <>
                          <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          {t('common.approving', 'Approving...')}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          {t('review.approve', 'Approve')}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(review.id)}
                      disabled={processingId === review.id}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium
                                 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                                 transition-colors flex items-center justify-center gap-2 touch-manipulation"
                    >
                      {processingId === review.id ? (
                        <>
                          <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          {t('common.rejecting', 'Rejecting...')}
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          {t('review.reject', 'Reject')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewModerationDashboard;
