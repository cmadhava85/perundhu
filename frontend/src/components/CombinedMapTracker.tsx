import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DirectionsRenderer } from '@react-google-maps/api';
import type { Location, Stop, BusLocation } from '../types';
import { getCurrentBusLocations } from '../services/api';
import MapContainer from './map/MapContainer';
import MapMarkers from './map/MapMarkers';
import LiveBusMarkers from './map/LiveBusMarkers';
import MapLegend from './map/MapLegend';

interface CombinedMapTrackerProps {
  fromLocation: Location;
  toLocation: Location;
  selectedStops?: Stop[];
  showLiveTracking?: boolean;
  // Additional props expected by tests
  selectedBuses?: number[];
  buses?: any[];
  userLocation?: { latitude: number; longitude: number } | null;
  onBusSelect?: (busId: number) => void;
  onStopSelect?: (stop: Stop) => void;
}

/**
 * Combined component that shows both static route map and live bus tracking
 * Now refactored into smaller, focused components
 */
const CombinedMapTracker: React.FC<CombinedMapTrackerProps> = ({ 
  fromLocation, 
  toLocation, 
  selectedStops = [],
  showLiveTracking = true,
  selectedBuses = [],
  userLocation,
  onBusSelect,
  onStopSelect
}) => {
  const { t } = useTranslation();
  const mapRef = useRef<google.maps.Map | null>(null);
  const intervalRef = useRef<number | null>(null);
  const isUnmountedRef = useRef(false);

  // State management
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [mapKey, setMapKey] = useState<number>(0);
  const [busLocations, setBusLocations] = useState<BusLocation[]>([]);
  const [selectedBus, setSelectedBus] = useState<BusLocation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Coordinate validation and parsing utilities
  const parseCoordinate = useCallback((value: any): number | null => {
    if (value === null || value === undefined) return null;
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(parsed) || !isFinite(parsed)) return null;
    return parsed;
  }, []);

  const validateLocationCoordinates = useCallback((location: Location): { lat: number; lng: number } | null => {
    const lat = parseCoordinate(location.latitude);
    const lng = parseCoordinate(location.longitude);
    
    if (lat === null || lng === null) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    
    return { lat, lng };
  }, [parseCoordinate]);

  const getStopLocation = useCallback((stop: any): { lat: number, lng: number } | null => {
    let lat: number, lng: number;
    
    if (stop?.lat !== null && stop?.lat !== undefined && 
        stop?.lng !== null && stop?.lng !== undefined) {
      lat = parseFloat(stop.lat.toString());
      lng = parseFloat(stop.lng.toString());
    } else if (stop?.stopLat !== null && stop?.stopLat !== undefined && 
               stop?.stopLng !== null && stop?.stopLng !== undefined) {
      lat = parseFloat(stop.stopLat.toString());
      lng = parseFloat(stop.stopLng.toString());
    } else if (stop?.location?.latitude !== null && stop?.location?.longitude !== null) {
      lat = parseFloat(stop.location.latitude.toString());
      lng = parseFloat(stop.location.longitude.toString());
    } else if (stop?.latitude !== null && stop?.longitude !== null) {
      lat = parseFloat(stop.latitude.toString());
      lng = parseFloat(stop.longitude.toString());
    } else {
      return null;
    }
    
    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    
    return { lat, lng };
  }, []);

  const isValidBusLocation = useCallback((bus: BusLocation): boolean => {
    if (!bus || typeof bus.latitude !== 'number' || typeof bus.longitude !== 'number') return false;
    
    const lat = bus.latitude;
    const lng = bus.longitude;
    
    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) return false;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
    if (lat === 0 && lng === 0) return false;
    
    return true;
  }, []);

  // Memoize coordinate calculations
  const fromCoords = useMemo(() => 
    fromLocation ? validateLocationCoordinates(fromLocation) : null,
    [fromLocation, validateLocationCoordinates]
  );
  
  const toCoords = useMemo(() => 
    toLocation ? validateLocationCoordinates(toLocation) : null,
    [toLocation, validateLocationCoordinates]
  );

  const mapCenter = useMemo(() => {
    if (!fromCoords || !toCoords) return { lat: 0, lng: 0 };
    return {
      lat: (fromCoords.lat + toCoords.lat) / 2,
      lng: (fromCoords.lng + toCoords.lng) / 2
    };
  }, [fromCoords, toCoords]);

  // Early validation
  if (!fromLocation || !toLocation) {
    return (
      <div className="map-error-fallback">
        <div className="map-error-content">
          <div className="map-error-icon">📍</div>
          <h3>Missing Location Data</h3>
          <p>Please select both origin and destination locations.</p>
        </div>
      </div>
    );
  }
  
  if (!fromCoords || !toCoords) {
    return (
      <div className="map-error-fallback">
        <div className="map-error-content">
          <div className="map-error-icon">🗺️</div>
          <h3>Invalid Coordinates</h3>
          <p>The selected locations don't have valid coordinates.</p>
        </div>
      </div>
    );
  }

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleBusClick = useCallback((bus: BusLocation) => {
    setSelectedBus(bus);
    onBusSelect?.(bus.id);
  }, [onBusSelect]);

  const handleInfoClose = useCallback(() => {
    setSelectedBus(null);
  }, []);

  // Effect for loading bus locations - FIXED to prevent infinite loops
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!showLiveTracking || selectedBuses.length === 0) {
      setBusLocations([]);
      return;
    }
    
    const loadBusLocations = async () => {
      if (isUnmountedRef.current) return;
      
      try {
        setIsLoading(true);
        const locations = await getCurrentBusLocations();
        
        if (isUnmountedRef.current) return;
        
        const filteredLocations = locations.filter(loc => 
          selectedBuses.includes(loc.id) &&
          ((loc.fromLocation?.includes(fromLocation.name) && 
            loc.toLocation?.includes(toLocation.name)) ||
           (loc.fromLocation?.includes(toLocation.name) && 
            loc.toLocation?.includes(fromLocation.name)))
        );
        
        setBusLocations(filteredLocations);
        setError(null);
      } catch (err) {
        if (isUnmountedRef.current) return;
        console.error('Error loading bus locations:', err);
        setError(t('liveTracker.loadError', 'Could not load bus locations'));
      } finally {
        if (!isUnmountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadBusLocations();
    
    // Set up interval only if we have selected buses
    if (selectedBuses.length > 0) {
      intervalRef.current = setInterval(loadBusLocations, 15000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [showLiveTracking, selectedBuses, fromLocation.name, toLocation.name, t]);

  // Effect for directions - FIXED to prevent unnecessary calls
  useEffect(() => {
    if (!fromCoords || !toCoords || !window.google?.maps) return;
    
    const directionsService = new google.maps.DirectionsService();
    setIsLoading(true);
    setError(null);
    
    directionsService.route(
      {
        origin: { lat: fromCoords.lat, lng: fromCoords.lng },
        destination: { lat: toCoords.lat, lng: toCoords.lng },
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false
      },
      (result, status) => {
        if (isUnmountedRef.current) return;
        
        setIsLoading(false);
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        } else {
          setError(t('map.error.directions', 'Could not calculate route directions'));
        }
      }
    );
  }, [fromCoords?.lat, fromCoords?.lng, toCoords?.lat, toCoords?.lng, t]);

  // Effect to handle map bounds - THROTTLED to prevent excessive updates
  useEffect(() => {
    if (!mapRef.current || !selectedStops || selectedStops.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      if (!mapRef.current || isUnmountedRef.current) return;
      
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: fromCoords.lat, lng: fromCoords.lng });
      bounds.extend({ lat: toCoords.lat, lng: toCoords.lng });
      
      const stopsWithCoordinates = selectedStops
        .map(stop => ({ stop, location: getStopLocation(stop) }))
        .filter(item => item.location !== null);
      
      if (stopsWithCoordinates.length > 0) {
        stopsWithCoordinates.forEach(item => {
          if (item.location) bounds.extend(item.location);
        });
        
        busLocations
          .filter(bus => isValidBusLocation(bus))
          .forEach(bus => bounds.extend({ lat: bus.latitude, lng: bus.longitude }));
        
        if (mapRef.current && !isUnmountedRef.current) {
          mapRef.current.fitBounds(bounds);
          setMapKey(prev => prev + 1);
        }
      }
    }, 100); // Debounce map updates
    
    return () => clearTimeout(timeoutId);
  }, [selectedStops, fromCoords, toCoords, busLocations, getStopLocation, isValidBusLocation]);

  return (
    <div className="combined-map-section">
      <h2>{t('combinedMap.title', 'Route Map & Live Tracking')}</h2>
      
      {error && <div className="map-error">{error}</div>}
      {isLoading && <div className="map-loading">{t('common.loading', 'Loading...')}</div>}
      
      {showLiveTracking && busLocations.length > 0 && (
        <div className="active-trackers">
          <span className="tracking-indicator"></span>
          <span>{t('liveTracker.activeTrackers', 'Active Trackers')}: </span>
          <strong>{busLocations.reduce((sum, bus) => sum + (bus.reportCount || 0), 0)}</strong>
        </div>
      )}
      
      {!error && (
        <MapContainer
          key={`map-${mapKey}`}
          center={mapCenter}
          onMapLoad={handleMapLoad}
        >
          {/* Basic route directions */}
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: "#1a73e8",
                  strokeWeight: 5,
                }
              }}
            />
          )}
          
          {/* Location and stop markers */}
          <MapMarkers
            fromLocation={fromLocation}
            toLocation={toLocation}
            stops={selectedStops}
            onStopLocation={getStopLocation}
            onStopSelect={onStopSelect}
          />
          
          {/* Live bus markers */}
          {showLiveTracking && (
            <LiveBusMarkers
              busLocations={busLocations}
              selectedBus={selectedBus}
              onBusClick={handleBusClick}
              onInfoClose={handleInfoClose}
              isValidBusLocation={isValidBusLocation}
            />
          )}
          
          {/* User location marker */}
          {userLocation && (
            <div 
              data-testid="map-marker" 
              data-lat={userLocation.latitude}
              data-lng={userLocation.longitude}
            >
              User Location
            </div>
          )}
        </MapContainer>
      )}
      
      <MapLegend showLiveTracking={showLiveTracking} />
      
      {showLiveTracking && (
        <div className="refresh-info">
          <div className="refresh-icon">⟳</div>
          <p>{t('liveTracker.refreshInfo', 'Bus locations automatically update every 15 seconds')}</p>
        </div>
      )}
    </div>
  );
};

export default CombinedMapTracker;