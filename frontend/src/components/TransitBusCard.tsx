import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Stop, Location as AppLocation } from '../types';
import OpenStreetMapComponent from './OpenStreetMapComponent';
import FallbackMapComponent from './FallbackMapComponent';
import '../styles/transit-design-system.css';
import '../styles/transit-bus-card.css';

interface TransitBusCardProps {
  bus: Bus;
  selectedBusId: number | null;
  stops: Stop[];
  onSelectBus: (busId: number) => void;
  fromLocation?: AppLocation;
  toLocation?: AppLocation;
  isCompact?: boolean;
}

const TransitBusCard: React.FC<TransitBusCardProps> = ({
  bus,
  selectedBusId,
  stops,
  onSelectBus,
  fromLocation,
  toLocation,
  isCompact = false
}) => {

  const { i18n } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const isSelected = selectedBusId === bus.id;
  
  // Helper function to get display name for location
  const getLocationDisplayName = (location?: AppLocation) => {
    if (!location) return '';
    if (i18n.language === 'ta' && location.translatedName) {
      return location.translatedName;
    }
    return location.name;
  };
  
  // Helper function to get display name for stop
  const getStopDisplayName = (stop: Stop) => {
    if (i18n.language === 'ta' && stop.translatedName) {
      return stop.translatedName;
    }
    return stop.name;
  };

  const handleCardClick = useCallback(() => {
    setIsExpanded(prev => !prev);
    onSelectBus(bus.id);
  }, [onSelectBus, bus.id]);

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
    } catch {
      return '';
    }
  };

  // Format time display
  const formatTime = (time: string) => {
    if (!time || time === 'Unknown') return '--:--';
    return time;
  };

  // Get bus status
  const getBusStatus = () => {
    const status = bus.status?.toLowerCase() || 'on-time';
    
    let text = 'Unknown';
    if (status === 'on-time') text = 'On Time';
    else if (status === 'delayed') text = 'Delayed';
    else if (status === 'cancelled') text = 'Cancelled';
    
    return {
      status,
      text,
      className: status
    };
  };

  // Get bus type display
  const getBusTypeInfo = () => {
    const category = bus.category?.toLowerCase() || '';
    
    if (category.includes('express') || category.includes('superfast')) {
      return { icon: '⚡', label: 'Express', color: '#FF9500' };
    }
    if (category.includes('deluxe') || category.includes('luxury')) {
      return { icon: '✨', label: 'Deluxe', color: '#5856D6' };
    }
    if (category.includes('ac')) {
      return { icon: '❄️', label: 'AC', color: '#007AFF' };
    }
    return { icon: '🚌', label: 'Regular', color: '#86868B' };
  };

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



  const duration = getDuration();
  const statusInfo = getBusStatus();
  const busTypeInfo = getBusTypeInfo();

  // Debug logging for stops
  console.log(`TransitBusCard: Bus ${bus.id} has ${stops.length} stops:`, stops);

  return (
    <button 
      className={`transit-bus-card ${isSelected ? 'selected' : ''} ${isCompact ? 'compact' : ''} fade-in`}
      onClick={handleCardClick}
      aria-label={`Bus ${bus.busNumber || 'Transit'} from ${getLocationDisplayName(fromLocation) || bus.from} to ${getLocationDisplayName(toLocation) || bus.to}`}
      type="button"
    >
      {/* Card Header */}
      <div className="transit-card-header">
        {/* Bus Info Row - Number, Type, Name on same line */}
        <div className="bus-info-row">
          <div className="bus-number-display">
            {bus.busNumber || 'Bus'}
          </div>
          <div className="bus-type-display" style={{ backgroundColor: `${busTypeInfo.color}20`, color: busTypeInfo.color }}>
            {busTypeInfo.icon} {busTypeInfo.label}
          </div>
          <div className="bus-name-display">
            {bus.busName || 'Transit Service'}
          </div>
        </div>

        {/* Journey Layout - Cities with Progress Bar */}
        <div className="journey-layout">
          {/* Cities and Progress Bar Row */}
          <div className="cities-progress-row">
            <div className="city-name start-city">
              {getLocationDisplayName(fromLocation) || bus.from || 'Origin'}
            </div>
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-line"></div>
                <div className="bus-moving-icon">🚌</div>
                <div className="progress-dots">
                  <div className="progress-dot start"></div>
                  <div className="progress-dot end"></div>
                </div>
              </div>
            </div>
            <div className="city-name end-city">
              {getLocationDisplayName(toLocation) || bus.to || 'Destination'}
            </div>
          </div>

          {/* Time, Duration, Time Row */}
          <div className="time-duration-row">
            <div className="departure-time">
              {formatTime(bus.departureTime)}
            </div>
            <div className="journey-duration-center">
              {duration || '--h --m'}
            </div>
            <div className="arrival-time">
              {formatTime(bus.arrivalTime)}
            </div>
          </div>

          {/* Stops Row */}
          <div className="stops-row">
            <div className="stops-info">
              🛑 {stops.length} stops
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-indicator">
          <div className={`status-dot ${statusInfo.className}`}></div>
          <span className={`status-text ${statusInfo.className}`}>
            {statusInfo.text}
          </span>
        </div>

        <div className="row" style={{ gap: 'var(--space-2)', alignItems: 'center' }}>
          {bus.fare && (
            <div className="price-display">
              <span className="price-currency">₹</span>
              <span>{bus.fare}</span>
            </div>
          )}
          
          {/* Expand/Collapse Indicator */}
          <div className="expand-indicator">
            <span style={{ 
              fontSize: 'var(--text-sm)', 
              color: 'var(--transit-text-secondary)',
              transition: 'var(--transition-fast)',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              display: 'inline-block'
            }}>
              ▼
            </span>
          </div>
        </div>
      </div>

      {/* Expandable Route Details */}
      <div className={`expandable-content ${isExpanded ? 'expanded' : ''}`}>
        {/* Additional Features when expanded */}
        <div className="expanded-features">
          {/* Live Tracking */}
          <div className="live-tracking">
            <div className="tracking-icon"></div>
            <span className="tracking-text">Live tracking available</span>
          </div>

          {/* Accessibility Features */}
          <div className="accessibility-info">
            <div className="accessibility-icon" title="Wheelchair Accessible">
              ♿
            </div>
            <div className="accessibility-icon" title="Audio Announcements">
              🔊
            </div>
            <div className="accessibility-icon" title="Low Floor">
              📐
            </div>
          </div>
        </div>
        
        <div className="route-details">
          <div className="text-headline" style={{ marginBottom: 'var(--space-4)' }}>
            🗺️ Route Details
          </div>
          
          {stops.length > 0 && (
            <div className="stops-simple-list">
              {stops.map((stop, index) => (
                <div key={stop.id || index} className="stop-simple-item">
                  <span className="stop-simple-number">{index + 1}</span>
                  <span className="stop-simple-name">{getStopDisplayName(stop)}</span>
                  <span className="stop-simple-time">
                    {stop.arrivalTime || '--:--'}
                  </span>
                  {stop.departureTime && stop.departureTime !== stop.arrivalTime && (
                    <span className="stop-simple-departure">{stop.departureTime}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Map Placeholder */}
          <div style={{
            marginTop: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '1px solid var(--transit-divider)'
          }}>
            <div style={{ 
              padding: 'var(--space-3)',
              background: 'var(--transit-surface-elevated)',
              borderBottom: '1px solid var(--transit-divider)'
            }}>
              <div className="text-headline" style={{ fontSize: 'var(--text-base)' }}>
                🗺️ Interactive Route Map
              </div>
            </div>
            
            {/* Try OpenStreetMap first, fallback to static map */}
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
    </button>
  );
};

export default React.memo(TransitBusCard);