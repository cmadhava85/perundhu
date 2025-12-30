import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import BusItem from './bus-list/BusItem';
import BusListFilters from './bus-list/BusListFilters';
import type { Bus, Stop, Location as AppLocation } from '../types';
import '../styles/transit-design-system.css';
import '../styles/bus-list-clean-redesign.css';
import '../styles/bus-card.css';

interface TransitBusListProps {
  buses: Bus[];
  selectedBusId?: number | null;
  stopsMap?: Record<number, Stop[]>;
  stops?: Stop[];
  onSelectBus?: (bus: Bus) => void;
  showTitle?: boolean;
  fromLocation?: string;
  toLocation?: string;
  fromLocationObj?: AppLocation;
  toLocationObj?: AppLocation;
  onAddStops?: (bus: Bus) => void;
  onReportIssue?: (bus: Bus) => void;
  hasConnectingRoutes?: boolean;
}

const TransitBusList: React.FC<TransitBusListProps> = ({
  buses,
  selectedBusId,
  stopsMap = {},
  stops = [],
  onSelectBus,
  showTitle = true,
  fromLocation,
  toLocation,
  fromLocationObj,
  toLocationObj,
  onAddStops,
  onReportIssue,
  hasConnectingRoutes = false
}) => {
  const { t } = useTranslation();
  
  // Simplified state management matching BusListFilters
  const [sortBy, setSortBy] = useState<'fastest' | 'cheapest' | 'earliest' | 'latest'>('earliest');
  const [filterBy, setFilterBy] = useState<'all' | 'government' | 'private'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get available bus types (for summary)
  const busTypes = useMemo(() => {
    const types = [...new Set(buses.map(bus => bus.category || 'Regular').filter(Boolean))];
    return types;
  }, [buses]);

  // Find special buses: next bus, fastest
  const specialBuses = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    let nextBusId: number | null = null;
    let fastestBusId: number | null = null;
    let minTimeUntilDeparture = Infinity;
    let minDuration = Infinity;
    
    for (const bus of buses) {
      // Find next bus (soonest upcoming departure)
      if (bus.departureTime) {
        const [hours, minutes] = bus.departureTime.split(':').map(Number);
        const busMinutes = hours * 60 + minutes;
        const timeUntil = busMinutes - currentMinutes;
        
        // Only consider buses that haven't departed yet
        if (timeUntil >= 0 && timeUntil < minTimeUntilDeparture) {
          minTimeUntilDeparture = timeUntil;
          nextBusId = bus.id;
        }
      }
      
      // Find fastest bus (shortest duration)
      if (bus.departureTime && bus.arrivalTime) {
        const [depH, depM] = bus.departureTime.split(':').map(Number);
        const [arrH, arrM] = bus.arrivalTime.split(':').map(Number);
        let duration = (arrH * 60 + arrM) - (depH * 60 + depM);
        if (duration < 0) duration += 24 * 60; // Handle overnight
        
        if (duration > 0 && duration < minDuration) {
          minDuration = duration;
          fastestBusId = bus.id;
        }
      }
    }
    
    return { nextBusId, fastestBusId };
  }, [buses]);

  // Filter and sort buses with simplified logic
  const filteredAndSortedBuses = useMemo(() => {
    let filtered = buses.filter(bus => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const busName = (bus.busName || '').toLowerCase();
        const busNumber = (bus.busNumber || '').toLowerCase();
        const category = (bus.category || '').toLowerCase();
        
        if (!busName.includes(query) && !busNumber.includes(query) && !category.includes(query)) {
          return false;
        }
      }

      // Operator filter (government/private)
      if (filterBy !== 'all') {
        const category = (bus.category || '').toLowerCase();
        if (filterBy === 'government') {
          // Government buses typically include: TNSTC, SETC, APSRTC, etc.
          if (!category.includes('tnstc') && !category.includes('setc') && !category.includes('government')) {
            return false;
          }
        } else if (filterBy === 'private') {
          // Private buses
          if (category.includes('tnstc') || category.includes('setc') || category.includes('government')) {
            return false;
          }
        }
      }

      return true;
    });

    // Sort buses
    filtered.sort((a, b) => {
      const getDuration = (bus: Bus) => {
        if (!bus.departureTime || !bus.arrivalTime) return 0;
        const [depH, depM] = bus.departureTime.split(':').map(Number);
        const [arrH, arrM] = bus.arrivalTime.split(':').map(Number);
        let duration = (arrH * 60 + arrM) - (depH * 60 + depM);
        if (duration < 0) duration += 24 * 60;
        return duration;
      };

      const getTimeInMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };

      switch (sortBy) {
        case 'fastest':
          return getDuration(a) - getDuration(b);
        case 'cheapest':
          // Sort by fare if available, otherwise by duration
          if (a.fare && b.fare) return a.fare - b.fare;
          return getDuration(a) - getDuration(b);
        case 'earliest':
          return getTimeInMinutes(a.departureTime) - getTimeInMinutes(b.departureTime);
        case 'latest':
          return getTimeInMinutes(b.departureTime) - getTimeInMinutes(a.departureTime);
        default:
          return 0;
      }
    });

    return filtered;
  }, [buses, searchQuery, filterBy, sortBy]);

  // Memoized callback for bus selection to prevent re-renders
  const handleBusSelect = useCallback((bus: Bus) => {
    if (onSelectBus) {
      onSelectBus(bus);
    }
  }, [onSelectBus]);

  if (buses.length === 0) {
    // Check if either location was a user-input (not from database)
    const isFromUserInput = fromLocationObj?.source === 'user-input' || fromLocationObj?.id === -1;
    const isToUserInput = toLocationObj?.source === 'user-input' || toLocationObj?.id === -1;
    const hasInvalidLocation = isFromUserInput || isToUserInput;
    
    // If connecting routes exist, show a compact message instead of large empty state
    if (hasConnectingRoutes && !hasInvalidLocation) {
      return (
        <div className="container-sm" style={{ paddingTop: 'var(--space-4)' }}>
          <div className="transit-card" style={{ 
            textAlign: 'center', 
            padding: 'var(--space-4) var(--space-6)',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: '1px solid #bae6fd',
            borderRadius: '12px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
              <div>
                <p className="text-body" style={{ 
                  color: '#0369a1', 
                  margin: 0,
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}>
                  {t('busList.noDirectBuses', 'No direct buses available.')}
                </p>
                <p className="text-caption" style={{ 
                  color: '#0c4a6e', 
                  margin: '4px 0 0 0',
                  fontSize: '0.85rem'
                }}>
                  {t('busList.seeConnectingAbove', 'See connecting routes above with transfers.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="container-sm" style={{ paddingTop: 'var(--space-8)' }}>
        <div className="transit-card elevated" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>
            {hasInvalidLocation ? '🔍' : '🚌'}
          </div>
          <h3 className="text-title-2" style={{ marginBottom: 'var(--space-2)', color: 'var(--transit-error, #EF4444)' }}>
            {hasInvalidLocation 
              ? t('busList.locationNotFound', 'Location Not Found')
              : t('busList.noBusesFound', 'No buses found')}
          </h3>
          <p className="text-body" style={{ color: 'var(--transit-text-secondary)', marginBottom: 'var(--space-4)' }}>
            {hasInvalidLocation ? (
              <>
                {isFromUserInput && (
                  <span style={{ display: 'block', marginBottom: '8px' }}>
                    ❌ {t('busList.originNotInDatabase', 'Origin "{{location}}" is not in our database.', { location: fromLocation })}
                  </span>
                )}
                {isToUserInput && (
                  <span style={{ display: 'block', marginBottom: '8px' }}>
                    ❌ {t('busList.destinationNotInDatabase', 'Destination "{{location}}" is not in our database.', { location: toLocation })}
                  </span>
                )}
              </>
            ) : (
              t('busList.noBusesMessage', 'Currently no bus route available for this selection.')
            )}
          </p>
          {hasInvalidLocation ? (
            <div className="stack stack-sm" style={{ maxWidth: '300px', margin: '0 auto' }}>
              <div className="text-caption">{t('busList.suggestions', 'Suggestions:')}</div>
              <ul style={{ textAlign: 'left', color: 'var(--transit-text-secondary)' }}>
                <li>{t('busList.suggestionSelectFromList', 'Select a location from the dropdown suggestions')}</li>
                <li>{t('busList.suggestionCheckSpelling', 'Check the spelling of your location')}</li>
                <li>{t('busList.suggestionNearby', 'Try searching for nearby locations')}</li>
              </ul>
            </div>
          ) : (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <p className="text-body" style={{ color: 'var(--transit-text-secondary)', marginBottom: 'var(--space-4)' }}>
                {t('busList.contributePrompt', 'If you know this route, help others by contributing the bus information.')}
              </p>
              <Link 
                to="/contribute" 
                className="transit-button transit-button-primary"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  textDecoration: 'none'
                }}
              >
                ✏️ {t('busList.contributeButton', 'Contribute Route Info')}
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="transit-app transit-bus-list">
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
        
        {/* Results Header */}
        {showTitle && (
          <div className="results-header">
            <div className="results-count">
              {filteredAndSortedBuses.length} {filteredAndSortedBuses.length === 1 ? t('busList.bus', 'bus') : t('busList.buses', 'buses')} {t('busList.found', 'found')}
            </div>
            {fromLocation && toLocation && (
              <div style={{ fontSize: '14px', color: '#6B7280' }}>
                {fromLocation} → {toLocation}
              </div>
            )}
          </div>
        )}

        {/* BusListFilters Component */}
        <BusListFilters
          sortBy={sortBy}
          filterBy={filterBy}
          onSortChange={setSortBy}
          onFilterChange={setFilterBy}
        />

        {/* Bus Cards Grid */}
        <div className="bus-grid">
          {filteredAndSortedBuses.map((bus) => {
            const busStops = stopsMap[bus.id] || stops.filter(stop => stop.busId === bus.id);
            
            return (
              <BusItem
                key={bus.id}
                bus={bus}
                isSelected={selectedBusId === bus.id}
                stops={busStops}
                onSelect={() => handleBusSelect(bus)}
                isNextBus={bus.id === specialBuses.nextBusId}
                isFastest={bus.id === specialBuses.fastestBusId}
                onAddStops={onAddStops}
                onReportIssue={onReportIssue}
                onShare={(bus) => {
                  // Share functionality can be added here
                  console.log('Share bus:', bus);
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TransitBusList);