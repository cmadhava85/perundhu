import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/RouteResults.css';

interface RouteResultsProps {
  results: any[];
  isSearching: boolean;
  selectedRoute: any | null;
  setSelectedRoute: (route: any | null) => void;
  browserInfo: {
    deviceType: string;
    isLandscape: boolean;
  };
}

/**
 * Component for displaying route search results
 */
const RouteResults: React.FC<RouteResultsProps> = ({
  results,
  isSearching,
  selectedRoute,
  setSelectedRoute,
  browserInfo
}) => {
  const { t } = useTranslation();
  const isMobile = browserInfo.deviceType === 'mobile';

  if (isSearching) {
    return (
      <div className="route-results-loading">
        <div className="loading-spinner"></div>
        <p>{t('routes.results.searching', 'Searching for routes...')}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="route-results-empty">
        <p>{t('routes.results.noResults', 'No routes found. Try adjusting your search.')}</p>
      </div>
    );
  }

  return (
    <div className="route-results">
      <h3 className="results-title">
        {t('routes.results.title', '{{count}} Routes Found', { count: results.length })}
      </h3>
      
      <div className="results-list">
        {results.map((route, index) => (
          <div 
            key={`route-${index}`}
            className={`route-item ${selectedRoute === route ? 'selected' : ''}`}
            onClick={() => setSelectedRoute(route)}
          >
            <div className="route-header">
              <h4 className="route-name">{route.name || `Route ${index + 1}`}</h4>
              <span className="route-duration">
                {route.duration ? `${Math.round(route.duration)} min` : 'N/A'}
              </span>
            </div>
            
            <div className="route-details">
              <div className="route-endpoints">
                <div className="route-from">{route.from || 'Unknown origin'}</div>
                <div className="route-arrow">→</div>
                <div className="route-to">{route.to || 'Unknown destination'}</div>
              </div>
              
              {route.transfers !== undefined && (
                <div className="route-transfers">
                  {route.transfers === 0 
                    ? t('routes.results.direct', 'Direct')
                    : t('routes.results.transfers', '{{count}} transfer(s)', { count: route.transfers })}
                </div>
              )}
            </div>
            
            {!isMobile && route.buses && (
              <div className="route-buses">
                {route.buses.map((bus: any, busIndex: number) => (
                  <span key={`bus-${busIndex}`} className="bus-badge">
                    {bus.name || bus.number || `Bus ${busIndex + 1}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RouteResults;