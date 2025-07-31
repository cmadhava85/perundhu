import React from 'react';
import { useTranslation } from 'react-i18next';
import BusItem from './BusItem';
import type { Bus, Stop } from '../types';
import '../styles/BusList.css';

interface BusListProps {
  buses: Bus[];
  selectedBusId: number | null;
  stops: Stop[];
  onSelectBus: (busId: number) => void;
  showTitle?: boolean;
}

const BusList: React.FC<BusListProps> = ({
  buses,
  selectedBusId,
  stops,
  onSelectBus,
  showTitle = true
}) => {
  const { t } = useTranslation();
  
  if (buses.length === 0) {
    return null;
  }

  return (
    <div className="bus-list-container">
      <div className="bus-list">
        <div className="bus-list-header">
          {showTitle && <h2 className="bus-list-title">{t('busList.title', 'Available Buses')}</h2>}
          <div className="bus-sort-controls">
            <button className="sort-button active">{t('busList.sortByTime', 'Time')}</button>
            <button className="sort-button">{t('busList.sortByPrice', 'Price')}</button>
          </div>
        </div>
        
        <div className="buses-container">
          {buses.map(bus => (
            <BusItem
              key={bus.id}
              bus={bus}
              selectedBusId={selectedBusId}
              stops={stops}
              onSelectBus={onSelectBus}
            />
          ))}
        </div>
        
        {buses.length > 0 && (
          <div className="bus-list-footer">
            <div className="bus-count">{t('busList.showing', 'Showing')} {buses.length} {t('busList.buses', 'buses')}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusList;