import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import TransitBusCard from './TransitBusCard';
import type { Bus, Stop, Location as AppLocation } from '../types';
import '../styles/transit-design-system.css';
import '../styles/bus-list-clean-redesign.css';

// Filter and sort types
type SortOption = 'departure' | 'arrival' | 'duration' | 'price' | 'rating';
type SortDirection = 'asc' | 'desc';

interface FilterOptions {
  busTypes: string[];
  priceRange: [number, number];
  timeRange: string;
  accessibility: boolean;
  express: boolean;
}

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
  onAddStops
}) => {
  const { t } = useTranslation();
  
  // State management
  const [sortBy, setSortBy] = useState<SortOption>('departure');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filters, setFilters] = useState<FilterOptions>({
    busTypes: [],
    priceRange: [0, 2000],
    timeRange: 'all',
    accessibility: false,
    express: false
  });

  // Get available bus types
  const busTypes = useMemo(() => {
    const types = [...new Set(buses.map(bus => bus.category || 'Regular').filter(Boolean))];
    return types;
  }, [buses]);

  // Utility functions for sorting
  const getTimeInMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };

  const getDurationInMinutes = (bus: Bus): number => {
    if (!bus.departureTime || !bus.arrivalTime) return 480; // Default 8 hours
    const [depH, depM] = bus.departureTime.split(':').map(Number);
    const [arrH, arrM] = bus.arrivalTime.split(':').map(Number);
    
    let totalMinutes = (arrH * 60 + arrM) - (depH * 60 + depM);
    
    // Handle overnight journeys
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60; // Add 24 hours
    }
    
    return totalMinutes;
  };

  const getBusQualityScore = (category: string): number => {
    const cat = category.toLowerCase();
    if (cat.includes('deluxe') || cat.includes('luxury')) return 5;
    if (cat.includes('express') || cat.includes('superfast')) return 4;
    if (cat.includes('semi') || cat.includes('sleeper')) return 3;
    if (cat.includes('ac')) return 2;
    return 1;
  };

  const sortByDeparture = (a: Bus, b: Bus): number => {
    const timeA = a.departureTime || '00:00';
    const timeB = b.departureTime || '00:00';
    
    const minutesA = getTimeInMinutes(timeA);
    const minutesB = getTimeInMinutes(timeB);
    
    // If times are very close (within 15 minutes), sort by bus quality/rating
    if (Math.abs(minutesA - minutesB) <= 15) {
      const ratingA = a.rating || 4;
      const ratingB = b.rating || 4;
      return ratingB - ratingA; // Higher rating first
    }
    
    return sortDirection === 'asc' ? minutesA - minutesB : minutesB - minutesA;
  };

  const sortByArrival = (a: Bus, b: Bus): number => {
    const timeA = a.arrivalTime || '23:59';
    const timeB = b.arrivalTime || '23:59';
    
    const minutesA = getTimeInMinutes(timeA);
    const minutesB = getTimeInMinutes(timeB);
    
    // If arrival times are close, prefer shorter duration
    if (Math.abs(minutesA - minutesB) <= 15) {
      const durationA = getDurationInMinutes(a);
      const durationB = getDurationInMinutes(b);
      return durationA - durationB;
    }
    
    return sortDirection === 'asc' ? minutesA - minutesB : minutesB - minutesA;
  };

  const sortByPrice = (a: Bus, b: Bus): number => {
    const fareA = a.fare || Number.MAX_SAFE_INTEGER;
    const fareB = b.fare || Number.MAX_SAFE_INTEGER;
    
    // If prices are very similar (within ₹50), prefer better ratings
    if (Math.abs(fareA - fareB) <= 50) {
      const ratingA = a.rating || 4;
      const ratingB = b.rating || 4;
      return ratingB - ratingA;
    }
    
    return sortDirection === 'asc' ? fareA - fareB : fareB - fareA;
  };

  const sortByDuration = (a: Bus, b: Bus): number => {
    const durationA = getDurationInMinutes(a);
    const durationB = getDurationInMinutes(b);
    
    // If durations are similar (within 30 minutes), prefer better amenities
    if (Math.abs(durationA - durationB) <= 30) {
      const categoryA = a.category || '';
      const categoryB = b.category || '';
      
      const scoreA = getBusQualityScore(categoryA);
      const scoreB = getBusQualityScore(categoryB);
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Higher quality first
      }
    }
    
    return sortDirection === 'asc' ? durationA - durationB : durationB - durationA;
  };

  const sortByRating = (a: Bus, b: Bus): number => {
    const ratingA = a.rating || 4;
    const ratingB = b.rating || 4;
    
    // If ratings are similar, prefer more reasonable price
    if (Math.abs(ratingA - ratingB) <= 0.2) {
      const fareA = a.fare || 0;
      const fareB = b.fare || 0;
      
      if (fareA > 0 && fareB > 0) {
        return fareA - fareB; // Lower price among similar ratings
      }
    }
    
    return sortDirection === 'asc' ? ratingA - ratingB : ratingB - ratingA;
  };

  // Calculate price range
  const priceRange = useMemo(() => {
    const prices = buses.map(bus => bus.fare || 0).filter(p => p > 0);
    return prices.length > 0 ? [Math.min(...prices), Math.max(...prices)] : [0, 2000];
  }, [buses]);

  // Find special buses: next bus, fastest, cheapest
  const specialBuses = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    let nextBusId: number | null = null;
    let fastestBusId: number | null = null;
    let cheapestBusId: number | null = null;
    let minTimeUntilDeparture = Infinity;
    let minDuration = Infinity;
    let minFare = Infinity;
    
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
      
      // Find cheapest bus
      if (bus.fare && bus.fare > 0 && bus.fare < minFare) {
        minFare = bus.fare;
        cheapestBusId = bus.id;
      }
    }
    
    return { nextBusId, fastestBusId, cheapestBusId };
  }, [buses]);

  // Filter and sort buses
  const filteredAndSortedBuses = useMemo(() => {
    const filtered = buses.filter(bus => {
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

      // Bus type filter
      if (filters.busTypes.length > 0) {
        if (!filters.busTypes.includes(bus.category || 'Regular')) {
          return false;
        }
      }

      // Price filter
      if (bus.fare && (bus.fare < filters.priceRange[0] || bus.fare > filters.priceRange[1])) {
        return false;
      }

      // Express filter
      if (filters.express) {
        const category = (bus.category || '').toLowerCase();
        if (!category.includes('express') && !category.includes('superfast')) {
          return false;
        }
      }

      return true;
    });

    // Sort buses with improved logic using helper functions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'departure':
          return sortByDeparture(a, b);
        case 'arrival':
          return sortByArrival(a, b);
        case 'price':
          return sortByPrice(a, b);
        case 'duration':
          return sortByDuration(a, b);
        case 'rating':
          return sortByRating(a, b);
        default:
          return 0;
      }
    });

    return filtered;
  }, [buses, searchQuery, filters, sortBy, sortDirection]);

  // Handle filter changes
  const handleBusTypeToggle = (type: string) => {
    setFilters(prev => ({
      ...prev,
      busTypes: prev.busTypes.includes(type)
        ? prev.busTypes.filter(t => t !== type)
        : [...prev.busTypes, type]
    }));
  };

  // Handle sorting
  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      // Toggle direction if same option is clicked
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort option with appropriate default direction
      setSortBy(option);
      // Set sensible defaults for each sort type
      const defaultDirection = ['rating'].includes(option) ? 'desc' : 'asc';
      setSortDirection(defaultDirection);
    }
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  if (buses.length === 0) {
    // Check if either location was a user-input (not from database)
    const isFromUserInput = fromLocationObj?.source === 'user-input' || fromLocationObj?.id === -1;
    const isToUserInput = toLocationObj?.source === 'user-input' || toLocationObj?.id === -1;
    const hasInvalidLocation = isFromUserInput || isToUserInput;
    
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
              t('busList.noBusesMessage', "We couldn't find any buses for your selected route.")
            )}
          </p>
          <div className="stack stack-sm" style={{ maxWidth: '300px', margin: '0 auto' }}>
            <div className="text-caption">{t('busList.suggestions', 'Suggestions:')}</div>
            <ul style={{ textAlign: 'left', color: 'var(--transit-text-secondary)' }}>
              {hasInvalidLocation ? (
                <>
                  <li>{t('busList.suggestionSelectFromList', 'Select a location from the dropdown suggestions')}</li>
                  <li>{t('busList.suggestionCheckSpelling', 'Check the spelling of your location')}</li>
                  <li>{t('busList.suggestionNearby', 'Try searching for nearby locations')}</li>
                </>
              ) : (
                <>
                  <li>{t('busList.suggestionNearby', 'Try searching for nearby locations')}</li>
                  <li>{t('busList.suggestionTimes', 'Check different times of day')}</li>
                  <li>{t('busList.suggestionSupport', 'Contact support for assistance')}</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="transit-app transit-bus-list">
      <div className="container px-2 sm:px-4">
        {/* Unified Header + Controls Container */}
        {showTitle && (
          <div className="bus-list-unified-container bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-6 mb-3 sm:mb-6 shadow-sm">
            
            {/* Header Section with Title and Route Info */}
            <div className="bus-list-header-section flex flex-col gap-2 sm:gap-4 mb-3 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200">
              {/* Title and Bus Count */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 m-0">
                  {t('busList.title', 'Available Buses')}
                </h1>
                <div className="bus-count-badge-enhanced inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 bg-blue-100 text-blue-800 text-xs sm:text-sm font-semibold rounded-md whitespace-nowrap self-start sm:self-auto">
                  {filteredAndSortedBuses.length} {filteredAndSortedBuses.length === 1 ? t('busList.bus', 'bus') : t('busList.buses', 'buses')}
                </div>
              </div>

              {/* Route Info */}
              {fromLocation && toLocation && (
                <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base font-medium text-gray-900 text-center flex-wrap">
                    <span className="text-gray-500">📍</span>
                    <span className="truncate max-w-[120px] sm:max-w-none">{fromLocation}</span>
                    <span className="text-blue-600 font-bold">→</span>
                    <span className="truncate max-w-[120px] sm:max-w-none">{toLocation}</span>
                    <span className="text-gray-500">🎯</span>
                  </div>
                </div>
              )}

              {/* Smart Sorting Info Badge */}
              <div className="flex items-center justify-center gap-2 mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-blue-600 text-xs sm:text-sm">🎯</span>
                <span className="text-blue-700 text-xs sm:text-sm font-medium">
                  {t('busList.smartSorted', 'Sorted by time - upcoming buses shown first')}
                </span>
              </div>

              {/* Legend for badges */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span style={{ color: '#10B981' }}>🚀</span> Next departing</span>
                <span className="flex items-center gap-1"><span style={{ color: '#8B5CF6' }}>⚡</span> Fastest route</span>
                <span className="flex items-center gap-1"><span style={{ color: '#F59E0B' }}>💰</span> Best value</span>
              </div>
            </div>

            {/* Controls Section */}
            <div className="bus-list-controls-section">
              {/* Search and Filter Row - Mobile-First Design */}
              <div className="flex items-center gap-2 sm:gap-3 w-full mb-3 sm:mb-4">
                <div className="flex-1 relative min-w-0">
                  <input
                    type="text"
                    placeholder={t('busList.searchPlaceholder', 'Search buses...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bus-search-input-enhanced w-full pl-8 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 hover:border-gray-400"
                    style={{ fontSize: '16px' }} // Prevents zoom on iOS
                  />
                  <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-base sm:text-lg">🔍</span>
                  </div>
                </div>
                <button
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2.5 sm:py-3 text-sm font-semibold rounded-lg transition-all duration-200 border flex-shrink-0 min-w-[48px] sm:min-w-[70px]
                    ${showFilters 
                      ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <span className="text-sm sm:text-base">🔧</span>
                  <span className="hidden sm:inline font-medium">{t('busList.filter', 'Filter')}</span>
                </button>
              </div>

              {/* Sort Controls Row - Enhanced Mobile-Optimized Design */}
              <div className="bus-sort-controls flex items-center gap-1.5 sm:gap-3 pt-2.5 sm:pt-4 border-t border-gray-200 overflow-x-auto">
                <span className="sort-label">
                  {t('busList.sort', 'Sort:')}
                </span>
                <div className="sort-buttons-container">
                  {[
                    { key: 'departure', label: t('busList.sortDeparture', 'Departure'), shortLabel: t('busList.sortDepartureShort', 'Dep'), icon: '🕐', description: t('busList.sortDepartureDesc', 'Earliest first') },
                    { key: 'arrival', label: t('busList.sortArrival', 'Arrival'), shortLabel: t('busList.sortArrivalShort', 'Arr'), icon: '🏁', description: t('busList.sortArrivalDesc', 'Shortest journey') },
                    { key: 'duration', label: t('busList.sortDuration', 'Duration'), shortLabel: t('busList.sortDurationShort', 'Time'), icon: '⏱️', description: t('busList.sortDurationDesc', 'Fastest route') },
                    { key: 'price', label: t('busList.sortPrice', 'Price'), shortLabel: '₹', icon: '💰', description: t('busList.sortPriceDesc', 'Best value') },
                    { key: 'rating', label: t('busList.sortRating', 'Rating'), shortLabel: '⭐', icon: '⭐', description: t('busList.sortRatingDesc', 'Top rated') }
                  ].map(({ key, label, shortLabel, icon, description }) => (
                    <button
                      key={key}
                      className={`sort-option-btn group ${sortBy === key ? 'sort-active' : ''}`}
                      onClick={() => handleSort(key as SortOption)}
                      title={`Sort by ${label.toLowerCase()} - ${description}`}
                    >
                      {/* Show icon on desktop, text on all sizes */}
                      <span className="sort-icon hidden md:inline">{icon}</span>
                      <span className="sort-text-mobile inline sm:hidden">{shortLabel}</span>
                      <span className="sort-text-desktop hidden sm:inline">{label}</span>
                      
                      {/* Tooltip for mobile - simplified */}
                      <div className="tooltip-content absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 sm:hidden">
                        {description}
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Sort order toggle */}
                <button
                  className="sort-direction-toggle"
                  onClick={toggleSortDirection}
                  title={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
                >
                  <span className={`sort-direction-arrow ${sortDirection === 'desc' ? 'direction-desc' : ''}`}>
                    ↑
                  </span>
                </button>
              </div>

              {/* Filters Panel - Inside unified container */}
              {showFilters && (
                <div className="bus-filters-panel-enhanced" style={{ 
                  marginTop: 'var(--space-4)',
                  paddingTop: 'var(--space-4)',
                  borderTop: '1px solid var(--transit-divider)',
                  backgroundColor: 'var(--transit-surface-elevated)',
                  margin: '0 calc(-1 * var(--space-4))',
                  padding: 'var(--space-4)',
                  borderRadius: '0 0 var(--radius-lg) var(--radius-lg)'
                }}>
                  <h3 className="text-headline" style={{ 
                    marginBottom: 'var(--space-4)',
                    fontSize: 'var(--text-lg)',
                    color: 'var(--transit-text-primary)'
                  }}>
                    🔧 {t('busList.filters', 'Filters')}
                  </h3>
                  
                  <div className="stack stack-md">
                    {/* Bus Types */}
                    <div>
                      <div className="text-caption" style={{ 
                        marginBottom: 'var(--space-2)',
                        fontWeight: 'var(--font-medium)',
                        color: 'var(--transit-text-secondary)'
                      }}>
                        {t('busList.busTypes', 'Bus Types')}
                      </div>
                      <div className="row row-sm" style={{ flexWrap: 'wrap' }}>
                        {busTypes.map(type => (
                          <button
                            key={type}
                            className={`transit-button ${filters.busTypes.includes(type) ? 'primary' : 'secondary'}`}
                            onClick={() => handleBusTypeToggle(type)}
                            style={{ 
                              padding: 'var(--space-2) var(--space-3)', 
                              fontSize: 'var(--text-sm)',
                              minWidth: 'auto',
                              borderRadius: 'var(--radius-sm)'
                            }}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Filters */}
                    <div>
                      <div className="text-caption" style={{ 
                        marginBottom: 'var(--space-2)',
                        fontWeight: 'var(--font-medium)',
                        color: 'var(--transit-text-secondary)'
                      }}>
                        {t('busList.quickFilters', 'Quick Filters')}
                      </div>
                      <div className="row row-sm" style={{ flexWrap: 'wrap' }}>
                        <button
                          className={`transit-button ${filters.express ? 'primary' : 'secondary'}`}
                          onClick={() => setFilters(prev => ({ ...prev, express: !prev.express }))}
                          style={{ 
                            padding: 'var(--space-2) var(--space-3)', 
                            fontSize: 'var(--text-sm)',
                            minWidth: 'auto',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          ⚡ {t('busList.expressOnly', 'Express Only')}
                        </button>
                        <button
                          className={`transit-button ${filters.accessibility ? 'primary' : 'secondary'}`}
                          onClick={() => setFilters(prev => ({ ...prev, accessibility: !prev.accessibility }))}
                          style={{ 
                            padding: 'var(--space-2) var(--space-3)', 
                            fontSize: 'var(--text-sm)',
                            minWidth: 'auto',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          ♿ {t('busList.accessible', 'Accessible')}
                        </button>
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <div className="text-caption" style={{ 
                        marginBottom: 'var(--space-2)',
                        fontWeight: 'var(--font-medium)',
                        color: 'var(--transit-text-secondary)'
                      }}>
                        {t('busList.priceRange', 'Price Range')}: ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
                      </div>
                      <input
                        type="range"
                        min={priceRange[0]}
                        max={priceRange[1]}
                        value={filters.priceRange[1]}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          priceRange: [prev.priceRange[0], Number(e.target.value)]
                        }))}
                        style={{ 
                          width: '100%',
                          height: '6px',
                          borderRadius: '3px',
                          background: 'var(--transit-divider)',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bus Cards List */}
        <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
          {filteredAndSortedBuses.map((bus) => {
            const busStops = stopsMap[bus.id] || stops.filter(stop => stop.busId === bus.id);
            
            return (
              <TransitBusCard
                key={bus.id}
                bus={bus}
                selectedBusId={selectedBusId || null}
                stops={busStops}
                onSelectBus={(busId: number) => {
                  const selectedBus = buses.find(b => b.id === busId);
                  if (selectedBus && onSelectBus) {
                    onSelectBus(selectedBus);
                  }
                }}
                fromLocation={fromLocationObj}
                toLocation={toLocationObj}
                isCompact={true}
                isNextBus={bus.id === specialBuses.nextBusId}
                isFastest={bus.id === specialBuses.fastestBusId}
                isCheapest={bus.id === specialBuses.cheapestBusId}
                onAddStops={onAddStops}
              />
            );
          })}
        </div>

        {/* Results Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mt-4 sm:mt-6 text-center">
          <div className="space-y-2 sm:space-y-3">
            <div className="text-sm font-medium text-gray-600">Journey Summary</div>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-sm">
              <div>
                <strong className="text-blue-600">{filteredAndSortedBuses.length}</strong> buses available
              </div>
              <div>
                <strong className="text-blue-600">{busTypes.length}</strong> service types
              </div>
              {priceRange[1] > 0 && (
                <div>
                  ₹<strong className="text-blue-600">{priceRange[0]}</strong> - ₹<strong className="text-blue-600">{priceRange[1]}</strong> fare range
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
              <span>ℹ️</span>
              <span>Times are estimated. Arrive 10 minutes early for boarding.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TransitBusList);