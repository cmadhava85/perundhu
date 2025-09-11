import React from 'react';
import { useTranslation } from 'react-i18next';

interface AnalyticsDashboardProps {
  // Add props as needed
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = () => {
  const { t } = useTranslation();

  return (
    <div className="analytics-dashboard">
      <h2>{t('analytics.title', 'Analytics Dashboard')}</h2>
      <p>{t('analytics.comingSoon', 'Analytics features coming soon...')}</p>
    </div>
  );
};

export default AnalyticsDashboard;