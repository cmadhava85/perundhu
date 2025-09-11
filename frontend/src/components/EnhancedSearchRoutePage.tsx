import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import EnhancedBusList from './EnhancedBusList';
import EnhancedMapView from './EnhancedMapView';
import { useBusSearch } from '../hooks/useBusSearch';
import { searchLocationsWithGeocoding } from '../services/geocodingService';
import type { Stop, SearchFilters, Location } from '../types';
import '../styles/PremiumSearchRoutePage.css';

// Import the new smaller, reusable components
import SmartSearchForm from './search/SmartSearchForm';
import SearchStats from './search/SearchStats';
import ViewModeControls from './search/ViewModeControls';
import LoadingState from './ui/LoadingState';
import ErrorState from './ui/ErrorState';
import NoResultsState from './ui/NoResultsState';
import QuickActions from './search/QuickActions';

interface EnhancedSearchRoutePageProps {
  initialFromLocation?: string;
  initialToLocation?: string;
  onNavigateBack?: () => void;
}

const EnhancedSearchRoutePage: React.FC<EnhancedSearchRoutePageProps> = ({
  initialFromLocation = '',
  initialToLocation = '',
  onNavigateBack
}) => {
  const { t } = useTranslation();
  
  // Use the actual bus search hook
  const {
    buses,
    selectedBusId,
    stopsMap,
    loading: isLoading,
    error,
    searchBuses,
    setSelectedBusId
  } = useBusSearch();

  // State management
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    from: initialFromLocation,
    to: initialToLocation,
    date: new Date().toISOString().split('T')[0],
    busType: 'all',
    sortBy: 'departure-time'
  });

  const [fromLocation, setFromLocation] = useState<Location | null>(null);
  const [toLocation, setToLocation] = useState<Location | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'split'>('split');
  const [showFilters, setShowFilters] = useState(false);
  const [searchStats, setSearchStats] = useState({
    totalRoutes: 0,
    liveBuses: 0,
    averagePrice: 0,
    fastestDuration: ''
  });

  // Location search state
  const [fromSuggestions, setFromSuggestions] = useState<Location[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Location[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  // Calculate search statistics with null safety
  useEffect(() => {
    if (buses.length > 0) {
      const liveBusesCount = buses.filter(b => b.isLive).length;
      const totalPrice = buses.reduce((sum, bus) => sum + (bus.fare || 0), 0);
      const averagePrice = Math.round(totalPrice / buses.length);
      const durations = buses.map(b => b.duration).filter(d => d);
      const fastestDuration = durations.sort()[0] || '';

      setSearchStats({
        totalRoutes: buses.length,
        liveBuses: liveBusesCount,
        averagePrice,
        fastestDuration
      });
    }
  }, [buses]);

  // Location search handlers
  const handleFromSearch = useCallback(async (query: string) => {
    if (query.length >= 2) {
      try {
        const suggestions = await searchLocationsWithGeocoding(query, 10);
        setFromSuggestions(suggestions);
        setShowFromSuggestions(true);
      } catch (err) {
        console.error('Error searching from locations:', err);
        setFromSuggestions([]);
      }
    } else {
      setFromSuggestions([]);
      setShowFromSuggestions(false);
    }
  }, []);

  const handleToSearch = useCallback(async (query: string) => {
    if (query.length >= 2) {
      try {
        const suggestions = await searchLocationsWithGeocoding(query, 10);
        setToSuggestions(suggestions);
        setShowToSuggestions(true);
      } catch (err) {
        console.error('Error searching to locations:', err);
        setToSuggestions([]);
      }
    } else {
      setToSuggestions([]);
      setShowToSuggestions(false);
    }
  }, []);

  // Filter and sort buses based on search criteria with null safety
  const filteredBuses = useMemo(() => {
    let filtered = [...buses];
    
    // Filter by bus type
    if (searchFilters.busType !== 'all') {
      filtered = filtered.filter(bus => bus.busType === searchFilters.busType);
    }
    
    // Sort buses with null safety
    switch (searchFilters.sortBy) {
      case 'departure-time':
        filtered.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
        break;
      case 'price-low':
        filtered.sort((a, b) => (a.fare || 0) - (b.fare || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.fare || 0) - (a.fare || 0));
        break;
      case 'duration':
        filtered.sort((a, b) => (a.duration || '').localeCompare(b.duration || ''));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        break;
    }
    
    return filtered;
  }, [buses, searchFilters.busType, searchFilters.sortBy]);

  const handleSearch = useCallback(async () => {
    if (!fromLocation || !toLocation) {
      // Try to find locations based on filter text
      if (searchFilters.from && searchFilters.to) {
        try {
          const fromQuery = typeof searchFilters.from === 'string' ? searchFilters.from : searchFilters.from.name;
          const toQuery = typeof searchFilters.to === 'string' ? searchFilters.to : searchFilters.to.name;
          
          const [fromResults, toResults] = await Promise.all([
            searchLocationsWithGeocoding(fromQuery, 1),
            searchLocationsWithGeocoding(toQuery, 1)
          ]);
          
          if (fromResults.length > 0 && toResults.length > 0) {
            setFromLocation(fromResults[0]);
            setToLocation(toResults[0]);
            await searchBuses(fromResults[0], toResults[0]);
          }
        } catch (err) {
          console.error('Error finding locations:', err);
        }
      }
      return;
    }

    await searchBuses(fromLocation, toLocation);
  }, [fromLocation, toLocation, searchBuses, searchFilters.from, searchFilters.to]);

  const handleBusSelect = useCallback((busId: number) => {
    const bus = buses.find(b => b.id === busId);
    if (bus) {
      setSelectedBusId(busId);
    }
  }, [buses, setSelectedBusId]);

  const handleBusBook = useCallback((busId: number) => {
    const bus = buses.find(b => b.id === busId);
    if (bus) {
      console.log('Booking bus:', bus.busNumber);
      // Navigate to booking page or open booking modal
    }
  }, [buses]);

  const handleSwapLocations = () => {
    const tempFrom = fromLocation;
    const tempFromText = searchFilters.from;
    setFromLocation(toLocation);
    setToLocation(tempFrom);
    setSearchFilters(prev => ({
      ...prev,
      from: searchFilters.to,
      to: tempFromText
    }));
  };

  const handleFromSelect = (location: Location) => {
    setFromLocation(location);
    setSearchFilters(prev => ({ ...prev, from: location.name }));
    setShowFromSuggestions(false);
  };

  const handleToSelect = (location: Location) => {
    setToLocation(location);
    setSearchFilters(prev => ({ ...prev, to: location.name }));
    setShowToSuggestions(false);
  };

  const getAllStops = useCallback((): Stop[] => {
    const allStops: Stop[] = [];
    Object.values(stopsMap).forEach(stops => {
      stops.forEach(stop => {
        if (!allStops.find(s => s.id === stop.id)) {
          allStops.push(stop);
        }
      });
    });
    return allStops;
  }, [stopsMap]);

  return (
    <div className="premium-search-route-page">
      {/* Premium Floating Background Elements */}
      <div className="floating-elements">
        <div className="floating-shape shape-1">🚌</div>
        <div className="floating-shape shape-2">🗺️</div>
        <div className="floating-shape shape-3">📍</div>
        <div className="floating-shape shape-4">🎯</div>
        <div className="floating-shape shape-5">⭐</div>
        <div className="floating-shape shape-6">🛣️</div>
      </div>

      {/* Enhanced Search Header */}
      <div className="premium-search-header">
        <div className="search-header-container">
          <div className="header-navigation">
            {onNavigateBack && (
              <button className="back-btn premium" onClick={onNavigateBack}>
                <span className="back-icon">←</span>
                <span className="back-text">{t('common.back', 'Back')}</span>
              </button>
            )}
            <div className="page-title">
              <h1 className="title-text">{t('search.title', 'Find Your Journey')}</h1>
              <p className="title-subtitle">{t('search.subtitle', 'Discover the best routes across Tamil Nadu')}</p>
            </div>
          </div>

          <SmartSearchForm
            searchFilters={searchFilters}
            fromLocation={fromLocation}
            toLocation={toLocation}
            fromSuggestions={fromSuggestions}
            toSuggestions={toSuggestions}
            showFromSuggestions={showFromSuggestions}
            showToSuggestions={showToSuggestions}
            isLoading={isLoading}
            onFiltersChange={setSearchFilters}
            onFromSearch={handleFromSearch}
            onToSearch={handleToSearch}
            onFromSelect={handleFromSelect}
            onToSelect={handleToSelect}
            onSwapLocations={handleSwapLocations}
            onSearch={handleSearch}
          />
        </div>
      </div>

      {/* Search Statistics Dashboard */}
      {!isLoading && filteredBuses.length > 0 && (
        <SearchStats stats={searchStats} />
      )}

      {/* Premium Results Header with Advanced Controls */}
      {!isLoading && filteredBuses.length > 0 && (
        <div className="premium-results-header">
          <div className="results-info-section">
            <div className="route-breadcrumb">
              <span className="location-chip from">
                <span className="location-icon">📍</span>
                {typeof searchFilters.from === 'string' ? searchFilters.from : searchFilters.from?.name || 'From'}
              </span>
              <div className="route-arrow">
                <span className="arrow-line"></span>
                <span className="arrow-head">→</span>
              </div>
              <span className="location-chip to">
                <span className="location-icon">🎯</span>
                {typeof searchFilters.to === 'string' ? searchFilters.to : searchFilters.to?.name || 'To'}
              </span>
            </div>
            <div className="journey-details">
              <span className="travel-date">
                <span className="detail-icon">📅</span>
                {new Date(searchFilters.date).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
              <span className="passenger-count">
                <span className="detail-icon">👥</span>
                1 {t('search.passenger', 'Passenger')}
              </span>
            </div>
          </div>

          <ViewModeControls
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            sortBy={searchFilters.sortBy}
            onSortChange={(sortBy) => setSearchFilters(prev => ({ ...prev, sortBy }))}
          />
        </div>
      )}

      {/* Main Content Area with Premium Layout */}
      <div className={`premium-search-content ${viewMode}`}>
        <LoadingState isLoading={isLoading} />

        <ErrorState 
          error={error} 
          onRetry={handleSearch}
          onAdjustSearch={() => setShowFilters(true)}
        />

        {!isLoading && !error && filteredBuses.length === 0 && searchFilters.from && searchFilters.to && (
          <NoResultsState 
            searchFilters={searchFilters}
            onChangeFilters={setSearchFilters}
          />
        )}

        {/* Premium Results Display */}
        {!isLoading && !error && filteredBuses.length > 0 && (
          <div className="results-display-container">
            {/* List View */}
            {(viewMode === 'list' || viewMode === 'split') && (
              <div className="premium-bus-list-container">
                <EnhancedBusList
                  buses={filteredBuses}
                  selectedBusId={selectedBusId}
                  onBusSelect={handleBusSelect}
                  onBusBook={handleBusBook}
                  isCompact={viewMode === 'split'}
                />
              </div>
            )}

            {/* Map View */}
            {(viewMode === 'map' || viewMode === 'split') && (
              <div className="premium-map-container">
                <EnhancedMapView
                  buses={filteredBuses}
                  stops={getAllStops()}
                  selectedBusId={selectedBusId}
                  onBusSelect={handleBusSelect}
                  showLiveTracking={true}
                  className={viewMode === 'split' ? 'compact' : ''}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Premium Quick Actions Floating Panel */}
      {!isLoading && filteredBuses.length > 0 && (
        <QuickActions
          onSaveSearch={() => console.log('Save search')}
          onPriceAlert={() => console.log('Price alert')}
          onShare={() => console.log('Share results')}
        />
      )}
    </div>
  );
};

export default EnhancedSearchRoutePage;