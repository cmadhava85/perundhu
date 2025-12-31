import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Stop } from '../../types';
import { ChevronDown, MapPin, Clock, Users, Wind, AlertCircle, CheckCircle } from 'lucide-react';
import './premium-bus-card.css';

interface PremiumBusCardProps {
  bus: Bus;
  isSelected?: boolean;
  stops: Stop[];
  onSelect?: () => void;
  onBook?: () => void;
  isNextBus?: boolean;
  isFastest?: boolean;
  className?: string;
}

/**
 * Premium Bus Card Component
 * 
 * High-end card with:
 * - Glassmorphism design
 * - High-contrast time hierarchy
 * - Smooth micro-interactions
 * - Full mobile accessibility
 */
const PremiumBusCard: React.FC<PremiumBusCardProps> = ({
  bus,
  isSelected = false,
  stops = [],
  onSelect,
  onBook,
  isNextBus = false,
  isFastest = false,
  className = ''
}) => {
  const { t } = useTranslation();
  const [showStops, setShowStops] = useState(false);

  // Calculate duration
  const duration = useMemo(() => {
    if (!bus.departureTime || !bus.arrivalTime) return '';
    try {
      const [depH, depM] = bus.departureTime.split(':').map(Number);
      const [arrH, arrM] = bus.arrivalTime.split(':').map(Number);
      
      let h = arrH - depH;
      let m = arrM - depM;
      
      if (m < 0) {
        h--;
        m += 60;
      }
      if (h < 0) h += 24;
      
      return `${h}h ${m}m`;
    } catch {
      return '';
    }
  }, [bus.departureTime, bus.arrivalTime]);

  // Determine status color
  const getStatusColor = () => {
    const status = bus.status?.toLowerCase() || 'on-time';
    if (status.includes('delay')) return { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', label: 'Delayed' };
    if (status.includes('cancel')) return { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-700', label: 'Cancelled' };
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', label: 'On Time' };
  };

  const statusColor = getStatusColor();

  // Get bus type info
  const getBusType = () => {
    const cat = bus.category?.toLowerCase() || '';
    if (cat.includes('deluxe') || cat.includes('luxury')) return { icon: '✨', label: 'Deluxe' };
    if (cat.includes('express')) return { icon: '⚡', label: 'Express' };
    if (cat.includes('ac')) return { icon: '❄️', label: 'AC' };
    return { icon: '🚌', label: 'Standard' };
  };

  const busType = getBusType();

  // Sorted stops
  const sortedStops = useMemo(() => {
    return [...stops].sort((a, b) => {
      const timeA = a.departureTime || a.arrivalTime || '00:00';
      const timeB = b.departureTime || b.arrivalTime || '00:00';
      return timeA.localeCompare(timeB);
    });
  }, [stops]);

  const handleCardClick = () => {
    onSelect?.();
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBook?.();
  };

  const handleStopsToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStops(!showStops);
  };

  return (
    <div
      className={`premium-bus-card ${isSelected ? 'selected' : ''} ${className}`}
      onClick={handleCardClick}
    >
      {/* Glassmorphic Container */}
      <div className="premium-card-content">
        {/* Header with Badges */}
        <div className="card-header">
          <div className="route-info">
            <h2 className="route-title">
              {bus.from} <span className="arrow-separator">→</span> {bus.to}
            </h2>
            <p className="operator-name">{bus.busName || bus.busNumber}</p>
          </div>

          <div className="badges-group">
            {isNextBus && (
              <span className="badge badge-primary">
                <Clock size={12} />
                Next Bus
              </span>
            )}
            {isFastest && (
              <span className="badge badge-secondary">
                <CheckCircle size={12} />
                Fastest
              </span>
            )}
            <span className={`badge ${statusColor.badge}`}>
              {statusColor.label}
            </span>
          </div>
        </div>

        {/* Journey Visualization - High Contrast Times */}
        <div className="journey-section">
          <div className="journey-container">
            {/* Departure */}
            <div className="time-block departure-block">
              <div className="time-display text-5xl font-bold text-slate-900">
                {bus.departureTime || '--:--'}
              </div>
              <div className="time-label">{t('bus.departure', 'Departure')}</div>
              <div className="location-name">{bus.from}</div>
            </div>

            {/* Journey Line with Duration */}
            <div className="journey-line-wrapper">
              <div className="journey-line">
                <div className="journey-dot start"></div>
                <div className="journey-dot end"></div>
              </div>
              <div className="duration-badge">{duration}</div>
            </div>

            {/* Arrival */}
            <div className="time-block arrival-block">
              <div className="time-display text-5xl font-bold text-slate-900">
                {bus.arrivalTime || '--:--'}
              </div>
              <div className="time-label">{t('bus.arrival', 'Arrival')}</div>
              <div className="location-name">{bus.to}</div>
            </div>
          </div>
        </div>

        {/* Bus Features Grid */}
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon">🚌</div>
            <div className="feature-content">
              <div className="feature-label">{t('bus.type', 'Type')}</div>
              <div className="feature-value">{busType.label}</div>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">💺</div>
            <div className="feature-content">
              <div className="feature-label">{t('bus.seats', 'Seats')}</div>
              <div className="feature-value">{bus.capacity || '40'}</div>
            </div>
          </div>

          {stops.length > 0 && (
            <div className="feature-item">
              <div className="feature-icon">🚏</div>
              <div className="feature-content">
                <div className="feature-label">{t('bus.stops', 'Stops')}</div>
                <div className="feature-value">{stops.length}</div>
              </div>
            </div>
          )}

          {bus.fare && (
            <div className="feature-item">
              <div className="feature-icon">💰</div>
              <div className="feature-content">
                <div className="feature-label">{t('bus.fare', 'Fare')}</div>
                <div className="feature-value">₹{bus.fare}</div>
              </div>
            </div>
          )}
        </div>

        {/* Expandable Stops Section */}
        {stops.length > 0 && (
          <div className="stops-section">
            <button
              onClick={handleStopsToggle}
              className="stops-toggle"
              aria-expanded={showStops}
            >
              <span className="toggle-text">
                {t('bus.viewStops', 'View Stops')} ({stops.length})
              </span>
              <ChevronDown
                size={20}
                className={`toggle-icon ${showStops ? 'expanded' : ''}`}
              />
            </button>

            {showStops && (
              <div className="stops-list">
                {sortedStops.map((stop, index) => (
                  <div key={stop.id || index} className="stop-item">
                    <div className="stop-marker"></div>
                    <div className="stop-content">
                      <div className="stop-name">{stop.name}</div>
                      {stop.arrivalTime && (
                        <div className="stop-time">
                          {stop.arrivalTime}
                        </div>
                      )}
                    </div>
                    <div className="stop-order">#{index + 1}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTA Button */}
        {onBook && (
          <button
            onClick={handleBookClick}
            className="book-button"
            aria-label={t('bus.book', 'Book Now')}
          >
            {t('bus.book', 'Book Now')}
          </button>
        )}
      </div>
    </div>
  );
};

export default PremiumBusCard;
