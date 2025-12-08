import React from 'react';
import { MarkerF } from '@react-google-maps/api';
import type { Location, Stop } from '../../types';

interface MapMarkersProps {
  fromLocation: Location;
  toLocation: Location;
  stops?: Stop[];
  onStopLocation?: (stop: Stop) => { lat: number; lng: number } | null;
  onStopSelect?: (stop: Stop) => void;
  highlightedStopIndex?: number | null;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  fromLocation,
  toLocation,
  stops = [],
  onStopLocation,
  onStopSelect,
  highlightedStopIndex = null
}) => {
  // Listen for stop highlight events from the bus list
  React.useEffect(() => {
    const handleHighlightStop = (event: CustomEvent) => {
      const { stop, index: _index } = event.detail;
      if (onStopSelect) {
        onStopSelect(stop);
      }
    };

    window.addEventListener('highlightStop', handleHighlightStop as EventListener);
    return () => {
      window.removeEventListener('highlightStop', handleHighlightStop as EventListener);
    };
  }, [onStopSelect]);

  return (
    <>
      {/* From location marker - Enhanced with better styling */}
      <MarkerF
        position={{ 
          lat: fromLocation.latitude, 
          lng: fromLocation.longitude 
        }}
        label={{
          text: "A",
          color: "#FFFFFF",
          fontWeight: "bold",
          fontSize: "16px"
        }}
        icon={{
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#22c55e",
          fillOpacity: 1,
          strokeColor: "#16a34a",
          strokeWeight: 2,
          scale: 16
        }}
        title={`${fromLocation.name} (Origin)`}
        zIndex={1000}
      />
      
      {/* To location marker - Enhanced with better styling */}
      <MarkerF
        position={{ 
          lat: toLocation.latitude, 
          lng: toLocation.longitude 
        }}
        label={{
          text: "B",
          color: "#FFFFFF",
          fontWeight: "bold",
          fontSize: "16px"
        }}
        icon={{
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeColor: "#dc2626",
          strokeWeight: 2,
          scale: 16
        }}
        title={`${toLocation.name} (Destination)`}
        zIndex={1000}
      />
      
      {/* Stop markers with enhanced numbering and highlighting */}
      {stops.length > 0 && onStopLocation && (
        <>
          {stops
            .map((stop: Stop, index) => ({ stop, location: onStopLocation(stop), originalIndex: index }))
            .filter(item => item.location !== null)
            .map((item) => {
              const isHighlighted = highlightedStopIndex === item.originalIndex + 1;
              const stopNumber = item.originalIndex + 1;
              
              return (
                <MarkerF
                  key={`stop-${item.stop.id || item.originalIndex}`}
                  position={item.location!}
                  label={{
                    text: `${stopNumber}`,
                    color: "#FFFFFF",
                    fontWeight: "bold",
                    fontSize: isHighlighted ? "16px" : "14px"
                  }}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: isHighlighted ? "#f59e0b" : "#3b82f6",
                    fillOpacity: isHighlighted ? 1 : 0.9,
                    strokeColor: isHighlighted ? "#d97706" : "#1e40af",
                    strokeWeight: isHighlighted ? 3 : 2,
                    scale: isHighlighted ? 20 : 16
                  }}
                  title={`Stop ${stopNumber}: ${item.stop.translatedName || item.stop.name}${item.stop.arrivalTime ? ` (${item.stop.arrivalTime})` : ''}`}
                  zIndex={isHighlighted ? 2000 : (1000 + item.originalIndex)}
                  onClick={() => onStopSelect?.(item.stop)}
                  animation={isHighlighted ? google.maps.Animation.BOUNCE : undefined}
                />
              );
            })}
        </>
      )}
    </>
  );
};

export default MapMarkers;