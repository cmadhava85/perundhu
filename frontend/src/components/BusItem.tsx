import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Stop } from '../types';
import StopsList from './StopsList';

interface BusItemProps {
  bus: Bus;
  selectedBusId: number | null;
  stops: Stop[];
  onSelectBus: (busId: number) => void;
}

const BusItem: React.FC<BusItemProps> = ({ bus, selectedBusId, stops, onSelectBus }) => {
  const { t, i18n } = useTranslation();
  const isSelected = selectedBusId === bus.id;
  // Local state for controlling visibility
  const [showStops, setShowStops] = useState(false);
  // Track language changes
  const prevLanguageRef = useRef(i18n.language);
  const expandedByUserRef = useRef(false);
  
  // When selectedBusId changes from parent, update local state
  useEffect(() => {
    if (isSelected && !showStops) {
      setShowStops(true);
      expandedByUserRef.current = true;
    } else if (!isSelected && showStops && !expandedByUserRef.current) {
      setShowStops(false);
    }
  }, [isSelected, showStops]);

  // When language changes and this bus is selected, refresh stops but maintain expanded state
  useEffect(() => {
    if (i18n.language !== prevLanguageRef.current && isSelected) {
      // Store current expanded state
      const wasExpanded = showStops;
      
      // This will trigger a re-fetch of stops with the new language
      onSelectBus(bus.id);
      console.log(`Bus ${bus.id} is selected, language changed to ${i18n.language}, fetching stops...`);
      
      // Ensure we maintain the expanded state after language change
      if (wasExpanded) {
        setShowStops(true);
      }
    }
    prevLanguageRef.current = i18n.language;
  }, [i18n.language, isSelected, bus.id, onSelectBus, showStops]);

  // Debug: Log when this component renders and what stops are available
  console.log(`BusItem ${bus.id} rendering. isSelected=${isSelected}, showStops=${showStops}, stopsCount=${stops?.length || 0}`);
  if (isSelected) {
    console.log('Stops for selected bus:', stops);
  }
  
  // Handle click on the stops indicator/button separately
  const handleStopsClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from reaching parent div
    e.preventDefault();
    
    // Toggle local state
    const newShowStops = !showStops;
    setShowStops(newShowStops);
    expandedByUserRef.current = newShowStops;
    
    // Select the bus if not already selected and we're expanding
    if (!isSelected && newShowStops) {
      onSelectBus(bus.id);
    }
  };
  
  return (
    <div 
      data-testid={`bus-item-${bus.id}`}
      className={`bus-item ${showStops ? 'expanded' : ''}`}
      onClick={() => onSelectBus(bus.id)}
      aria-expanded={showStops}
    >
      <div className="bus-header">
        <div className="bus-info">
          <h3>{bus.busName} {bus.busNumber}</h3>
          <div className="bus-route">
            {bus.from} → {bus.to}
          </div>
          <div 
            className="stops-indicator" 
            title={t('busItem.clickToViewStops', 'Click to view stops')}
            onClick={handleStopsClick}
          >
            <span className="stops-icon">🚏</span>
            <span className="stops-text">{t('busItem.viewStops', 'View Stops')}</span>
            <span className="expand-icon">{showStops ? '▲' : '▼'}</span>
          </div>
        </div>
        <div className="bus-time">
          <div className="departure">
            <span>Departure</span>
            {bus.departureTime}
          </div>
          <div className="arrival">
            <span>Arrival</span>
            {bus.arrivalTime}
          </div>
        </div>
      </div>

      {showStops && (
        <div className="bus-details" onClick={(e) => e.stopPropagation()}>
          {stops && stops.length > 0 ? (
            <StopsList stops={stops} />
          ) : (
            <div className="no-stops-message">
              {t('busItem.noStops', 'This is a direct bus with no intermediate stops')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BusItem;