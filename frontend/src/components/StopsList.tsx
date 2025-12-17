import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Stop } from '../types';
import '../styles/StopsList.css';

interface StopsListProps {
  stops: Stop[];
}

const StopsList: React.FC<StopsListProps> = ({ stops }) => {
  const { t } = useTranslation();
  
  // Sort stops by time (departure time first, then arrival time)
  const sortedStops = [...stops].sort((a, b) => {
    const timeA = a.departureTime || a.arrivalTime || '00:00';
    const timeB = b.departureTime || b.arrivalTime || '00:00';
    return timeA.localeCompare(timeB);
  });
  
  return (
    <div className="stops-list">
      <div className="stops-list-header">
        <h3 className="stops-title">{t('stopsList.stops', 'Stops')}</h3>
        <div className="stops-count">{sortedStops.length} {t('stopsList.totalStops', 'stops')}</div>
      </div>
      
      <div className="stops-container">
        <div className="stops-timeline"></div>
        {sortedStops.length > 0 ? (
          sortedStops.map((stop, index) => (
            <div 
              key={stop.id || `${stop.name}-${index}`} 
              className="stop-item"
            >
              <div 
                className={`stop-marker ${
                  index === 0 ? 'origin' : 
                  index === sortedStops.length - 1 ? 'destination' : ''
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
                  {stop.order && (
                    <div className="stop-attribute">
                      {t('stopsList.stopOrder', 'Stop')}: {stop.order}
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

// Apply React.memo to prevent unnecessary re-renders when props haven't changed
export default React.memo(StopsList);