import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Stop } from '../types';
import '../styles/StopsList.css';

interface StopsListProps {
  stops: Stop[];
}

const StopsList: React.FC<StopsListProps> = ({ stops }) => {
  const { t } = useTranslation();
  
  return (
    <div className="stops-list">
      <div className="stops-list-header">
        <h3 className="stops-title">{t('stopsList.stops', 'Stops')}</h3>
        <div className="stops-count">{stops.length} {t('stopsList.totalStops', 'stops')}</div>
      </div>
      
      <div className="stops-container">
        <div className="stops-timeline"></div>
        {stops.length > 0 ? (
          stops.map((stop, index) => (
            <div 
              key={stop.id || `${stop.name}-${index}`} 
              className="stop-item"
            >
              <div 
                className={`stop-marker ${
                  index === 0 ? 'origin' : 
                  index === stops.length - 1 ? 'destination' : 'intermediate'
                }`}
              ></div>
              
              <div className="stop-details">
                <div className="stop-info">
                  <h4 className="stop-name">{stop.translatedName || stop.name}</h4>
                  <div className="stop-time">
                    {stop.arrivalTime && (
                      <div>{t('stopsList.arrival', 'Arr')}: {stop.arrivalTime}</div>
                    )}
                    {stop.departureTime && (
                      <div>{t('stopsList.departure', 'Dep')}: {stop.departureTime}</div>
                    )}
                  </div>
                </div>
                
                <div className="stop-meta">
                  {(stop.order || stop.stopOrder) && (
                    <div className="stop-attribute">
                      <span className="attribute-icon">📍</span>
                      {t('stopsList.stopOrder', 'Stop')}: {stop.stopOrder || stop.order}
                    </div>
                  )}
                  {stop.platform && (
                    <div className="stop-attribute">
                      {t('stopsList.platform', 'Platform')}: {stop.platform}
                    </div>
                  )}
                  {stop.status && (
                    <div className={`stop-status status-${stop.status}`}>
                      {t(`stopsList.status.${stop.status}`, stop.status)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-stops-message">
            {t('busItem.noStops', 'This is a direct bus with no intermediate stops')}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(StopsList);