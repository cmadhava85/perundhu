import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Stop } from '../types';
import StopsList from './StopsList';
import LiveBusTracker from './BusTracker/LiveBusTracker';
import BusHeader from './bus/BusHeader';
import BusTiming from './bus/BusTiming';
import BusAvailability from './bus/BusAvailability';

interface BusItemProps {
  bus: Bus;
  selectedBusId: number | null;
  stops: Stop[];
  stopsMap?: Record<number, Stop[]>;
  onSelectBus: (busId: number) => void;
}

const BusItem: React.FC<BusItemProps> = ({ 
  bus, 
  selectedBusId, 
  stops,
  stopsMap,
  onSelectBus
}) => {
  const { t } = useTranslation();
  const isSelected = selectedBusId === bus.id;
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  
  const handleBusCardClick = () => {
    onSelectBus(bus.id);
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isLiveTracking) {
      setIsLiveTracking(false);
      setIsTrackingModalOpen(false);
    } else {
      setIsTrackingModalOpen(true);
    }
  };

  const handleStartTracking = () => {
    setIsLiveTracking(true);
    setIsTrackingModalOpen(false);
  };

  const handleStopTracking = () => {
    setIsLiveTracking(false);
    setIsTrackingModalOpen(false);
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Save bus route:', bus.id);
  };

  // Calculate journey duration
  const calculateDuration = (departure: string, arrival: string) => {
    const depTime = new Date(`2024-01-01 ${departure}`);
    const arrTime = new Date(`2024-01-01 ${arrival}`);
    const diff = Math.abs(arrTime.getTime() - depTime.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Get stops for this specific bus
  const busStops = stopsMap ? stopsMap[bus.id] || [] : stops;

  return (
    <>
      <div className={`compact-bus-item ${isSelected ? 'selected' : ''} ${isLiveTracking ? 'tracking-active' : ''}`} onClick={handleBusCardClick}>
        <BusHeader
          busNumber={bus.busNumber}
          busName={bus.busName}
          isLiveTracking={isLiveTracking}
          onTrackClick={handleTrackClick}
          onSaveClick={handleSaveClick}
        />

        <BusTiming
          departureTime={bus.departureTime}
          arrivalTime={bus.arrivalTime}
          duration={calculateDuration(bus.departureTime, bus.arrivalTime)}
        />

        <BusAvailability
          stopsCount={busStops.length}
          isLiveTracking={isLiveTracking}
        />

        {/* Expandable stops section */}
        {isSelected && (
          <div className="stops-section">
            {busStops.length > 0 ? (
              <StopsList stops={busStops} />
            ) : (
              <div className="no-stops">
                <span className="no-stops-icon">🚌</span>
                <span className="no-stops-text">{t('busItem.directBus', 'Direct bus - no intermediate stops')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Bus Tracking Modal */}
      {isTrackingModalOpen && (
        <LiveBusTracker
          selectedBus={bus}
          stops={busStops}
          isTracking={isLiveTracking}
          onStartTracking={handleStartTracking}
          onStopTracking={handleStopTracking}
          onClose={() => setIsTrackingModalOpen(false)}
        />
      )}
    </>
  );
};

export default BusItem;