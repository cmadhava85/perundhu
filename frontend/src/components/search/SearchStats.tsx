import React from 'react';
import { useTranslation } from 'react-i18next';

interface SearchStatsProps {
  stats: {
    totalRoutes: number;
    liveBuses: number;
    averagePrice: number;
    fastestDuration: string;
  };
}

const SearchStats: React.FC<SearchStatsProps> = ({ stats }) => {
  const { t } = useTranslation();

  return (
    <div className="search-stats-dashboard">
      <div className="stats-container">
        <div className="stat-card primary">
          <div className="stat-icon">🚌</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalRoutes}</div>
            <div className="stat-label">{t('search.routesAvailable', 'Routes Available')}</div>
          </div>
          <div className="stat-trend">+12%</div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon live-indicator">🔴</div>
          <div className="stat-content">
            <div className="stat-number">{stats.liveBuses}</div>
            <div className="stat-label">{t('search.liveBuses', 'Live Tracking')}</div>
          </div>
          <div className="stat-trend">Real-time</div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-number">₹{stats.averagePrice}</div>
            <div className="stat-label">{t('search.avgPrice', 'Avg Price')}</div>
          </div>
          <div className="stat-trend">Best value</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-number">{stats.fastestDuration}</div>
            <div className="stat-label">{t('search.fastest', 'Fastest Route')}</div>
          </div>
          <div className="stat-trend">Express</div>
        </div>
      </div>
    </div>
  );
};

export default SearchStats;