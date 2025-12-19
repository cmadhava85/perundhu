import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, X, Calendar, Tag } from 'lucide-react';
import { REVIEW_TAGS, REVIEW_TAG_LABELS, type ReviewTag, type SubmitReviewRequest } from '../../types/review';
import reviewService from '../../services/reviewService';

interface SubmitReviewFormProps {
  busId: number;
  busName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Form component for submitting a bus review
 */
export const SubmitReviewForm: React.FC<SubmitReviewFormProps> = ({
  busId,
  busName,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<ReviewTag[]>([]);
  const [travelDate, setTravelDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTagToggle = (tag: ReviewTag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating < 1 || rating > 5) {
      setError(t('review.ratingRequired', 'Please select a rating'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const request: SubmitReviewRequest = {
        busId,
        rating,
        comment: comment.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        travelDate: travelDate || undefined,
      };

      await reviewService.submitReview(request);
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit review';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('review.submitTitle', 'Rate this bus')}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
            aria-label={t('common.close', 'Close')}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="p-4 space-y-5 overflow-y-auto flex-1">
          {/* Bus Name */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400 font-medium">
            {busName}
          </div>

          {/* Star Rating */}
          <div className="flex flex-col items-center space-y-3 py-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('review.yourRating', 'Your Rating')} *
            </label>
            <div className="flex gap-2 sm:gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1.5 sm:p-1 transition-transform active:scale-95 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded touch-manipulation"
                >
                  <Star
                    className={`w-10 h-10 sm:w-8 sm:h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-500 font-medium">
              {rating > 0 ? `${rating}/5` : t('review.tapToRate', 'Tap to rate')}
            </span>
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('review.comment', 'Comment')} ({t('review.optional', 'optional')})
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('review.commentPlaceholder', 'Share your experience...')}
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-gray-400 dark:placeholder-gray-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {comment.length}/500
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Tag className="w-4 h-4" />
              {t('review.tags', 'Tags')} ({t('review.optional', 'optional')})
            </label>
            <div className="flex flex-wrap gap-2">
              {REVIEW_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-4 py-2 sm:px-3 sm:py-1 rounded-full text-sm font-medium transition-all touch-manipulation active:scale-95 ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {t(`review.tag.${tag}`, REVIEW_TAG_LABELS[tag])}
                </button>
              ))}
            </div>
          </div>

          {/* Travel Date */}
          <div>
            <label htmlFor="travelDate" className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Calendar className="w-4 h-4" />
              {t('review.travelDate', 'When did you travel?')} ({t('review.optional', 'optional')})
            </label>
            <input
              type="date"
              id="travelDate"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 pb-safe">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 sm:py-2.5 border border-gray-300 dark:border-gray-600 
                         text-gray-700 dark:text-gray-300 rounded-xl sm:rounded-lg font-medium
                         hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation active:scale-98"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 px-4 py-3 sm:py-2.5 bg-blue-600 text-white rounded-xl sm:rounded-lg font-medium
                         hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                         transition-all flex items-center justify-center gap-2 touch-manipulation active:scale-98
                         shadow-lg shadow-blue-500/25 disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  {t('common.submitting', 'Submitting...')}
                </>
              ) : (
                t('review.submit', 'Submit Review')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitReviewForm;
