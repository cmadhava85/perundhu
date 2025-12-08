import React, { useEffect, useRef, useState } from 'react';
import mapService from '../services/mapService';
import type { Location, Bus, Stop, BusLocation } from '../types/index';
import '../styles/MapComponent.css';

interface MapComponentProps {
  fromLocation: Location;
  toLocation: Location;
  selectedStops?: Stop[];
  buses?: (Bus | BusLocation)[];
  onBusClick?: (bus: Bus | BusLocation) => void;
  className?: string;
  style?: React.CSSProperties;
  mapId?: string;
}

// Helper function to check if a bus has currentLocation
function hasBusLocation(bus: Bus | BusLocation): bus is BusLocation {
  return 'latitude' in bus && 'longitude' in bus;
}

/**
 * A universal map component that uses either Leaflet (default) or Google Maps
 * Handles both route display and bus location tracking
 */
const MapComponent: React.FC<MapComponentProps> = ({
  fromLocation,
  toLocation,
  selectedStops = [],
  buses = [],
  onBusClick,
  className = 'map-container',
  style = { height: '450px', width: '100%' },
  mapId
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Use stable ID to prevent re-rendering issues
  const stableMapId = useRef(mapId || `map-container-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
  const mapContainerId = stableMapId.current;

  useEffect(() => {
    const initMap = async () => {
      try {
        // Initialize the map service - no need to pass element anymore
        await mapService.init();

        // Create the map with the element ID
        if (mapContainerRef.current) {
          mapService.createMap(mapContainerId);
          setIsMapInitialized(true);
        }
      } catch (_error) {
        // Map initialization failed
        setMapError('Failed to load map. Please try again later.');
      }
    };

    if (!isMapInitialized && mapContainerRef.current) {
      initMap();
    }

    return () => {
      // Cleanup map when component unmounts
      if (isMapInitialized) {
        mapService.cleanup();
      }
    };
  }, [mapContainerId, isMapInitialized]);

  useEffect(() => {
    if (!isMapInitialized || mapError) return;

    const updateMap = async () => {
      try {
        // Clear existing markers
        mapService.clearMarkers();

        const coordinates: { lat: number; lng: number }[] = [];

        // Add origin marker
        if (fromLocation && fromLocation.latitude && fromLocation.longitude) {
          mapService.addMarker([fromLocation.latitude, fromLocation.longitude], {
            title: fromLocation.name
          });
          coordinates.push({ lat: fromLocation.latitude, lng: fromLocation.longitude });
        }

        // Add destination marker
        if (toLocation && toLocation.latitude && toLocation.longitude) {
          mapService.addMarker([toLocation.latitude, toLocation.longitude], {
            title: toLocation.name
          });
          coordinates.push({ lat: toLocation.latitude, lng: toLocation.longitude });
        }

        // Add stop markers
        selectedStops?.forEach(stop => {
          if (stop.location) {
            mapService.addMarker(
              [stop.location.latitude, stop.location.longitude],
              {
                title: stop.name || `Stop ${selectedStops.indexOf(stop) + 1}`
              }
            );
            coordinates.push({ lat: stop.location.latitude, lng: stop.location.longitude });
          }
        });

        // Add bus markers
        buses?.forEach(bus => {
          if (hasBusLocation(bus)) {
            // It's a BusLocation type
            mapService.addMarker(
              [bus.latitude, bus.longitude],
              {
                title: bus.busName || `Bus ${bus.busId}`
              }
            );
            coordinates.push({ lat: bus.latitude, lng: bus.longitude });
          } else if (bus.fromLocation && bus.toLocation) {
            // It's a Bus type with location objects
            // Use from location as a default display position
            mapService.addMarker(
              [bus.fromLocation.latitude, bus.fromLocation.longitude],
              {
                title: bus.name || bus.busNumber
              }
            );
            coordinates.push({ lat: bus.fromLocation.latitude, lng: bus.fromLocation.longitude });
          }
        });

        // Fit map to show all markers
        if (coordinates.length > 0) {
          const formattedCoords = coordinates.map(coord => [coord.lat, coord.lng] as [number, number]);
          mapService.fitBounds(formattedCoords);
        }
      } catch (_error) {
        // Error updating map
        setMapError('Error updating map');
      }
    };

    updateMap();
  }, [fromLocation, toLocation, selectedStops, buses, isMapInitialized, mapError, onBusClick]);

  return (
    <div>
      {mapError && <div className="map-error">{mapError}</div>}
      {!isMapInitialized && <div className="map-loading">Loading...</div>}

      <div
        ref={mapContainerRef}
        id={mapContainerId}
        style={style}
        data-testid="map-container"
        className={className}
      />
    </div>
  );
};

export default MapComponent;