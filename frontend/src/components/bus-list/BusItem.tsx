import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Stop } from '../../types';
import { formatTime, calculateDuration } from './busUtils';
import '../../styles/bus-card.css';

interface BusItemProps {
  bus: Bus;
  isSelected: boolean;
  stops: Stop[];
  onSelect: () => void;
  onAddStops?: (bus: Bus) => void;
  onReportIssue?: (bus: Bus) => void;
  onShare?: (bus: Bus) => void;
  isNextBus?: boolean;
  isFastest?: boolean;
  isCompact?: boolean;
}

const BusItem: React.FC<BusItemProps> = ({ 
  bus, 
  isSelected, 
  stops, 
  onSelect,
  onAddStops,
  onReportIssue,
  onShare,
  isNextBus = false,
  isFastest = false,
  isCompact: _isCompact = false 
}) => {
  const { t } = useTranslation();
  const [showStops, setShowStops] = useState(false);

  const getTimeUntilDeparture = () => {
    if (!bus.departureTime) return null;
    const now = new Date();
    const [hours, minutes] = bus.departureTime.split(':').map(Number);
    const departure = new Date();
    departure.setHours(hours, minutes, 0, 0);
    const diffMs = departure.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes >= 0 && diffMinutes <= 60) {
      return `${diffMinutes}m`;
    }
    return null;
  };

  const timeUntil = getTimeUntilDeparture();

  const handleCardClick = () => {
    setShowStops(!showStops);
    if (onSelect) {
      onSelect();
    }
  };

  return (
    <div
      className={`bus-card ${showStops ? 'expanded' : ''}`}
      onClick={handleCardClick}
    >
      {/* Highlight Banner for Next Bus or Fastest */}
      {(isNextBus || timeUntil) && (
        <div className="highlight-row">
          {isNextBus && (
            <span className="badge badge-next">🚀 {t('bus.nextBus', 'Next Bus')}</span>
          )}
          {timeUntil && (
            <span className="time-badge time-urgent">
              🔴 {t('bus.leavesIn', 'Leaves in')} {timeUntil}
            </span>
          )}
        </div>
      )}

      {/* Fastest Badge */}
      {isFastest && !isNextBus && (
        <span className="badge" style={{ position: 'absolute', top: isNextBus ? '60px' : '-8px', right: '16px' }}>
          ⚡ {t('bus.fastest', 'Fastest')}
        </span>
      )}

      {/* Bus Header */}
      <div className="bus-header">
        <div className="bus-info">
          <h3>
            {bus.busName || bus.busNumber}
            <span className={`expand-indicator ${showStops ? 'expanded' : ''}`}>▼</span>
          </h3>
          <div className="bus-number">
            {t('bus.busNumber', 'Bus')} #{bus.busNumber}
            {bus.registrationNumber && ` • ${bus.registrationNumber}`}
          </div>
          {bus.rating && (
            <div className="rating" style={{ marginTop: '8px' }}>
              ⭐ {bus.rating} <span style={{ color: '#9CA3AF' }}>({bus.reviewCount || 0} {t('bus.reviews', 'reviews')})</span>
            </div>
          )}
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="journey-timeline">
        <div className="time-block">
          <div className="time">{formatTime(bus.departureTime)}</div>
          <div className="location">{bus.from || bus.fromLocation?.name}</div>
        </div>

        <div style={{ position: 'relative' }}>
          <div className="journey-line">
            <div className="bus-icon-moving">🚌</div>
          </div>
          <div className="duration">
            <strong>{calculateDuration(bus.departureTime, bus.arrivalTime)}</strong>
            <div style={{ color: '#10B981', fontWeight: 600 }}>
              {stops.length} {t('bus.stops', 'stops')}
            </div>
          </div>
        </div>

        <div className="time-block">
          <div className="time">{formatTime(bus.arrivalTime)}</div>
          <div className="location">{bus.to || bus.toLocation?.name}</div>
        </div>
      </div>

      {/* Stops List */}
      {stops.length > 0 && (
        <div className={`stops-list ${showStops ? 'show' : ''}`}>
          {stops.map((stop, index) => (
            <div key={stop.id || index} className="stop-item">
              <div className="stop-number">{index + 1}</div>
              <div className="stop-name">{stop.name}</div>
              <div className="stop-times">
                {stop.arrivalTime && <span>↓ {formatTime(stop.arrivalTime)}</span>}
                {stop.departureTime && <span>↑ {formatTime(stop.departureTime)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bus Footer */}
      <div className="bus-footer" onClick={(e) => e.stopPropagation()}>
        <div className="action-buttons">
          {onAddStops && (
            <button
              className="add-stops-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAddStops(bus);
              }}
            >
              ➕ {t('bus.addStops', 'Add Stops')}
            </button>
          )}
          {onReportIssue && (
            <button
              className="report-issue-btn"
              onClick={(e) => {
                e.stopPropagation();
                onReportIssue(bus);
              }}
            >
              🚨 {t('bus.reportIssue', 'Report Issue')}
            </button>
          )}
          {onShare && (
            <button
              className="share-btn"
              onClick={(e) => {
                e.stopPropagation();
                onShare(bus);
              }}
            >
              ↗️ {t('bus.share', 'Share')}
            </button>
          )}
        </div>
        <button
          className="view-details-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowStops(!showStops);
          }}
        >
          {showStops ? t('bus.hideDetails', 'Hide Details') : t('bus.viewDetails', 'View Details')} →
        </button>
      </div>
    </div>
  );
};

export default BusItem;