import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Star } from 'lucide-react';
import reviewService from '../../services/reviewService';
import type { RatingSummary } from '../../types/review';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { StarRatingDisplay } from './StarRatingDisplay';
import { SubmitReviewForm } from './SubmitReviewForm';
import { ReviewList } from './ReviewList';

// Default auth state for when AuthProvider is not available
const defaultAuthState = { isAuthenticated: false, user: null, isLoading: false };

// Create a fallback context with default values
const FallbackAuthContext = createContext(defaultAuthState);

// Try to import the real AuthContext, fall back to our own
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let RealAuthContext: React.Context<any> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  RealAuthContext = require('../../hooks/useAuth').AuthContext;
} catch {
  // AuthContext not available
}

// Use the real context if available, otherwise use fallback
const AuthContextToUse = RealAuthContext || FallbackAuthContext;

/**
 * Safe hook to get auth state without requiring AuthProvider
 * Returns isAuthenticated: false if AuthProvider is not available
 */
const useSafeAuth = () => {
  // Always call useContext unconditionally with a valid context
  const authContext = useContext(AuthContextToUse);
  
  // Return the context value or default if context value is undefined/null
  return authContext || defaultAuthState;
};

interface BusReviewSectionProps {
  busId: number;
  busName: string;
  compact?: boolean; // For bus card display
  className?: string;
}

/**
 * Complete review section for a bus - can be used in bus details or bus cards
 */
export const BusReviewSection: React.FC<BusReviewSectionProps> = ({
  busId,
  busName,
  compact = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const { flags } = useFeatureFlags();
  const { isAuthenticated } = useSafeAuth();
  
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showReviewList, setShowReviewList] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!flags.enableBusReviews) return;
    
    try {
      setIsLoading(true);
      const [summary, reviewed] = await Promise.all([
        reviewService.getRatingSummary(busId),
        isAuthenticated ? reviewService.hasReviewedBus(busId) : Promise.resolve(false),
      ]);
      setRatingSummary(summary);
      setHasReviewed(reviewed);
    } catch (err) {
      console.error('Failed to fetch review data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [busId, flags.enableBusReviews, isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    setHasReviewed(true);
    fetchData(); // Refresh the summary
  };

  const handleWriteReview = () => {
    if (flags.busReviewsRequireLogin && !isAuthenticated) {
      // Show login prompt or redirect
      alert(t('review.loginRequired', 'Please log in to submit a review'));
      return;
    }
    setShowReviewForm(true);
  };

  // Don't render if feature is disabled
  if (!flags.enableBusReviews) {
    return null;
  }

  // Compact view for bus cards
  if (compact) {
    if (isLoading) {
      return null; // Don't show loading state in compact view
    }

    if (!ratingSummary || ratingSummary.reviewCount === 0) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleWriteReview();
          }}
          disabled={hasReviewed}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                     bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300
                     hover:bg-yellow-100 hover:text-yellow-700 dark:hover:bg-yellow-900 
                     dark:hover:text-yellow-300 transition-colors ${className}`}
          style={{ whiteSpace: 'nowrap' }}
        >
          <span style={{ color: '#facc15' }}>☆</span>
          {hasReviewed ? t('reviews.reviewed', 'Reviewed') : t('reviews.rate', 'Rate')}
        </button>
      );
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowReviewList(true);
        }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                   bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 
                   dark:hover:bg-yellow-900/50 transition-colors ${className}`}
        style={{ whiteSpace: 'nowrap' }}
      >
        <StarRatingDisplay
          rating={ratingSummary.averageRating}
          size="sm"
          reviewCount={ratingSummary.reviewCount}
          showValue={false}
        />
      </button>
    );
  }

  // Full view for bus details
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {t('review.ratingsAndReviews', 'Ratings & Reviews')}
          </h3>
          {ratingSummary && ratingSummary.reviewCount > 0 && (
            <StarRatingDisplay
              rating={ratingSummary.averageRating}
              size="md"
              reviewCount={ratingSummary.reviewCount}
            />
          )}
        </div>
        
        {!hasReviewed && (
          <button
            onClick={handleWriteReview}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                       transition-colors text-sm flex items-center gap-2"
          >
            <Star className="w-4 h-4" />
            {t('review.writeReview', 'Write a Review')}
          </button>
        )}
      </div>

      {/* Review List */}
      <ReviewList
        busId={busId}
        onWriteReview={hasReviewed ? undefined : handleWriteReview}
        showWriteButton={!hasReviewed}
      />

      {/* Submit Review Modal */}
      {showReviewForm && (
        <SubmitReviewForm
          busId={busId}
          busName={busName}
          onSuccess={handleReviewSuccess}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Review List Modal (for compact view click) */}
      {showReviewList && compact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {busName} - {t('review.reviews', 'Reviews')}
              </h3>
              <button
                onClick={() => setShowReviewList(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <ReviewList
              busId={busId}
              onWriteReview={hasReviewed ? undefined : handleWriteReview}
              showWriteButton={!hasReviewed}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BusReviewSection;
