import React, { useState, useCallback } from 'react';
import type { Bus, Stop, Location as AppLocation } from '../types';
import StopsList from './StopsList';
import OpenStreetMapComponent from './OpenStreetMapComponent';
import FallbackMapComponent from './FallbackMapComponent';
import '../styles/MobileBusCard.css';
import { useTranslation } from 'react-i18next';

interface ModernBusItemProps {
  bus: Bus;
  selectedBusId: number | null;
  stops: Stop[];
  onSelectBus: (busId: number) => void;
  fromLocation?: AppLocation;
  toLocation?: AppLocation;
}

const ModernBusItem: React.FC<ModernBusItemProps> = ({ 
  bus, 
  selectedBusId, 
  stops,
  onSelectBus,
  fromLocation,
  toLocation
}) => {
  const { t } = useTranslation();
  const isSelected = selectedBusId === bus.id;
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleRowClick = useCallback(() => {
    setIsExpanded(prev => !prev);
    onSelectBus(bus.id);
  }, [onSelectBus, bus.id]);
  
  // Calculate status-based CSS class
  const getStatusClass = useCallback(() => {
    const status = bus.status?.toLowerCase() || 'on-time';
    switch (status) {
      case 'delayed':
        return 'delayed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'on-time';
    }
  }, [bus.status]);
  
  // Get status icon
  const getStatusIcon = useCallback(() => {
    const status = bus.status?.toLowerCase() || 'on-time';
    switch (status) {
      case 'on-time':
        return '✅';
      case 'delayed':
        return '⏰';
      case 'cancelled':
        return '❌';
      default:
        return '⏱';
    }
  }, [bus.status]);
  
  // Create location objects for map if available
  const mapFromLocation = fromLocation || {
    id: 0,
    name: bus.from || 'Origin',
    latitude: 0,
    longitude: 0
  };
  
  const mapToLocation = toLocation || {
    id: 1, 
    name: bus.to || 'Destination',
    latitude: 0,
    longitude: 0
  };
  
  // Calculate journey duration
  const getDuration = () => {
    try {
      if (!bus.departureTime || !bus.arrivalTime) return '';
      
      const [depHours, depMinutes] = bus.departureTime.split(':').map(Number);
      const [arrHours, arrMinutes] = bus.arrivalTime.split(':').map(Number);
      
      let durationHours = arrHours - depHours;
      let durationMinutes = arrMinutes - depMinutes;
      
      if (durationMinutes < 0) {
        durationHours -= 1;
        durationMinutes += 60;
      }
      
      if (durationHours < 0) {
        durationHours += 24;
      }
      
      return `${durationHours}h ${durationMinutes}m`;
    } catch (e) {
      return '';
    }
  };

  // Format time display
  const formatTime = (time: string) => {
    if (!time || time === 'Unknown') return '--:--';
    return time;
  };

  // Get bus type icon
  const getBusIcon = () => {
    const category = bus.category?.toLowerCase() || '';
    if (category.includes('express') || category.includes('superfast')) return '🚄';
    if (category.includes('deluxe') || category.includes('luxury')) return '🚐';
    if (category.includes('ac')) return '❄️';
    return '🚌';
  };

  // Get status color
  const getStatusColor = () => {
    const status = bus.status?.toLowerCase() || 'on-time';
    switch (status) {
      case 'on-time': return '#10b981';
      case 'delayed': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const duration = getDuration();
  const busIcon = getBusIcon();
  const statusColor = getStatusColor();
  const statusClass = getStatusClass();
  const statusIcon = getStatusIcon();
  
  return (
    <div className={`modern-bus-item ${statusClass} ${isExpanded ? 'expanded' : ''}`}>
      {/* Main Bus Info Card - Clickable Row */}
      <div className="bus-card" onClick={handleRowClick}>
        {/* Compact Mobile Header */}
        <div className="bus-card-header">
          <div className="bus-identity">
            <div className="bus-icon">{busIcon}</div>
            <div className="bus-details">
              <h3 className="bus-name">
                {bus.busName || 'Bus Service'}
                {bus.busNumber && <span className="bus-number">{bus.busNumber}</span>}
              </h3>
              <div className="bus-type">{bus.category || 'Regular Service'}</div>
            </div>
          </div>
          
          <div className="expand-indicator">
            <div className={`expand-arrow ${isExpanded ? 'expanded' : ''}`}>▼</div>
          </div>
        </div>

        {/* Compact Timing Section */}
        <div className="timing-section">
          <div className="time-display">
            <div className="departure-info">
              <div className="time-value">{formatTime(bus.departureTime)}</div>
              <div className="location-name">{bus.from || 'Origin'}</div>
            </div>
            
            <div className="journey-info">
              <div className="journey-line">
                <div className="journey-start"></div>
                <div className="journey-path"></div>
                <div className="journey-end"></div>
              </div>
              {duration && (
                <div className="duration-badge">{duration}</div>
              )}
            </div>
            
            <div className="arrival-info">
              <div className="time-value">{formatTime(bus.arrivalTime)}</div>
              <div className="location-name">{bus.to || 'Destination'}</div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Info */}
        <div className="quick-info">
          {stops.length > 0 && (
            <span className="info-item">
              <span className="info-icon">🛑</span>
              {stops.length} stops
            </span>
          )}
          
          <span className="info-item">
            <span className="info-icon">{statusIcon}</span>
            {bus.status || 'On Time'}
          </span>
          
          <span className="info-item map-available">
            <span className="info-icon">🗺️</span>
            Route Map
          </span>
          
          <span className="tap-hint">
            {isExpanded ? 'Tap to collapse' : 'Tap for route map & details'}
          </span>
        </div>
      </div>

      {/* Expandable Route Details with Map */}
      {isExpanded && (
        <div className="expanded-content">
          <div className="route-header">
            <h4>Route Details</h4>
            <span className="stops-count">{stops.length} stops</span>
          </div>
          
          {/* Stops List with Numbers */}
          {stops.length > 0 && (
            <div className="numbered-stops-list">
              {stops.map((stop, index) => (
                <div key={stop.id || index} className="stop-item">
                  <div className="stop-number">{index + 1}</div>
                  <div className="stop-details">
                    <div className="stop-name">{stop.name}</div>
                    {stop.arrivalTime && (
                      <div className="stop-time">{stop.arrivalTime}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Integrated Map with Numbered Stops */}
          <div className="route-map">
            <div className="map-header">
              <h4>🗺️ Interactive Route Map</h4>
              <span className="map-status">Showing {stops.length} stops</span>
            </div>
            
            {/* Try OpenStreetMap first, fallback to static map */}
            <div className="map-container-wrapper">
              {typeof window !== 'undefined' && (window as any).L ? (
                <OpenStreetMapComponent
                  fromLocation={mapFromLocation}
                  toLocation={mapToLocation}
                  selectedStops={stops}
                  style={{ height: '250px', width: '100%' }}
                  mapId={`osm-map-${bus.id}`}
                />
              ) : (
                <FallbackMapComponent
                  fromLocation={mapFromLocation}
                  toLocation={mapToLocation}
                  selectedStops={stops}
                  style={{ height: '250px', width: '100%' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ModernBusItem);