import React, { useState, useEffect, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Stop, Location as AppLocation } from '../types';
import { usePublicFeatureFlags } from '../hooks/usePublicFeatureFlag';
import { BusReviewSection } from './review/BusReviewSection';
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

// PHASE 2 OPTIMIZATION: Memoize component to prevent unnecessary re-renders
const BusCardModern: React.FC<BusCardModernProps> = memo(({
  bus,
  index,
  isSelected,
  onSelect: _onSelect,
  onAddStops: _onAddStops,
  onReportIssue: _onReportIssue,
  onMapClick: _onMapClick,
  fromLocation,
  toLocation,
  stops = []
}) => {
  const { i18n } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [leavingIn, setLeavingIn] = useState<string | null>(null);
  
  // Fetch feature flags from public endpoint (no auth required)
  const { flags } = usePublicFeatureFlags(['enableAddStops', 'enableReportIssue', 'enableShareRoute', 'enableBusReviews']);

  // Calculate bus title with operator name
  const busTitle = React.useMemo(() => {
    const operatorLabel = bus.name || bus.corporation?.toUpperCase() || '';
    const titleBase = bus.busName || bus.routeName || bus.busNumber || 'Bus';
    return operatorLabel ? `${operatorLabel} • ${titleBase}` : titleBase;
  }, [bus.name, bus.corporation, bus.busName, bus.routeName, bus.busNumber]);

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

  // PHASE 2 OPTIMIZATION: Memoize callbacks to prevent child re-renders
  const handleCardClick = useCallback(() => {
    if (stops.length > 0) {
      setIsExpanded(prev => !prev);
    }
  }, [stops.length]);

  // Prefer segment-based times from stops when available
  const matchStop = (s: Stop, loc?: AppLocation): boolean => {
    if (!loc) return false;
    if (s.locationId && loc.id && s.locationId === loc.id) return true;
    const sName = (s.name || '').toLowerCase();
    const sTranslated = (s.translatedName || '').toLowerCase();
    const locName = (loc.name || '').toLowerCase();
    return sName === locName || sName.includes(locName) || sTranslated.includes(locName);
  };

  const segmentDepartureTime = React.useMemo(() => {
    const fromStop = stops.find(s => matchStop(s, fromLocation));
    return fromStop?.departureTime || bus.departureTime || '';
  }, [stops, fromLocation, bus.departureTime]);

  const segmentArrivalTime = React.useMemo(() => {
    const toStop = stops.find(s => matchStop(s, toLocation));
    // Fall back to last stop if destination not found
    const lastStopArrival = stops.length > 0 ? stops[stops.length - 1].arrivalTime : '';
    return toStop?.arrivalTime || lastStopArrival || bus.arrivalTime || '';
  }, [stops, toLocation, bus.arrivalTime]);

  const getDuration = () => {
    if (!segmentDepartureTime || !segmentArrivalTime) return '';
    const [depHours, depMinutes] = segmentDepartureTime.split(':').map(Number);
    const [arrHours, arrMinutes] = segmentArrivalTime.split(':').map(Number);
    let durationHours = arrHours - depHours;
    let durationMinutes = arrMinutes - depMinutes;
    if (durationMinutes < 0) { durationHours -= 1; durationMinutes += 60; }
    if (durationHours < 0) { durationHours += 24; }
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

  const _status = getStatus();
  const _timeUntilDep = getTimeUntilDeparture();
  const rating = bus.rating || 4.5;
  const reviews = bus.features?.reviewCount ? parseInt(String(bus.features.reviewCount)) : 0;
  const busTypeInfo = getBusType();
  const _borderColorClass = index === 0
    ? 'border-emerald-200/40 hover:border-emerald-400/60'
    : index % 3 === 1
    ? 'border-cyan-200/40 hover:border-cyan-400/60'
    : 'border-amber-200/40 hover:border-amber-400/60';

  return (
    <div 
      className="bus-card-premium"
      role="article"
      aria-label={`Bus ${bus.busNumber || 'N/A'} from ${bus.from} to ${bus.to}`}
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
          <h3>{busTitle}</h3>
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
          <div className="journey-time">{segmentDepartureTime ? segmentDepartureTime.split(':').slice(0, 2).join(':') : '--:--'}</div>
          <div className="journey-location">{getLocationDisplayName(fromLocation)}</div>
        </div>

        <div className="journey-connector">
          <div className="connector-line"></div>
          <div className="connector-info">
            {getDuration() && <div className="duration-badge">{getDuration()}</div>}
            <span className="connector-icon">🚌</span>
          </div>
          <div className="connector-line"></div>
        </div>

        {/* Only show arrival time if available (MTC buses may not have estimated arrival) */}
        {segmentArrivalTime ? (
          <div className="journey-item">
            <div className="journey-time">{segmentArrivalTime.split(':').slice(0, 2).join(':')}</div>
            <div className="journey-location">{getLocationDisplayName(toLocation)}</div>
          </div>
        ) : (
          <div className="journey-item">
            <div className="journey-time" style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Est. arrival</div>
            <div className="journey-location">{getLocationDisplayName(toLocation)}</div>
          </div>
        )}
      </div>

      {/* View Stops Section - Always visible, shows chevron to indicate expandable */}
      {stops.length > 0 && (
        <div 
          className="bus-card-view-stops"
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCardClick();
            }
          }}
          aria-label={isExpanded ? `Hide all stops for ${bus.busName || 'bus'} (${stops.length} stops)` : `Show all stops for ${bus.busName || 'bus'} (${stops.length} stops)`}
          aria-expanded={isExpanded}
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
                
                // Get stop name with translation support
                const getStopName = () => {
                  if (i18n.language === 'ta') {
                    // Try Tamil translations in order of preference
                    return stop.taName || stop.translatedName || stop.translatedNames?.ta || stop.name;
                  }
                  return stop.name;
                };
                
                // Determine if this is origin or destination by name comparison
                const isOriginStop = stop.name.toLowerCase().includes(bus.from?.toLowerCase() || '');
                const isDestStop = stop.name.toLowerCase().includes(bus.to?.toLowerCase() || '');
                
                let stopColor = '#6B7280'; // default gray
                if (isOriginStop) stopColor = '#10B981'; // green for origin
                else if (isDestStop) stopColor = '#EF4444'; // red for destination
                
                return (
                  <div key={stop.id || idx} className="stop-item">
                    <div className="stop-number" style={{ background: stopColor }}>
                      {idx + 1}
                    </div>
                    <div className="stop-content">
                      <div className="stop-name-full">{getStopName()}</div>
                      <div className="stop-timing-info">
                        {stop.arrivalTime && <span>Arr: {formatTime(stop.arrivalTime)}</span>}
                        {stop.departureTime && <span>Dep: {formatTime(stop.departureTime)}</span>}
                      </div>
                    </div>
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
        {/* Add Stops Button - controlled by public feature flag */}
        {flags.enableAddStops && (
          <button
            className="btn btn-add"
            onClick={(e) => {
              e.stopPropagation();
              _onAddStops?.(bus);
            }}
            title="Add stops"
            aria-label={`Add stops to ${bus.busName || 'bus'} ${bus.busNumber ? `(${bus.busNumber})` : ''}`}
          >
            ➕ Add Stops
          </button>
        )}
        
        {/* Report Issue Button - controlled by public feature flag */}
        {flags.enableReportIssue && (
          <button
            className="btn btn-report"
            onClick={(e) => {
              e.stopPropagation();
              _onReportIssue?.(bus);
            }}
            title="Report issue"
            aria-label={`Report issue with ${bus.busName || 'bus'} ${bus.busNumber ? `(${bus.busNumber})` : ''}`}
          >
            ⚠️ Report
          </button>
        )}
        
        {/* Reviews Button - controlled by public feature flag */}
        {flags.enableBusReviews && (
          <button
            className="btn btn-reviews"
            onClick={(e) => {
              e.stopPropagation();
              setShowReviews(true);
            }}
            title="View and write reviews"
            aria-label={`Reviews for ${bus.busName || 'bus'} ${bus.busNumber ? `(${bus.busNumber})` : ''}`}
          >
            ⭐ Reviews
          </button>
        )}
        
        {/* Share Button - controlled by public feature flag */}
        {flags.enableShareRoute && (
          <button
            className="btn btn-share"
            aria-label={`Share ${bus.busName || 'bus'} ${bus.busNumber ? `(${bus.busNumber})` : ''} details`}
            onClick={(e) => {
              e.stopPropagation();
              
              const formatTimeWithoutSecs = (time?: string) => {
                if (!time) return '';
                const parts = time.split(':');
                return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : time;
              };

              const getStopDisplayName = (stop?: Stop) => {
                if (!stop) return '';
                if (i18n.language === 'ta') {
                  return (
                    stop.translatedName ||
                    stop.translations?.ta?.name ||
                    stop.translatedNames?.ta ||
                    stop.name ||
                    ''
                  );
                }
                return stop.name || stop.translatedName || '';
              };

              // Determine source and destination
              const explicitFrom =
                getLocationDisplayName(fromLocation) ||
                bus.from ||
                bus.fromLocationName ||
                bus.fromLocationNameTranslated ||
                '';
              const explicitTo =
                getLocationDisplayName(toLocation) ||
                bus.to ||
                bus.toLocationName ||
                bus.toLocationNameTranslated ||
                '';
              const firstStop = stops && stops.length > 0 ? stops[0] : undefined;
              const lastStop = stops && stops.length > 0 ? stops[stops.length - 1] : undefined;
              const fallbackFrom = getStopDisplayName(firstStop);
              const fallbackTo = getStopDisplayName(lastStop);

              const sourceLocation = explicitFrom || fallbackFrom;
              const destinationLocation = explicitTo || fallbackTo;
              
              const shareLines = [
                `🚌 Bus Route Information`,
                ``,
              ];
              
              if (sourceLocation) shareLines.push(`📍 From: ${sourceLocation}`);
              if (destinationLocation) shareLines.push(`🎯 To: ${destinationLocation}`);
              
              shareLines.push(
                `🚍 Bus: ${bus.busName || bus.busNumber || bus.name || bus.number || 'Bus'}`,
                `⏰ Departure: ${bus.departureTime || 'Check'}`,
                `⏱️ Arrival: ${bus.arrivalTime || 'Check'}`,
              );
              
              if (bus.fare) {
                shareLines.push(`💰 Fare: ₹${bus.fare}`);
              }
              
              if (bus.duration) {
                shareLines.push(`⏳ Duration: ${bus.duration}`);
              }

              // Add stops if available
              if (stops && stops.length > 0) {
                shareLines.push(``);
                shareLines.push(`🛑 Intermediate Stops:`);
                stops.forEach((stop, idx) => {
                  const stopName = i18n.language === 'ta' && stop.translatedName ? stop.translatedName : stop.name;
                  const arrivalTime = stop.arrivalTime ? `Arr: ${formatTimeWithoutSecs(stop.arrivalTime)}` : '';
                  const departureTime = stop.departureTime ? `Dep: ${formatTimeWithoutSecs(stop.departureTime)}` : '';
                  const times = [arrivalTime, departureTime].filter(t => t).join(' | ');
                  const timeInfo = times ? ` (${times})` : '';
                  shareLines.push(`  ${idx + 1}. ${stopName}${timeInfo}`);
                });
              }
              
              shareLines.push(``);
              shareLines.push(`📱 Shared via Perundhu - Tamil Nadu Bus Tracker`);
              shareLines.push(`🔗 https://perundhu.app`);
              
              const text = shareLines.join('\n');
              
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
        )}

      </div>

      {/* Fare Section */}
      {bus.fare && (
        <div className="bus-card-fare">
          ₹{bus.fare}
        </div>
      )}

      {/* Reviews Modal */}
      {showReviews && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold">{bus.busName || 'Bus'} Reviews</h2>
              <button
                onClick={() => setShowReviews(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <BusReviewSection
                busId={bus.id}
                busName={bus.busName || 'Bus'}
                compact={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// PHASE 2 OPTIMIZATION: Add display name for better debugging
BusCardModern.displayName = 'BusCardModern';

export default BusCardModern;
