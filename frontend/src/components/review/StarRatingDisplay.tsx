import React from 'react';

interface StarRatingDisplayProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

/**
 * Component to display star rating with filled/empty stars
 */
export const StarRatingDisplay: React.FC<StarRatingDisplayProps> = ({
  rating,
  size = 'md',
  showValue = true,
  reviewCount,
  className = '',
}) => {
  const sizeStyles = {
    sm: { fontSize: '12px', gap: '1px' },
    md: { fontSize: '14px', gap: '2px' },
    lg: { fontSize: '18px', gap: '2px' },
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const { fontSize, gap } = sizeStyles[size];
  const textSize = textSizeClasses[size];

  // Round to nearest 0.5
  const roundedRating = Math.round(rating * 2) / 2;

  return (
    <span 
      className={`inline-flex items-center ${className}`}
      style={{ gap: '4px' }}
    >
      <span 
        className="inline-flex"
        style={{ gap, fontSize }}
        aria-label={`${rating.toFixed(1)} out of 5 stars`}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.floor(roundedRating);
          const halfFilled = !filled && star - 0.5 <= roundedRating;

          return (
            <span
              key={star}
              style={{ 
                color: filled || halfFilled ? '#facc15' : '#d1d5db',
                lineHeight: 1,
              }}
            >
              {filled ? '★' : halfFilled ? '★' : '☆'}
            </span>
          );
        })}
      </span>

      {showValue && rating > 0 && (
        <span className={`${textSize} font-medium text-gray-700 dark:text-gray-300`}>
          {rating.toFixed(1)}
        </span>
      )}

      {reviewCount !== undefined && reviewCount > 0 && (
        <span className={`${textSize} text-gray-500 dark:text-gray-400`}>
          ({reviewCount})
        </span>
      )}
    </span>
  );
};

export default StarRatingDisplay;
