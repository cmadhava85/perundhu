import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Stop } from '../types';
import '../styles/EnhancedMapView.css';

interface EnhancedMapViewProps {
  buses: Bus[];
  stops: Stop[];
  selectedBusId?: number | null;
  onBusSelect?: (busId: number) => void;
  showLiveTracking?: boolean;
  className?: string;
}

const EnhancedMapView: React.FC<EnhancedMapViewProps> = ({
  buses,
  stops,
  selectedBusId,
  onBusSelect,
  showLiveTracking = false,
  className = ''
}) => {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapMode, setMapMode] = useState<'route' | 'satellite' | 'traffic'>('route');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [trackingMode, setTrackingMode] = useState<'all' | 'selected'>('all');

  useEffect(() => {
    // Initialize map when component mounts
    // This would integrate with your actual map library (Google Maps, Mapbox, etc.)
    console.log('Initializing enhanced map with buses:', buses.length, 'stops:', stops.length);
  }, [buses, stops]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getBusStatusColor = (bus: Bus) => {
    if (bus.isLive) return '#10b981'; // Green for live
    if (bus.availability === 'filling-fast') return '#f59e0b'; // Orange
    if (bus.availability === 'full') return '#ef4444'; // Red
    return '#3b82f6'; // Blue default
  };

  return (
    <div className={`enhanced-map-view ${className} ${isFullscreen ? 'fullscreen' : ''}`}>
      <div ref={mapRef} className="map-container">
        {/* Map Header Controls */}
        <div className={`map-header ${!showControls ? 'hidden' : ''}`}>
          <div className="map-title">
            <h3>
              <span className="map-icon">🗺️</span>
              {t('map.title', 'Route Map')}
            </h3>
            <div className="map-stats">
              <span className="stat">
                <span className="stat-icon">🚌</span>
                {buses.length} {t('map.buses', 'buses')}
              </span>
              <span className="stat">
                <span className="stat-icon">📍</span>
                {stops.length} {t('map.stops', 'stops')}
              </span>
            </div>
          </div>
          
          <div className="map-header-controls">
            <div className="map-mode-selector">
              <button 
                className={`mode-btn ${mapMode === 'route' ? 'active' : ''}`}
                onClick={() => setMapMode('route')}
                title={t('map.routeView', 'Route View')}
              >
                🛣️
              </button>
              <button 
                className={`mode-btn ${mapMode === 'satellite' ? 'active' : ''}`}
                onClick={() => setMapMode('satellite')}
                title={t('map.satelliteView', 'Satellite View')}
              >
                🛰️
              </button>
              <button 
                className={`mode-btn ${mapMode === 'traffic' ? 'active' : ''}`}
                onClick={() => setMapMode('traffic')}
                title={t('map.trafficView', 'Traffic View')}
              >
                🚦
              </button>
            </div>
            
            <button
              className="control-btn"
              onClick={() => setShowControls(!showControls)}
              title={t('map.toggleControls', 'Toggle Controls')}
            >
              {showControls ? '🙈' : '👁️'}
            </button>
            
            <button
              className="control-btn fullscreen-btn"
              onClick={toggleFullscreen}
              title={t('map.fullscreen', 'Fullscreen')}
            >
              {isFullscreen ? '🗗' : '🗖'}
            </button>
          </div>
        </div>

        {/* Map Content Area */}
        <div className="map-content">
          {/* This would be replaced with your actual map component */}
          <div className="map-placeholder">
            <div className="map-background">
              {/* Simulated map with bus routes */}
              <svg
                viewBox="0 0 800 600"
                className="route-svg"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Background grid */}
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Simulated bus routes */}
                {buses.map((bus, index) => (
                  <g key={bus.id}>
                    {/* Route path */}
                    <path
                      d={`M ${100 + index * 50} 100 Q 400 ${200 + index * 30} ${700 - index * 50} 500`}
                      fill="none"
                      stroke={getBusStatusColor(bus)}
                      strokeWidth="4"
                      strokeDasharray={selectedBusId === bus.id ? "0" : "10,5"}
                      className="route-path"
                      opacity={selectedBusId && selectedBusId !== bus.id ? 0.3 : 1}
                    />
                    
                    {/* Bus marker */}
                    <circle
                      cx={300 + index * 80}
                      cy={250 + index * 40}
                      r="8"
                      fill={getBusStatusColor(bus)}
                      className="bus-marker"
                      onClick={() => onBusSelect && onBusSelect(bus.id)}
                    />
                    
                    {/* Bus number label */}
                    <text
                      x={300 + index * 80}
                      y={235 + index * 40}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#374151"
                      fontWeight="600"
                    >
                      {bus.busNumber}
                    </text>
                  </g>
                ))}
                
                {/* Stop markers */}
                {stops.slice(0, 8).map((stop, index) => (
                  <g key={stop.id}>
                    <circle
                      cx={150 + index * 75}
                      cy={300 + (index % 2) * 100}
                      r="6"
                      fill="#6b7280"
                      className="stop-marker"
                    />
                    <text
                      x={150 + index * 75}
                      y={320 + (index % 2) * 100}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#6b7280"
                    >
                      {stop.name.substring(0, 8)}...
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* Map Side Panel */}
        {showControls && (
          <div className="map-side-panel">
            <div className="panel-section">
              <h4>{t('map.legend', 'Legend')}</h4>
              <div className="legend-items">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
                  <span>{t('map.liveBus', 'Live Bus')}</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span>{t('map.scheduledBus', 'Scheduled Bus')}</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
                  <span>{t('map.fillingFast', 'Filling Fast')}</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#6b7280' }}></div>
                  <span>{t('map.busStop', 'Bus Stop')}</span>
                </div>
              </div>
            </div>

            {showLiveTracking && (
              <div className="panel-section">
                <h4>{t('map.liveTracking', 'Live Tracking')}</h4>
                <div className="tracking-controls">
                  <label className="tracking-option">
                    <input
                      type="radio"
                      name="tracking"
                      value="all"
                      checked={trackingMode === 'all'}
                      onChange={() => setTrackingMode('all')}
                    />
                    <span>{t('map.trackAll', 'Track All Buses')}</span>
                  </label>
                  <label className="tracking-option">
                    <input
                      type="radio"
                      name="tracking"
                      value="selected"
                      checked={trackingMode === 'selected'}
                      onChange={() => setTrackingMode('selected')}
                    />
                    <span>{t('map.trackSelected', 'Track Selected Only')}</span>
                  </label>
                </div>
              </div>
            )}

            <div className="panel-section">
              <h4>{t('map.activeBuses', 'Active Buses')}</h4>
              <div className="bus-list-mini">
                {buses.map((bus) => (
                  <div
                    key={bus.id}
                    className={`bus-item-mini ${selectedBusId === bus.id ? 'selected' : ''}`}
                    onClick={() => onBusSelect && onBusSelect(bus.id)}
                  >
                    <div className="bus-indicator" style={{ backgroundColor: getBusStatusColor(bus) }}></div>
                    <div className="bus-info-mini">
                      <span className="bus-name-mini">{bus.busNumber}</span>
                      <span className="bus-status-mini">
                        {bus.isLive ? t('map.live', 'Live') : t('map.scheduled', 'Scheduled')}
                      </span>
                    </div>
                    {bus.isLive && <div className="live-pulse"></div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Map Bottom Bar */}
        <div className="map-bottom-bar">
          <div className="map-controls">
            <button className="map-control-btn" title={t('map.zoomIn', 'Zoom In')}>➕</button>
            <button className="map-control-btn" title={t('map.zoomOut', 'Zoom Out')}>➖</button>
            <button className="map-control-btn" title={t('map.recenter', 'Recenter')}>🎯</button>
            <button className="map-control-btn" title={t('map.myLocation', 'My Location')}>📍</button>
          </div>
          
          <div className="map-info">
            <span className="map-scale">1 km</span>
            <span className="map-attribution">© Enhanced Maps</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMapView;