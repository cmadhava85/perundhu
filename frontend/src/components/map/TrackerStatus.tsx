import React from 'react';
import { useTranslation } from 'react-i18next';
import type { BusLocation } from '../../types';

interface TrackerStatusProps {
  isLoading: boolean;
  error: string | null;
  busLocations: BusLocation[];
  showLiveTracking: boolean;
}

/**
 * Component to display tracking status information including errors, loading states,
 * active tracker count, and refresh information
 */
const TrackerStatus: React.FC<TrackerStatusProps> = ({ 
  isLoading, 
  error, 
  busLocations, 
  showLiveTracking 
}) => {
  const { t } = useTranslation();
  
  // Calculate the total number of active trackers
  const totalTrackers = busLocations.reduce((sum, bus) => sum + bus.reportCount, 0);
  
  return (
    <>
      {error && <div className="map-error">{error}</div>}
      {isLoading && <div className="map-loading">{t('common.loading', 'Loading...')}</div>}
      
      {showLiveTracking && busLocations.length > 0 && (
        <div className="active-trackers">
          <span className="tracking-indicator"></span>
          <span>{t('liveTracker.activeTrackers', 'Active Trackers')}: </span>
          <strong>{totalTrackers}</strong>
        </div>
      )}
      
      {showLiveTracking && (
        <div className="refresh-info">
          <div className="refresh-icon">⟳</div>
          <p>{t('liveTracker.refreshInfo', 'Bus locations automatically update every 15 seconds')}</p>
        </div>
      )}
    </>
  );
};

export default TrackerStatus;