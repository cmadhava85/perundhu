import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, MessageSquare, Calendar, User, Edit2, Trash2 } from 'lucide-react';
import { REVIEW_TAG_LABELS, type Review, type ReviewTag } from '../../types/review';
import reviewService from '../../services/reviewService';
import { StarRatingDisplay } from './StarRatingDisplay';
import { EditReviewForm } from './EditReviewForm';

// Fallback auth context
const defaultAuthState = { isAuthenticated: false, user: null, isLoading: false };
const FallbackAuthContext = React.createContext(defaultAuthState);

let RealAuthContext: React.Context<any> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  RealAuthContext = require('../../hooks/useAuth').AuthContext;
} catch {
  // AuthContext not available
}

const AuthContextToUse = RealAuthContext || FallbackAuthContext;

const useSafeAuth = () => {
  const authContext = useContext(AuthContextToUse);
  return authContext || defaultAuthState;
};

interface ReviewListProps {
  busId: number;
  busName?: string;
  onWriteReview?: () => void;
  showWriteButton?: boolean;
  onRefresh?: () => void;
}

/**
 * Component to display list of reviews for a bus
 */
export const ReviewList: React.FC<ReviewListProps> = ({
  busId,
  busName = '',
  onWriteReview,
  showWriteButton = true,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useSafeAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await reviewService.getReviewsForBus(busId);
        setReviews(data);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        setError(t('review.loadError', 'Failed to load reviews'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [busId, t]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm(t('review.confirmDelete', 'Are you sure you want to delete this review?'))) {
      return;
    }

    setDeletingReviewId(reviewId);
    try {
      await reviewService.deleteReview(reviewId);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      onRefresh?.();
    } catch (err) {
      console.error('Failed to delete review:', err);
      setError(t('review.deleteError', 'Failed to delete review'));
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleEditSuccess = () => {
    setEditingReviewId(null);
    // Refresh reviews
    const fetchReviews = async () => {
      try {
        const data = await reviewService.getReviewsForBus(busId);
        setReviews(data);
      } catch (err) {
        console.error('Failed to refresh reviews:', err);
      }
    };
    fetchReviews();
    onRefresh?.();
  };

  const isOwnReview = (review: Review) => {
    return isAuthenticated && user && review.userId === user.id;
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          {t('review.reviews', 'Reviews')} ({reviews.length})
        </h4>
        {showWriteButton && onWriteReview && (
          <button
            onClick={onWriteReview}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 touch-manipulation"
          >
            <Star className="w-4 h-4" />
            {t('review.writeReview', 'Write a review')}
          </button>
        )}
      </div>

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="text-center py-10 sm:py-8 text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl">
          <MessageSquare className="w-10 h-10 sm:w-8 sm:h-8 mx-auto mb-3 opacity-50" />
          <p className="text-base sm:text-sm">{t('review.noReviews', 'No reviews yet')}</p>
          {showWriteButton && onWriteReview && (
            <button
              onClick={onWriteReview}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium 
                         hover:bg-blue-700 transition-colors touch-manipulation"
            >
              {t('review.beFirst', 'Be the first to review')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 
                         hover:shadow-md transition-shadow"
            >
              {/* Rating, Date, and Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <StarRatingDisplay rating={review.rating} size="md" showValue={true} />
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-full">
                  <Calendar className="w-3 h-3" />
                  {formatDate(review.createdAt)}
                </span>
                
                {/* Edit/Delete Buttons */}
                {isOwnReview(review) && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingReviewId(review.id)}
                      className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors touch-manipulation"
                      title={t('review.edit', 'Edit')}
                    >
                      <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      disabled={deletingReviewId === review.id}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors touch-manipulation disabled:opacity-50"
                      title={t('review.delete', 'Delete')}
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                )}
              </div>

              {/* Comment */}
              {review.comment && (
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                  {review.comment}
                </p>
              )}

              {/* Tags */}
              {review.tags && review.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {review.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 
                                 text-blue-700 dark:text-blue-300 rounded-full"
                    >
                      {t(`review.tag.${tag}`, REVIEW_TAG_LABELS[tag as ReviewTag] || tag)}
                    </span>
                  ))}
                </div>
              )}

              {/* User info & Travel Date */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                {review.userId && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {review.userId.slice(0, 8)}...
                  </span>
                )}
                {review.travelDate && (
                  <span>
                    {t('review.traveledOn', 'Traveled on')}: {formatDate(review.travelDate)}
                  </span>
                )}
              </div>

              {/* Edit Modal */}
              {editingReviewId === review.id && (
                <EditReviewForm
                  review={review}
                  busName={busName}
                  onSuccess={handleEditSuccess}
                  onCancel={() => setEditingReviewId(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewList;
