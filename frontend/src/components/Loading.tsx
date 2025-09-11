import React from 'react';
import { useTranslation } from 'react-i18next';
import './Loading.css';

interface LoadingProps {
  variant?: 'default' | 'skeleton' | 'search' | 'list';
  message?: string;
  fullscreen?: boolean;
  small?: boolean;
}

/**
 * Loading spinner component with configurable size and message
 */
const Loading: React.FC<LoadingProps> = ({ 
  variant = 'default', 
  message, 
  fullscreen = false,
  small = false 
}) => {
  const { t } = useTranslation();

  if (variant === 'skeleton') {
    return (
      <div className="skeleton-loader">
        <div className="skeleton-card">
          <div className="skeleton-text long"></div>
          <div className="skeleton-text medium"></div>
          <div className="skeleton-text short"></div>
        </div>
        <div className="skeleton-card">
          <div className="skeleton-text medium"></div>
          <div className="skeleton-text long"></div>
          <div className="skeleton-text short"></div>
        </div>
        <div className="skeleton-card">
          <div className="skeleton-text short"></div>
          <div className="skeleton-text long"></div>
          <div className="skeleton-text medium"></div>
        </div>
      </div>
    );
  }

  if (variant === 'search') {
    return (
      <div className="loading-container search-loading">
        <div className="loading-icon">🔍</div>
        <div className="loading-text">
          <h3>{t('loading.searching', 'Searching for routes...')}</h3>
          <p>{t('loading.searchMessage', 'Finding the best routes for you')}</p>
        </div>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="skeleton-loader">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="skeleton-bus-item">
            <div className="skeleton-bus-header">
              <div className="skeleton-text medium"></div>
              <div className="skeleton-text short"></div>
            </div>
            <div className="skeleton-bus-route">
              <div className="skeleton-text long"></div>
            </div>
            <div className="skeleton-bus-times">
              <div className="skeleton-text short"></div>
              <div className="skeleton-text short"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const displayMessage = message || t('common.loading', 'Loading...');
  
  const containerClassName = [
    'loading-container',
    fullscreen ? 'fullscreen' : '',
    small ? 'small' : ''
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={containerClassName} 
      data-testid="loading"
      role="alert"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="loading-spinner" aria-hidden="true"></div>
      <p className="loading-text">{displayMessage}</p>
    </div>
  );
};

export default Loading;