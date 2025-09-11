import React from 'react';
import { MarkerF, InfoWindowF } from '@react-google-maps/api';
import { useTranslation } from 'react-i18next';
import type { BusLocation } from '../../types';

interface LiveBusMarkersProps {
  busLocations: BusLocation[];
  selectedBus: BusLocation | null;
  onBusClick: (bus: BusLocation) => void;
  onInfoClose: () => void;
  isValidBusLocation: (bus: BusLocation) => boolean;
}

const LiveBusMarkers: React.FC<LiveBusMarkersProps> = ({
  busLocations,
  selectedBus,
  onBusClick,
  onInfoClose,
  isValidBusLocation
}) => {
  const { t } = useTranslation();

  // Generate bus marker icon based on confidence score
  const getBusMarkerIcon = (confidence: number) => {
    let fillColor = '#FF0000'; // Red for low confidence
    
    if (confidence >= 70) {
      fillColor = '#4CAF50'; // Green for high confidence
    } else if (confidence >= 40) {
      fillColor = '#FFC107'; // Yellow for medium confidence
    }
    
    return {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      fillColor: fillColor,
      fillOpacity: 0.8,
      strokeWeight: 1,
      strokeColor: '#000000',
      scale: 7,
    };
  };

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

  return (
    <>
      {/* Live bus markers */}
      {busLocations
        .filter(bus => isValidBusLocation(bus))
        .map(bus => (
          <MarkerF
            key={`bus-${bus.busId}`}
            position={{ lat: bus.latitude, lng: bus.longitude }}
            icon={{
              ...getBusMarkerIcon(bus.confidenceScore),
              rotation: bus.heading || 0
            }}
            onClick={() => onBusClick(bus)}
            title={`${bus.busName} (${bus.busNumber})`}
            animation={google.maps.Animation.DROP}
            zIndex={2000}
          />
        ))}
      
      {/* Info window for selected bus */}
      {selectedBus && isValidBusLocation(selectedBus) && (
        <InfoWindowF
          position={{ lat: selectedBus.latitude, lng: selectedBus.longitude }}
          onCloseClick={onInfoClose}
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
    </>
  );
};

export default LiveBusMarkers;