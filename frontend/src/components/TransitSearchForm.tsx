import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Location as AppLocation } from '../types';
import '../styles/transit-design-system.css';

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
  }, [selectedFromLocation, selectedToLocation, fromQuery, toQuery, searchOptions, locations, onSearch]);

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
                style={{ display: 'block', marginBottom: 'var(--space-2)' }}
              >
                🟢 {t('search.from', 'From')}
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
                style={{ display: 'block', marginBottom: 'var(--space-2)' }}
              >
                🔴 {t('search.to', 'To')}
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
              padding: 'var(--space-4) var(--space-6)'
            }}
            disabled={!fromQuery || !toQuery}
          >
            🔍 {t('search.searchButton', 'Find Buses')}
          </button>

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