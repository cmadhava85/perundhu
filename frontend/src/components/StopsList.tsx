import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Stop } from '../types';

interface StopsListProps {
  stops: Stop[];
}

const StopsList: React.FC<StopsListProps> = ({ stops }) => {
  const { t } = useTranslation();
  
  return (
    <div className="stops-list">
      <h3>{t('stopsList.stops', 'Stops')}</h3>
      <div className="stops-container">
        {stops.length > 0 ? (
          stops.map((stop, index) => (
            <div key={stop.id || stop.name} className="stop-item">
              <div className="stop-number">{index + 1}</div>
              <div className="stop-details">
                <div className="stop-name">{stop.translatedName || stop.name}</div>
                <div className="stop-times">
                  <div>{t('stopsList.arrival', 'Arr:')} {stop.arrivalTime}</div>
                  <div>{t('stopsList.departure', 'Dep:')} {stop.departureTime}</div>
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

export default StopsList;