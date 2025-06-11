import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from '@react-google-maps/api';
import type { Location, Bus, BusLocation } from '../types';
import { getEnv } from '../utils/environment';
import { getCurrentBusLocations } from '../services/api';

interface LiveBusTrackerProps {
  fromLocation: Location;
  toLocation: Location;
  buses: Bus[];
}

// Import the correct type from the library for Google Maps libraries
// Rather than defining our own type, use the type directly from the package
const libraries = ['places'] as ("places" | "drawing" | "geometry" | "visualization")[];

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '10px'
};

/**
 * Component for displaying real-time bus locations on a map
 * Uses crowd-sourced data from users who are on the buses
 */
export const LiveBusTracker: React.FC<LiveBusTrackerProps> = ({ 
  fromLocation, 
  toLocation, 
  buses  // Actually use this prop in the component to avoid warnings
}) => {
  const { t } = useTranslation();
  const [busLocations, setBusLocations] = useState<BusLocation[]>([]);
  const [selectedBus, setSelectedBus] = useState<BusLocation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showStaticBuses, setShowStaticBuses] = useState<boolean>(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: getEnv('VITE_GOOGLE_MAPS_API_KEY'),
    libraries,
  });

  // Calculate center of the map based on from/to locations
  const mapCenter = {
    lat: (fromLocation.latitude + toLocation.latitude) / 2,
    lng: (fromLocation.longitude + toLocation.longitude) / 2
  };

  // Load bus locations when component mounts and periodically update
  useEffect(() => {
    const loadBusLocations = async () => {
      try {
        setLoading(true);
        // Get all current bus locations
        const locations = await getCurrentBusLocations();
        
        // Filter locations based on fromLocation and toLocation
        // Since routeId doesn't exist, filter by matching bus routes that go between these locations
        const filteredLocations = locations.filter(loc => 
          (loc.fromLocation && loc.fromLocation.includes(fromLocation.name) && 
           loc.toLocation && loc.toLocation.includes(toLocation.name)) ||
          (loc.fromLocation && loc.fromLocation.includes(toLocation.name) && 
           loc.toLocation && loc.toLocation.includes(fromLocation.name))
        );
        
        setBusLocations(filteredLocations);
        setError(null);
        
        // If no live bus data is available, show the static buses after a delay
        if (filteredLocations.length === 0 && buses.length > 0) {
          setTimeout(() => setShowStaticBuses(true), 2000);
        } else {
          setShowStaticBuses(false);
        }
      } catch (err) {
        console.error('Error loading bus locations:', err);
        setError(t('liveTracker.loadError', 'Could not load bus locations'));
        
        // Show static buses if an error occurs while fetching live data
        if (buses.length > 0) {
          setShowStaticBuses(true);
        }
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    loadBusLocations();

    // Set up periodic refresh (every 15 seconds)
    const interval = setInterval(loadBusLocations, 15000);

    return () => {
      clearInterval(interval);
    };
  }, [fromLocation.id, toLocation.id, t, buses.length]);

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

  // Calculate map bounds to fit all markers
  const calculateBounds = () => {
    if (!isLoaded || busLocations.length === 0) return null;
    
    const bounds = new google.maps.LatLngBounds();
    
    // Add from and to locations
    bounds.extend({ lat: fromLocation.latitude, lng: fromLocation.longitude });
    bounds.extend({ lat: toLocation.latitude, lng: toLocation.longitude });
    
    // Add all bus locations
    busLocations.forEach(bus => {
      bounds.extend({ lat: bus.latitude, lng: bus.longitude });
    });
    
    return bounds;
  };

  // Handle map load event
  const handleMapLoad = (map: google.maps.Map) => {
    const bounds = calculateBounds();
    if (bounds) {
      map.fitBounds(bounds);
    }
  };

  return (
    <div className="live-tracker-section">
      <h2>{t('liveTracker.title', 'Live Bus Tracker')}</h2>
      
      {/* Show the number of static buses if we're displaying them */}
      {showStaticBuses && (
        <div className="static-buses-info">
          <p>{t('liveTracker.staticBusesInfo', 'Showing scheduled buses on this route')}: {buses.length}</p>
        </div>
      )}
      
      {loading && (
        <div className="live-tracker-loading">
          <div className="spinner"></div>
          <p>{t('common.loading', 'Loading...')}</p>
        </div>
      )}
      
      {error && <div className="live-tracker-error">{error}</div>}
      
      <div className="live-tracker-info">
        <div className="confidence-legend">
          <h4>{t('liveTracker.confidenceLegend', 'Confidence Score')}</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#4CAF50' }}></span>
              <span>{t('liveTracker.highConfidence', 'High (70-100)')}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#FFC107' }}></span>
              <span>{t('liveTracker.mediumConfidence', 'Medium (40-69)')}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#FF0000' }}></span>
              <span>{t('liveTracker.lowConfidence', 'Low (0-39)')}</span>
            </div>
          </div>
        </div>
        
        <div className="active-trackers">
          <h4>{t('liveTracker.activeTrackers', 'Active Trackers')}</h4>
          <div className="trackers-count">
            {busLocations.reduce((sum, bus) => sum + bus.reportCount, 0)}
            <span className="trackers-label">{t('liveTracker.people', 'people')}</span>
          </div>
        </div>
      </div>
      
      {isLoaded && (
        <div className="map-container">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={12}
            options={mapOptions}
            onLoad={handleMapLoad}
          >
            {/* Origin marker */}
            <MarkerF
              position={{ lat: fromLocation.latitude, lng: fromLocation.longitude }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#1a73e8',
                fillOpacity: 1,
                strokeWeight: 0,
                scale: 10
              }}
              label={{
                text: "A",
                color: "#FFFFFF",
                fontWeight: "bold",
                fontSize: "14px"
              }}
              title={fromLocation.name}
            />
            
            {/* Destination marker */}
            <MarkerF
              position={{ lat: toLocation.latitude, lng: toLocation.longitude }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#1a73e8',
                fillOpacity: 1,
                strokeWeight: 0,
                scale: 10
              }}
              label={{
                text: "B",
                color: "#FFFFFF",
                fontWeight: "bold",
                fontSize: "14px"
              }}
              title={toLocation.name}
            />
            
            {/* Bus markers */}
            {busLocations.map(bus => (
              <MarkerF
                key={`bus-${bus.busId}`}
                position={{ lat: bus.latitude, lng: bus.longitude }}
                icon={getBusMarkerIcon(bus.confidenceScore)}
                onClick={() => handleBusClick(bus)}
                title={`${bus.busName} (${bus.busNumber})`}
                animation={google.maps.Animation.DROP}
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
      
      {!loading && busLocations.length === 0 && (
        <div className="no-buses-message">
          <p>{t('liveTracker.noBuses', 'No buses currently being tracked on this route')}</p>
          <p>{t('liveTracker.enableTracking', 'Use the tracking feature when you board a bus to help other passengers!')}</p>
        </div>
      )}
      
      <div className="refresh-info">
        <div className="refresh-icon">⟳</div>
        <p>{t('liveTracker.refreshInfo', 'Bus locations automatically update every 15 seconds')}</p>
      </div>
    </div>
  );
};

export default LiveBusTracker;

