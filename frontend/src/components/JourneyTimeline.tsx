import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Stop } from '../types';
import '../styles/journey-timeline.css';

interface JourneyTimelineProps {
  bus: Bus;
  stops: Stop[];
  fromLocation?: string;
  toLocation?: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}

/**
 * Visual Journey Timeline Component
 * Compact, mobile-friendly representation of the bus route
 */
const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
  bus,
  stops,
  fromLocation,
  toLocation,
  isExpanded = false,
  onToggle
}) => {
  const { t: _t } = useTranslation();

  // Helper to normalize location names for comparison
  const normalizeLocationName = (name?: string): string => {
    if (!name) return '';
    return name.toLowerCase().trim().replaceAll(/\s+/g, ' ');
  };

  // Get origin and destination names for filtering
  const originName = normalizeLocationName(fromLocation || bus.from);
  const destName = normalizeLocationName(toLocation || bus.to);

  // Helper to get stop order priority
  const getOrderPriority = (stop: Stop): number => {
    if (stop.stopOrder !== undefined && stop.stopOrder > 0) {
      return stop.stopOrder;
    }
    if (stop.order !== undefined && stop.order > 0) {
      return stop.order;
    }
    return Infinity;
  };

  // Sort all stops by order or time, and filter out origin/destination
  // since they're already shown in the header
  const allStops = useMemo(() => {
    if (!stops || stops.length === 0) return [];
    
    // Filter out stops that match origin or destination
    const intermediateStops = stops.filter(stop => {
      const stopName = normalizeLocationName(stop.name);
      const stopTranslatedName = normalizeLocationName(stop.translatedName);
      
      // Check if this stop matches origin or destination
      const isOrigin = stopName === originName || stopTranslatedName === originName;
      const isDestination = stopName === destName || stopTranslatedName === destName;
      
      // Keep only intermediate stops (not origin or destination)
      return !isOrigin && !isDestination;
    });
    
    return [...intermediateStops].sort((a, b) => {
      // Sort by stopOrder first (but treat 0 as "no order")
      const orderA = getOrderPriority(a);
      const orderB = getOrderPriority(b);
      
      if (orderA !== orderB && orderA !== Infinity && orderB !== Infinity) {
        return orderA - orderB;
      }
      
      // If no valid order, sort by time
      const timeA = a.departureTime || a.arrivalTime || '';
      const timeB = b.departureTime || b.arrivalTime || '';
      
      if (timeA && timeB) {
        return timeA.localeCompare(timeB);
      }
      
      // Stops with time come before those without
      if (timeA && !timeB) return -1;
      if (!timeA && timeB) return 1;
      
      // Fall back to name order
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [stops, originName, destName]);

  // Calculate journey duration
  const duration = useMemo(() => {
    if (!bus.departureTime || !bus.arrivalTime) return 0;
    const [depH, depM] = bus.departureTime.split(':').map(Number);
    const [arrH, arrM] = bus.arrivalTime.split(':').map(Number);
    let minutes = (arrH * 60 + arrM) - (depH * 60 + depM);
    if (minutes < 0) minutes += 24 * 60;
    return minutes;
  }, [bus.departureTime, bus.arrivalTime]);

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (time?: string): string => {
    if (!time) return '--:--';
    // Remove seconds if present (HH:MM:SS -> HH:MM)
    const parts = time.split(':');
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : time;
  };

  const hasStops = allStops.length > 0;
  const stopCount = allStops.length; // Now counts only intermediate stops

  return (
    <div className="journey-timeline-compact">
      {/* Compact Header - Always visible */}
      <div 
        className="timeline-header-compact" 
        onClick={onToggle} 
        role="button" 
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggle?.()}
      >
        {/* Origin */}
        <div className="endpoint-compact origin">
          <span className="time-compact">{formatTime(bus.departureTime)}</span>
          <span 
            className="dot-compact origin-dot" 
            style={{ background: '#10B981', width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #fff' }}
          ></span>
          <span className="name-compact">{fromLocation || bus.from}</span>
        </div>
        
        {/* Journey Info */}
        <div className="journey-info-compact">
          <div className="journey-line"></div>
          <div className="journey-meta">
            <span className="duration-compact">{formatDuration(duration)}</span>
            {stopCount > 0 && (
              <span className="stops-count-compact">{stopCount} stops</span>
            )}
          </div>
        </div>

        {/* Destination */}
        <div className="endpoint-compact destination">
          <span className="time-compact">{formatTime(bus.arrivalTime)}</span>
          <span 
            className="dot-compact destination-dot"
            style={{ background: '#EF4444', width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #fff' }}
          ></span>
          <span className="name-compact">{toLocation || bus.to}</span>
        </div>

        {/* Expand Toggle */}
        {hasStops && (
          <button 
            className="toggle-compact"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Hide stops' : 'Show stops'}
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5"
              className={isExpanded ? 'rotated' : ''}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        )}
      </div>

      {/* Expanded Stops - Clean vertical list showing ALL stops */}
      {isExpanded && hasStops && (
        <div className="stops-expanded-compact">
          {allStops.map((stop, index) => {
            const arrTime = formatTime(stop.arrivalTime);
            const depTime = formatTime(stop.departureTime);
            const hasArrival = arrTime !== '--:--';
            const hasDeparture = depTime !== '--:--';
            
            return (
              <div key={stop.id || index} className="stop-row-compact">
                <span className="stop-index">{index + 1}</span>
                <span className="stop-name-compact">{stop.translatedName || stop.name}</span>
                <div className="stop-times-compact">
                  {hasArrival && (
                    <span className="stop-time-arrival" title="Arrival">
                      <span className="time-label">arr</span> {arrTime}
                    </span>
                  )}
                  {hasDeparture && (
                    <span className="stop-time-departure" title="Departure">
                      <span className="time-label">dep</span> {depTime}
                    </span>
                  )}
                  {!hasArrival && !hasDeparture && (
                    <span className="stop-time-compact">--:--</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default React.memo(JourneyTimeline);
