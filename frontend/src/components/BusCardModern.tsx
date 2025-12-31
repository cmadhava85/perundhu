import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Stop, Location as AppLocation } from '../types';
import '../styles/premium-design-system.css';
import '../styles/bus-card-modern-premium.css';
import '../styles/premium-bus-grid.css';

interface BusCardModernProps {
  bus: Bus;
  index: number;
  isSelected: boolean;
  onSelect: (bus: Bus) => void;
  onAddStops?: (bus: Bus) => void;
  onReportIssue?: (bus: Bus) => void;
  onMapClick?: (stop: Stop, bus: Bus) => void;
  fromLocation?: AppLocation;
  toLocation?: AppLocation;
  stops?: Stop[];
}

const BusCardModern: React.FC<BusCardModernProps> = ({
  bus,
  index,
  isSelected,
  onSelect,
  onAddStops,
  onReportIssue,
  onMapClick,
  fromLocation,
  toLocation,
  stops = []
}) => {
  const { i18n, t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [leavingIn, setLeavingIn] = useState<string | null>(null);

  // Sync expansion with selection
  useEffect(() => {
    if (isSelected && stops.length > 0) {
      setIsExpanded(true);
    }
  }, [isSelected, stops.length]);

  // Update "leaving in" countdown
  useEffect(() => {
    const updateLeavingIn = () => {
      if (!bus.departureTime) {
        setLeavingIn(null);
        return;
      }
      
      const now = new Date();
      const [hours, minutes] = bus.departureTime.split(':').map(Number);
      
      const departure = new Date();
      departure.setHours(hours, minutes, 0, 0);
      
      const diffMs = departure.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes <= 0) {
        setLeavingIn(null);
      } else if (diffMinutes < 60) {
        setLeavingIn(`Leaves in ${diffMinutes}m`);
      } else {
        const hrs = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        setLeavingIn(`Leaves in ${hrs}h ${mins}m`);
      }
    };
    
    updateLeavingIn();
    const interval = setInterval(updateLeavingIn, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [bus.departureTime]);

  const getLocationDisplayName = (location?: AppLocation) => {
    if (!location) return '';
    if (i18n.language === 'ta' && location.translatedName) {
      return location.translatedName;
    }
    return location.name;
  };

  const getDuration = () => {
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
  };

  const getTimeUntilDeparture = () => {
    if (!bus.departureTime) return null;
    
    const now = new Date();
    const [hours, minutes] = bus.departureTime.split(':').map(Number);
    
    const departure = new Date();
    departure.setHours(hours, minutes, 0, 0);
    
    const diffMs = departure.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes <= 0) return null;
    if (diffMinutes < 60) return `Leaves in ${diffMinutes}m`;
    
    const hours_left = Math.floor(diffMinutes / 60);
    const mins_left = diffMinutes % 60;
    return `Leaves in ${hours_left}h ${mins_left}m`;
  };

  const getStatus = () => {
    const status = bus.status?.toLowerCase() || 'on-time';
    if (status === 'on-time') return { text: 'On Time', color: '#10B981', icon: '●' };
    if (status === 'delayed') return { text: 'Delayed', color: '#F59E0B', icon: '●' };
    if (status === 'cancelled') return { text: 'Cancelled', color: '#EF4444', icon: '●' };
    return { text: 'Unknown', color: '#6B7280', icon: '●' };
  };

  const getBusType = () => {
    const category = bus.category?.toLowerCase() || '';
    if (category.includes('express')) return '⚡ Express';
    if (category.includes('deluxe')) return '✨ Deluxe';
    if (category.includes('ac')) return '❄️ AC';
    return '🚌 Regular';
  };

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
    onSelect(bus);
  };

  const status = getStatus();
  const timeUntilDep = getTimeUntilDeparture();
  const rating = bus.rating || 4.5;
  const reviews = bus.features?.reviewCount ? parseInt(String(bus.features.reviewCount)) : 0;
  const busTypeInfo = getBusType();
  
  // Determine status colors: Emerald for on-time, Amber for delayed/cancelled
  const isDelayed = status.text === 'Delayed';
  const isCancelled = status.text === 'Cancelled';
  const statusColor = isCancelled ? 'red' : isDelayed ? 'amber' : 'emerald';
  const statusBg = isCancelled 
    ? 'bg-red-400/20 border-red-400/50 text-red-600' 
    : isDelayed 
    ? 'bg-amber-400/20 border-amber-400/50 text-amber-600'
    : 'bg-emerald-400/20 border-emerald-400/50 text-emerald-600';

  // Alternate background colors with app theme (emerald, cyan, amber)
  const cardBgClass = index % 3 === 0 
    ? 'bg-emerald-50/60 hover:bg-emerald-50/80' 
    : index % 3 === 1
    ? 'bg-cyan-50/60 hover:bg-cyan-50/80'
    : 'bg-amber-50/50 hover:bg-amber-50/70';
  
  const cardBorderClass = index % 3 === 0
    ? 'border-emerald-200/40 hover:border-emerald-400/60'
    : index % 3 === 1
    ? 'border-cyan-200/40 hover:border-cyan-400/60'
    : 'border-amber-200/40 hover:border-amber-400/60';

  return (
    <div 
      className="bus-card-premium"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleCardClick();
        }
      }}
    >
      {/* Top Badges Section */}
      <div className="bus-card-badges">
        {leavingIn && (
          <span className="badge badge-urgent">⏱️ {leavingIn}</span>
        )}
        {index === 0 && (
          <span className="badge badge-next">🚀 Next Bus</span>
        )}
        {busTypeInfo.includes('Express') && (
          <span className="badge badge-fastest">⚡ Fastest</span>
        )}
      </div>

      {/* Header Section */}
      <div className="bus-card-header">
        <div className="bus-card-title">
          <h3>{bus.busName || 'Bus'}</h3>
          <p className="bus-card-subtitle">Bus #{bus.busNumber || bus.number || 'N/A'} • {bus.category || 'Standard'}</p>
        </div>
        <div className="bus-card-rating">
          <span className="rating-stars">⭐{rating}</span>
          <span className="rating-count">({reviews} reviews)</span>
        </div>
      </div>

      {/* Journey Timeline Section */}
      <div className="bus-card-journey">
        <div className="journey-item">
          <div className="journey-time">{bus.departureTime || '--:--'}</div>
          <div className="journey-location">{getLocationDisplayName(fromLocation)}</div>
        </div>

        <div className="journey-connector">
          <div className="connector-line"></div>
          <div className="connector-info">
            <div className="duration-badge">{getDuration()}</div>
            <span className="connector-icon">🚌</span>
          </div>
          <div className="connector-line"></div>
        </div>

        <div className="journey-item">
          <div className="journey-time">{bus.arrivalTime || '--:--'}</div>
          <div className="journey-location">{getLocationDisplayName(toLocation)}</div>
        </div>
      </div>

      {/* View Stops Section - Always visible, shows chevron to indicate expandable */}
      {stops.length > 0 && (
        <div 
          className="bus-card-view-stops"
          onClick={handleCardClick}
          role="button"
          tabIndex={0}
        >
          <div className="view-stops-content">
            <span className="stops-count-badge">{stops.length} stops</span>
            <span className="expand-indicator">{isExpanded ? '▼' : '▶'} View All Stops</span>
          </div>
        </div>
      )}

      {/* Stops Section */}
      {stops.length > 0 && isExpanded && (
        <div className="bus-card-stops">
          <div className="stops-header">
            <h4>
              <span className="stops-icon">📍</span>
              All Stops
            </h4>
          </div>

          <div className="stops-list">
              {stops.map((stop, idx) => {
                // Format time to show only HH:MM (remove seconds)
                const formatTime = (time: string) => {
                  if (!time) return '--:--';
                  return time.substring(0, 5); // Get first 5 chars (HH:MM)
                };
                
                return (
                  <div key={stop.id || idx} className="stop-item">
                    <div className="stop-number">{idx + 1}</div>
                    <div className="stop-name">{stop.name}</div>
                    {stop.arrivalTime && (
                      <div className="stop-times">
                        <span className="stop-time">↓ {formatTime(stop.arrivalTime)}</span>
                        {stop.departureTime && (
                          <span className="stop-time">↑ {formatTime(stop.departureTime)}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Features Section */}
      {(busTypeInfo.includes('AC') || busTypeInfo.includes('Deluxe')) && (
        <div className="bus-card-features">
          <div className="features-list">
            {busTypeInfo.includes('AC') && <span className="feature-tag">❄️ AC</span>}
            {busTypeInfo.includes('Deluxe') && <span className="feature-tag">✨ Deluxe</span>}
          </div>
        </div>
      )}

      {/* Action Buttons Section */}
      <div className="bus-card-actions">
        <button
          className="btn btn-add"
          onClick={(e) => {
            e.stopPropagation();
            onAddStops?.(bus);
          }}
          title="Add stops"
        >
          ➕ Add Stops
        </button>
        <button
          className="btn btn-report"
          onClick={(e) => {
            e.stopPropagation();
            onReportIssue?.(bus);
          }}
          title="Report issue"
        >
          ⚠️ Report
        </button>
        <button
          className="btn btn-share"
          onClick={(e) => {
            e.stopPropagation();
            const text = `${bus.number || 'Bus'} ${bus.name || ''} - ${bus.arrivalTime || 'Check'}`;
            if (navigator.share) {
              navigator.share({ title: 'Share Bus', text });
            } else {
              navigator.clipboard.writeText(text);
            }
          }}
          title="Share"
        >
          📤 Share
        </button>
      </div>

      {/* Fare Section */}
      {bus.fare && (
        <div className="bus-card-fare">
          ₹{bus.fare}
        </div>
      )}
    </div>
  );
};

export default BusCardModern;
