import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Location, Bus } from '../types';
import { useLiveBusTracking } from '../hooks/useLiveBusTracking';
import LiveBusMap from './map/LiveBusMap';
import ConfidenceLegend from './map/ConfidenceLegend';

interface LiveBusTrackerProps {
  fromLocation: Location;
  toLocation: Location;
  buses: Bus[];
  onTrackingUpdate?: (update: any) => void;
}

/**
 * Component for displaying real-time bus locations on a map
 * Uses crowd-sourced data from users who are on the buses
 * Refactored into smaller, more maintainable components
 */
export const LiveBusTracker: React.FC<LiveBusTrackerProps> = ({ 
  fromLocation, 
  toLocation, 
  buses = [],
  onTrackingUpdate
}) => {
  const { t } = useTranslation();
  
  // Always call the hook - let it handle invalid states internally
  const { liveLocations, isTracking, error, startTracking, stopTracking } = useLiveBusTracking({ 
    isEnabled: true
  });

  // Check if we have valid locations for rendering
  const shouldRenderTracking = fromLocation && toLocation && buses.length > 0;

  // Suppress unused variable warning
  void onTrackingUpdate;
  void startTracking;
  void stopTracking;

  return (
    <div className="live-bus-tracker">
      <h2>{t('liveTracker.title', 'Live Bus Tracker')}</h2>
      
      {shouldRenderTracking ? (
        <>
          {buses.length > 0 && (
            <div className="static-buses-info">
              <p>{t('liveTracker.staticBusesInfo', 'Showing scheduled buses on this route')}: {buses.length}</p>
            </div>
          )}
          
          {error && <div className="live-tracker-error">{error}</div>}
          
          <div className="live-tracker-info">
            <ConfidenceLegend />
            
            <div className="active-trackers">
              <h4>{t('liveTracker.activeTrackers', 'Active Trackers')}</h4>
              <div className="trackers-count">
                {isTracking ? liveLocations.length : 0}
                <span className="trackers-label">{t('liveTracker.people', 'people')}</span>
              </div>
            </div>
          </div>
          
          <LiveBusMap
            fromLocation={fromLocation}
            toLocation={toLocation}
            busLocations={liveLocations}
            selectedBus={null}
            mapCenter={{ lat: fromLocation.latitude, lng: fromLocation.longitude }}
            onBusClick={() => {}}
            onInfoClose={() => {}}
            getBusMarkerIcon={() => ({
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#ff6b6b',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#ffffff',
              scale: 8
            })}
          />
          
          {!isTracking && liveLocations.length === 0 && (
            <div className="no-buses-message">
              <p>{t('liveTracker.noBuses', 'No buses currently being tracked on this route')}</p>
              <p>{t('liveTracker.enableTracking', 'Use the tracking feature when you board a bus to help other passengers!')}</p>
            </div>
          )}
        </>
      ) : (
        <p>{t('liveTracker.noLocationData', 'Location data not available')}</p>
      )}
      
      <div className="refresh-info">
        <div className="refresh-icon">⟳</div>
        <p>{t('liveTracker.refreshInfo', 'Bus locations automatically update every 15 seconds')}</p>
      </div>
    </div>
  );
};

export default LiveBusTracker;

