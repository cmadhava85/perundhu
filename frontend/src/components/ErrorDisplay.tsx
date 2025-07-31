import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/ErrorDisplay.css';

interface ErrorDisplayProps {
  message: string;
  title?: string;
  onRetry?: () => void;
}

/**
 * Component for displaying error messages to users
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  message, 
  title, 
  onRetry 
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="error-display">
      <div className="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12" y2="16" />
        </svg>
      </div>
      
      <h2 className="error-title">
        {title || t('error.defaultTitle', 'Something went wrong')}
      </h2>
      
      <p className="error-message">{message}</p>
      
      {onRetry && (
        <button 
          onClick={onRetry}
          className="retry-button"
        >
          {t('error.retry', 'Try Again')}
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;