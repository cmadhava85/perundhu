import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/AnalyticsComponents.css';

interface AnalyticsErrorProps {
  error: string;
  onRetry: () => void;
}

/**
 * Component for displaying analytics errors with retry option
 */
const AnalyticsError: React.FC<AnalyticsErrorProps> = ({ error, onRetry }) => {
  const { t } = useTranslation();
  
  return (
    <div className="analytics-error">
      <p>{error}</p>
      <button onClick={onRetry}>
        {t('error.retry', 'Try Again')}
      </button>
    </div>
  );
};

export default AnalyticsError;