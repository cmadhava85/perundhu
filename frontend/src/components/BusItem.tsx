import React, { useState, useCallback } from 'react';
import type { Bus, Stop } from '../types';
import StopsList from './StopsList';
import '../styles/BusItem.css';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const isSelected = selectedBusId === bus.id;
  const [showStops, setShowStops] = useState(isSelected);
  
  const handleClick = useCallback(() => {
    onSelectBus(bus.id);
    setShowStops(prevShowStops => !prevShowStops);
  }, [onSelectBus, bus.id]);
  
  const toggleStops = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStops(prevShowStops => !prevShowStops);
  }, []);
  
  // Calculate journey duration
  const getDuration = () => {
    try {
      if (!bus.departureTime || !bus.arrivalTime) return '';
      
      // Simple parsing for HH:MM format
      const [depHours, depMinutes] = bus.departureTime.split(':').map(Number);
      const [arrHours, arrMinutes] = bus.arrivalTime.split(':').map(Number);
      
      let durationHours = arrHours - depHours;
      let durationMinutes = arrMinutes - depMinutes;
      
      if (durationMinutes < 0) {
        durationHours -= 1;
        durationMinutes += 60;
      }
      
      if (durationHours < 0) {
        durationHours += 24; // Assume overnight journey
      }
      
      return `${durationHours}h ${durationMinutes}m`;
    } catch (e) {
      return '';
    }
  };
  
  const duration = getDuration();
  const status = bus.status || 'on-time';
  
  return (
    <div 
      className={`bus-item ${isSelected ? 'selected' : ''}`} 
      onClick={handleClick}
    >
      <div className="bus-header">
        <div className="bus-info">
          <div className="bus-name">
            {bus.busName} 
            <span className="bus-number">{bus.busNumber}</span>
            {bus.category && <span className="bus-type">{bus.category}</span>}
          </div>
          <div className="bus-route">
            {bus.from} → {bus.to}
          </div>
        </div>
        
        <div className="bus-times">
          <div className="departure-time">{bus.departureTime || '---'}</div>
          <div className="arrival-time">{bus.arrivalTime || '---'}</div>
        </div>
      </div>
      
      <div className="bus-meta">
        <div className="bus-attributes">
          {bus.category && (
            <div className="bus-attribute">
              <span className="attribute-icon">🚍</span>
              {bus.category}
            </div>
          )}
          {bus.capacity && (
            <div className="bus-attribute">
              <span className="attribute-icon">👥</span>
              {bus.capacity} {t('bus.seats', 'seats')}
            </div>
          )}
        </div>
        
        {duration && (
          <div className="bus-duration">
            {duration}
          </div>
        )}
        
        {status && (
          <div className={`bus-status status-${status}`}>
            {t(`bus.status.${status}`, status)}
          </div>
        )}
      </div>
      
      <div className="stops-preview">
        <span>{bus.from}</span>
        <div className="stop-dots">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="stop-dot"></span>
          ))}
        </div>
        <span>{bus.to}</span>
        {stops.length > 0 && (
          <span className="stop-count">({stops.length} {t('bus.stops', 'stops')})</span>
        )}
      </div>
      
      {isSelected && (
        <div className="bus-details">
          <div className="stops-container">
            <StopsList stops={stops} />
          </div>
          <button 
            className={`toggle-stops ${showStops ? 'expanded' : ''}`}
            onClick={toggleStops}
          >
            {showStops 
              ? t('bus.hideStops', 'Hide Stops') 
              : t('bus.showStops', 'Show Stops')
            }
            <span className="toggle-icon">▼</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(BusItem);