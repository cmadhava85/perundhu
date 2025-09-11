import React from 'react';
import { useTranslation } from 'react-i18next';

<<<<<<< HEAD
/**
 * Component to display map legend with confidence levels and marker explanations
 */
const MapLegend: React.FC = () => {
=======
interface MapLegendProps {
  showLiveTracking?: boolean;
}

const MapLegend: React.FC<MapLegendProps> = ({ showLiveTracking = true }) => {
>>>>>>> 75c2859 (production ready code need to test)
  const { t } = useTranslation();

  return (
    <div className="map-legend">
<<<<<<< HEAD
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
=======
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
>>>>>>> 75c2859 (production ready code need to test)
      
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
<<<<<<< HEAD
          <div className="legend-item">
            <span className="legend-marker bus">➤</span>
            <span>{t('combinedMap.liveBus', 'Live Bus')}</span>
          </div>
=======
          {showLiveTracking && (
            <div className="legend-item">
              <span className="legend-marker bus">➤</span>
              <span>{t('combinedMap.liveBus', 'Live Bus')}</span>
            </div>
          )}
>>>>>>> 75c2859 (production ready code need to test)
        </div>
      </div>
    </div>
  );
};

export default MapLegend;