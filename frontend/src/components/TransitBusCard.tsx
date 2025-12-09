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
  isNextBus?: boolean;
  isFastest?: boolean;
  isCheapest?: boolean;
}

const TransitBusCard: React.FC<TransitBusCardProps> = ({
  bus,
  selectedBusId,
  stops,
  onSelectBus,
  fromLocation,
  toLocation,
  isCompact = false,
  isNextBus = false,
  isFastest = false,
  isCheapest = false
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

  // Calculate time until departure
  const getTimeUntilDeparture = () => {
    if (!bus.departureTime) return null;
    
    const now = new Date();
    const [hours, minutes] = bus.departureTime.split(':').map(Number);
    
    const departure = new Date();
    departure.setHours(hours, minutes, 0, 0);
    
    const diffMs = departure.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < -60) {
      // More than 1 hour ago
      const hoursAgo = Math.abs(Math.floor(diffMinutes / 60));
      return { text: `${hoursAgo}h ago`, type: 'past', minutes: diffMinutes };
    } else if (diffMinutes < 0) {
      // Less than 1 hour ago
      return { text: `${Math.abs(diffMinutes)}m ago`, type: 'past', minutes: diffMinutes };
    } else if (diffMinutes <= 15) {
      // Leaving very soon
      return { text: diffMinutes === 0 ? 'Now!' : `${diffMinutes}m`, type: 'urgent', minutes: diffMinutes };
    } else if (diffMinutes <= 60) {
      // Within the hour
      return { text: `${diffMinutes}m`, type: 'soon', minutes: diffMinutes };
    } else {
      // More than an hour away
      const hoursAway = Math.floor(diffMinutes / 60);
      const minsAway = diffMinutes % 60;
      return { text: minsAway > 0 ? `${hoursAway}h ${minsAway}m` : `${hoursAway}h`, type: 'upcoming', minutes: diffMinutes };
    }
  };

  const timeUntil = getTimeUntilDeparture();

  // Get styling for time until departure badge
  const getTimeBadgeStyle = (type: string) => {
    switch (type) {
      case 'urgent':
        return {
          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
          color: 'white',
          animation: 'pulse 1.5s ease-in-out infinite'
        };
      case 'soon':
        return {
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: 'white'
        };
      case 'upcoming':
        return {
          background: '#EFF6FF',
          color: '#1D4ED8',
          border: '1px solid #BFDBFE'
        };
      default:
        return {
          background: '#F3F4F6',
          color: '#6B7280',
          border: '1px solid #E5E7EB'
        };
    }
  };

  // Get icon for time badge
  const getTimeBadgeIcon = (type: string) => {
    if (type === 'past') return '🕐';
    if (type === 'urgent') return '🔴';
    return '⏱️';
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

  return (
    <button 
      className={`transit-bus-card ${isSelected ? 'selected' : ''} ${isCompact ? 'compact' : ''} ${isNextBus ? 'next-bus-highlight' : ''} fade-in`}
      onClick={handleCardClick}
      aria-label={`Bus ${bus.busNumber || 'Transit'} from ${getLocationDisplayName(fromLocation) || bus.from} to ${getLocationDisplayName(toLocation) || bus.to}`}
      type="button"
      style={isNextBus ? { borderLeft: '4px solid #10B981', background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.05) 0%, transparent 20%)' } : undefined}
    >
      {/* Special Badges Row */}
      {(isNextBus || isFastest || isCheapest) && (
        <div className="special-badges-row" style={{
          display: 'flex',
          gap: '6px',
          padding: '8px 12px',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          borderBottom: '1px solid #d1fae5',
          flexWrap: 'wrap'
        }}>
          {isNextBus && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '600',
              boxShadow: '0 1px 3px rgba(16, 185, 129, 0.3)'
            }}>
              🚀 Next Bus
            </span>
          )}
          {isFastest && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
              color: 'white',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '600',
              boxShadow: '0 1px 3px rgba(139, 92, 246, 0.3)'
            }}>
              ⚡ Fastest
            </span>
          )}
          {isCheapest && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: 'white',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '600',
              boxShadow: '0 1px 3px rgba(245, 158, 11, 0.3)'
            }}>
              💰 Best Value
            </span>
          )}
        </div>
      )}

      {/* Card Header */}
      <div className="transit-card-header">
        {/* Bus Info Row - Number and Type on same line */}
        <div className="bus-info-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div className="bus-number-display">
            {bus.busNumber || bus.busName || 'Bus'}
          </div>
          <div className="bus-type-display" style={{ backgroundColor: `${busTypeInfo.color}20`, color: busTypeInfo.color }}>
            {busTypeInfo.icon} {busTypeInfo.label}
          </div>
          
          {/* Time Until Departure Badge */}
          {timeUntil && (
            <div style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: '600',
              ...getTimeBadgeStyle(timeUntil.type)
            }}>
              <span>{getTimeBadgeIcon(timeUntil.type)}</span>
              <span>{timeUntil.type === 'past' ? timeUntil.text : `Leaves in ${timeUntil.text}`}</span>
            </div>
          )}
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
            {typeof window !== 'undefined' && (window as unknown as { L?: unknown }).L ? (
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