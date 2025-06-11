import React from 'react';
import type { Bus, Stop } from '../types';
import StopsList from './StopsList';

interface BusItemProps {
  bus: Bus;
  selectedBusId: number | null;
  stops: Stop[];
  onSelectBus: (busId: number) => void;
}

const BusItem: React.FC<BusItemProps> = ({ 
  bus, 
  selectedBusId, 
  stops,
  onSelectBus
}) => {
  const isSelected = selectedBusId === bus.id;
  
  return (
    <div 
      className={`bus-item ${isSelected ? 'expanded' : ''}`} 
      onClick={() => onSelectBus(bus.id)}
    >
      <div className="bus-header">
        <div className="bus-title">{bus.busName} {bus.busNumber}</div>
        <div className="bus-route">{bus.from} → {bus.to}</div>
        <div className="bus-times">
          <div className="departure-time">{bus.departureTime}</div>
          <div className="arrival-time">{bus.arrivalTime}</div>
        </div>
      </div>
      {isSelected && (
        <div className="bus-details">
          <StopsList stops={stops} />
        </div>
      )}
    </div>
  );
};

export default BusItem;