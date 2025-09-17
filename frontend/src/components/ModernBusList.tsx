import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ModernBusItem from './ModernBusItem';
import type { Bus, Stop, Location as AppLocation } from '../types';
import '../styles/ModernBusList.css';
import '../styles/ModernBusListRIA.css';

// Enhanced filtering and sorting types
type SortOption = 'departure' | 'arrival' | 'duration' | 'price' | 'name';
type SortOrder = 'asc' | 'desc';

interface FilterOptions {
  busType: string[];
  departureTime: string;
  arrivalTime: string;
  priceRange: [number, number];
  duration: string;
  searchText: string;
}

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

// Lazy Image Component with Intersection Observer
const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, placeholder = '/api/placeholder/bus.jpg' }) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
      onLoad={() => setIsLoaded(true)}
      loading="lazy"
    />
  );
};

interface ModernBusListProps {
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

const ModernBusList: React.FC<ModernBusListProps> = ({
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
  
  // RIA State Management
  const [sortBy, setSortBy] = useState<SortOption>('departure');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isGridView, setIsGridView] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [loadedItems, setLoadedItems] = useState(10); // Virtual scrolling
  
  // Advanced Filters State
  const [filters, setFilters] = useState<FilterOptions>({
    busType: [],
    departureTime: '',
    arrivalTime: '',
    priceRange: [0, 5000],
    duration: '',
    searchText: ''
  });

  // Calculate price range from buses
  const priceRange = useMemo(() => {
    const prices = buses.map(bus => bus.fare || 0).filter(p => p > 0);
    return prices.length > 0 ? [Math.min(...prices), Math.max(...prices)] : [0, 5000];
  }, [buses]);

  // Get unique bus types for filtering
  const busTypes = useMemo(() => {
    const types = [...new Set(buses.map(bus => bus.category || 'Regular').filter(Boolean))];
    return types;
  }, [buses]);

  // Enhanced filtering and sorting logic
  const filteredAndSortedBuses = useMemo(() => {
    let filtered = buses.filter(bus => {
      // Search text filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const busName = (bus.busName || '').toLowerCase();
        const busNumber = (bus.busNumber || '').toLowerCase();
        const category = (bus.category || '').toLowerCase();
        if (!busName.includes(searchLower) && 
            !busNumber.includes(searchLower) && 
            !category.includes(searchLower)) {
          return false;
        }
      }

      // Bus type filter
      if (filters.busType.length > 0) {
        if (!filters.busType.includes(bus.category || 'Regular')) {
          return false;
        }
      }

      // Price range filter
      if (bus.fare && (bus.fare < filters.priceRange[0] || bus.fare > filters.priceRange[1])) {
        return false;
      }

      // Time filters
      if (filters.departureTime && bus.departureTime) {
        const filterTime = filters.departureTime;
        const busTime = bus.departureTime;
        if (busTime < filterTime) return false;
      }

      if (filters.arrivalTime && bus.arrivalTime) {
        const filterTime = filters.arrivalTime;
        const busTime = bus.arrivalTime;
        if (busTime > filterTime) return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      let result = 0;
      
      switch (sortBy) {
        case 'departure':
          result = (a.departureTime || '00:00').localeCompare(b.departureTime || '00:00');
          break;
        case 'arrival':
          result = (a.arrivalTime || '00:00').localeCompare(b.arrivalTime || '00:00');
          break;
        case 'price':
          result = (a.fare || 0) - (b.fare || 0);
          break;
        case 'duration':
          // Calculate duration for sorting
          const getDuration = (bus: Bus) => {
            if (!bus.departureTime || !bus.arrivalTime) return 0;
            const [depH, depM] = bus.departureTime.split(':').map(Number);
            const [arrH, arrM] = bus.arrivalTime.split(':').map(Number);
            return (arrH * 60 + arrM) - (depH * 60 + depM);
          };
          result = getDuration(a) - getDuration(b);
          break;
        case 'name':
          result = (a.busName || '').localeCompare(b.busName || '');
          break;
        default:
          result = 0;
      }
      
      return sortOrder === 'desc' ? -result : result;
    });

    return filtered;
  }, [buses, searchText, filters, sortBy, sortOrder]);

  // Virtual scrolling for performance
  const visibleBuses = useMemo(() => {
    return filteredAndSortedBuses.slice(0, loadedItems);
  }, [filteredAndSortedBuses, loadedItems]);

  // Load more items when scrolling
  const handleLoadMore = useCallback(() => {
    if (loadedItems < filteredAndSortedBuses.length) {
      setLoadedItems(prev => Math.min(prev + 10, filteredAndSortedBuses.length));
    }
  }, [loadedItems, filteredAndSortedBuses.length]);

  // Filter handlers
  const handleBusTypeFilter = (type: string) => {
    setFilters(prev => ({
      ...prev,
      busType: prev.busType.includes(type) 
        ? prev.busType.filter(t => t !== type)
        : [...prev.busType, type]
    }));
  };

  const handleSortChange = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (option: SortOption) => {
    if (sortBy !== option) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };
  
  if (buses.length === 0) {
    return (
      <div className="modern-bus-list-empty">
        <div className="empty-state">
          <div className="empty-icon">🚌</div>
          <h3 className="empty-title">No buses found</h3>
          <p className="empty-message">
            We couldn't find any buses for your selected route. 
            Try adjusting your search criteria or check back later.
          </p>
          <div className="empty-suggestions">
            <h4>Suggestions:</h4>
            <ul>
              <li>Try searching for nearby cities</li>
              <li>Check if the route is available on different days</li>
              <li>Contact support for more options</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-bus-list ria-enhanced ria-fade-in">
      {showTitle && (
        <div className="bus-list-header ria-enhanced">
          <div className="header-content ria-enhanced">
            <div className="title-section ria-enhanced">
              <h2 className="list-title ria-enhanced">
                {t('busList.title', 'Available Buses')}
              </h2>
              <div className="bus-count ria-enhanced">
                {filteredAndSortedBuses.length} {filteredAndSortedBuses.length === 1 ? 'bus' : 'buses'} found
              </div>
              {fromLocation && toLocation && (
                <div className="route-summary">
                  <span className="route-text">
                    {fromLocation} → {toLocation}
                  </span>
                </div>
              )}
            </div>
            
            {/* Enhanced View Controls */}
            <div className="controls-section ria-enhanced">
              <div className="view-controls ria-enhanced">
                <button 
                  className={`view-button ria-enhanced ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 6H20V8H4V6ZM4 11H20V13H4V11ZM4 16H20V18H4V16Z"/>
                  </svg>
                  List
                </button>
                <button 
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  ⊞
                </button>
                <button 
                  className={`view-btn ${viewMode === 'compact' ? 'active' : ''}`}
                  onClick={() => setViewMode('compact')}
                  title="Compact View"
                >
                  ≡
                </button>
              </div>
              
              <button 
                className={`filter-toggle ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                🔧 Filters
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="search-section">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search buses by name, number, or type..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="search-input"
              />
              <div className="search-icon">🔍</div>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="sort-controls">
            <div className="sort-buttons">
              <button 
                className={`sort-btn ${sortBy === 'departure' ? 'active' : ''}`}
                onClick={() => handleSortChange('departure')}
              >
                Departure {getSortIcon('departure')}
              </button>
              <button 
                className={`sort-btn ${sortBy === 'arrival' ? 'active' : ''}`}
                onClick={() => handleSortChange('arrival')}
              >
                Arrival {getSortIcon('arrival')}
              </button>
              <button 
                className={`sort-btn ${sortBy === 'duration' ? 'active' : ''}`}
                onClick={() => handleSortChange('duration')}
              >
                Duration {getSortIcon('duration')}
              </button>
              <button 
                className={`sort-btn ${sortBy === 'price' ? 'active' : ''}`}
                onClick={() => handleSortChange('price')}
              >
                Price {getSortIcon('price')}
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="filters-panel">
              <div className="filter-section">
                <h4>Bus Type</h4>
                <div className="filter-chips">
                  {busTypes.map(type => (
                    <button
                      key={type}
                      className={`filter-chip ${filters.busType.includes(type) ? 'active' : ''}`}
                      onClick={() => handleBusTypeFilter(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="filter-section">
                <h4>Price Range</h4>
                <div className="price-range">
                  <input
                    type="range"
                    min={priceRange[0]}
                    max={priceRange[1]}
                    value={filters.priceRange[0]}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      priceRange: [Number(e.target.value), prev.priceRange[1]]
                    }))}
                    className="range-slider"
                  />
                  <input
                    type="range"
                    min={priceRange[0]}
                    max={priceRange[1]}
                    value={filters.priceRange[1]}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      priceRange: [prev.priceRange[0], Number(e.target.value)]
                    }))}
                    className="range-slider"
                  />
                  <div className="price-values">
                    ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
                  </div>
                </div>
              </div>

              <div className="filter-section">
                <h4>Departure Time</h4>
                <input
                  type="time"
                  value={filters.departureTime}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    departureTime: e.target.value
                  }))}
                  className="time-input"
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className={`buses-container ${viewMode}-view`}>
        {visibleBuses.map((bus, index) => (
          <div key={bus.id} className="bus-item-wrapper">
            {index > 0 && viewMode === 'list' && <div className="bus-separator"></div>}
            <ModernBusItem
              bus={bus}
              selectedBusId={selectedBusId || null}
              stops={stopsMap && stopsMap[bus.id] ? stopsMap[bus.id] : stops.filter(stop => stop.busId === bus.id)}
              onSelectBus={onSelectBus ? (busId: number) => {
                const selectedBus = buses.find(b => b.id === busId);
                if (selectedBus) {
                  onSelectBus(selectedBus);
                }
              } : () => {}}
              fromLocation={fromLocationObj}
              toLocation={toLocationObj}
            />
          </div>
        ))}
        
        {/* Load More Button for Virtual Scrolling */}
        {loadedItems < filteredAndSortedBuses.length && (
          <div className="load-more-section">
            <button 
              className="load-more-btn"
              onClick={handleLoadMore}
            >
              Load More Buses ({filteredAndSortedBuses.length - loadedItems} remaining)
            </button>
          </div>
        )}
      </div>
      
      {/* Results Summary */}
      <div className="bus-list-footer">
        <div className="results-summary">
          <div className="summary-stats">
            <span className="stat-item">
              <strong>{filteredAndSortedBuses.length}</strong> buses found
            </span>
            <span className="stat-item">
              <strong>{busTypes.length}</strong> types available
            </span>
            {priceRange[1] > 0 && (
              <span className="stat-item">
                ₹<strong>{priceRange[0]}</strong> - ₹<strong>{priceRange[1]}</strong> price range
              </span>
            )}
          </div>
        </div>
        
        <div className="footer-info">
          <div className="info-item">
            <span className="info-icon">ℹ️</span>
            <span className="info-text">
              Times shown are estimated. Please arrive 10 minutes early.
            </span>
          </div>
          <div className="info-item">
            <span className="info-icon">🎫</span>
            <span className="info-text">
              Book tickets in advance for better availability.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ModernBusList);