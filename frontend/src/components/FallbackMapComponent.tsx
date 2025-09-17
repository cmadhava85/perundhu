import React from 'react';
import type { Location, Bus, Stop, BusLocation } from '../types/index';
import '../styles/FallbackMapComponent.css';

interface FallbackMapComponentProps {
  fromLocation: Location;
  toLocation: Location;
  selectedStops?: Stop[];
  buses?: (Bus | BusLocation)[];
  onBusClick?: (bus: Bus | BusLocation) => void;
  className?: string;
  style?: React.CSSProperties;
  mapId?: string;
}

/**
 * Fallback Map Component that shows route information when map service fails
 */
const FallbackMapComponent: React.FC<FallbackMapComponentProps> = ({
  fromLocation,
  toLocation,
  selectedStops = [],
  buses = [],
  onBusClick,
  className = 'map-container',
  style = { height: '450px', width: '100%' }
}) => {
  
  // Calculate distance (simple approximation)
  const calculateDistance = () => {
    if (!fromLocation.latitude || !toLocation.latitude) return null;
    
    const lat1 = fromLocation.latitude;
    const lon1 = fromLocation.longitude;
    const lat2 = toLocation.latitude;
    const lon2 = toLocation.longitude;
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance);
  };

  const distance = calculateDistance();

  return (
    <div className={`${className} fallback-map`} style={style}>
      <div className="fallback-map-content">
        {/* Header */}
        <div className="fallback-header">
          <div className="map-icon">🗺️</div>
          <div className="header-text">
            <h3>Route Overview</h3>
            <p>Map service temporarily unavailable</p>
          </div>
        </div>
        
        {/* Route Information */}
        <div className="route-display">
          <div className="route-line">
            <div className="route-point start">
              <div className="point-marker start-marker">
                <span className="marker-icon">📍</span>
              </div>
              <div className="point-info">
                <h4>Origin</h4>
                <p className="location-name">{fromLocation.name}</p>
                {fromLocation.latitude && fromLocation.longitude && (
                  <small className="coordinates">
                    {fromLocation.latitude.toFixed(4)}, {fromLocation.longitude.toFixed(4)}
                  </small>
                )}
              </div>
            </div>

            <div className="route-path">
              <div className="path-line"></div>
              {distance && (
                <div className="distance-badge">
                  <span className="distance-icon">📏</span>
                  <span className="distance-text">~{distance} km</span>
                </div>
              )}
              
              {selectedStops.length > 0 && (
                <div className="intermediate-stops">
                  <div className="stops-indicator">
                    <span className="stops-count">{selectedStops.length}</span>
                    <span className="stops-label">stops</span>
                  </div>
                </div>
              )}
            </div>

            <div className="route-point end">
              <div className="point-marker end-marker">
                <span className="marker-icon">🎯</span>
              </div>
              <div className="point-info">
                <h4>Destination</h4>
                <p className="location-name">{toLocation.name}</p>
                {toLocation.latitude && toLocation.longitude && (
                  <small className="coordinates">
                    {toLocation.latitude.toFixed(4)}, {toLocation.longitude.toFixed(4)}
                  </small>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stops Information */}
        {selectedStops.length > 0 && (
          <div className="stops-section">
            <h4 className="stops-title">
              <span className="stops-icon">🚏</span>
              Route Stops ({selectedStops.length})
            </h4>
            <div className="stops-grid">
              {selectedStops.slice(0, 6).map((stop, index) => (
                <div key={index} className="stop-card">
                  <div className="stop-number">{index + 1}</div>
                  <div className="stop-details">
                    <div className="stop-name">{stop.name}</div>
                    {stop.arrivalTime && (
                      <div className="stop-time">🕐 {stop.arrivalTime}</div>
                    )}
                  </div>
                </div>
              ))}
              {selectedStops.length > 6 && (
                <div className="stop-card more-stops">
                  <div className="more-count">+{selectedStops.length - 6}</div>
                  <div className="more-text">more stops</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bus Information */}
        {buses.length > 0 && (
          <div className="buses-section">
            <h4 className="buses-title">
              <span className="buses-icon">🚌</span>
              Active Buses ({buses.length})
            </h4>
            <div className="buses-list">
              {buses.slice(0, 3).map((bus, index) => (
                <div 
                  key={index} 
                  className="bus-card"
                  onClick={() => onBusClick?.(bus)}
                >
                  <div className="bus-icon">🚌</div>
                  <div className="bus-info">
                    <div className="bus-name">{bus.busName || 'Bus Service'}</div>
                    <div className="bus-number">#{bus.busNumber}</div>
                  </div>
                  {'latitude' in bus && (
                    <div className="bus-status online">
                      <span className="status-dot"></span>
                      Live
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="map-actions">
          <button 
            className="action-button secondary"
            onClick={() => {
              const url = `https://www.google.com/maps/dir/${fromLocation.latitude},${fromLocation.longitude}/${toLocation.latitude},${toLocation.longitude}`;
              window.open(url, '_blank');
            }}
          >
            <span className="button-icon">🌐</span>
            Open in Google Maps
          </button>
          
          <button 
            className="action-button primary"
            onClick={() => window.location.reload()}
          >
            <span className="button-icon">🔄</span>
            Retry Map
          </button>
        </div>
      </div>
    </div>
  );
};

export default FallbackMapComponent;