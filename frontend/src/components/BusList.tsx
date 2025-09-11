import React from 'react';
import { useTranslation } from 'react-i18next';
import BusItem from './BusItem';
import type { Bus, Stop } from '../types';

interface BusListProps {
  buses: Bus[];
  selectedBusId?: number | null;
  stopsMap?: Record<number, Stop[]>;
  onSelectBus?: (bus: Bus) => void;
  showTitle?: boolean;
}

const BusList: React.FC<BusListProps> = ({
  buses,
  selectedBusId,
  stopsMap = {},
  onSelectBus,
  showTitle = true
}) => {
  const { t } = useTranslation();
  
  if (buses.length === 0) {
    return null;
  }

  return (
    <div className="bus-list">
      {showTitle && <h2>{t('busList.title', 'Available Buses')}</h2>}
      <div className="buses-container">
        {buses.map(bus => (
          <BusItem
            key={bus.id}
            bus={bus}
            selectedBusId={selectedBusId || null}
            stops={stopsMap && stopsMap[bus.id] ? stopsMap[bus.id] : []}
            onSelectBus={onSelectBus ? (busId: number) => {
              const selectedBus = buses.find(b => b.id === busId);
              if (selectedBus) {
                onSelectBus(selectedBus);
              }
            } : () => {}}
          />
        ))}
      </div>
    </div>
  );
};

export default BusList;