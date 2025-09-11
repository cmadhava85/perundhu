import React from 'react';
import { useTranslation } from 'react-i18next';

interface MapErrorFallbackProps {
  error?: Error;
  retry?: () => void;
}

const MapErrorFallback: React.FC<MapErrorFallbackProps> = ({ error, retry }) => {
  const { t } = useTranslation();

  return (
    <div className="map-error-fallback">
      <div className="map-error-content">
        <div className="map-error-icon">🗺️</div>
        <h3>{t('map.error.title', 'Map Loading Error')}</h3>
        <p>{t('map.error.message', 'Unable to load the map component.')}</p>
        
        {import.meta.env.MODE === 'development' && error && (
          <details className="error-details">
            <summary>Technical Details</summary>
            <pre>{error.message}</pre>
          </details>
        )}
        
        <div className="map-error-actions">
          <button 
            onClick={retry}
            className="retry-button primary"
          >
            {t('map.error.retry', 'Retry')}
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            className="retry-button secondary"
          >
            {t('map.error.refresh', 'Refresh Page')}
          </button>
        </div>
        
        <div className="map-error-help">
          <p className="help-text">
            {t('map.error.help', 'Try refreshing the page or check your internet connection.')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapErrorFallback;