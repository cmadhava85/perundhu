import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/AnalyticsComponents.css';

/**
 * Simple loading component for analytics data
 */
const AnalyticsLoading: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="analytics-loading">
      <div className="spinner"></div>
      <p>{t('common.loading', 'Loading...')}</p>
    </div>
  );
};

export default AnalyticsLoading;