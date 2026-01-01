import React, { useEffect, useRef, useState } from 'react';
import mapService from '../services/mapService';
import { logDebug } from '../utils/logger';
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
  
  // Suppress lint warnings for unused prop
  // onBusClick is passed but not used in current implementation
  React.useMemo(() => onBusClick, [onBusClick]);
  
  // Use stable ID to prevent re-rendering issues
  const stableMapId = useRef(mapId || `map-container-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
  const mapContainerId = stableMapId.current;

  useEffect(() => {
    const initMap = async () => {
      try {
        // Wait for DOM to be fully ready and element to have dimensions
        if (!mapContainerRef.current) {
          setMapError('Map container reference not available');
          return;
        }

        const element = mapContainerRef.current;
        
        // First, ensure element is visible in DOM
        if (!element.isConnected) {
          setMapError('Map container not connected to DOM');
          return;
        }

        // Force a layout recalculation
        const _offsetHeight = element.offsetHeight; // Trigger reflow
        
        // Ensure element has dimensions - wait with exponential backoff
        let attempts = 0;
        const maxAttempts = 30;
        let delayMs = 10;
        
        while ((element.offsetWidth === 0 || element.offsetHeight === 0) && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          attempts++;
          // Exponential backoff: 10ms, 15ms, 20ms, ... up to 100ms
          delayMs = Math.min(delayMs + 5, 100);
        }

        if (element.offsetWidth === 0 || element.offsetHeight === 0) {
          console.warn('Map container dimensions:', {
            offsetWidth: element.offsetWidth,
            offsetHeight: element.offsetHeight,
            clientWidth: element.clientWidth,
            clientHeight: element.clientHeight,
            computedStyle: globalThis.getComputedStyle(element)
          });
          throw new Error(`Map container has no dimensions after ${attempts} attempts (${element.offsetWidth}x${element.offsetHeight}). Ensure parent container is visible.`);
        }

        // Initialize the map service
        await mapService.init();

        // Create the map with the element ID
        mapService.createMap(mapContainerId);
        setIsMapInitialized(true);
      } catch (error) {
        // Map initialization failed
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setMapError(`Failed to load map: ${errorMessage}`);
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

        // Helper to add marker safely
        const safeAddMarker = (lat: number | undefined, lng: number | undefined, title: string) => {
          if (lat === undefined || lng === undefined || !Number.isFinite(lat) || !Number.isFinite(lng)) {
            logDebug('Skipping invalid marker', {
              component: 'MapComponent',
              lat,
              lng,
              title
            });
            return false;
          }
          try {
            mapService.addMarker([lat, lng], { title });
            coordinates.push({ lat, lng });
            return true;
          } catch (error) {
            logDebug('Failed to add marker', {
              component: 'MapComponent',
              title,
              error: error instanceof Error ? error.message : String(error)
            });
            return false;
          }
        };

        // Add origin marker
        if (fromLocation) {
          safeAddMarker(fromLocation.latitude, fromLocation.longitude, fromLocation.name || 'Origin');
        }

        // Add destination marker
        if (toLocation) {
          safeAddMarker(toLocation.latitude, toLocation.longitude, toLocation.name || 'Destination');
        }

        // Add stop markers
        selectedStops?.forEach((stop, index) => {
          if (stop.location) {
            safeAddMarker(
              stop.location.latitude,
              stop.location.longitude,
              stop.name || `Stop ${index + 1}`
            );
          }
        });

        // Add bus markers
        buses?.forEach(bus => {
          if (hasBusLocation(bus)) {
            // It's a BusLocation type
            safeAddMarker(
              bus.latitude,
              bus.longitude,
              bus.busName || `Bus ${bus.busId}`
            );
          } else if (bus.fromLocation && bus.toLocation) {
            // It's a Bus type with location objects
            safeAddMarker(
              bus.fromLocation.latitude,
              bus.fromLocation.longitude,
              bus.name || bus.busNumber
            );
          }
        });

        // Fit map to show all markers
        if (coordinates.length > 0) {
          try {
            const formattedCoords = coordinates.map(coord => [coord.lat, coord.lng] as [number, number]);
            mapService.fitBounds(formattedCoords);
          } catch (boundsError) {
            logDebug('Fit bounds error', {
              component: 'MapComponent',
              error: boundsError instanceof Error ? boundsError.message : String(boundsError)
            });
            // Don't fail the entire update if fitBounds fails
          }
        }
      } catch (error) {
        // Error updating map - log the actual error for debugging
        const errorMsg = error instanceof Error ? error.message : String(error);
        logDebug('Map update error', {
          component: 'MapComponent',
          error: errorMsg,
          errorType: error instanceof Error ? error.name : typeof error
        });
        setMapError(`Error updating map: ${errorMsg}`);
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
        style={{
          ...style,
          position: 'relative',
          display: 'block',
          width: style?.width || '100%',
          height: style?.height || '450px',
          minHeight: style?.height || '450px'
        }}
        data-testid="map-container"
        className={className}
      />
    </div>
  );
};

export default MapComponent;