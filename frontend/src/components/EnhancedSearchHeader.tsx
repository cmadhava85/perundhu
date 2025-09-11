import React from 'react';
import { useTranslation } from 'react-i18next';

interface EnhancedSearchHeaderProps {
  fromLocation?: { name: string; coordinates?: [number, number] };
  toLocation?: { name: string; coordinates?: [number, number] };
  busCount?: number;
  searchTime?: string;
  isLoading?: boolean;
}

const EnhancedSearchHeader: React.FC<EnhancedSearchHeaderProps> = ({
  fromLocation,
  toLocation,
  busCount = 0,
  searchTime,
  isLoading = false
}) => {
  const { t } = useTranslation();

  return (
    <div className="enhanced-search-header">
      <div className="search-hero-section">
        <div className="hero-background"></div>
        <div className="hero-content">
          <div className="route-display">
            <div className="location-card from-location">
              <div className="location-icon">📍</div>
              <div className="location-details">
                <span className="location-label">{t('search.from', 'From')}</span>
                <h3 className="location-name">{fromLocation?.name || t('search.selectOrigin', 'Select origin')}</h3>
              </div>
            </div>
            
            <div className="route-connector">
              <div className="connector-line"></div>
              <div className="connector-icon">🚌</div>
              <div className="connector-animation"></div>
            </div>
            
            <div className="location-card to-location">
              <div className="location-icon">🎯</div>
              <div className="location-details">
                <span className="location-label">{t('search.to', 'To')}</span>
                <h3 className="location-name">{toLocation?.name || t('search.selectDestination', 'Select destination')}</h3>
              </div>
            </div>
          </div>
          
          {(fromLocation && toLocation) && (
            <div className="search-results-summary">
              {isLoading ? (
                <div className="loading-summary">
                  <div className="loading-spinner"></div>
                  <span>{t('search.searching', 'Finding the best routes...')}</span>
                </div>
              ) : (
                <div className="results-summary">
                  <div className="summary-stat">
                    <span className="stat-number">{busCount}</span>
                    <span className="stat-label">{t('search.routesFound', 'Routes Found')}</span>
                  </div>
                  {searchTime && (
                    <div className="summary-stat">
                      <span className="stat-number">{searchTime}</span>
                      <span className="stat-label">{t('search.searchTime', 'Search Time')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedSearchHeader;