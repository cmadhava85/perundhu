import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Location as AppLocation } from '../types';
import { locationAutocompleteService, type LocationSuggestion } from '../services/locationAutocompleteService';
import { findNearbyLocationFromGPS, checkLocationPermission } from '../services/nearbyLocationService';
import { getGeolocationSupport } from '../services/geolocation';
import { 
  validateDifferentLocations,
  type LocationData,
  type ValidationResult 
} from '../utils/validationService';
import '../styles/transit-design-system.css';

// Recent search interface
interface RecentSearch {
  from: { id: number; name: string; translatedName?: string };
  to: { id: number; name: string; translatedName?: string };
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
  
  // Dynamic suggestions from autocomplete service (DB + OpenStreetMap)
  const [dynamicFromSuggestions, setDynamicFromSuggestions] = useState<LocationSuggestion[]>([]);
  const [dynamicToSuggestions, setDynamicToSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoadingFrom, setIsLoadingFrom] = useState(false);
  const [isLoadingTo, setIsLoadingTo] = useState(false);
  
  // GPS location detection state
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [gpsSupported, setGpsSupported] = useState(true);
  const [isFromGPS, setIsFromGPS] = useState(false); // Track if origin was set via GPS
  
  // Validation state
  const [validationError, setValidationError] = useState<ValidationResult | null>(null);
  
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

  // Check GPS support and permission status on mount
  useEffect(() => {
    const checkGpsStatus = async () => {
      const supported = getGeolocationSupport();
      setGpsSupported(supported);
      
      if (supported) {
        const permission = await checkLocationPermission();
        setLocationPermission(permission);
        
        // Auto-detect location if permission is already granted and no origin set
        if (permission === 'granted' && !fromQuery && !selectedFromLocation) {
          handleUseMyLocation();
        }
      }
    };
    
    checkGpsStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle "Use My Location" button click
  const handleUseMyLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);
    
    try {
      const result = await findNearbyLocationFromGPS();
      
      if (result.success && result.location) {
        // Set the location as the "from" location
        setFromQuery(getLocationDisplayName(result.location));
        setSelectedFromLocation(result.location);
        setLocationPermission('granted');
        setIsFromGPS(true); // Mark as GPS-detected
        
        // Show distance info if available
        if (result.distance && result.distance > 0) {
          console.log(`Set origin to: ${result.location.name} (${result.distance.toFixed(1)}km away)`);
        }
      } else {
        setLocationError(result.error || t('location.error', 'Could not detect your location'));
        // Clear error after 5 seconds
        setTimeout(() => setLocationError(null), 5000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLocationError(errorMessage);
      setTimeout(() => setLocationError(null), 5000);
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Save recent search to localStorage
  const saveRecentSearch = useCallback((from: AppLocation, to: AppLocation) => {
    if (from.id === -1 || to.id === -1) return; // Don't save invalid searches
    
    const newSearch: RecentSearch = {
      from: { id: from.id, name: from.name, translatedName: from.translatedName },
      to: { id: to.id, name: to.name, translatedName: to.translatedName },
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

  // Helper function to get display name for recent search location
  const getRecentSearchDisplayName = (loc: { name: string; translatedName?: string }) => {
    if (i18n.language === 'ta' && loc.translatedName) {
      return loc.translatedName;
    }
    return loc.name;
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

  // Filter locations based on search query - combines static locations with dynamic suggestions
  const filterLocations = useCallback((query: string): AppLocation[] => {
    if (!query.trim()) return [];
    return locations.filter(location => {
      const displayName = getLocationDisplayName(location);
      const englishName = location.name;
      return displayName.toLowerCase().includes(query.toLowerCase()) ||
             englishName.toLowerCase().includes(query.toLowerCase());
    });
  }, [locations]);

  // Fetch dynamic suggestions when query changes (DB-first, OpenStreetMap fallback)
  const fetchDynamicSuggestions = useCallback((query: string, isFromField: boolean) => {
    if (query.trim().length < 3) {
      if (isFromField) setDynamicFromSuggestions([]);
      else setDynamicToSuggestions([]);
      return;
    }
    
    if (isFromField) setIsLoadingFrom(true);
    else setIsLoadingTo(true);
    
    locationAutocompleteService.getDebouncedSuggestions(
      query,
      (suggestions) => {
        if (isFromField) {
          setDynamicFromSuggestions(suggestions);
          setIsLoadingFrom(false);
        } else {
          setDynamicToSuggestions(suggestions);
          setIsLoadingTo(false);
        }
      },
      i18n.language
    );
  }, [i18n.language]);

  // Convert LocationSuggestion to AppLocation
  const suggestionToLocation = useCallback((suggestion: LocationSuggestion): AppLocation => ({
    id: suggestion.id,
    name: suggestion.name,
    translatedName: suggestion.translatedName,
    latitude: suggestion.latitude || 0,
    longitude: suggestion.longitude || 0,
    source: (suggestion.source as 'database' | 'nominatim') || 'database'
  }), []);

  // Combine static and dynamic suggestions, removing duplicates
  const getCombinedSuggestions = useCallback((query: string, dynamicSuggestions: LocationSuggestion[]): AppLocation[] => {
    const staticResults = filterLocations(query);
    const dynamicResults = dynamicSuggestions.map(suggestionToLocation);
    
    // Combine and dedupe by ID, preferring database results
    const seen = new Set<number>();
    const combined: AppLocation[] = [];
    
    // Add static (database) results first
    for (const loc of staticResults) {
      if (!seen.has(loc.id)) {
        seen.add(loc.id);
        combined.push(loc);
      }
    }
    
    // Add dynamic results (from autocomplete service)
    for (const loc of dynamicResults) {
      if (!seen.has(loc.id)) {
        seen.add(loc.id);
        combined.push(loc);
      }
    }
    
    return combined.slice(0, 10); // Limit to 10 suggestions
  }, [filterLocations, suggestionToLocation]);

  const fromSuggestions = getCombinedSuggestions(fromQuery, dynamicFromSuggestions);
  const toSuggestions = getCombinedSuggestions(toQuery, dynamicToSuggestions);

  // Handle location selection
    const handleFromSelect = (location: AppLocation) => {
    setSelectedFromLocation(location);
    setFromQuery(getLocationDisplayName(location));
    setShowFromSuggestions(false);
    setValidationError(null); // Clear validation error when selecting
  };

    const handleToSelect = (location: AppLocation) => {
    setSelectedToLocation(location);
    setToQuery(getLocationDisplayName(location));
    setShowToSuggestions(false);
    setValidationError(null); // Clear validation error when selecting
  };

  // Handle search - validate and then search
  const handleSearch = useCallback(() => {
    // Clear previous validation errors
    setValidationError(null);
    
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
    
    // Validation 1: Check if origin is selected from list (not just typed)
    if (!selectedFrom && fromQuery.trim().length > 0) {
      setValidationError({
        valid: false,
        message: t('validation.location.selectFromList', 'Please select origin from the suggestions list'),
        severity: 'error'
      });
      return;
    }
    
    // Validation 2: Check if destination is selected from list
    if (!selectedTo && toQuery.trim().length > 0) {
      setValidationError({
        valid: false,
        message: t('validation.location.selectDestFromList', 'Please select destination from the suggestions list'),
        severity: 'error'
      });
      return;
    }
    
    // Validation 3: Check origin and destination are different
    if (selectedFrom && selectedTo) {
      const originData: LocationData = {
        name: selectedFrom.name,
        latitude: selectedFrom.latitude,
        longitude: selectedFrom.longitude,
        isVerified: true
      };
      const destData: LocationData = {
        name: selectedTo.name,
        latitude: selectedTo.latitude,
        longitude: selectedTo.longitude,
        isVerified: true
      };
      
      const diffValidation = validateDifferentLocations(originData, destData);
      if (!diffValidation.valid) {
        setValidationError(diffValidation);
        return;
      }
    }
    
    setIsSearching(true);
    
    // If we found matching locations, use them
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
  }, [selectedFromLocation, selectedToLocation, fromQuery, toQuery, searchOptions, locations, onSearch, saveRecentSearch, t]);

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
    
    // Reset GPS flag when swapping (GPS location is now destination, not origin)
    setIsFromGPS(false);
    
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <label 
                  htmlFor="from-location-input"
                  className="text-caption" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>🟢 {t('search.from', 'From')}</span>
                  {selectedFromLocation && selectedFromLocation.id !== -1 && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      background: isFromGPS 
                        ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' 
                        : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {isFromGPS ? '📍 ' + t('location.nearYou', 'Near you') : '✓ ' + t('search.verified', 'Verified')}
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
                      ⚠ {t('search.selectFromList', 'Select from list')}
                    </span>
                  )}
                </label>
                
                {/* Use My Location Button */}
                {gpsSupported && (
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={isGettingLocation}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      background: isGettingLocation 
                        ? '#E5E7EB' 
                        : locationPermission === 'granted' 
                          ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                          : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                      color: isGettingLocation ? '#6B7280' : 'white',
                      border: 'none',
                      borderRadius: '16px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: isGettingLocation ? 'wait' : 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isGettingLocation ? 'none' : '0 2px 8px rgba(99, 102, 241, 0.3)'
                    }}
                    title={t('location.useMyLocation', 'Use my current location')}
                  >
                    {isGettingLocation ? (
                      <>
                        <span style={{
                          width: '12px',
                          height: '12px',
                          border: '2px solid #9CA3AF',
                          borderTopColor: '#374151',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                          display: 'inline-block'
                        }} />
                        {t('location.detecting', 'Detecting...')}
                      </>
                    ) : (
                      <>
                        📍 {t('location.useLocation', 'Use my location')}
                      </>
                    )}
                  </button>
                )}
              </div>
              
              {/* Location Error Message */}
              {locationError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  fontSize: '12px',
                  color: '#DC2626'
                }}>
                  <span>⚠️</span>
                  <span>{locationError}</span>
                  <button
                    onClick={() => setLocationError(null)}
                    style={{
                      marginLeft: 'auto',
                      background: 'none',
                      border: 'none',
                      color: '#DC2626',
                      cursor: 'pointer',
                      padding: '2px',
                      fontSize: '14px'
                    }}
                    title={t('common.dismiss', 'Dismiss')}
                  >
                    ✕
                  </button>
                </div>
              )}
              <input
                id="from-location-input"
                type="text"
                value={fromQuery}
                onChange={(e) => {
                  setFromQuery(e.target.value);
                  setSelectedFromLocation(null);
                  setShowFromSuggestions(true);
                  setHighlightedFromIndex(-1);
                  setIsFromGPS(false); // Reset GPS flag when user types manually
                  // Trigger dynamic autocomplete (DB + OpenStreetMap)
                  fetchDynamicSuggestions(e.target.value, true);
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
              {showFromSuggestions && fromQuery.trim().length >= 2 && fromSuggestions.length === 0 && !isLoadingFrom && (
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
              {showFromSuggestions && fromQuery.trim().length >= 3 && isLoadingFrom && fromSuggestions.length === 0 && (
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
                  <div style={{ color: 'var(--transit-primary, #6366F1)', marginBottom: 'var(--space-2)' }}>🔍</div>
                  <div className="text-body" style={{ color: 'var(--transit-text-secondary)', fontWeight: 500 }}>
                    {t('search.searching', 'Searching locations...')}
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
                  // Trigger dynamic autocomplete (DB + OpenStreetMap)
                  fetchDynamicSuggestions(e.target.value, false);
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
              {showToSuggestions && toQuery.trim().length >= 2 && toSuggestions.length === 0 && !isLoadingTo && (
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
              {showToSuggestions && toQuery.trim().length >= 3 && isLoadingTo && toSuggestions.length === 0 && (
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
                  <div style={{ color: 'var(--transit-primary, #6366F1)', marginBottom: 'var(--space-2)' }}>🔍</div>
                  <div className="text-body" style={{ color: 'var(--transit-text-secondary)', fontWeight: 500 }}>
                    {t('search.searching', 'Searching locations...')}
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
                    </li>
                  );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Validation Error Display */}
          {validationError && !validationError.valid && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: validationError.severity === 'warning' ? '#FEF3C7' : '#FEE2E2',
              border: `1px solid ${validationError.severity === 'warning' ? '#F59E0B' : '#EF4444'}`,
              borderRadius: '8px',
              color: validationError.severity === 'warning' ? '#92400E' : '#B91C1C',
              fontSize: '14px'
            }}>
              <span>{validationError.severity === 'warning' ? '⚠️' : '❌'}</span>
              <span>{validationError.message}</span>
            </div>
          )}

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
              fontSize: '13px',
              color: 'var(--transit-text-secondary, #64748b)',
              marginTop: '4px',
              marginBottom: '8px',
              padding: '8px 12px',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '8px',
              border: '1px solid #bae6fd',
              fontWeight: '500'
            }}>
              💡 Press <kbd style={{
                padding: '3px 8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                borderRadius: '4px',
                border: 'none',
                fontSize: '12px',
                fontWeight: '600',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
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
                        {getRecentSearchDisplayName(search.from)}
                      </span>
                      <span style={{ color: '#9ca3af' }}>→</span>
                      <span style={{ color: '#EF4444' }}>●</span>
                      <span style={{ fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                        {getRecentSearchDisplayName(search.to)}
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