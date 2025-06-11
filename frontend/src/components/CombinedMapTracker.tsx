import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  GoogleMap, 
  DirectionsRenderer, 
  MarkerF, 
  InfoWindowF, 
  useJsApiLoader 
} from '@react-google-maps/api';
import type { Libraries } from '@react-google-maps/api';
import type { Location, Bus, Stop, BusLocation } from '../types';
import { getEnv } from '../utils/environment';
import { getCurrentBusLocations } from '../services/api';

interface CombinedMapTrackerProps {
  fromLocation: Location;
  toLocation: Location;
  buses: Bus[];
  selectedStops?: Stop[];
  showLiveTracking?: boolean;
}

const libraries: Libraries = ['places'];

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

const containerStyle = {
  width: '100%',
  height: '450px',  // Slightly taller to accommodate more elements
  borderRadius: '10px'
};

/**
 * Combined component that shows both static route map and live bus tracking
 */
const CombinedMapTracker: React.FC<CombinedMapTrackerProps> = ({ 
  fromLocation, 
  toLocation, 
  buses,
  selectedStops = [],
  showLiveTracking = true
}) => {
  const { t } = useTranslation();
  // Route map state
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [mapKey, setMapKey] = useState<number>(0); // For forcing re-render
  
  // Live tracker state
  const [busLocations, setBusLocations] = useState<BusLocation[]>([]);
  const [selectedBus, setSelectedBus] = useState<BusLocation | null>(null);
  
  // Shared state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: getEnv('VITE_GOOGLE_MAPS_API_KEY'),
    libraries,
  });

  // Calculate map center based on from/to locations
  const mapCenter = {
    lat: (fromLocation.latitude + toLocation.latitude) / 2,
    lng: (fromLocation.longitude + toLocation.longitude) / 2
  };

  // Handle map load event
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Helper function to get location data from a stop
  const getStopLocation = (stop: any): { lat: number, lng: number } | null => {
    // Check if stop has direct lat/lng properties
    if (stop && typeof stop.lat !== 'undefined' && typeof stop.lng !== 'undefined') {
      return {
        lat: parseFloat(stop.lat.toString()),
        lng: parseFloat(stop.lng.toString())
      };
    }
    
    // Check if stop has a location property with latitude/longitude
    if (stop && stop.location && 
        typeof stop.location.latitude !== 'undefined' && 
        typeof stop.location.longitude !== 'undefined') {
      return {
        lat: parseFloat(stop.location.latitude.toString()),
        lng: parseFloat(stop.location.longitude.toString())
      };
    }
    
    // Finally check if stop has latitude/longitude directly
    if (stop && typeof stop.latitude !== 'undefined' && typeof stop.longitude !== 'undefined') {
      return {
        lat: parseFloat(stop.latitude.toString()),
        lng: parseFloat(stop.longitude.toString())
      };
    }
    
    return null;
  };

  // Effect for loading bus locations
  useEffect(() => {
    if (!showLiveTracking) return;
    
    const loadBusLocations = async () => {
      try {
        setIsLoading(true);
        // Get all current bus locations
        const locations = await getCurrentBusLocations();
        
        // Filter locations based on fromLocation and toLocation
        const filteredLocations = locations.filter(loc => 
          (loc.fromLocation && loc.fromLocation.includes(fromLocation.name) && 
           loc.toLocation && loc.toLocation.includes(toLocation.name)) ||
          (loc.fromLocation && loc.fromLocation.includes(toLocation.name) && 
           loc.toLocation && loc.toLocation.includes(fromLocation.name))
        );
        
        setBusLocations(filteredLocations);
        setError(null);
      } catch (err) {
        console.error('Error loading bus locations:', err);
        setError(t('liveTracker.loadError', 'Could not load bus locations'));
      } finally {
        setIsLoading(false);
      }
    };

    // Initial load
    loadBusLocations();

    // Set up periodic refresh (every 15 seconds)
    const interval = setInterval(loadBusLocations, 15000);

    return () => {
      clearInterval(interval);
    };
  }, [fromLocation.id, toLocation.id, fromLocation.name, toLocation.name, t, buses.length, showLiveTracking]);

  // Effect for basic directions between from/to locations
  useEffect(() => {
    if (!isLoaded || !fromLocation || !toLocation) return;
    
    const directionsService = new google.maps.DirectionsService();

    setIsLoading(true);
    setError(null);

    directionsService.route(
      {
        origin: { lat: fromLocation.latitude, lng: fromLocation.longitude },
        destination: { lat: toLocation.latitude, lng: toLocation.longitude },
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false
      },
      (result, status) => {
        setIsLoading(false);

        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        } else {
          setError(t('map.error.directions', 'Could not calculate route directions'));
        }
      }
    );
  }, [isLoaded, fromLocation, toLocation, t]);

  // Effect to handle changes in selectedStops
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !selectedStops || selectedStops.length === 0) return;
    
    // Create bounds to include all stops
    const bounds = new google.maps.LatLngBounds();
    
    // Add from and to locations
    bounds.extend({ lat: fromLocation.latitude, lng: fromLocation.longitude });
    bounds.extend({ lat: toLocation.latitude, lng: toLocation.longitude });
    
    // Get stops with coordinates using our helper function
    const stopsWithCoordinates = selectedStops
      .map(stop => ({ stop, location: getStopLocation(stop) }))
      .filter(item => item.location !== null);
    
    if (stopsWithCoordinates.length > 0) {
      // Add all stops with coordinates
      stopsWithCoordinates.forEach(item => {
        if (item.location) {
          bounds.extend(item.location);
        }
      });
      
      // Add any bus locations too
      busLocations.forEach(bus => {
        bounds.extend({ lat: bus.latitude, lng: bus.longitude });
      });
      
      // Fit map to include all markers
      if (mapRef.current) {
        mapRef.current.fitBounds(bounds);
        
        // Force map to refresh by updating key
        setMapKey(prev => prev + 1);
        
        // Add a small delay to ensure map is visible
        setTimeout(() => {
          if (mapRef.current) {
            const center = mapRef.current.getCenter();
            if (center) {
              google.maps.event.trigger(mapRef.current, 'resize');
              mapRef.current.setCenter(center);
            }
          }
        }, 200);
      }
    }
  }, [selectedStops, fromLocation, toLocation, isLoaded, busLocations]);

  // Format speed for display
  const formatSpeed = (speedMps: number): string => {
    const kmh = speedMps * 3.6; // Convert m/s to km/h
    return `${kmh.toFixed(1)} km/h`;
  };

  // Format time for display
  const formatTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timestamp;
    }
  };

  // Handle bus marker click
  const handleBusClick = (bus: BusLocation) => {
    setSelectedBus(bus);
  };

  // Close info window
  const handleInfoClose = () => {
    setSelectedBus(null);
  };

  // Generate bus marker icon based on confidence score
  const getBusMarkerIcon = (confidence: number) => {
    // Different colors based on confidence level
    let fillColor = '#FF0000'; // Red for low confidence
    
    if (confidence >= 70) {
      fillColor = '#4CAF50'; // Green for high confidence
    } else if (confidence >= 40) {
      fillColor = '#FFC107'; // Yellow for medium confidence
    }
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: fillColor,
      fillOpacity: 0.8,
      strokeWeight: 1,
      strokeColor: '#000000',
      scale: 10,
    };
  };

  if (!isLoaded) return null;

  return (
    <div className="combined-map-section">
      <h2>{t('combinedMap.title', 'Route Map & Live Tracking')}</h2>
      
      {error && <div className="map-error">{error}</div>}
      {isLoading && <div className="map-loading">{t('common.loading', 'Loading...')}</div>}
      
      {showLiveTracking && busLocations.length > 0 && (
        <div className="active-trackers">
          <span className="tracking-indicator"></span>
          <span>{t('liveTracker.activeTrackers', 'Active Trackers')}: </span>
          <strong>{busLocations.reduce((sum, bus) => sum + bus.reportCount, 0)}</strong>
        </div>
      )}
      
      {!error && isLoaded && (
        <div className="map-container" key={`map-${mapKey}`}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={7}
            options={mapOptions}
            onLoad={handleMapLoad}
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
            
            {/* Render markers for selected stops if available */}
            {selectedStops && selectedStops.length > 0 && (
              <>
                {selectedStops
                  .map((stop: any, index) => ({ stop, location: getStopLocation(stop), index }))
                  .filter(item => item.location !== null)
                  .map((item) => (
                    <MarkerF
                      key={`stop-${item.stop.id || item.index}`}
                      position={item.location!}
                      label={{
                        text: `${item.index + 1}`,
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
                      zIndex={1000 + item.index}
                    />
                  ))}
              </>
            )}
            
            {/* Live bus markers */}
            {showLiveTracking && busLocations.map(bus => (
              <MarkerF
                key={`bus-${bus.busId}`}
                position={{ lat: bus.latitude, lng: bus.longitude }}
                icon={{
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  fillColor: getBusMarkerIcon(bus.confidenceScore).fillColor,
                  fillOpacity: 0.8,
                  strokeWeight: 1,
                  strokeColor: '#000000',
                  scale: 7,
                  rotation: bus.heading || 0 // Use bus heading for arrow direction
                }}
                onClick={() => handleBusClick(bus)}
                title={`${bus.busName} (${bus.busNumber})`}
                animation={google.maps.Animation.DROP}
                zIndex={2000} // Keep bus markers on top
              />
            ))}
            
            {/* Info window for selected bus */}
            {selectedBus && (
              <InfoWindowF
                position={{ lat: selectedBus.latitude, lng: selectedBus.longitude }}
                onCloseClick={handleInfoClose}
              >
                <div className="bus-info-window">
                  <h3>{selectedBus.busName} {selectedBus.busNumber}</h3>
                  <div className="info-grid">
                    <div className="info-row">
                      <span className="info-label">{t('liveTracker.lastUpdated', 'Last updated')}:</span>
                      <span className="info-value">{formatTime(selectedBus.timestamp)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t('liveTracker.speed', 'Speed')}:</span>
                      <span className="info-value">{formatSpeed(selectedBus.speed)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t('liveTracker.nextStop', 'Next stop')}:</span>
                      <span className="info-value">{selectedBus.nextStopName || '-'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t('liveTracker.etaNextStop', 'ETA')}:</span>
                      <span className="info-value">{selectedBus.estimatedArrivalTime || '-'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t('liveTracker.trackers', 'Active trackers')}:</span>
                      <span className="info-value">{selectedBus.reportCount}</span>
                    </div>
                  </div>
                  <div className="confidence-indicator">
                    <span className="confidence-label">{t('liveTracker.confidence', 'Confidence')}:</span>
                    <div className="confidence-bar-bg">
                      <div 
                        className="confidence-bar-fill" 
                        style={{ 
                          width: `${selectedBus.confidenceScore}%`,
                          backgroundColor: selectedBus.confidenceScore >= 70 ? '#4CAF50' : 
                                          (selectedBus.confidenceScore >= 40 ? '#FFC107' : '#FF0000')
                        }}
                      ></div>
                    </div>
                    <span className="confidence-value">{selectedBus.confidenceScore}%</span>
                  </div>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        </div>
      )}
      
      <div className="map-legend">
        <div className="legend-section">
          <h4>{t('combinedMap.busConfidence', 'Live Bus Confidence')}</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#4CAF50' }}></span>
              <span>{t('liveTracker.highConfidence', 'High')}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#FFC107' }}></span>
              <span>{t('liveTracker.mediumConfidence', 'Medium')}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#FF0000' }}></span>
              <span>{t('liveTracker.lowConfidence', 'Low')}</span>
            </div>
          </div>
        </div>
        
        <div className="legend-section">
          <h4>{t('combinedMap.markers', 'Map Markers')}</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-marker origin">A</span>
              <span>{t('combinedMap.origin', 'Origin')}</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker destination">B</span>
              <span>{t('combinedMap.destination', 'Destination')}</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker stop">1</span>
              <span>{t('combinedMap.busStop', 'Bus Stop')}</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker bus">➤</span>
              <span>{t('combinedMap.liveBus', 'Live Bus')}</span>
            </div>
          </div>
        </div>
      </div>
      
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