import React, { useState, useRef, useCallback } from 'react';
import './pull-to-refresh.css';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
  threshold?: number;
  maxPullDistance?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
  threshold = 80,
  maxPullDistance = 120,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);
  
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if we're at the top of the scrollable area
  const checkCanPull = useCallback(() => {
    if (disabled || isRefreshing) return false;
    
    const scrollElement = containerRef.current;
    if (!scrollElement) return false;
    
    // Check if we're at the top of the scroll
    return scrollElement.scrollTop === 0;
  }, [disabled, isRefreshing]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    if (checkCanPull()) {
      setCanPull(true);
      startY.current = e.touches[0].clientY;
    }
  }, [checkCanPull, disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!canPull || disabled || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;
    
    // Only allow pulling down
    if (distance > 0) {
      // Prevent default scrolling when pulling
      e.preventDefault();
      
      // Apply resistance: the further you pull, the harder it gets
      const resistance = 0.5;
      const adjustedDistance = distance * resistance;
      const limitedDistance = Math.min(adjustedDistance, maxPullDistance);
      
      setPullDistance(limitedDistance);
    }
  }, [canPull, disabled, isRefreshing, maxPullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!canPull || disabled) {
      setPullDistance(0);
      setCanPull(false);
      return;
    }
    
    setCanPull(false);
    
    // Trigger refresh if pulled past threshold
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Lock at threshold during refresh
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull to refresh error:', error);
      } finally {
        setIsRefreshing(false);
        // Smooth return to 0
        setPullDistance(0);
      }
    } else {
      // Didn't reach threshold, snap back
      setPullDistance(0);
    }
  }, [canPull, disabled, pullDistance, threshold, isRefreshing, onRefresh]);

  // Calculate indicator state
  const getIndicatorState = () => {
    if (isRefreshing) return 'refreshing';
    if (pullDistance >= threshold) return 'ready';
    if (pullDistance > 0) return 'pulling';
    return 'idle';
  };

  const indicatorState = getIndicatorState();
  const indicatorOpacity = Math.min(pullDistance / threshold, 1);
  const indicatorRotation = (pullDistance / threshold) * 360;

  return (
    <div 
      ref={containerRef}
      className="pull-to-refresh-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div 
        className={`pull-indicator pull-indicator--${indicatorState}`}
        style={{
          transform: `translateY(${pullDistance}px)`,
          opacity: indicatorOpacity,
        }}
      >
        <div 
          className="pull-indicator__icon"
          style={{
            transform: isRefreshing 
              ? 'rotate(0deg)' 
              : `rotate(${indicatorRotation}deg)`,
          }}
        >
          {isRefreshing ? (
            <svg 
              className="pull-indicator__spinner" 
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <circle 
                className="spinner-circle"
                cx="12" 
                cy="12" 
                r="10" 
                fill="none" 
                strokeWidth="3"
              />
            </svg>
          ) : (
            <svg 
              viewBox="0 0 24 24" 
              width="24" 
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          )}
        </div>
        <div className="pull-indicator__text">
          {isRefreshing ? 'Refreshing...' : pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}
        </div>
      </div>

      {/* Content with pull transform */}
      <div 
        className="pull-to-refresh-content"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
