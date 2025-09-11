import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Stop } from '../types';
import { useBusTracking } from '../hooks/useBusTracking';
import BusSelector from './tracker/BusSelector';
import StopSelector from './tracker/StopSelector';
import TrackingStatus from './tracker/TrackingStatus';
import '../styles/BusTracker.css';

interface BusTrackerProps {
  buses: Bus[];
  stops: Record<number, Stop[]>;
}

/**
 * Component for crowd-sourced bus tracking
 * Allows users to report when they've boarded a bus at a specific stop
 * Refactored into smaller, more maintainable components
 */
const BusTracker: React.FC<BusTrackerProps> = ({ buses, stops }) => {
  const { t } = useTranslation();
  const {
    selectedBusId,
    selectedStopId,
    trackingEnabled,
    lastReportTime,
    busStops,
    isOnboard,
    error,
    handleBusSelect,
    handleStopSelect,
    toggleTracking,
    startTracking,
    stopTracking,
    setError
  } = useBusTracking({ buses, stops });

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
            aria-label={t('busTracker.enableTracking', 'Enable bus tracking')}
          />
          <span className="toggle-slider"></span>
        </label>
        <span className="tracker-toggle-label">{t('busTracker.enableTracking', 'Enable bus tracking')}</span>
      </div>
      
      {!isOnboard && (
        <>
          <BusSelector 
            buses={buses}
            selectedBusId={selectedBusId}
            onBusSelect={handleBusSelect}
          />

          <StopSelector 
            stops={busStops}
            selectedStopId={selectedStopId}
            onStopSelect={handleStopSelect}
          />

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

      <TrackingStatus 
        isOnboard={isOnboard}
        selectedBusId={selectedBusId}
        buses={buses}
        lastReportTime={lastReportTime}
        onStopTracking={stopTracking}
      />

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

export default BusTracker;