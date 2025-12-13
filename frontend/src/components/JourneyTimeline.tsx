import React from 'react';
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
 * Displays a graphical representation of the bus route with stops
 */
const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
  bus,
  stops,
  fromLocation,
  toLocation,
  isExpanded = false,
  onToggle
}) => {
  const { t } = useTranslation();

  // Sort stops by order/time
  const sortedStops = [...stops].sort((a, b) => {
    if (a.stopOrder !== undefined && b.stopOrder !== undefined) {
      return a.stopOrder - b.stopOrder;
    }
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    // Sort by time if order not available
    const timeA = a.arrivalTime || a.departureTime || '00:00';
    const timeB = b.arrivalTime || b.departureTime || '00:00';
    return timeA.localeCompare(timeB);
  });

  // Calculate journey duration
  const getDurationMinutes = (): number => {
    if (!bus.departureTime || !bus.arrivalTime) return 0;
    const [depH, depM] = bus.departureTime.split(':').map(Number);
    const [arrH, arrM] = bus.arrivalTime.split(':').map(Number);
    let minutes = (arrH * 60 + arrM) - (depH * 60 + depM);
    if (minutes < 0) minutes += 24 * 60; // Handle overnight
    return minutes;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}${t('common.min', 'min')}`;
    if (mins === 0) return `${hours}${t('common.hr', 'hr')}`;
    return `${hours}${t('common.hr', 'hr')} ${mins}${t('common.min', 'min')}`;
  };

  const duration = getDurationMinutes();
  const hasStops = sortedStops.length > 0;

  return (
    <div className="journey-timeline">
      {/* Timeline Header */}
      <div className="timeline-header" onClick={onToggle} role="button" tabIndex={0}>
        <div className="timeline-summary">
          <div className="timeline-endpoints">
            <div className="endpoint origin">
              <span className="endpoint-time">{bus.departureTime}</span>
              <span className="endpoint-dot origin-dot"></span>
              <span className="endpoint-name">{fromLocation || bus.from}</span>
            </div>
            
            <div className="timeline-connector">
              <div className="connector-line">
                <div className="connector-arrow">→</div>
              </div>
              <span className="connector-duration">{formatDuration(duration)}</span>
              {hasStops && (
                <span className="connector-stops">
                  {sortedStops.length} {t('timeline.stops', 'stops')}
                </span>
              )}
            </div>

            <div className="endpoint destination">
              <span className="endpoint-time">{bus.arrivalTime}</span>
              <span className="endpoint-dot destination-dot"></span>
              <span className="endpoint-name">{toLocation || bus.to}</span>
            </div>
          </div>
        </div>
        
        {hasStops && (
          <button 
            className="timeline-toggle"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? t('timeline.collapse', 'Collapse stops') : t('timeline.expand', 'Expand stops')}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        )}
      </div>

      {/* Expanded Stops View */}
      {isExpanded && hasStops && (
        <div className="timeline-stops">
          <div className="stops-list">
            {/* Origin */}
            <div className="stop-item origin-stop">
              <div className="stop-marker origin-marker">
                <span className="marker-dot"></span>
                <span className="marker-line"></span>
              </div>
              <div className="stop-details">
                <span className="stop-time">{bus.departureTime}</span>
                <span className="stop-name">{fromLocation || bus.from}</span>
                <span className="stop-label">{t('timeline.departure', 'Departure')}</span>
              </div>
            </div>

            {/* Intermediate Stops */}
            {sortedStops.map((stop, index) => (
              <div key={stop.id || index} className="stop-item intermediate-stop">
                <div className="stop-marker">
                  <span className="marker-dot"></span>
                  <span className="marker-line"></span>
                </div>
                <div className="stop-details">
                  <span className="stop-time">
                    {stop.arrivalTime || stop.departureTime || '--:--'}
                  </span>
                  <span className="stop-name">
                    {stop.translatedName || stop.name}
                  </span>
                  {stop.platform && (
                    <span className="stop-platform">
                      {t('timeline.platform', 'Platform')} {stop.platform}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Destination */}
            <div className="stop-item destination-stop">
              <div className="stop-marker destination-marker">
                <span className="marker-dot"></span>
              </div>
              <div className="stop-details">
                <span className="stop-time">{bus.arrivalTime}</span>
                <span className="stop-name">{toLocation || bus.to}</span>
                <span className="stop-label">{t('timeline.arrival', 'Arrival')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Stops Message */}
      {isExpanded && !hasStops && (
        <div className="timeline-no-stops">
          <span className="no-stops-icon">📍</span>
          <span className="no-stops-text">{t('timeline.directRoute', 'Direct route - No intermediate stops listed')}</span>
        </div>
      )}
    </div>
  );
};

export default React.memo(JourneyTimeline);
