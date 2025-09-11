import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingStateProps {
  isLoading: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ isLoading }) => {
  const { t } = useTranslation();

  if (!isLoading) return null;

  return (
    <div className="premium-loading-container">
      <div className="loading-hero">
        <div className="search-animation">
          <div className="bus-loader-premium">
            <div className="bus-chassis"></div>
            <div className="bus-windows">
              <div className="window"></div>
              <div className="window"></div>
              <div className="window"></div>
            </div>
            <div className="bus-wheels">
              <div className="wheel rotating"></div>
              <div className="wheel rotating"></div>
            </div>
          </div>
          <div className="route-line"></div>
          <div className="search-indicators">
            <div className="indicator active"></div>
            <div className="indicator active"></div>
            <div className="indicator active"></div>
          </div>
        </div>
        <div className="loading-content">
          <h3 className="loading-title">{t('search.searching', 'Finding the best routes for you...')}</h3>
          <p className="loading-subtitle">{t('search.searchingDesc', 'Comparing prices, timing, and availability across all operators')}</p>
          <div className="loading-progress">
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
            <div className="progress-steps">
              <span className="step completed">✓ {t('search.step1', 'Searching routes')}</span>
              <span className="step active">⏳ {t('search.step2', 'Checking availability')}</span>
              <span className="step">⏸️ {t('search.step3', 'Comparing prices')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;