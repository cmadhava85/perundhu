import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Stop } from '../types';
import { getCurrentPosition } from '../services/geolocation';
import { useAuth } from '../hooks/useAuth';
import { getOrCreateDeviceId } from '../utils/deviceId';
import '../styles/BusTracker.css';

interface BusTrackerProps {
  buses: Bus[];
  stops: Record<number, Stop[]>;
}

/**
 * Component for crowd-sourced bus tracking
 * Allows users to report when they've boarded a bus at a specific stop
 * Supports both authenticated users (for rewards) and anonymous tracking (device ID)
 */
const BusTracker: React.FC<BusTrackerProps> = ({ buses, stops }) => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState<boolean>(
    localStorage.getItem('perundhu-tracking-enabled') === 'true'
  );
  const [lastReportTime, setLastReportTime] = useState<Date | null>(null);
  const [boardingTime, setBoardingTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [movementDetected, setMovementDetected] = useState<boolean>(false);
  const [busStops, setBusStops] = useState<Stop[]>([]);
  const [isOnboard, setIsOnboard] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reportCount, setReportCount] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [reporterId, setReporterId] = useState<string>('');

  // Initialize reporter ID (user ID if authenticated, device ID if anonymous)
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      setReporterId(`user_${user.id}`);
    } else {
      const deviceId = getOrCreateDeviceId();
      setReporterId(`device_${deviceId}`);
    }
  }, [user, isAuthenticated]);

  // Handle bus selection
  const handleBusSelect = (busId: number) => {
    setSelectedBusId(busId);
    setBusStops(stops[busId] || []);
    setSelectedStopId(null);
  };

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

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
      const now = new Date();
      setUserLocation(position);
      setGpsAccuracy(position.coords.accuracy);
      setIsTracking(true);
      setIsOnboard(true);
      setBoardingTime(now);
      setLastReportTime(now);
      setReportCount(1);
      setError(null);
      
      // Request battery information
      if ('getBattery' in navigator) {
        const batteryApi = navigator as { getBattery?: () => Promise<{ level: number }> };
        batteryApi.getBattery?.().then((battery: { level: number }) => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }
      
      // Report initial location
      reportLocation(position, selectedBusId, selectedStopId);
      
    } catch (_err) {
      // Location tracking error
      setError(t('busTracker.locationError', 'Unable to access your location'));
      setIsTracking(false);
    }
  }, [selectedBusId, selectedStopId, t]);

  // Stop location tracking
  const stopTracking = () => {
    setIsTracking(false);
    setIsOnboard(false);
    setBoardingTime(null);
    reportDisembark();
  };

  // Report current location to server
  const reportLocation = async (
    position: GeolocationPosition,
    busId: number,
    stopId: number | null
  ) => {
    try {
      // Report location with reporter ID (user ID or device ID)
      await fetch('/api/v1/bus-tracking/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          busId,
          stopId,
          reporterId,  // Use hybrid identifier (user_xxx or device_xxx)
          timestamp: new Date().toISOString(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0
        })
      });

      setLastReportTime(new Date());
      setReportCount(reportCount + 1);
    } catch (_error) {
      // Failed to report location
    }
  };

  // Report user disembarking the bus
  const reportDisembark = async () => {
    if (!selectedBusId) return;
    
    try {
      // Reset state after reporting
      setSelectedBusId(null);
      setSelectedStopId(null);
      setIsOnboard(false);
      setUserLocation(null);
      
    } catch (_error) {
      // Failed to report disembark
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
          // Geolocation error
          void error; // Acknowledge parameter
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
  }, [isTracking, selectedBusId, selectedStopId, lastReportTime, t]);

  // Validate user is actually on a bus using movement patterns
  // This helps prevent false reports from users in cars or other transport
  useEffect(() => {
    if (!isTracking || !movementDetected || !userLocation) return;

    // Here you could implement more sophisticated movement pattern detection
    // For now, we'll just use a simple timer to show the concept
    
    // After 2 minutes of tracking with movement, we confirm the user is likely on the bus
    const movementTimer = setTimeout(() => {
      // Movement pattern validated - user appears to be on a bus
    }, 120000); // 2 minutes
    
    return () => clearTimeout(movementTimer);
  }, [isTracking, movementDetected, userLocation]);

  return (
    <div className="bus-tracker">
      <div className="tracker-header-section">
        <h3>{t('busTracker.title', 'Help Track Buses')}</h3>
      </div>

      {!isAuthenticated && (
        <div className="anonymous-banner">
          <span className="banner-icon">👤</span>
          <div className="banner-content">
            <p>{t('busTracker.anonymousTracking', 'Tracking anonymously using device ID')}</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="tracker-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="tracker-toggle-section">
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={trackingEnabled}
            onChange={toggleTracking}
            aria-label={t('busTracker.enableTracking', 'Enable bus tracking')}
          />
          <span className="toggle-slider"></span>
        </label>
        <span className="tracker-toggle-label">{t('busTracker.enableTracking', 'Enable bus tracking')}</span>
      </div>

      {/* Info Cards showing current stats */}
      {trackingEnabled && (
        <div className="tracking-stats-row">
          {isOnboard && boardingTime && (
            <div className="stat-card">
              <span className="stat-icon">⏱️</span>
              <div className="stat-content">
                <label>{t('busTracker.trackedTime', 'Time tracked')}</label>
                <span className="stat-value">{calculateDuration(boardingTime, currentTime, t)}</span>
              </div>
            </div>
          )}
          
          {gpsAccuracy !== null && (
            <div className="stat-card">
              <span className="stat-icon">📍</span>
              <div className="stat-content">
                <label>{t('busTracker.gpsAccuracy', 'GPS Accuracy')}</label>
                <span className="stat-value">{Math.round(gpsAccuracy)}m</span>
              </div>
            </div>
          )}
          
          {reportCount > 0 && (
            <div className="stat-card">
              <span className="stat-icon">📤</span>
              <div className="stat-content">
                <label>{t('busTracker.reports', 'Location reports')}</label>
                <span className="stat-value">{reportCount}</span>
              </div>
            </div>
          )}

          {batteryLevel !== null && (
            <div className="stat-card">
              <span className={`stat-icon ${batteryLevel < 20 ? 'warning' : ''}`}>🔋</span>
              <div className="stat-content">
                <label>{t('busTracker.batteryLevel', 'Battery')}</label>
                <span className="stat-value">{batteryLevel}%</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {trackingEnabled ? (
        <>
          {!isOnboard && (
            <>
              <div className="tracker-section">
                <label className="section-label">{t('busTracker.selectBus', 'Select your bus:')}</label>
                <div className="select-wrapper">
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
                  <span className="select-arrow">▼</span>
                </div>
              </div>

              {selectedBusId && busStops.length > 0 && (
                <div className="tracker-section">
                  <label className="section-label">{t('busTracker.selectStop', 'Select the stop you boarded at:')}</label>
                  <div className="select-wrapper">
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
                    <span className="select-arrow">▼</span>
                  </div>
                </div>
              )}

              {selectedBusId && selectedStopId && (
                <button 
                  className="tracker-button primary" 
                  onClick={startTracking}
                >
                  <span className="button-icon">✓</span>
                  {t('busTracker.startTracking', 'I\'m boarding this bus')}
                </button>
              )}
            </>
          )}

          {isOnboard && (
            <div className="tracking-active">
              <div className="tracking-status-badge">
                <span className="tracking-indicator"></span>
                {t('busTracker.activelyTracking', 'Actively tracking your bus')}
              </div>
              
              <div className="bus-info-card">
                <h4>{buses.find(b => b.id === selectedBusId)?.busName}</h4>
                <p className="bus-number-info">{buses.find(b => b.id === selectedBusId)?.busNumber}</p>
                {lastReportTime && (
                  <p className="last-report">
                    📡 {t('busTracker.lastUpdate', 'Last update')}: {formatTime(lastReportTime)}
                  </p>
                )}
              </div>

              <button 
                className="tracker-button secondary" 
                onClick={stopTracking}
              >
                <span className="button-icon">🛑</span>
                {t('busTracker.stopTracking', 'I\'ve reached my destination')}
              </button>
            </div>  
          )}

          <div className="tracker-info">
            <h4>ℹ️ {t('busTracker.howItWorks', 'How it works:')}</h4>
            <ul className="tracker-steps">
              <li><span className="step-number">1</span>{t('busTracker.step1', 'Select the bus you\'re boarding')}</li>
              <li><span className="step-number">2</span>{t('busTracker.step2', 'Choose the stop where you boarded')}</li>
              <li><span className="step-number">3</span>{t('busTracker.step3', 'Tap "I\'m boarding this bus" when you get on')}</li>
              <li><span className="step-number">4</span>{t('busTracker.step4', 'Your location helps others track this bus')}</li>
              <li><span className="step-number">5</span>{t('busTracker.step5', 'Tap "I\'ve reached my destination" when you get off')}</li>
            </ul>
            <div className="tracker-benefits">
              <h5>🎁 {t('busTracker.benefits', 'Benefits:')}</h5>
              <ul>
                <li>🚌 {t('busTracker.helpOthers', 'Help others find buses in real-time')}</li>
                <li>📍 {t('busTracker.improveData', 'Improve our bus tracking database')}</li>
                <li>💡 {t('busTracker.makeTransport', 'Make public transport more reliable')}</li>
                <li>🔐 {t('busTracker.privacyProtected', 'Your privacy is protected')}</li>
              </ul>
            </div>
            <p className="tracker-note">
              <strong>ℹ️ {t('busTracker.privacyNote', 'Your location is only shared while you\'re on the bus. Battery usage is optimized.')}</strong>
            </p>
          </div>
        </>
      ) : (
        <div className="tracker-disabled">
          <p className="tracker-disabled-message">
            {t('busTracker.trackingDisabled', 'Enable bus tracking to help other travelers by reporting your bus location.')}
          </p>
          <div className="disabled-benefits">
            <h5>🚀 {t('busTracker.whyTrack', 'Why track buses?')}</h5>
            <ul>
              <li>{t('busTracker.whyHelp', 'Help others find accurate bus locations in real-time')}</li>
              <li>{t('busTracker.whyImprove', 'Improve our bus tracking database')}</li>
              <li>{t('busTracker.whyReliable', 'Make public transport more reliable for everyone')}</li>
              <li>{t('busTracker.whyPrivacy', 'Simple and secure - your privacy is protected')}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to format time
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Helper function to calculate duration between two dates
const calculateDuration = (startTime: Date, endTime: Date, t: any): string => {
  const diffMs = endTime.getTime() - startTime.getTime();
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  
  if (hours > 0) {
    return `${hours}${t('busTracker.hours', 'h')} ${minutes}${t('busTracker.minutes', 'm')} ${seconds}${t('busTracker.seconds', 's')}`;
  }
  if (minutes === 0) {
    return `${seconds}${t('busTracker.seconds', 's')}`;
  }
  return `${minutes}${t('busTracker.minutes', 'm')} ${seconds}${t('busTracker.seconds', 's')}`;
};

export default BusTracker;