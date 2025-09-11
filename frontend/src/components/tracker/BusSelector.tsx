import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus } from '../../types';

interface BusSelectorProps {
  buses: Bus[];
  selectedBusId: number | null;
  onBusSelect: (busId: number) => void;
}

const BusSelector: React.FC<BusSelectorProps> = ({ 
  buses, 
  selectedBusId, 
  onBusSelect 
}) => {
  const { t } = useTranslation();

  return (
    <div className="tracker-section">
      <label>{t('busTracker.selectBus', 'Select your bus:')}</label>
      <select 
        value={selectedBusId || ''} 
        onChange={(e) => onBusSelect(Number(e.target.value))}
        className="tracker-select"
      >
        <option value="">{t('busTracker.chooseBus', '-- Choose bus --')}</option>
        {buses.map((bus, index) => (
          <option key={`bus-${bus.id || index}`} value={bus.id}>
            {bus.busNumber} {bus.busName && `- ${bus.busName}`} {(bus.from || bus.to) && 
              `(${bus.from || t('busTracker.unknown')} to ${bus.to || t('busTracker.unknown')})`}
          </option>
        ))}
      </select>
    </div>
  );
};

export default BusSelector;