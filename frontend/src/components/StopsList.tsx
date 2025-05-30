import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Stop } from '../types';

interface StopsListProps {
  stops: Stop[];
  leg?: string;
}

const StopsList: React.FC<StopsListProps> = ({ stops, leg }) => {
  const { t, i18n } = useTranslation();
  
  // Enhanced debugging to track translation and data issues
  console.log('StopsList received stops:', stops);
  console.log('Current language:', i18n.language);
  
  // Log when language changes occur to help debug translation issues
  useEffect(() => {
    console.log('Language changed in StopsList:', i18n.language);
  }, [i18n.language]);

  if (!stops || !Array.isArray(stops)) {
    console.log('No valid stops array provided to StopsList');
    return null;
  }
  
  if (stops.length === 0) {
    console.log('Empty stops array provided to StopsList');
    return null;
  }
  
  // Normalize the stops data - handle both 'order' and 'stopOrder' properties
  const normalizedStops = stops.map(stop => {
    // Make a copy to avoid mutating the original
    const normalizedStop = { ...stop };
    
    // If the stop has 'stopOrder' but not 'order', copy it to 'order'
    if (normalizedStop.stopOrder !== undefined && normalizedStop.order === undefined) {
      normalizedStop.order = normalizedStop.stopOrder;
    }
    
    return normalizedStop;
  });
  
  // Safety check - ensure all items in the stops array have the required properties
  const validStops = normalizedStops.filter(stop => 
    stop && 
    (typeof stop.name === 'string' || typeof stop.translatedName === 'string') && 
    typeof stop.order === 'number'
  );
  
  console.log('Valid stops for rendering:', validStops.length);
  
  if (validStops.length === 0) {
    console.log('No valid stops to render after filtering');
    return null;
  }
  
  // Sort stops by their order
  const sortedStops = [...validStops].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Prevent clicks within the stops list from propagating up to parent elements
  // Use a more aggressive approach to stop propagation
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
  };
  
  return (
    <div 
      className="stops-list" 
      data-testid="stops-list" 
      onClick={handleClick}
      onMouseDown={handleClick}
    >
      <h4>{leg ? `${t('stopsList.stops', 'Stops')} - ${leg}` : t('stopsList.stops', 'Stops')}</h4>
      {sortedStops.map((stop, index) => (
        <div 
          key={`stop-${stop.id || stop.name}-${index}`} 
          className="stop-item" 
          data-testid={`stop-item-${index}`}
          onClick={handleClick}
        >
          <div className="stop-number">{index + 1}</div>
          <div className="stop-marker"></div>
          <div className="stop-info">
            <span className="stop-name">{stop.translatedName || stop.name}</span>
            <div className="stop-times">
              <span>Arr: {stop.arrivalTime === '---' ? '-' : stop.arrivalTime}</span>
              <span>Dep: {stop.departureTime === '---' ? '-' : stop.departureTime}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StopsList;