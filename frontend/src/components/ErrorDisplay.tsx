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
      
      {apiError && apiError.details && apiError.details.length > 0 && (
        <div className="error-details">
          <details>
            <summary>{t('error.details', 'See Details')}</summary>
            <ul>
              {apiError.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </details>
        </div>
      )}
      
      {apiError && apiError.errorCode && (
        <div className="error-code">
          {t('error.code', 'Error Code')}: {apiError.errorCode}
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