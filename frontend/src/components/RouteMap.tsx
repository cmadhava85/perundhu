import React from 'react';
import MapComponent from './MapComponent';
import type { Location } from '../types/apiTypes';
import '../styles/RouteMap.css';

interface SelectedRoute {
  name?: string;
  distance?: number | string;
  duration?: number | string;
  fromLocation?: { name?: string; lat?: number; lng?: number };
  toLocation?: { name?: string; lat?: number; lng?: number };
}

interface RouteMapProps {
  selectedRoute: SelectedRoute | null;
  userLocation: { lat: number; lng: number; } | null;
  routes: SelectedRoute[];
  fromLocation?: Location;
  toLocation?: Location;
}

/**
 * Map component specifically for rendering routes
 */
const RouteMap: React.FC<RouteMapProps> = ({
  selectedRoute,
  userLocation: _userLocation,
  routes: _routes,
  fromLocation,
  toLocation
}) => {
  // Convert route data to map-compatible format
  const processedFromLocation = fromLocation || (selectedRoute?.fromLocation ? {
    id: 0,
    name: selectedRoute.fromLocation.name || 'Origin',
    latitude: selectedRoute.fromLocation.lat || 0,
    longitude: selectedRoute.fromLocation.lng || 0
  } : {
    id: 0,
    name: 'Default Origin',
    latitude: 13.0827,
    longitude: 80.2707
  });
  
  const processedToLocation = toLocation || (selectedRoute?.toLocation ? {
    id: 0,
    name: selectedRoute.toLocation.name || 'Destination',
    latitude: selectedRoute.toLocation.lat || 0,
    longitude: selectedRoute.toLocation.lng || 0
  } : {
    id: 0,
    name: 'Default Destination',
    latitude: 12.9716,
    longitude: 77.5946
  });

  return (
    <div className="route-map-container">
      <MapComponent 
        fromLocation={processedFromLocation}
        toLocation={processedToLocation}
        selectedStops={[]}
        className="route-map"
      />
      {selectedRoute && (
        <div className="route-info-overlay">
          <div className="route-name">{selectedRoute.name || 'Selected Route'}</div>
          <div className="route-details">
            {selectedRoute.distance && (
              <span className="route-distance">
                {typeof selectedRoute.distance === 'number'
                  ? `${(selectedRoute.distance / 1000).toFixed(1)} km`
                  : selectedRoute.distance}
              </span>
            )}
            {selectedRoute.duration && (
              <span className="route-duration">
                {typeof selectedRoute.duration === 'number'
                  ? `${Math.round(selectedRoute.duration / 60)} min`
                  : selectedRoute.duration}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteMap;