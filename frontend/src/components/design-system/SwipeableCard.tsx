import React from 'react';
import { useSwipeGesture, type SwipeState } from '../../hooks/useSwipeGesture';
import './swipeable-card.css';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeLeftLabel?: string;
  swipeRightLabel?: string;
  swipeLeftIcon?: React.ReactNode;
  swipeRightIcon?: React.ReactNode;
  threshold?: number;
  disabled?: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  swipeLeftLabel = 'Action',
  swipeRightLabel = 'Action',
  swipeLeftIcon,
  swipeRightIcon,
  threshold = 100,
  disabled = false,
}) => {
  const { swipeHandlers, swipeState } = useSwipeGesture({
    onSwipeLeft: disabled ? undefined : onSwipeLeft,
    onSwipeRight: disabled ? undefined : onSwipeRight,
    threshold,
  });

  const getSwipeTransform = (state: SwipeState) => {
    if (!state.isSwiping || disabled) return 'translateX(0)';
    
    // Apply resistance: the further you swipe, the harder it gets
    const resistance = 0.4;
    const direction = state.swipeDirection === 'left' ? -1 : 1;
    const distance = state.swipeDistance * resistance;
    
    return `translateX(${direction * distance}px)`;
  };

  const getBackgroundOpacity = (state: SwipeState) => {
    if (!state.isSwiping || disabled) return 0;
    return Math.min(state.swipeDistance / threshold, 1);
  };

  const isThresholdReached = swipeState.swipeDistance >= threshold;

  return (
    <div className="swipeable-card-container">
      {/* Left background action (shown when swiping right) */}
      <div
        className={`swipe-background swipe-background--right ${isThresholdReached && swipeState.swipeDirection === 'right' ? 'active' : ''}`}
        style={{ opacity: swipeState.swipeDirection === 'right' ? getBackgroundOpacity(swipeState) : 0 }}
      >
        <div className="swipe-action-content">
          {swipeRightIcon || (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          )}
          <span className="swipe-action-label">{swipeRightLabel}</span>
        </div>
      </div>

      {/* Right background action (shown when swiping left) */}
      <div
        className={`swipe-background swipe-background--left ${isThresholdReached && swipeState.swipeDirection === 'left' ? 'active' : ''}`}
        style={{ opacity: swipeState.swipeDirection === 'left' ? getBackgroundOpacity(swipeState) : 0 }}
      >
        <div className="swipe-action-content">
          {swipeLeftIcon || (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          )}
          <span className="swipe-action-label">{swipeLeftLabel}</span>
        </div>
      </div>

      {/* Card content */}
      <div
        className={`swipeable-card-content ${swipeState.isSwiping ? 'swiping' : ''} ${disabled ? 'disabled' : ''}`}
        style={{
          transform: getSwipeTransform(swipeState),
          transition: swipeState.isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        {...(disabled ? {} : swipeHandlers)}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableCard;
