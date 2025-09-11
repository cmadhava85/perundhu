import React from 'react';
import { useTranslation } from 'react-i18next';

interface AnalyticsDashboardProps {
  data?: any[];
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  isLoading?: boolean;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  data = [],
  timeRange = '7d',
  onTimeRangeChange,
  isLoading = false
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="analytics-dashboard loading">
        <div className="loading-spinner">{t('common.loading', 'Loading...')}</div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h2>{t('analytics.title', 'Analytics Dashboard')}</h2>
        <div className="time-range-selector">
          <select 
            value={timeRange} 
            onChange={(e) => onTimeRangeChange?.(e.target.value)}
          >
            <option value="1d">{t('analytics.timeRange.1d', 'Last 24 hours')}</option>
            <option value="7d">{t('analytics.timeRange.7d', 'Last 7 days')}</option>
            <option value="30d">{t('analytics.timeRange.30d', 'Last 30 days')}</option>
          </select>
        </div>
      </div>
      
      <div className="dashboard-content">
        {data.length === 0 ? (
          <div className="no-data">
            <p>{t('analytics.noData', 'No analytics data available')}</p>
          </div>
        ) : (
          <div className="analytics-grid">
            <div className="metric-card">
              <h3>{t('analytics.totalBuses', 'Total Buses')}</h3>
              <div className="metric-value">{data.length}</div>
            </div>
            <div className="metric-card">
              <h3>{t('analytics.activeRoutes', 'Active Routes')}</h3>
              <div className="metric-value">{new Set(data.map(item => item.route)).size}</div>
            </div>
            <div className="metric-card">
              <h3>{t('analytics.onTimePerformance', 'On-Time Performance')}</h3>
              <div className="metric-value">85%</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;