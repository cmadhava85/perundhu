import React from 'react';
import { useTranslation } from 'react-i18next';

interface MapLegendProps {
  showLiveTracking?: boolean;
}

/**
 * Component to display map legend with confidence levels and marker explanations
 */
const MapLegend: React.FC<MapLegendProps> = ({ showLiveTracking = true }) => {
  const { t } = useTranslation();

  return (
    <div className="map-legend">
      {showLiveTracking && (
        <div className="legend-section">
          <h4>{t('combinedMap.busConfidence', 'Live Bus Confidence')}</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#4CAF50' }}></span>
              <span>{t('liveTracker.highConfidence', 'High')}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#FFC107' }}></span>
              <span>{t('liveTracker.mediumConfidence', 'Medium')}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#FF0000' }}></span>
              <span>{t('liveTracker.lowConfidence', 'Low')}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="legend-section">
        <h4>{t('combinedMap.markers', 'Map Markers')}</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-marker origin">A</span>
            <span>{t('combinedMap.origin', 'Origin')}</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker destination">B</span>
            <span>{t('combinedMap.destination', 'Destination')}</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker stop">1</span>
            <span>{t('combinedMap.busStop', 'Bus Stop')}</span>
          </div>
          {showLiveTracking && (
            <div className="legend-item">
              <span className="legend-marker bus">➤</span>
              <span>{t('combinedMap.liveBus', 'Live Bus')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapLegend;