import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus } from '../types';
import '../styles/PremiumBusList.css';

interface EnhancedBusListProps {
  buses: Bus[];
  selectedBusId?: number | null;
  onBusSelect?: (busId: number) => void;
  onBusBook?: (busId: number) => void;
  isCompact?: boolean;
}

const EnhancedBusList: React.FC<EnhancedBusListProps> = ({
  buses,
  selectedBusId,
  onBusSelect,
  onBusBook,
  isCompact = false
}) => {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<string>('departure-time');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [expandedBusId, setExpandedBusId] = useState<number | null>(null);

  if (buses.length === 0) {
    return (
      <div className="premium-bus-list-empty">
        <div className="empty-state-animation">
          <div className="empty-bus-icon">🚌</div>
          <div className="empty-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
        <div className="empty-state-content">
          <h3 className="empty-title">{t('busList.noResults', 'No buses found')}</h3>
          <p className="empty-description">
            {t('busList.noResultsDesc', 'Try adjusting your search criteria or check other dates.')}
          </p>
          <div className="empty-suggestions">
            <button className="suggestion-chip">
              <span className="chip-icon">📅</span>
              {t('busList.tryOtherDates', 'Try other dates')}
            </button>
            <button className="suggestion-chip">
              <span className="chip-icon">🔍</span>
              {t('busList.expandSearch', 'Expand search')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleBusClick = (busId: number) => {
    if (onBusSelect) {
      onBusSelect(busId);
    }
  };

  const handleBookClick = (busId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (onBusBook) {
      onBusBook(busId);
    }
  };

  const handleDetailsToggle = (busId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedBusId(expandedBusId === busId ? null : busId);
  };

  return (
    <div className={`premium-bus-list ${isCompact ? 'compact' : ''}`}>
      {/* Premium List Header */}
      <div className="premium-list-header">
        <div className="header-info">
          <div className="list-title-section">
            <h2 className="list-title">
              <span className="title-icon">🚌</span>
              {t('busList.availableRoutes', 'Available Routes')}
            </h2>
            <div className="results-count">
              <span className="count-number">{buses.length}</span>
              <span className="count-label">{t('busList.routesFound', 'routes found')}</span>
            </div>
          </div>
          
          <div className="quick-stats">
            <div className="stat-chip">
              <span className="stat-icon">⚡</span>
              <span className="stat-text">
                {buses.filter(b => b.isLive).length} {t('busList.liveTracking', 'Live')}
              </span>
            </div>
            <div className="stat-chip">
              <span className="stat-icon">💺</span>
              <span className="stat-text">
                {buses.reduce((sum, b) => sum + (b.seatsAvailable || 0), 0)} {t('busList.seatsAvailable', 'Seats')}
              </span>
            </div>
          </div>
        </div>

        <div className="header-controls">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
              onClick={() => setViewMode('card')}
              title={t('busList.cardView', 'Card View')}
            >
              <span className="view-icon">⊞</span>
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title={t('busList.listView', 'List View')}
            >
              <span className="view-icon">☰</span>
            </button>
          </div>

          <div className="sort-control">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="premium-sort-select"
            >
              <option value="departure-time">{t('busList.sortByDeparture', 'Departure Time')}</option>
              <option value="duration">{t('busList.sortByDuration', 'Duration')}</option>
              <option value="price-low">{t('busList.sortByPriceLow', 'Price: Low to High')}</option>
              <option value="rating">{t('busList.sortByRating', 'Rating')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Premium Bus Cards Container */}
      <div className={`premium-buses-container view-${viewMode}`}>
        {buses.map((bus, index) => (
          <PremiumBusCard
            key={bus.id}
            bus={bus}
            isSelected={selectedBusId === bus.id}
            isExpanded={expandedBusId === bus.id}
            viewMode={viewMode}
            animationDelay={index * 0.1}
            onClick={() => handleBusClick(bus.id)}
            onBook={(e) => handleBookClick(bus.id, e)}
            onToggleDetails={(e) => handleDetailsToggle(bus.id, e)}
            isCompact={isCompact}
          />
        ))}
      </div>
    </div>
  );
};

interface PremiumBusCardProps {
  bus: Bus;
  isSelected: boolean;
  isExpanded: boolean;
  viewMode: 'card' | 'list';
  animationDelay: number;
  onClick: () => void;
  onBook: (event: React.MouseEvent) => void;
  onToggleDetails: (event: React.MouseEvent) => void;
  isCompact: boolean;
}

const PremiumBusCard: React.FC<PremiumBusCardProps> = ({
  bus,
  isSelected,
  isExpanded,
  viewMode,
  animationDelay,
  onClick,
  onBook,
  onToggleDetails,
  isCompact
}) => {
  const { t } = useTranslation();

  const getBusTypeInfo = (type: string) => {
    const types = {
      'ac-sleeper': { icon: '🛏️', label: 'AC Sleeper', color: '#8B5CF6' },
      'ac-seater': { icon: '❄️', label: 'AC Seater', color: '#3B82F6' },
      'non-ac-sleeper': { icon: '🛏️', label: 'Non-AC Sleeper', color: '#F59E0B' },
      'non-ac-seater': { icon: '🚌', label: 'Non-AC Seater', color: '#10B981' },
      'deluxe': { icon: '✨', label: 'Deluxe', color: '#EC4899' },
      'express': { icon: '⚡', label: 'Express', color: '#EF4444' }
    };
    return types[type as keyof typeof types] || types['non-ac-seater'];
  };

  const getAvailabilityInfo = (availability: string) => {
    const statuses = {
      'available': { color: '#10B981', label: 'Available', pulse: false },
      'filling-fast': { color: '#F59E0B', label: 'Filling Fast', pulse: true },
      'full': { color: '#EF4444', label: 'Full', pulse: false }
    };
    return statuses[availability as keyof typeof statuses] || statuses['available'];
  };

  const busTypeInfo = getBusTypeInfo(bus.busType || 'non-ac-seater');
  const availabilityInfo = getAvailabilityInfo(bus.availability || 'available');

  return (
    <div
      className={`premium-bus-card ${isSelected ? 'selected' : ''} ${viewMode}-view ${
        isCompact ? 'compact' : ''
      }`}
      onClick={onClick}
      style={{ animationDelay: `${animationDelay}s` }}
    >
      {/* Selection Indicator */}
      {isSelected && <div className="selection-indicator"></div>}

      {/* Bus Card Header */}
      <div className="bus-card-header">
        <div className="bus-identity-section">
          <div className="bus-type-badge" style={{ backgroundColor: busTypeInfo.color }}>
            <span className="type-icon">{busTypeInfo.icon}</span>
            <span className="type-label">{busTypeInfo.label}</span>
          </div>
          
          <div className="bus-info">
            <h3 className="bus-route-name">{bus.routeName}</h3>
            <div className="bus-meta">
              <span className="bus-number">{bus.busNumber}</span>
              <span className="operator-name">{bus.operatorName}</span>
            </div>
          </div>
        </div>

        <div className="bus-status-section">
          {bus.isLive && (
            <div className="live-tracking-badge">
              <div className="live-pulse"></div>
              <span className="live-text">LIVE</span>
            </div>
          )}
          
          <div
            className={`availability-badge ${availabilityInfo.pulse ? 'pulsing' : ''}`}
            style={{ backgroundColor: availabilityInfo.color }}
          >
            <span className="availability-text">{availabilityInfo.label}</span>
          </div>

          {bus.rating && (
            <div className="rating-badge">
              <span className="rating-star">⭐</span>
              <span className="rating-value">{bus.rating}</span>
            </div>
          )}
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="journey-timeline">
        <div className="timeline-point departure">
          <div className="point-indicator departure-point"></div>
          <div className="point-details">
            <div className="point-time">{bus.departureTime}</div>
            <div className="point-location">{bus.route?.[0] || 'Origin'}</div>
          </div>
        </div>

        <div className="timeline-connector">
          <div className="connector-line">
            <div className="line-fill" style={{ animationDelay: `${animationDelay + 0.5}s` }}></div>
          </div>
          <div className="duration-chip">
            <span className="duration-icon">⏱️</span>
            <span className="duration-text">{bus.duration}</span>
          </div>
          {bus.route && bus.route.length > 2 && (
            <div className="intermediate-stops">
              <span className="stops-count">+{bus.route.length - 2}</span>
              <span className="stops-label">{t('busList.stops', 'stops')}</span>
            </div>
          )}
        </div>

        <div className="timeline-point arrival">
          <div className="point-indicator arrival-point"></div>
          <div className="point-details">
            <div className="point-time">{bus.arrivalTime}</div>
            <div className="point-location">{bus.route?.[bus.route.length - 1] || 'Destination'}</div>
          </div>
        </div>
      </div>

      {/* Bus Details Grid */}
      <div className="bus-details-grid">
        <div className="detail-card seats">
          <div className="detail-icon">💺</div>
          <div className="detail-content">
            <div className="detail-value">{bus.seatsAvailable}/{bus.totalSeats}</div>
            <div className="detail-label">{t('busList.seatsAvailable', 'Seats')}</div>
          </div>
        </div>

        <div className="detail-card price">
          <div className="detail-icon">💰</div>
          <div className="detail-content">
            <div className="detail-value">₹{bus.fare}</div>
            <div className="detail-label">{t('busList.fare', 'Fare')}</div>
          </div>
        </div>

        <div className="detail-card amenities">
          <div className="detail-icon">🛡️</div>
          <div className="detail-content">
            <div className="detail-value">{bus.amenities?.length || 0}</div>
            <div className="detail-label">{t('busList.amenities', 'Amenities')}</div>
          </div>
        </div>
      </div>

      {/* Amenities Preview */}
      {bus.amenities && bus.amenities.length > 0 && (
        <div className="amenities-preview">
          {bus.amenities.slice(0, 4).map((amenity) => {
            const amenityIcons = {
              'wifi': '📶',
              'charging-port': '🔌',
              'gps-tracking': '📡',
              'entertainment': '📺',
              'refreshments': '🥤',
              'emergency-contact': '🆘'
            };
            const icon = amenityIcons[amenity as keyof typeof amenityIcons] || '✓';
            
            return (
              <div key={amenity} className="amenity-chip">
                <span className="amenity-icon">{icon}</span>
                <span className="amenity-name">
                  {t(`amenities.${amenity}`, amenity.replace('-', ' '))}
                </span>
              </div>
            );
          })}
          {bus.amenities.length > 4 && (
            <div className="amenity-chip more">
              <span className="more-count">+{bus.amenities.length - 4}</span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="bus-actions">
        <button
          className="action-btn primary book-btn"
          onClick={onBook}
          disabled={bus.availability === 'full'}
        >
          <span className="btn-icon">🎫</span>
          <span className="btn-text">
            {bus.availability === 'full' 
              ? t('busList.soldOut', 'Sold Out')
              : t('busList.bookNow', 'Book Now')
            }
          </span>
          {bus.availability === 'filling-fast' && <div className="urgency-indicator"></div>}
        </button>

        <button className="action-btn secondary details-btn" onClick={onToggleDetails}>
          <span className="btn-icon">{isExpanded ? '▲' : '▼'}</span>
          <span className="btn-text">{t('busList.details', 'Details')}</span>
        </button>

        <button className="action-btn tertiary track-btn" title={t('busList.trackBus', 'Track Bus')}>
          <span className="btn-icon">📍</span>
        </button>

        <button className="action-btn tertiary share-btn" title={t('busList.share', 'Share')}>
          <span className="btn-icon">📤</span>
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="expanded-details">
          <div className="details-tabs">
            <div className="tab-content">
              {/* Route Stops */}
              <div className="stops-section">
                <h4 className="section-title">
                  <span className="section-icon">🗺️</span>
                  {t('busList.routeStops', 'Route & Stops')}
                </h4>
                <div className="route-stops-list">
                  {bus.route?.map((stop, index) => (
                    <div key={index} className="route-stop-item">
                      <div className="stop-marker">{index + 1}</div>
                      <div className="stop-info">
                        <div className="stop-name">{stop}</div>
                        <div className="stop-time">
                          {index === 0 
                            ? bus.departureTime
                            : index === bus.route!.length - 1
                            ? bus.arrivalTime
                            : `+${index * 30}m`
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Amenities */}
              <div className="all-amenities-section">
                <h4 className="section-title">
                  <span className="section-icon">🛡️</span>
                  {t('busList.allAmenities', 'All Amenities')}
                </h4>
                <div className="all-amenities-grid">
                  {bus.amenities?.map((amenity) => {
                    const amenityIcons = {
                      'wifi': '📶',
                      'charging-port': '🔌',
                      'gps-tracking': '📡',
                      'entertainment': '📺',
                      'refreshments': '🥤',
                      'emergency-contact': '🆘'
                    };
                    const icon = amenityIcons[amenity as keyof typeof amenityIcons] || '✓';
                    
                    return (
                      <div key={amenity} className="amenity-item">
                        <span className="amenity-icon">{icon}</span>
                        <span className="amenity-name">
                          {t(`amenities.${amenity}`, amenity.replace('-', ' '))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Operator Info */}
              <div className="operator-section">
                <h4 className="section-title">
                  <span className="section-icon">🏢</span>
                  {t('busList.operatorInfo', 'Operator Information')}
                </h4>
                <div className="operator-details">
                  <div className="operator-name">{bus.operatorName}</div>
                  {bus.rating && (
                    <div className="operator-rating">
                      <span className="rating-stars">
                        {'⭐'.repeat(Math.floor(bus.rating))}
                      </span>
                      <span className="rating-text">{bus.rating}/5</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedBusList;