import React from 'react';
import { useTranslation } from 'react-i18next';
import type { BusLocation } from '../../types';

interface BusInfoPanelProps {
  bus: BusLocation;
  onClose: () => void;
}

/**
 * Component to display detailed information about a selected bus
 */
const BusInfoPanel: React.FC<BusInfoPanelProps> = ({ bus, onClose }) => {
  const { t } = useTranslation();

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
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="bus-info-panel">
      <button className="close-button" onClick={onClose}>×</button>
      <div className="bus-info-content">
        <h3>{bus.busName} {bus.busNumber}</h3>
        <div className="info-grid">
          <div className="info-row">
            <span className="info-label">{t('liveTracker.lastUpdated', 'Last updated')}:</span>
            <span className="info-value">{formatTime(bus.timestamp)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('liveTracker.speed', 'Speed')}:</span>
            <span className="info-value">{formatSpeed(bus.speed)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('liveTracker.nextStop', 'Next stop')}:</span>
            <span className="info-value">{bus.nextStopName || '-'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('liveTracker.etaNextStop', 'ETA')}:</span>
            <span className="info-value">{bus.estimatedArrivalTime || '-'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('liveTracker.trackers', 'Active trackers')}:</span>
            <span className="info-value">{bus.reportCount}</span>
          </div>
        </div>
        <div className="confidence-indicator">
          <span className="confidence-label">{t('liveTracker.confidence', 'Confidence')}:</span>
          <div className="confidence-bar-bg">
            <div 
              className="confidence-bar-fill" 
              style={{ 
                width: `${bus.confidenceScore}%`,
                backgroundColor: bus.confidenceScore >= 70 ? '#4CAF50' : 
                                (bus.confidenceScore >= 40 ? '#FFC107' : '#FF0000')
              }}
            ></div>
          </div>
          <span className="confidence-value">{bus.confidenceScore}%</span>
        </div>
      </div>
    </div>
  );
};

export default BusInfoPanel;