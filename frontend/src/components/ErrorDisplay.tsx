import React from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../services/api';
import { getUserFriendlyErrorMessage } from '../utils/errorHandling';
import './ErrorDisplay.css';

interface ErrorDisplayProps {
  error: Error | ApiError | null;
  reset?: () => void;
}

/**
 * Component to display errors with user-friendly messages and retry option
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, reset }) => {
  const { t } = useTranslation();
  
  if (!error) return null;
  
  // Check if it's an API Error with details
  const isApiError = error instanceof ApiError;
  const apiError = isApiError ? error as ApiError : null;
  
  // Get user-friendly error message
  const { message, suggestion } = getUserFriendlyErrorMessage(error);
  
  return (
    <div className="error-container" data-testid="error-display">
      <div className="error-header">
        <div className="error-icon">⚠️</div>
        <h3>{t('error.title', 'Error')}</h3>
      </div>
      
      <div className="error-message">
        <p>{message}</p>
        <p className="error-suggestion">{suggestion}</p>
      </div>
      
      {/* Display additional info for API errors */}
      {apiError && apiError.status && (
        <div className="error-status">
          <p>{t('error.status', 'Status')}: {apiError.status}</p>
        </div>
      )}
      
      {/* Display error code if available */}
      {apiError && apiError.code && (
        <div className="error-code">
          {t('error.code', 'Error Code')}: {apiError.code}
        </div>
      )}
      
      {reset && (
        <button className="error-retry-button" onClick={reset}>
          {t('error.retry', 'Try Again')}
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;