import React from 'react';
import './LoadingSkeleton.css';

interface LoadingSkeletonProps {
  count?: number;
  type?: 'bus-card' | 'list' | 'text';
}

/**
 * Skeleton loading component for better perceived performance
 * Shows content placeholders while data is loading
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  count = 3,
  type = 'bus-card',
}) => {
  const renderBusCardSkeleton = () => (
    <div className="skeleton-bus-card" aria-label="Loading bus information">
      <div className="skeleton-header">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-subtitle" />
      </div>
      
      <div className="skeleton-timing">
        <div className="skeleton-time-block">
          <div className="skeleton-line skeleton-time" />
          <div className="skeleton-line skeleton-location" />
        </div>
        
        <div className="skeleton-duration">
          <div className="skeleton-circle" />
        </div>
        
        <div className="skeleton-time-block">
          <div className="skeleton-line skeleton-time" />
          <div className="skeleton-line skeleton-location" />
        </div>
      </div>
      
      <div className="skeleton-footer">
        <div className="skeleton-line skeleton-badge" />
        <div className="skeleton-line skeleton-badge" />
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className="skeleton-list-item" aria-label="Loading list item">
      <div className="skeleton-line skeleton-list-title" />
      <div className="skeleton-line skeleton-list-subtitle" />
    </div>
  );

  const renderTextSkeleton = () => (
    <div className="skeleton-text" aria-label="Loading text">
      <div className="skeleton-line skeleton-text-line" />
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'bus-card':
        return renderBusCardSkeleton();
      case 'list':
        return renderListSkeleton();
      case 'text':
        return renderTextSkeleton();
      default:
        return renderBusCardSkeleton();
    }
  };

  return (
    <div className="skeleton-container" role="status" aria-live="polite">
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
      <span className="sr-only">Loading content...</span>
    </div>
  );
};

export default LoadingSkeleton;
