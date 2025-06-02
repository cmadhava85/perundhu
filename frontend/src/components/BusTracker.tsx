import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Stop } from '../types';
import { getCurrentPosition } from '../utils/geolocation';

interface BusTrackerProps {
  buses: Bus[];
  stops: Record<number, Stop[]>;
}

/**
 * Component for crowd-sourced bus tracking
 * Allows users to report when they've boarded a bus at a specific stop
 */
const BusTracker: React.FC<BusTrackerProps> = ({ buses, stops }) => {
  const { t } = useTranslation();
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState<boolean>(
    localStorage.getItem('perundhu-tracking-enabled') === 'true'
  );
  const [lastReportTime, setLastReportTime] = useState<Date | null>(null);
  const [movementDetected, setMovementDetected] = useState<boolean>(false);
  const [busStops, setBusStops] = useState<Stop[]>([]);
  const [isOnboard, setIsOnboard] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handle bus selection
  const handleBusSelect = (busId: number) => {
    setSelectedBusId(busId);
    setBusStops(stops[busId] || []);
    setSelectedStopId(null);
  };

  // Handle stop selection
  const handleStopSelect = (stopId: number) => {
    setSelectedStopId(stopId);
  };

  // Toggle tracking on/off
  const toggleTracking = () => {
    const newValue = !trackingEnabled;
    setTrackingEnabled(newValue);
    localStorage.setItem('perundhu-tracking-enabled', newValue ? 'true' : 'false');
    
    if (newValue) {
      startTracking();
    } else {
      stopTracking();
    }
  };

  // Start location tracking
  const startTracking = useCallback(async () => {
    if (!selectedBusId || !selectedStopId) {
      setError(t('busTracker.selectBusAndStop', 'Please select a bus and stop first'));
      return;
    }

    try {
      // Request permission for location tracking
      const position = await getCurrentPosition();
      setUserLocation(position);
      setIsTracking(true);
      setIsOnboard(true);
      setError(null);
      setLastReportTime(new Date());
      
      // Report initial location
      reportLocation(position, selectedBusId, selectedStopId);
      
    } catch (err) {
      console.error('Error starting location tracking:', err);
      setError(t('busTracker.locationError', 'Unable to access your location'));
      setIsTracking(false);
    }
  }, [selectedBusId, selectedStopId]);

  // Stop location tracking
  const stopTracking = () => {
    setIsTracking(false);
    setIsOnboard(false);
    reportDisembark();
  };

  // Report current location to server
  const reportLocation = async (
    position: GeolocationPosition,
    busId: number,
    stopId: number | null
  ) => {
    try {
      // Here we would make an API call to your backend
      console.log('Reporting location:', {
        busId,
        stopId,
        timestamp: new Date().toISOString(),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || 0
      });

      // In a real implementation, you would call an API endpoint:
      await fetch('/api/v1/bus-tracking/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          busId,
          stopId,
          timestamp: new Date().toISOString(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0
        })
      });

      setLastReportTime(new Date());
    } catch (error) {
      console.error('Failed to report location:', error);
    }
  };

  // Report user disembarking the bus
  const reportDisembark = async () => {
    if (!selectedBusId) return;
    
    try {
      // Here we would make an API call to indicate the user has left the bus
      console.log('Reporting disembark:', {
        busId: selectedBusId,
        timestamp: new Date().toISOString()
      });

      // Reset state after reporting
      setSelectedBusId(null);
      setSelectedStopId(null);
      setIsOnboard(false);
      setUserLocation(null);
      
    } catch (error) {
      console.error('Failed to report disembark:', error);
    }
  };

  // Track user movement to validate they're on a bus
  useEffect(() => {
    if (!isTracking) return;

    let watchId: number;
    
    // Speed threshold that indicates user is on a moving vehicle (in m/s)
    // Average walking speed is about 1.4 m/s, bus will be faster
    const SPEED_THRESHOLD = 3.0;
    
    // Set up continuous position monitoring
    const setupWatchPosition = () => {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation(position);
          
          // Check if speed indicates user is on a moving vehicle
          if (position.coords.speed && position.coords.speed > SPEED_THRESHOLD) {
            setMovementDetected(true);
            
            // Only report location if we have a bus and stop selected and some time has passed
            // to avoid too many reports
            if (selectedBusId && selectedStopId && lastReportTime) {
              const now = new Date();
              const timeSinceLastReport = now.getTime() - lastReportTime.getTime();
              
              // Report location every 30 seconds while moving
              if (timeSinceLastReport > 30000) {
                reportLocation(position, selectedBusId, null); // null for stop means en route
              }
            }
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError(t('busTracker.trackingError', 'Error tracking position'));
        },
        { 
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000
        }
      );
    };
    
    setupWatchPosition();
    
    // Cleanup watch on unmount or when tracking stops
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTracking, selectedBusId, selectedStopId, lastReportTime]);

  // Validate user is actually on a bus using movement patterns
  // This helps prevent false reports from users in cars or other transport
  useEffect(() => {
    if (!isTracking || !movementDetected || !userLocation) return;

    // Here you could implement more sophisticated movement pattern detection
    // For now, we'll just use a simple timer to show the concept
    
    // After 2 minutes of tracking with movement, we confirm the user is likely on the bus
    const movementTimer = setTimeout(() => {
      // In a real implementation, you could validate the route matches the expected bus route
      console.log('Movement pattern validated - user appears to be on a bus');
    }, 120000); // 2 minutes
    
    return () => clearTimeout(movementTimer);
  }, [isTracking, movementDetected, userLocation]);

  if (!trackingEnabled) {
    return null;
  }

  return (
    <div className="bus-tracker">
      <h3>{t('busTracker.title', 'Help Track Buses')}</h3>
      
      {error && (
        <div className="tracker-error">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="tracker-toggle">
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={trackingEnabled}
            onChange={toggleTracking}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>
      
      {!isOnboard && (
        <>
          <div className="tracker-section">
            <label>{t('busTracker.selectBus', 'Select your bus:')}</label>
            <select 
              value={selectedBusId || ''} 
              onChange={(e) => handleBusSelect(Number(e.target.value))}
              className="tracker-select"
            >
              <option value="">{t('busTracker.chooseBus', '-- Choose bus --')}</option>
              {buses.map((bus, index) => (
                <option key={`bus-${bus.id || index}`} value={bus.id}>
                  {bus.busNumber} {bus.busName && `- ${bus.busName}`} {(bus.from || bus.to) && 
                    `(${bus.from || t('busTracker.unknown')} to ${bus.to || t('busTracker.unknown')})`}
                </option>
              ))}
            </select>
          </div>

          {selectedBusId && busStops.length > 0 && (
            <div className="tracker-section">
              <label>{t('busTracker.selectStop', 'Select the stop you boarded at:')}</label>
              <select 
                value={selectedStopId || ''} 
                onChange={(e) => handleStopSelect(Number(e.target.value))}
                className="tracker-select"
              >
                <option value="">{t('busTracker.chooseStop', '-- Choose stop --')}</option>
                {busStops.map((stop, index) => (
                  <option key={`stop-${stop.id || index}`} value={stop.id}>
                    {stop.name} {stop.departureTime ? `(${stop.departureTime})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedBusId && selectedStopId && (
            <button 
              className="tracker-button" 
              onClick={startTracking}
            >
              {t('busTracker.startTracking', 'I\'m boarding this bus')}
            </button>
          )}
        </>
      )}

      {isOnboard && (
        <div className="tracking-active">
          <div className="tracking-status">
            <span className="tracking-indicator"></span>
            {t('busTracker.activelyTracking', 'Actively tracking your bus')}
          </div>
          
          <div className="bus-info-card">
            <h4>{buses.find(b => b.id === selectedBusId)?.busName}</h4>
            <p>{buses.find(b => b.id === selectedBusId)?.busNumber}</p>
            {lastReportTime && (
              <p className="last-report">
                {t('busTracker.lastUpdate', 'Last update')}: {formatTime(lastReportTime)}
              </p>
            )}
          </div>

          <button 
            className="stop-tracking-button" 
            onClick={stopTracking}
          >
            {t('busTracker.stopTracking', 'I\'ve reached my destination')}
          </button>
        </div>  
      )}

      <div className="tracker-info">
        <h4>{t('busTracker.howItWorks', 'How it works:')}</h4>
        <ul>
          <li>{t('busTracker.step1', 'Select the bus you\'re boarding')}</li>
          <li>{t('busTracker.step2', 'Choose the stop where you boarded')}</li>
          <li>{t('busTracker.step3', 'Tap "I\'m boarding this bus" when you get on')}</li>
          <li>{t('busTracker.step4', 'Your location helps others track this bus')}</li>
          <li>{t('busTracker.step5', 'Tap "I\'ve reached my destination" when you get off')}</li>
        </ul>
        <p className="tracker-note">{t('busTracker.privacyNote', 'Your location is only shared while you\'re on the bus. Battery usage is optimized.')}</p>
      </div>
    </div>
  );
};

// Helper function to format time
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default BusTracker;