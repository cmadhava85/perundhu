import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import TransitBusCard from './TransitBusCard';
import type { Bus, Stop, Location as AppLocation } from '../types';
import '../styles/transit-design-system.css';
import '../styles/transit-bus-list-responsive.css';

// Filter and sort types
type SortOption = 'departure' | 'arrival' | 'duration' | 'price' | 'rating';

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
  toLocationObj
}) => {
  const { t } = useTranslation();
  
  // State management
  const [sortBy, setSortBy] = useState<SortOption>('departure');
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

  // Calculate price range
  const priceRange = useMemo(() => {
    const prices = buses.map(bus => bus.fare || 0).filter(p => p > 0);
    return prices.length > 0 ? [Math.min(...prices), Math.max(...prices)] : [0, 2000];
  }, [buses]);

  // Filter and sort buses
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

    // Sort buses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'departure':
          return (a.departureTime || '00:00').localeCompare(b.departureTime || '00:00');
        case 'arrival':
          return (a.arrivalTime || '00:00').localeCompare(b.arrivalTime || '00:00');
        case 'price':
          return (a.fare || 0) - (b.fare || 0);
        case 'duration': {
          const getDuration = (bus: Bus) => {
            if (!bus.departureTime || !bus.arrivalTime) return 0;
            const [depH, depM] = bus.departureTime.split(':').map(Number);
            const [arrH, arrM] = bus.arrivalTime.split(':').map(Number);
            return (arrH * 60 + arrM) - (depH * 60 + depM);
          };
          return getDuration(a) - getDuration(b);
        }
        case 'rating':
          return 4.5 - 4.2; // Mock ratings
        default:
          return 0;
      }
    });

    return filtered;
  }, [buses, searchQuery, filters, sortBy]);

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
    setSortBy(option);
  };

  if (buses.length === 0) {
    return (
      <div className="container-sm" style={{ paddingTop: 'var(--space-8)' }}>
        <div className="transit-card elevated" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🚌</div>
          <h3 className="text-title-2" style={{ marginBottom: 'var(--space-2)' }}>
            No buses found
          </h3>
          <p className="text-body" style={{ color: 'var(--transit-text-secondary)', marginBottom: 'var(--space-4)' }}>
            We couldn't find any buses for your selected route.
          </p>
          <div className="stack stack-sm" style={{ maxWidth: '300px', margin: '0 auto' }}>
            <div className="text-caption">Suggestions:</div>
            <ul style={{ textAlign: 'left', color: 'var(--transit-text-secondary)' }}>
              <li>Try searching for nearby locations</li>
              <li>Check different times of day</li>
              <li>Contact support for assistance</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="transit-app">
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
                <div className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 bg-blue-100 text-blue-800 text-xs sm:text-sm font-semibold rounded-md whitespace-nowrap self-start sm:self-auto">
                  {filteredAndSortedBuses.length} {filteredAndSortedBuses.length === 1 ? 'bus' : 'buses'}
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
            </div>

            {/* Controls Section */}
            <div className="bus-list-controls-section">
              {/* Search and Filter Row - Mobile-First Design */}
              <div className="flex items-center gap-2 sm:gap-3 w-full mb-3 sm:mb-4">
                <div className="flex-1 relative min-w-0">
                  <input
                    type="text"
                    placeholder="Search buses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 hover:border-gray-400"
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
                  <span className="hidden sm:inline font-medium">Filter</span>
                </button>
              </div>

              {/* Sort Controls Row - Mobile-Optimized Design with Text Labels */}
              <div className="flex items-center gap-1.5 sm:gap-3 pt-2.5 sm:pt-4 border-t border-gray-200 overflow-x-auto">
                <span className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap flex-shrink-0">
                  Sort:
                </span>
                <div className="flex gap-1 sm:gap-2 min-w-0">
                  {[
                    { key: 'departure', label: 'Departure', shortLabel: 'Dep', icon: '🕐' },
                    { key: 'arrival', label: 'Arrival', shortLabel: 'Arr', icon: '🏁' },
                    { key: 'duration', label: 'Duration', shortLabel: 'Time', icon: '⏱️' }
                  ].map(({ key, label, shortLabel, icon }) => (
                    <button
                      key={key}
                      className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap flex-shrink-0 border min-w-[44px] sm:min-w-auto
                        ${sortBy === key 
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                      onClick={() => handleSort(key as SortOption)}
                    >
                      <span className="hidden md:inline text-sm">{icon}</span>
                      <span className="inline sm:hidden text-xs font-semibold">{shortLabel}</span>
                      <span className="hidden sm:inline text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Filters Panel - Inside unified container */}
              {showFilters && (
                <div className="filters-panel" style={{ 
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
                    🔧 Filters
                  </h3>
                  
                  <div className="stack stack-md">
                    {/* Bus Types */}
                    <div>
                      <div className="text-caption" style={{ 
                        marginBottom: 'var(--space-2)',
                        fontWeight: 'var(--font-medium)',
                        color: 'var(--transit-text-secondary)'
                      }}>
                        Bus Types
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
                        Quick Filters
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
                          ⚡ Express Only
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
                          ♿ Accessible
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
                        Price Range: ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
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
            console.log(`TransitBusList: Bus ${bus.id} stops from map:`, stopsMap[bus.id]);
            console.log(`TransitBusList: Bus ${bus.id} filtered stops:`, stops.filter(stop => stop.busId === bus.id));
            console.log(`TransitBusList: Bus ${bus.id} final stops:`, busStops);
            
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