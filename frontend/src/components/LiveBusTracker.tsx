import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Location, Bus, BusLocation } from '../types';
import type { Bus as ApiBus, BusLocation as ApiBusLocation } from '../types/apiTypes';
import { getCurrentBusLocations } from '../services/api';
import MapComponent from './MapComponent';
import '../styles/LiveBusTracker.css';

interface LiveBusTrackerProps {
  fromLocation: Location;
  toLocation: Location;
  buses: Bus[];
}

/**
 * Component for displaying real-time bus locations on a map
 * Now uses the universal MapComponent that supports both Leaflet and Google Maps
 */
export const LiveBusTracker: React.FC<LiveBusTrackerProps> = ({ 
  fromLocation, 
  toLocation, 
  buses
}) => {
  const { t } = useTranslation();
  const [busLocations, setBusLocations] = useState<BusLocation[]>([]);
  const [selectedBus, setSelectedBus] = useState<BusLocation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showStaticBuses, setShowStaticBuses] = useState<boolean>(false);
  const [infoOpen, setInfoOpen] = useState<boolean>(false); // Added missing state

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

  // Update handler to accept union type
  const handleBusClick = (bus: Bus | BusLocation) => {
    // Check if it's a BusLocation type using type guard
    if ('latitude' in bus && 'longitude' in bus) {
      setSelectedBus(bus);
      setInfoOpen(true);
    } else {
      console.log('Bus selected:', bus.busName || bus.busNumber);
      // Handle regular Bus type if needed
    }
  };

  // Close info window
  const handleInfoClose = () => {
    setSelectedBus(null);
  };

  const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '10px'
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
      
      {/* Using our universal MapComponent with type assertion */}
      <MapComponent
        fromLocation={fromLocation}
        toLocation={toLocation}
        buses={busLocations}
        onBusClick={handleBusClick as any} // Using type assertion to bypass the type error
        style={mapContainerStyle}
      />
      
      {/* Selected bus info panel - now showing as a modal/panel instead of map popup */}
      {selectedBus && (
        <div className="bus-info-panel">
          <button className="close-button" onClick={handleInfoClose}>×</button>
          <div className="bus-info-content">
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

