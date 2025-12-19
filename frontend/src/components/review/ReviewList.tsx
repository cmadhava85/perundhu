import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, MessageSquare, Calendar, User } from 'lucide-react';
import type { Review } from '../../types/review';
import { REVIEW_TAG_LABELS, type ReviewTag } from '../../types/review';
import reviewService from '../../services/reviewService';
import { StarRatingDisplay } from './StarRatingDisplay';

interface ReviewListProps {
  busId: number;
  onWriteReview?: () => void;
  showWriteButton?: boolean;
}

/**
 * Component to display list of reviews for a bus
 */
export const ReviewList: React.FC<ReviewListProps> = ({
  busId,
  onWriteReview,
  showWriteButton = true,
}) => {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          {t('review.reviews', 'Reviews')} ({reviews.length})
        </h4>
        {showWriteButton && onWriteReview && (
          <button
            onClick={onWriteReview}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <Star className="w-4 h-4" />
            {t('review.writeReview', 'Write a review')}
          </button>
        )}
      </div>

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>{t('review.noReviews', 'No reviews yet')}</p>
          {showWriteButton && onWriteReview && (
            <button
              onClick={onWriteReview}
              className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
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
              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700"
            >
              {/* Rating and Date */}
              <div className="flex items-center justify-between mb-2">
                <StarRatingDisplay rating={review.rating} size="sm" showValue={false} />
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(review.createdAt)}
                </span>
              </div>

              {/* Comment */}
              {review.comment && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {review.comment}
                </p>
              )}

              {/* Tags */}
              {review.tags && review.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {review.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 
                                 text-blue-700 dark:text-blue-300 rounded-full"
                    >
                      {t(`review.tag.${tag}`, REVIEW_TAG_LABELS[tag as ReviewTag] || tag)}
                    </span>
                  ))}
                </div>
              )}

              {/* User info */}
              {review.userId && (
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {review.userId.slice(0, 8)}...
                </div>
              )}

              {/* Travel Date */}
              {review.travelDate && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('review.traveledOn', 'Traveled on')}: {formatDate(review.travelDate)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewList;
