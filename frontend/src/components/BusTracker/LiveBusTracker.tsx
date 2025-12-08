import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Stop } from '../../types';
import { getCurrentPositionCallback, watchPosition, clearWatch } from '../../services/geolocation';
import { reportBusLocationSimple } from '../../services/busTrackingService';

interface LiveBusTrackerProps {
  selectedBus: Bus;
  stops: Stop[];
  isTracking: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onClose: () => void;
}

const LiveBusTracker: React.FC<LiveBusTrackerProps> = ({
  selectedBus,
  stops,
  isTracking,
  onStartTracking,
  onStopTracking,
  onClose
}) => {
  const { t } = useTranslation();
  const [trackingData, setTrackingData] = useState<{
    currentLocation: string;
    lastUpdated: string;
    accuracy: number;
    speed: number;
    nearestStop?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [hasStartedTracking, setHasStartedTracking] = useState(false);

  // Generate a unique user ID for tracking
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Auto-detect nearest stop from GPS
  const findNearestStop = (userLat: number, userLng: number): Stop | null => {
    if (!stops || stops.length === 0) return null;
    
    let nearestStop: Stop | null = null;
    let minDistance = Infinity;
    
    stops.forEach(stop => {
      // Check if stop has coordinates
      if (stop.latitude && stop.longitude) {
        const distance = Math.sqrt(
          Math.pow(userLat - stop.latitude, 2) + 
          Math.pow(userLng - stop.longitude, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestStop = stop;
        }
      }
    });
    
    return nearestStop;
  };

  const handleStartTracking = () => {
    setError(null);
    setHasStartedTracking(true);

    // Get initial position and auto-detect stop
    getCurrentPositionCallback(
      (position) => {
        console.log('Initial position:', position);
        
        // Auto-detect nearest stop
        const nearestStop = findNearestStop(position.latitude, position.longitude);
        console.log('Auto-detected nearest stop:', nearestStop?.name);
        
        startLocationReporting(position);
        onStartTracking();
      },
      (error) => {
        setError(t('busTracker.locationError', 'Could not get your location. Please enable location services.'));
        console.error('Location error:', error);
      }
    );
  };

  const handleStopTracking = () => {
    if (watchId !== null) {
      clearWatch(watchId);
      setWatchId(null);
    }
    setHasStartedTracking(false);
    setTrackingData(null);
    onStopTracking();
  };

  const startLocationReporting = (initialPosition: { latitude: number; longitude: number; accuracy: number }) => {
    // Report initial position
    reportLocation(initialPosition);

    // Start watching position changes
    const id = watchPosition(
      (position) => {
        reportLocation(position);
      },
      (error) => {
        console.error('Position watch error:', error);
        setError(t('busTracker.trackingError', 'Location tracking interrupted'));
      }
    );

    if (id !== -1) {
      setWatchId(id);
    }
  };

  const reportLocation = async (position: { latitude: number; longitude: number; accuracy: number }) => {
    try {
      const locationReport = {
        busId: selectedBus.id,
        userId: userId,
        timestamp: new Date().toISOString(),
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        speed: 0, // Will be calculated by the system
        heading: 0, // Will be calculated by the system
        deviceInfo: navigator.userAgent
      };

      // Use the simplified API that auto-detects stops
      const result = await reportBusLocationSimple(locationReport);
      console.log('Location reported successfully:', result);

      // Update tracking data display
      setTrackingData({
        currentLocation: `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`,
        lastUpdated: new Date().toLocaleTimeString(),
        accuracy: position.accuracy,
        speed: 0, // Will be updated from backend response
        nearestStop: result.lastReportedStopName || 'Detecting...'
      });

    } catch (error) {
      console.error('Failed to report location:', error);
      setError(t('busTracker.reportError', 'Failed to report location'));
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        clearWatch(watchId);
      }
    };
  }, [watchId]);

  return (
    <div className="live-tracker-modal-overlay" onClick={onClose}>
      <div className="live-tracker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {t('busTracker.liveTracking', 'Live Bus Tracking')}
          </h3>
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label={t('common.close', 'Close')}
          >
            ✕
          </button>
        </div>

        <div className="modal-content">
          <div className="bus-info-card">
            <h4 className="bus-name">
              {selectedBus.busName || `Bus ${selectedBus.id}`}
            </h4>
            <div className="bus-details">
              <p className="bus-route">
                {t('busTracker.route', 'Route')}: {selectedBus.from} → {selectedBus.to}
              </p>
              <p className="bus-number">
                {t('busTracker.busNumber', 'Bus Number')}: {selectedBus.busNumber}
              </p>
              <div className="tracking-status">
                <span className={`status-indicator ${isTracking ? 'active' : 'inactive'}`}></span>
                {isTracking 
                  ? t('busTracker.tracking', 'Tracking active')
                  : t('busTracker.notTracking', 'Tracking inactive')
                }
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          {!hasStartedTracking && (
            <div className="tracking-setup">
              <h4>{t('busTracker.setupTracking', 'Set up tracking')}</h4>
              
              <div className="tracking-info">
                <h5>{t('busTracker.howItWorks', 'How it works:')}</h5>
                <ul>
                  <li>{t('busTracker.step1', 'Tap "Start Tracking" when you get on the bus')}</li>
                  <li>{t('busTracker.step2', 'Your location helps others track this bus')}</li>
                  <li>{t('busTracker.step3', 'Tap "Stop Tracking" when you get off')}</li>
                </ul>
                <p className="privacy-note">
                  {t('busTracker.privacyNote', 'Your location is only shared while you\'re on the bus. Battery usage is optimized.')}
                </p>
              </div>

              <button
                onClick={handleStartTracking}
                className="start-tracking-btn"
              >
                {t('busTracker.startTracking', 'Start Tracking')}
              </button>
            </div>
          )}

          {hasStartedTracking && trackingData && (
            <div className="tracking-active">
              <div className="tracking-stats">
                <div className="stat-item">
                  <label>{t('busTracker.currentLocation', 'Current Location')}</label>
                  <span>{trackingData.currentLocation}</span>
                </div>
                
                <div className="stat-item">
                  <label>{t('busTracker.lastUpdated', 'Last Updated')}</label>
                  <span>{trackingData.lastUpdated}</span>
                </div>
                
                <div className="stat-item">
                  <label>{t('busTracker.accuracy', 'GPS Accuracy')}</label>
                  <span>{Math.round(trackingData.accuracy)}m</span>
                </div>

                {trackingData.nearestStop && (
                  <div className="stat-item">
                    <label>{t('busTracker.nearestStop', 'Nearest Stop')}</label>
                    <span>{trackingData.nearestStop}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleStopTracking}
                className="stop-tracking-btn"
              >
                {t('busTracker.stopTracking', 'I\'ve reached my destination')}
              </button>
            </div>
          )}

          {!hasStartedTracking && !trackingData && isTracking && (
            <div className="loading-tracking">
              <div className="loading-spinner"></div>
              <p>{t('busTracker.loadingTracking', 'Loading tracking data...')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveBusTracker;