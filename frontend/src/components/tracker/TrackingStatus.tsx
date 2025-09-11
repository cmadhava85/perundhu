import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus } from '../../types';

interface TrackingStatusProps {
  isOnboard: boolean;
  selectedBusId: number | null;
  buses: Bus[];
  lastReportTime: string | null; // Change to string to match hook
  onStopTracking: () => void;
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const TrackingStatus: React.FC<TrackingStatusProps> = ({
  isOnboard,
  selectedBusId,
  buses,
  lastReportTime,
  onStopTracking
}) => {
  const { t } = useTranslation();

  if (!isOnboard) return null;

  const selectedBus = buses.find(b => b.id === selectedBusId);

  return (
    <div className="tracking-active">
      <div className="tracking-status">
        <span className="tracking-indicator"></span>
        {t('busTracker.activelyTracking', 'Actively tracking your bus')}
      </div>
      
      <div className="bus-info-card">
        <h4>{selectedBus?.busName}</h4>
        <p>{selectedBus?.busNumber}</p>
        {lastReportTime && (
          <p className="last-report">
            {t('busTracker.lastUpdate', 'Last update')}: {formatTime(lastReportTime)}
          </p>
        )}
      </div>

      <button 
        className="stop-tracking-button" 
        onClick={onStopTracking}
      >
        {t('busTracker.stopTracking', 'I\'ve reached my destination')}
      </button>
    </div>
  );
};

export default TrackingStatus;