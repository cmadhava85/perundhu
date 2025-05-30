import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Stop } from '../types';
import BusItem from './BusItem';

interface BusListProps {
  buses: Bus[];
  selectedBusId: number | null;
  stops: Stop[];
  onSelectBus: (busId: number) => void;
}

const BusList: React.FC<BusListProps> = ({ 
  buses, 
  selectedBusId, 
  stops, 
  onSelectBus 
}) => {
  const { t } = useTranslation();
  const [showHelp, setShowHelp] = useState<boolean>(false);
  
  // Show help tooltip on first load if no bus is selected
  useEffect(() => {
    if (buses.length > 0 && !selectedBusId) {
      const hasSeenHelp = localStorage.getItem('perundhu-seen-stops-help');
      if (!hasSeenHelp) {
        setShowHelp(true);
        // Hide help after 5 seconds
        const timer = setTimeout(() => {
          setShowHelp(false);
          localStorage.setItem('perundhu-seen-stops-help', 'true');
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [buses, selectedBusId]);
  
  if (buses.length === 0) {
    return null;
  }
  
  return (
    <div className="results-section" data-testid="bus-list">
      <h2>{t('busList.title')}</h2>
      
      {showHelp && (
        <div className="help-tooltip">
          <div className="tooltip-icon">💡</div>
          <div className="tooltip-text">
            {t('busList.helpText', 'Click on any bus to view its stops and route details')}
          </div>
          <button 
            className="tooltip-close"
            onClick={() => {
              setShowHelp(false);
              localStorage.setItem('perundhu-seen-stops-help', 'true');
            }}
          >
            ✕
          </button>
        </div>
      )}
      
      <div className="bus-list">
        {buses.map(bus => (
          <BusItem
            key={bus.id}
            bus={bus}
            selectedBusId={selectedBusId}
            stops={bus.id === selectedBusId ? stops : []}
            onSelectBus={onSelectBus}
          />
        ))}
      </div>
    </div>
  );
};

export default BusList;