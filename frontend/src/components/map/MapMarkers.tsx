import React from 'react';
import { MarkerF } from '@react-google-maps/api';
import type { Location, Stop } from '../../types';

interface MapMarkersProps {
  fromLocation: Location;
  toLocation: Location;
  stops?: Stop[];
  onStopLocation?: (stop: any) => { lat: number; lng: number } | null;
  onStopSelect?: (stop: Stop) => void; // Add missing onStopSelect prop
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  fromLocation,
  toLocation,
  stops = [],
  onStopLocation,
  onStopSelect
}) => {
  return (
    <>
      {/* From location marker */}
      <MarkerF
        position={{ 
          lat: fromLocation.latitude, 
          lng: fromLocation.longitude 
        }}
        label={{
          text: "A",
          color: "#FFFFFF",
          fontWeight: "bold"
        }}
        icon={{
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#1a73e8",
          fillOpacity: 1,
          strokeWeight: 0,
          scale: 14
        }}
        title={fromLocation.name}
      />
      
      {/* To location marker */}
      <MarkerF
        position={{ 
          lat: toLocation.latitude, 
          lng: toLocation.longitude 
        }}
        label={{
          text: "B",
          color: "#FFFFFF",
          fontWeight: "bold"
        }}
        icon={{
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#1a73e8",
          fillOpacity: 1,
          strokeWeight: 0,
          scale: 14
        }}
        title={toLocation.name}
      />
      
      {/* Stop markers */}
      {stops.length > 0 && onStopLocation && (
        <>
          {stops
            .map((stop: any, index) => ({ stop, location: onStopLocation(stop), originalIndex: index }))
            .filter(item => item.location !== null)
            .map((item) => (
              <MarkerF
                key={`stop-${item.stop.id || item.originalIndex}`}
                position={item.location!}
                label={{
                  text: `${item.originalIndex + 1}`,
                  color: "#FFFFFF",
                  fontWeight: "bold",
                  fontSize: "14px"
                }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: "#34A853",
                  fillOpacity: 1,
                  strokeColor: "#FFFFFF",
                  strokeWeight: 2,
                  scale: 16
                }}
                title={item.stop.translatedName || item.stop.name}
                zIndex={1000 + item.originalIndex}
                onClick={() => onStopSelect?.(item.stop)}
              />
            ))}
        </>
      )}
    </>
  );
};

export default MapMarkers;