import React from 'react';
import { useTranslation } from 'react-i18next';
import './Loading.css';

interface LoadingProps {
  message?: string;
  fullscreen?: boolean;
  small?: boolean;
}

/**
 * Loading spinner component with configurable size and message
 */
const Loading: React.FC<LoadingProps> = ({ 
  message, 
  fullscreen = false,
  small = false 
}) => {
  const { t } = useTranslation();
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