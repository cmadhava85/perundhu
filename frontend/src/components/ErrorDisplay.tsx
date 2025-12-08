import React, { useState } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!error) return null;
  
  // Check if it's an API Error with details
  const isApiError = error instanceof ApiError;
  const apiError = isApiError ? error as ApiError : null;
  
  // Get user-friendly error message
  const { message, suggestion } = getUserFriendlyErrorMessage(error);
  
  // Determine error type for specific styling
  const isNoRoutesFound = apiError?.code === 'NO_ROUTES_FOUND' || apiError?.status === 404;
  const isNetworkError = apiError?.status === 0 || message.includes('Network error') || message.includes('Unable to connect');
  const isServerError = apiError?.status && apiError.status >= 500;
  const isRateLimitError = apiError?.status === 429 || apiError?.code === 'RATE_LIMIT_EXCEEDED';
  const isDuplicateError = apiError?.status === 409 || apiError?.code === 'DUPLICATE_ENTRY';
  const isTimeoutError = message.includes('timeout') || message.includes('took too long');
  
  // Get error-specific content
  const getErrorContent = () => {
    if (isRateLimitError) {
      return {
        icon: '⏱️',
        title: t('error.rateLimit.title', 'Slow Down'),
        message: t('error.rateLimit.message', 'You\'re making too many requests.'),
        suggestions: [
          t('error.rateLimit.suggestion1', 'Wait about a minute before trying again'),
          t('error.rateLimit.suggestion2', 'Avoid refreshing the page repeatedly')
        ],
        actionText: t('error.rateLimit.action', 'Try Again'),
        type: 'rate-limit'
      };
    }

    if (isDuplicateError) {
      return {
        icon: '📋',
        title: t('error.duplicate.title', 'Already Exists'),
        message: t('error.duplicate.message', 'This item already exists in our system.'),
        suggestions: [
          t('error.duplicate.suggestion1', 'Check if this has already been submitted'),
          t('error.duplicate.suggestion2', 'Try with different details')
        ],
        actionText: t('error.duplicate.action', 'Modify'),
        type: 'duplicate'
      };
    }

    if (isTimeoutError) {
      return {
        icon: '⏳',
        title: t('error.timeout.title', 'Request Timed Out'),
        message: t('error.timeout.message', 'The request took too long to complete.'),
        suggestions: [
          t('error.timeout.suggestion1', 'Check your internet connection'),
          t('error.timeout.suggestion2', 'Try again in a moment')
        ],
        actionText: t('error.timeout.action', 'Retry'),
        type: 'timeout'
      };
    }

    if (isNoRoutesFound) {
      return {
        icon: '🔍',
        title: t('error.noRoutesFound.title', 'No Routes Found'),
        message: t('error.noRoutesFound.message', 'We couldn\'t find any bus routes between these locations.'),
        suggestions: [
          t('error.noRoutesFound.suggestion1', 'Try different locations'),
          t('error.noRoutesFound.suggestion2', 'Check for connecting routes'),
          t('error.noRoutesFound.suggestion3', 'Verify location names are spelled correctly')
        ],
        actionText: t('error.noRoutesFound.action', 'Search Again'),
        secondaryText: t('error.modifySearch', 'Modify Search'),
        type: 'no-routes'
      };
    }
    
    if (isNetworkError) {
      return {
        icon: '📡',
        title: t('error.network.title', 'Connection Problem'),
        message: t('error.network.message', 'Unable to connect to our servers.'),
        suggestions: [
          t('error.network.suggestion1', 'Check your internet connection'),
          t('error.network.suggestion2', 'Try again in a few moments')
        ],
        actionText: t('error.network.action', 'Retry'),
        type: 'network'
      };
    }
    
    if (isServerError) {
      return {
        icon: '⚙️',
        title: t('error.server.title', 'Server Error'),
        message: t('error.server.message', 'Our servers are experiencing issues.'),
        suggestions: [
          t('error.server.suggestion1', 'Please try again later'),
          t('error.server.suggestion2', 'Contact support if problem persists')
        ],
        actionText: t('error.server.action', 'Try Again'),
        type: 'server'
      };
    }
    
    // Default error
    return {
      icon: '⚠️',
      title: t('error.general.title', 'Something went wrong'),
      message: message,
      suggestions: suggestion ? [suggestion] : [],
      actionText: t('error.general.action', 'Try Again'),
      type: 'general'
    };
  };
  
  const errorContent = getErrorContent();
  
  return (
    <div className={`modern-error-display ${errorContent.type}`} data-testid="error-display">
      <div className="error-card">
        {/* Main error header */}
        <div className="error-header">
          <div className="error-main-content">
            <div className="error-icon-modern">{errorContent.icon}</div>
            <div className="error-text-content">
              <h3 className="error-title-modern">{errorContent.title}</h3>
              <p className="error-message-modern">{errorContent.message}</p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="error-actions-modern">
            {reset && (
              <button className="error-btn primary" onClick={reset}>
                <span className="btn-icon">🔄</span>
                <span className="btn-text">{errorContent.actionText}</span>
              </button>
            )}
            
            {isNoRoutesFound && (
              <button 
                className="error-btn secondary"
                onClick={() => {
                  const searchForm = document.querySelector('.search-form');
                  if (searchForm) {
                    searchForm.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <span className="btn-icon">🔍</span>
                <span className="btn-text">{errorContent.secondaryText}</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Expandable suggestions section */}
        {errorContent.suggestions.length > 0 && (
          <div className="error-suggestions-section">
            <button 
              className="suggestions-toggle"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span className="toggle-icon">💡</span>
              <span className="toggle-text">
                {isExpanded ? 'Hide Suggestions' : 'Show Suggestions'}
              </span>
              <span className={`chevron ${isExpanded ? 'expanded' : ''}`}>▼</span>
            </button>
            
            {isExpanded && (
              <div className="suggestions-content">
                <ul className="suggestions-list-modern">
                  {errorContent.suggestions.map((suggestion, index) => (
                    <li key={index} className="suggestion-item-modern">
                      <span className="suggestion-bullet">→</span>
                      <span className="suggestion-text">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Error code display */}
        {apiError?.code && (
          <div className="error-code-section">
            <span className="error-code-label">Error Code:</span>
            <code className="error-code-value">{apiError.code}</code>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;