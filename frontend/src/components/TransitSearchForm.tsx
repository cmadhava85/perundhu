import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Location as AppLocation } from '../types';
import '../styles/transit-design-system.css';

// Recent search interface
interface RecentSearch {
  from: { id: number; name: string };
  to: { id: number; name: string };
  timestamp: number;
}

const RECENT_SEARCHES_KEY = 'perundhu_recent_searches';
const MAX_RECENT_SEARCHES = 5;

interface TransitSearchFormProps {
  fromLocation?: AppLocation;
  toLocation?: AppLocation;
  onLocationChange?: (from: AppLocation, to: AppLocation) => void;
  onSearch?: (from: AppLocation, to: AppLocation, options: SearchOptions) => void;
  locations?: AppLocation[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SearchOptions {
  // Simplified interface - only essential search parameters remain
}

const TransitSearchForm: React.FC<TransitSearchFormProps> = ({
  fromLocation,
  toLocation,
  onLocationChange,
  onSearch,
  locations = []
}) => {
  const { t, i18n } = useTranslation();
  
  // Simplified search options - removed date, time, travelers, and accessibility options
  const searchOptions: SearchOptions = {};

  const [fromQuery, setFromQuery] = useState(fromLocation?.name || '');
  const [toQuery, setToQuery] = useState(toLocation?.name || '');
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [highlightedFromIndex, setHighlightedFromIndex] = useState(-1);
  const [highlightedToIndex, setHighlightedToIndex] = useState(-1);
  const [selectedFromLocation, setSelectedFromLocation] = useState<AppLocation | null>(fromLocation || null);
  const [selectedToLocation, setSelectedToLocation] = useState<AppLocation | null>(toLocation || null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentSearch[];
        setRecentSearches(parsed);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save recent search to localStorage
  const saveRecentSearch = useCallback((from: AppLocation, to: AppLocation) => {
    if (from.id === -1 || to.id === -1) return; // Don't save invalid searches
    
    const newSearch: RecentSearch = {
      from: { id: from.id, name: from.name },
      to: { id: to.id, name: to.name },
      timestamp: Date.now()
    };
    
    setRecentSearches(prev => {
      // Remove duplicates
      const filtered = prev.filter(
        s => !(s.from.id === from.id && s.to.id === to.id)
      );
      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      
      return updated;
    });
  }, []);

  // Format relative time
  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  // Handle recent search click
  const handleRecentSearchClick = (search: RecentSearch) => {
    const fromLoc = locations.find(l => l.id === search.from.id);
    const toLoc = locations.find(l => l.id === search.to.id);
    
    if (fromLoc && toLoc) {
      setFromQuery(getLocationDisplayName(fromLoc));
      setToQuery(getLocationDisplayName(toLoc));
      setSelectedFromLocation(fromLoc);
      setSelectedToLocation(toLoc);
      
      // Auto-search after selecting recent search
      if (onSearch) {
        onSearch(fromLoc, toLoc, searchOptions);
      }
    }
  };
  
  // Refs to track if we're clicking on suggestions
  const fromSuggestionsRef = useRef<HTMLUListElement>(null);
  const toSuggestionsRef = useRef<HTMLUListElement>(null);
  const isSelectingFromRef = useRef(false);
  const isSelectingToRef = useRef(false);

  // Helper function to get display name for location
  const getLocationDisplayName = (location: AppLocation) => {
    if (i18n.language === 'ta' && location.translatedName) {
      return location.translatedName;
    }
    return location.name;
  };

  // Update query fields when language or locations change
  useEffect(() => {
    if (selectedFromLocation) {
      setFromQuery(getLocationDisplayName(selectedFromLocation));
    }
    if (selectedToLocation) {
      setToQuery(getLocationDisplayName(selectedToLocation));
    }
  }, [i18n.language, locations, selectedFromLocation, selectedToLocation]);

  // Filter locations based on search query
  const filterLocations = (query: string) => {
    if (!query.trim()) return [];
    return locations.filter(location => {
      const displayName = getLocationDisplayName(location);
      const englishName = location.name;
      return displayName.toLowerCase().includes(query.toLowerCase()) ||
             englishName.toLowerCase().includes(query.toLowerCase());
    });
  };

  const fromSuggestions = filterLocations(fromQuery);
  const toSuggestions = filterLocations(toQuery);

  // Handle location selection
    const handleFromSelect = (location: AppLocation) => {
    setSelectedFromLocation(location);
    setFromQuery(getLocationDisplayName(location));
    setShowFromSuggestions(false);
  };

    const handleToSelect = (location: AppLocation) => {
    setSelectedToLocation(location);
    setToQuery(getLocationDisplayName(location));
    setShowToSuggestions(false);
  };

  // Handle search - allow any location but try to match with database
  const handleSearch = useCallback(() => {
    setIsSearching(true);
    
    // Try to find matching locations from the database
    const selectedFrom = selectedFromLocation || locations.find(loc => 
      loc.name.toLowerCase() === fromQuery.toLowerCase() ||
      loc.translatedName?.toLowerCase() === fromQuery.toLowerCase() ||
      loc.name.toLowerCase().includes(fromQuery.toLowerCase()) ||
      fromQuery.toLowerCase().includes(loc.name.toLowerCase())
    );
    const selectedTo = selectedToLocation || locations.find(loc => 
      loc.name.toLowerCase() === toQuery.toLowerCase() ||
      loc.translatedName?.toLowerCase() === toQuery.toLowerCase() ||
      loc.name.toLowerCase().includes(toQuery.toLowerCase()) ||
      toQuery.toLowerCase().includes(loc.name.toLowerCase())
    );
    
    // If we found matching locations, use them
    // If not, the search will proceed and show "no results" on the results page
    if (selectedFrom && selectedTo && onSearch) {
      saveRecentSearch(selectedFrom, selectedTo);
      onSearch(selectedFrom, selectedTo, searchOptions);
    } else if (onSearch) {
      // Create temporary location objects for locations not in database
      // This allows the search to proceed and show appropriate error on results page
      const fromLoc: AppLocation = selectedFrom || {
        id: -1,
        name: fromQuery.trim(),
        latitude: 0,
        longitude: 0,
        source: 'user-input' as const
      };
      const toLoc: AppLocation = selectedTo || {
        id: -1,
        name: toQuery.trim(),
        latitude: 0,
        longitude: 0,
        source: 'user-input' as const
      };
      onSearch(fromLoc, toLoc, searchOptions);
    }
    
    // Reset searching state after a short delay
    setTimeout(() => setIsSearching(false), 500);
  }, [selectedFromLocation, selectedToLocation, fromQuery, toQuery, searchOptions, locations, onSearch, saveRecentSearch]);

  // Swap locations
  const handleSwapLocations = () => {
    // Swap the query strings
    const tempQuery = fromQuery;
    setFromQuery(toQuery);
    setToQuery(tempQuery);
    
    // Swap the selected location objects
    const tempLocation = selectedFromLocation;
    setSelectedFromLocation(selectedToLocation);
    setSelectedToLocation(tempLocation);
    
    // Notify parent component of the swap
    if (selectedFromLocation && selectedToLocation && onLocationChange) {
      onLocationChange(selectedToLocation, selectedFromLocation);
    }
  };

  return (
    <div className="transit-app">
      <div className="transit-card elevated transit-search-form">
        {/* Header */}
        <div className="stack stack-sm transit-form-header">
          <h2 className="text-title-2">🚌 {t('searchForm.planJourney', 'Plan Your Journey')}</h2>
          <p className="text-caption">{t('searchForm.findBestBuses', 'Find the best buses for your route')}</p>
        </div>

        <div className="stack stack-lg">
          {/* Location Inputs */}
          <div className="stack stack-md">
            {/* From Location */}
            <div style={{ position: 'relative' }}>
              <label 
                htmlFor="from-location-input"
                className="text-caption" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-2)' }}
              >
                <span>🟢 {t('search.from', 'From')}</span>
                {selectedFromLocation && selectedFromLocation.id !== -1 && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}>
                    ✓ Verified
                  </span>
                )}
                {fromQuery && !selectedFromLocation && fromQuery.length >= 2 && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    background: '#FEF3C7',
                    color: '#D97706',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}>
                    ⚠ Select from list
                  </span>
                )}
              </label>
              <input
                id="from-location-input"
                type="text"
                value={fromQuery}
                onChange={(e) => {
                  setFromQuery(e.target.value);
                  setSelectedFromLocation(null);
                  setShowFromSuggestions(true);
                  setHighlightedFromIndex(-1);
                }}
                onFocus={() => setShowFromSuggestions(true)}
                onBlur={() => {
                  // Use timeout to allow click event to fire first
                  setTimeout(() => {
                    if (!isSelectingFromRef.current) {
                      setShowFromSuggestions(false);
                    }
                    isSelectingFromRef.current = false;
                  }, 200);
                }}
                onDoubleClick={(e) => e.currentTarget.select()}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowFromSuggestions(false);
                    setHighlightedFromIndex(-1);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setShowFromSuggestions(true);
                    setHighlightedFromIndex(prev => 
                      prev < fromSuggestions.length - 1 ? prev + 1 : prev
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setShowFromSuggestions(true);
                    setHighlightedFromIndex(prev => prev > 0 ? prev - 1 : -1);
                  } else if (e.key === 'Enter') {
                    if (highlightedFromIndex >= 0 && fromSuggestions[highlightedFromIndex]) {
                      e.preventDefault();
                      handleFromSelect(fromSuggestions[highlightedFromIndex]);
                    }
                  } else if (e.key === 'Tab') {
                    setShowFromSuggestions(false);
                  }
                }}
                placeholder={t('search.fromPlaceholder', 'Enter departure location')}
                className="transit-input"
                aria-label={t('search.from', 'From location')}
                aria-autocomplete="list"
                aria-controls="from-suggestions-list"
                aria-expanded={showFromSuggestions}
                aria-activedescendant={highlightedFromIndex >= 0 ? `from-suggestion-${highlightedFromIndex}` : undefined}
                autoComplete="off"
              />
              
              {/* From Suggestions */}
              {showFromSuggestions && fromQuery.trim().length >= 2 && fromSuggestions.length === 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--transit-surface, #fff)',
                    border: '1px solid var(--transit-divider, #e5e7eb)',
                    borderRadius: 'var(--radius-md, 8px)',
                    marginTop: 'var(--space-1, 4px)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                    zIndex: 9999,
                    padding: 'var(--space-4)',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ color: 'var(--transit-error, #EF4444)', marginBottom: 'var(--space-2)' }}>❌</div>
                  <div className="text-body" style={{ color: 'var(--transit-text-secondary)', fontWeight: 500 }}>
                    {t('search.noLocationFound', 'Location not found')}
                  </div>
                  <div className="text-footnote" style={{ color: 'var(--transit-text-tertiary)', marginTop: 'var(--space-1)' }}>
                    {t('search.tryDifferentSearch', 'Try a different search term or check spelling')}
                  </div>
                </div>
              )}
              {showFromSuggestions && fromSuggestions.length > 0 && (
                <ul
                  ref={fromSuggestionsRef}
                  id="from-suggestions-list"
                  role="listbox"
                  aria-label={t('search.fromSuggestions', 'From location suggestions')}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--transit-surface, #fff)',
                    border: '1px solid var(--transit-divider, #e5e7eb)',
                    borderRadius: 'var(--radius-md, 8px)',
                    marginTop: 'var(--space-1, 4px)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                    zIndex: 9999,
                    maxHeight: '250px',
                    overflowY: 'auto',
                    listStyle: 'none',
                    padding: 0,
                    margin: 0
                  }}>
                  {fromSuggestions.map((location, index) => {
                    const isHighlighted = index === highlightedFromIndex;
                    return (
                    <li
                      key={location.id}
                      id={`from-suggestion-${index}`}
                      role="option"
                      aria-selected={isHighlighted}
                      onMouseDown={() => {
                        isSelectingFromRef.current = true;
                      }}
                      onClick={() => {
                        handleFromSelect(location);
                      }}
                      onMouseEnter={() => setHighlightedFromIndex(index)}
                      style={{
                        width: '100%',
                        padding: 'var(--space-3)',
                        border: 'none',
                        background: isHighlighted ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--transit-divider)',
                        transition: 'background-color 0.15s ease',
                        fontWeight: isHighlighted ? 600 : 400,
                        userSelect: 'none'
                      }}
                    >
                      <div className="text-body" style={{ color: isHighlighted ? '#3B82F6' : 'inherit' }}>
                        {getLocationDisplayName(location)}
                      </div>
                      <div className="text-footnote" style={{ color: 'var(--transit-text-tertiary)' }}>
                        📍 {location.latitude?.toFixed(4) || 'N/A'}, {location.longitude?.toFixed(4) || 'N/A'}
                      </div>
                    </li>
                  );
                  })}
                </ul>
              )}
            </div>

            {/* Swap Button */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleSwapLocations}
                className="transit-button secondary"
                style={{ 
                  borderRadius: '50%', 
                  width: '40px', 
                  height: '40px',
                  padding: 0,
                  fontSize: 'var(--text-lg)'
                }}
                title={t('searchForm.swapLocations', 'Swap locations')}
              >
                ⇅
              </button>
            </div>

            {/* To Location */}
            <div style={{ position: 'relative' }}>
              <label 
                htmlFor="to-location-input"
                className="text-caption" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-2)' }}
              >
                <span>🔴 {t('search.to', 'To')}</span>
                {selectedToLocation && selectedToLocation.id !== -1 && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}>
                    ✓ Verified
                  </span>
                )}
                {toQuery && !selectedToLocation && toQuery.length >= 2 && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    background: '#FEF3C7',
                    color: '#D97706',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}>
                    ⚠ Select from list
                  </span>
                )}
              </label>
              <input
                id="to-location-input"
                type="text"
                value={toQuery}
                onChange={(e) => {
                  setToQuery(e.target.value);
                  setSelectedToLocation(null);
                  setShowToSuggestions(true);
                  setHighlightedToIndex(-1);
                }}
                onFocus={() => setShowToSuggestions(true)}
                onBlur={() => {
                  // Use timeout to allow click event to fire first
                  setTimeout(() => {
                    if (!isSelectingToRef.current) {
                      setShowToSuggestions(false);
                    }
                    isSelectingToRef.current = false;
                  }, 200);
                }}
                onDoubleClick={(e) => e.currentTarget.select()}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowToSuggestions(false);
                    setHighlightedToIndex(-1);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setShowToSuggestions(true);
                    setHighlightedToIndex(prev => 
                      prev < toSuggestions.length - 1 ? prev + 1 : prev
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setShowToSuggestions(true);
                    setHighlightedToIndex(prev => prev > 0 ? prev - 1 : -1);
                  } else if (e.key === 'Enter') {
                    if (highlightedToIndex >= 0 && toSuggestions[highlightedToIndex]) {
                      e.preventDefault();
                      handleToSelect(toSuggestions[highlightedToIndex]);
                    }
                  } else if (e.key === 'Tab') {
                    setShowToSuggestions(false);
                  }
                }}
                placeholder={t('search.toPlaceholder', 'Enter destination')}
                className="transit-input"
                aria-label={t('search.to', 'To location')}
                aria-autocomplete="list"
                aria-controls="to-suggestions-list"
                aria-expanded={showToSuggestions}
                aria-activedescendant={highlightedToIndex >= 0 ? `to-suggestion-${highlightedToIndex}` : undefined}
                autoComplete="off"
              />
              
              {/* To Suggestions */}
              {showToSuggestions && toQuery.trim().length >= 2 && toSuggestions.length === 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--transit-surface, #fff)',
                    border: '1px solid var(--transit-divider, #e5e7eb)',
                    borderRadius: 'var(--radius-md, 8px)',
                    marginTop: 'var(--space-1, 4px)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                    zIndex: 9999,
                    padding: 'var(--space-4)',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ color: 'var(--transit-error, #EF4444)', marginBottom: 'var(--space-2)' }}>❌</div>
                  <div className="text-body" style={{ color: 'var(--transit-text-secondary)', fontWeight: 500 }}>
                    {t('search.noLocationFound', 'Location not found')}
                  </div>
                  <div className="text-footnote" style={{ color: 'var(--transit-text-tertiary)', marginTop: 'var(--space-1)' }}>
                    {t('search.tryDifferentSearch', 'Try a different search term or check spelling')}
                  </div>
                </div>
              )}
              {showToSuggestions && toSuggestions.length > 0 && (
                <ul
                  ref={toSuggestionsRef}
                  id="to-suggestions-list"
                  role="listbox"
                  aria-label={t('search.toSuggestions', 'To location suggestions')}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--transit-surface, #fff)',
                    border: '1px solid var(--transit-divider, #e5e7eb)',
                    borderRadius: 'var(--radius-md, 8px)',
                    marginTop: 'var(--space-1, 4px)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                    zIndex: 9999,
                    maxHeight: '250px',
                    overflowY: 'auto',
                    listStyle: 'none',
                    padding: 0,
                    margin: 0
                  }}>
                  {toSuggestions.map((location, index) => {
                    const isHighlighted = index === highlightedToIndex;
                    return (
                    <li
                      key={location.id}
                      id={`to-suggestion-${index}`}
                      role="option"
                      aria-selected={isHighlighted}
                      onMouseDown={() => {
                        isSelectingToRef.current = true;
                      }}
                      onClick={() => {
                        handleToSelect(location);
                      }}
                      onMouseEnter={() => setHighlightedToIndex(index)}
                      style={{
                        width: '100%',
                        padding: 'var(--space-3)',
                        border: 'none',
                        background: isHighlighted ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--transit-divider)',
                        transition: 'background-color 0.15s ease',
                        fontWeight: isHighlighted ? 600 : 400,
                        userSelect: 'none'
                      }}
                    >
                      <div className="text-body" style={{ color: isHighlighted ? '#3B82F6' : 'inherit' }}>
                        {getLocationDisplayName(location)}
                      </div>
                      <div className="text-footnote" style={{ color: 'var(--transit-text-tertiary)' }}>
                        📍 {location.latitude?.toFixed(4) || 'N/A'}, {location.longitude?.toFixed(4) || 'N/A'}
                      </div>
                    </li>
                  );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="transit-button primary"
            style={{ 
              fontSize: 'var(--text-lg)', 
              fontWeight: 'var(--font-semibold)',
              padding: 'var(--space-4) var(--space-6)',
              position: 'relative',
              overflow: 'hidden'
            }}
            disabled={!fromQuery || !toQuery || isSearching}
          >
            {isSearching ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                {t('search.searching', 'Searching...')}
              </span>
            ) : (
              <>
                🔍 {t('search.searchButton', 'Find Buses')}
              </>
            )}
          </button>
          
          {/* Keyboard hint */}
          {fromQuery && toQuery && selectedFromLocation && selectedToLocation && (
            <div style={{
              textAlign: 'center',
              fontSize: '12px',
              color: 'var(--transit-text-tertiary)',
              marginTop: '-8px'
            }}>
              💡 Press <kbd style={{
                padding: '2px 6px',
                background: '#f3f4f6',
                borderRadius: '4px',
                border: '1px solid #e5e7eb',
                fontSize: '11px'
              }}>Enter</kbd> to search
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-3)'
              }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--transit-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  🕐 {t('search.recentSearches', 'Recent Searches')}
                </span>
                <button
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem(RECENT_SEARCHES_KEY);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '12px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                  onFocus={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onBlur={(e) => e.currentTarget.style.background = 'none'}
                >
                  {t('search.clearAll', 'Clear all')}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentSearches.map((search, index) => (
                  <button
                    key={`${search.from.id}-${search.to.id}-${index}`}
                    onClick={() => handleRecentSearchClick(search)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      width: '100%',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.background = '#eff6ff';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.background = '#eff6ff';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#10B981' }}>●</span>
                      <span style={{ fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                        {search.from.name}
                      </span>
                      <span style={{ color: '#9ca3af' }}>→</span>
                      <span style={{ color: '#EF4444' }}>●</span>
                      <span style={{ fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                        {search.to.name}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      color: '#9ca3af',
                      background: '#f3f4f6',
                      padding: '2px 8px',
                      borderRadius: '10px'
                    }}>
                      {getRelativeTime(search.timestamp)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="row row-sm" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="transit-button secondary" style={{ fontSize: 'var(--text-sm)' }}>
              🗺️ {t('searchForm.viewOnMap', 'View on Map')}
            </button>
            <button className="transit-button secondary" style={{ fontSize: 'var(--text-sm)' }}>
              🕐 {t('searchForm.scheduleView', 'Schedule View')}
            </button>
            <button className="transit-button secondary" style={{ fontSize: 'var(--text-sm)' }}>
              💡 {t('searchForm.suggestions', 'Suggestions')}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default React.memo(TransitSearchForm);