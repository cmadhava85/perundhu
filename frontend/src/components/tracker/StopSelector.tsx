import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Stop } from '../../types';

interface StopSelectorProps {
  stops: Stop[];
  selectedStopId: number | null;
  onStopSelect: (stopId: number) => void;
}

const StopSelector: React.FC<StopSelectorProps> = ({ 
  stops, 
  selectedStopId, 
  onStopSelect 
}) => {
  const { t } = useTranslation();

  if (stops.length === 0) return null;

  return (
    <div className="tracker-section">
      <label>{t('busTracker.selectStop', 'Select the stop you boarded at:')}</label>
      <select 
        value={selectedStopId || ''} 
        onChange={(e) => onStopSelect(Number(e.target.value))}
        className="tracker-select"
      >
        <option value="">{t('busTracker.chooseStop', '-- Choose stop --')}</option>
        {stops.map((stop, index) => (
          <option key={`stop-${stop.id || index}`} value={stop.id}>
            {stop.name} {stop.departureTime ? `(${stop.departureTime})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
};

export default StopSelector;