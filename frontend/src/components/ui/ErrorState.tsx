import React from 'react';
import { useTranslation } from 'react-i18next';

interface ErrorStateProps {
  error: string | Error | null;
  onRetry?: () => void;
  onAdjustSearch?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry, onAdjustSearch }) => {
  const { t } = useTranslation();

  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className="premium-error-container">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <h3 className="error-title">{t('search.error.title', 'Search Error')}</h3>
        <p className="error-message">{errorMessage}</p>
        <div className="error-actions">
          {onRetry && (
            <button className="retry-btn primary" onClick={onRetry}>
              <span className="btn-icon">🔄</span>
              {t('search.error.retry', 'Try Again')}
            </button>
          )}
          {onAdjustSearch && (
            <button className="retry-btn secondary" onClick={onAdjustSearch}>
              <span className="btn-icon">⚙️</span>
              {t('search.error.adjust', 'Adjust Search')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorState;