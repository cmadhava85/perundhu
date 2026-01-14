import React from 'react';
import './LoadingSpinner.css';

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Custom message to display */
  message?: string;
  /** Whether to show full screen overlay */
  fullScreen?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Loading Spinner Component
 * - Multiple sizes for different contexts
 * - Optional message display
 * - Full screen overlay option
 * - Smooth rotation animation
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  fullScreen = false,
  className = '',
}) => {
  const _sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = (
    <div className={`loading-spinner loading-spinner-${size} ${className}`}>
      <div className="spinner-ring" />
      <div className="spinner-ring" />
      <div className="spinner-ring" />
      <div className="spinner-ring" />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-spinner-fullscreen">
        <div className="loading-spinner-overlay">
          <div className="loading-spinner-container">
            {spinner}
            {message && (
              <p className="loading-spinner-message">{message}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-spinner-inline">
      {spinner}
      {message && (
        <p className="loading-spinner-message">{message}</p>
      )}
    </div>
  );
};

/**
 * Loading Spinner with Button State
 * Shows spinner inside button during loading
 */
export const ButtonLoadingSpinner: React.FC = () => {
  return (
    <span className="inline-flex items-center gap-2">
      <div className="loading-spinner loading-spinner-sm">
        <div className="spinner-ring" />
        <div className="spinner-ring" />
        <div className="spinner-ring" />
        <div className="spinner-ring" />
      </div>
    </span>
  );
};

export default LoadingSpinner;
