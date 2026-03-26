import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Location as AppLocation, Bus } from '../types';
import { locationAutocompleteService, type LocationSuggestion } from '../services/locationAutocompleteService';
import { findNearbyLocationFromGPS, checkLocationPermission } from '../services/nearbyLocationService';
import { getGeolocationSupport } from '../services/geolocation';
import { searchBuses } from '../services/api';
import MapComponent from './MapComponent';
import { Skeleton } from '../design-system';
import { triggerHaptic } from '../utils/haptic';
import { 
  validateDifferentLocations,
  type LocationData,
  type ValidationResult 
} from '../utils/validationService';
import { 
  normalizeLocationName
} from '../utils/locationNormalizer';
import '../styles/premium-design-system.css';
import '../styles/transit-design-system.css';

// Popular routes in Tamil Nadu for suggestions
const POPULAR_ROUTES = [
  { from: { id: 1, name: 'Chennai', translatedName: 'சென்னை' }, to: { id: 2, name: 'Coimbatore', translatedName: 'கோயம்புத்தூர்' } },
  { from: { id: 1, name: 'Chennai', translatedName: 'சென்னை' }, to: { id: 3, name: 'Madurai', translatedName: 'மதுரை' } },
  { from: { id: 1, name: 'Chennai', translatedName: 'சென்னை' }, to: { id: 4, name: 'Trichy', translatedName: 'திருச்சி' } },
  { from: { id: 2, name: 'Coimbatore', translatedName: 'கோயம்புத்தூர்' }, to: { id: 3, name: 'Madurai', translatedName: 'மதுரை' } },
  { from: { id: 3, name: 'Madurai', translatedName: 'மதுரை' }, to: { id: 5, name: 'Rameshwaram', translatedName: 'ராமேஸ்வரம்' } },
  { from: { id: 1, name: 'Chennai', translatedName: 'சென்னை' }, to: { id: 6, name: 'Bangalore', translatedName: 'பெங்களூர்' } },
];

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
  
  // Quick action modal states
  const [showMapModal, setShowMapModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [scheduleData, setScheduleData] = useState<Bus[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  
  // Debounce timers for autocomplete
  const fromDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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
    
    // Cleanup debounce timers on unmount.
    // Timer refs must be read at cleanup time (not mount) so the latest timer ID is cleared.
    return () => {
      const fromTimer = fromDebounceTimerRef.current; // eslint-disable-line react-hooks/exhaustive-deps
      const toTimer = toDebounceTimerRef.current; // eslint-disable-line react-hooks/exhaustive-deps
      if (fromTimer) clearTimeout(fromTimer);
      if (toTimer) clearTimeout(toTimer);
    };
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

  // Sync props to internal state when they change (for default location support).
  // Compare by ID so that navigating back with different locations always resets the fields.
  useEffect(() => {
    if (fromLocation && fromLocation.id !== selectedFromLocation?.id) {
      setFromQuery(getLocationDisplayName(fromLocation));
      setSelectedFromLocation(fromLocation);
    }
  }, [fromLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (toLocation && toLocation.id !== selectedToLocation?.id) {
      setToQuery(getLocationDisplayName(toLocation));
      setSelectedToLocation(toLocation);
    }
  }, [toLocation]); // eslint-disable-line react-hooks/exhaustive-deps

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
  
  // Refs to track if we're clicking on suggestions and input refs for focus management
  const fromSuggestionsRef = useRef<HTMLUListElement>(null);
  const toSuggestionsRef = useRef<HTMLUListElement>(null);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
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
  // Now with proper debouncing at the component level to prevent multiple simultaneous calls
  const fetchDynamicSuggestions = useCallback((query: string, isFromField: boolean) => {
    // Clear existing timer for this field
    const timerRef = isFromField ? fromDebounceTimerRef : toDebounceTimerRef;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    if (query.trim().length < 3) {
      if (isFromField) setDynamicFromSuggestions([]);
      else setDynamicToSuggestions([]);
      return;
    }
    
    // Set loading immediately for better UX
    if (isFromField) setIsLoadingFrom(true);
    else setIsLoadingTo(true);
    
    // Debounce API calls to prevent multiple simultaneous requests
    timerRef.current = setTimeout(() => {
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
    }, 300); // 300ms debounce delay
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
    // Immediately reset the selecting flag to prevent blur timeout from reopening dropdown
    isSelectingFromRef.current = false;
    
    triggerHaptic('selection');
    setSelectedFromLocation(location);
    setFromQuery(getLocationDisplayName(location));
    setShowFromSuggestions(false);
    setValidationError(null); // Clear validation error when selecting
    // Move focus to the TO input after selecting FROM location
    setTimeout(() => {
      toInputRef.current?.focus();
    }, 0);
  };

    const handleToSelect = (location: AppLocation) => {
    // Immediately reset the selecting flag to prevent blur timeout from reopening dropdown
    isSelectingToRef.current = false;
    
    triggerHaptic('selection');
    setSelectedToLocation(location);
    setToQuery(getLocationDisplayName(location));
    setShowToSuggestions(false);
    setValidationError(null); // Clear validation error when selecting
    // Keep focus on the TO input, or move to search button if you prefer
    setTimeout(() => {
      toInputRef.current?.focus();
    }, 0);
  };

  // Handle search - validate and then search
  const handleSearch = useCallback(() => {
    // Clear previous validation errors
    setValidationError(null);
    
    // Try to find matching locations from the database
    // First check if already selected
    let selectedFrom = selectedFromLocation;
    let selectedTo = selectedToLocation;
    
    // If not already selected, try to find by normalized name
    // This allows "Besant Nagar MTC Terminus" to match "Besant Nagar" in database
    if (!selectedFrom && fromQuery.trim()) {
      const normalizedQuery = normalizeLocationName(fromQuery.toLowerCase());
      
      // Try exact match first with normalization
      selectedFrom = locations.find(loc => 
        normalizeLocationName(loc.name.toLowerCase()) === normalizedQuery ||
        normalizeLocationName(loc.translatedName?.toLowerCase() || '').toLowerCase() === normalizedQuery
      ) ?? null;
      
      // If no exact match, try partial match
      if (!selectedFrom) {
        selectedFrom = locations.find(loc => 
          loc.name.toLowerCase().includes(normalizedQuery) ||
          normalizedQuery.includes(loc.name.toLowerCase()) ||
          loc.translatedName?.toLowerCase().includes(normalizedQuery) ||
          normalizedQuery.includes(loc.translatedName?.toLowerCase() || '')
        ) ?? null;
      }
    }
    
    if (!selectedTo && toQuery.trim()) {
      const normalizedQuery = normalizeLocationName(toQuery.toLowerCase());
      
      // Try exact match first with normalization
      selectedTo = locations.find(loc => 
        normalizeLocationName(loc.name.toLowerCase()) === normalizedQuery ||
        normalizeLocationName(loc.translatedName?.toLowerCase() || '').toLowerCase() === normalizedQuery
      ) ?? null;
      
      // If no exact match, try partial match
      if (!selectedTo) {
        selectedTo = locations.find(loc => 
          loc.name.toLowerCase().includes(normalizedQuery) ||
          normalizedQuery.includes(loc.name.toLowerCase()) ||
          loc.translatedName?.toLowerCase().includes(normalizedQuery) ||
          normalizedQuery.includes(loc.translatedName?.toLowerCase() || '')
        ) ?? null;
      }
    }
    
    // Validation 1: Check origin and destination are both entered
    if (!fromQuery.trim()) {
      setValidationError({
        valid: false,
        message: t('validation.location.enterOrigin', 'Please enter an origin location'),
        severity: 'error'
      });
      return;
    }

    if (!toQuery.trim()) {
      setValidationError({
        valid: false,
        message: t('validation.location.enterDestination', 'Please enter a destination location'),
        severity: 'error'
      });
      return;
    }

    // Validation 2: Check origin and destination are different
    const fromName = selectedFrom?.name ?? fromQuery.trim();
    const toName = selectedTo?.name ?? toQuery.trim();
    if (fromName.toLowerCase() === toName.toLowerCase()) {
      setValidationError({
        valid: false,
        message: t('validation.location.sameLocation', 'Origin and destination cannot be the same'),
        severity: 'error'
      });
      return;
    }
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

  // Quick Action: View on Map
  const handleViewOnMap = () => {
    if (selectedFromLocation || selectedToLocation) {
      triggerHaptic('light');
      setShowMapModal(true);
    } else {
      // Show a message if no locations selected
      setValidationError({
        valid: false,
        message: t('searchForm.selectLocationsForMap', 'Please select at least one location to view on map'),
        severity: 'warning'
      });
      setTimeout(() => setValidationError(null), 3000);
    }
  };

  // Quick Action: Schedule View
  const handleScheduleView = async () => {
    if (!selectedFromLocation || !selectedToLocation) {
      setValidationError({
        valid: false,
        message: t('searchForm.selectBothLocationsForSchedule', 'Please select both origin and destination to view schedules'),
        severity: 'warning'
      });
      setTimeout(() => setValidationError(null), 3000);
      return;
    }

    triggerHaptic('light');
    setShowScheduleModal(true);
    setIsLoadingSchedule(true);
    setScheduleError(null);

    try {
      const buses = await searchBuses(selectedFromLocation, selectedToLocation, true, i18n.language);
      setScheduleData(buses);
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : t('searchForm.failedToLoadSchedules', 'Failed to load schedules'));
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  // Quick Action: Suggestions
  const handleSuggestions = () => {
    triggerHaptic('light');
    setShowSuggestionsModal(true);
  };

  // Apply suggestion route
  const applySuggestion = (from: { id: number; name: string; translatedName?: string }, to: { id: number; name: string; translatedName?: string }) => {
    const fromLoc = locations.find(l => l.id === from.id) || {
      id: from.id,
      name: from.name,
      translatedName: from.translatedName,
      latitude: 0,
      longitude: 0
    };
    const toLoc = locations.find(l => l.id === to.id) || {
      id: to.id,
      name: to.name,
      translatedName: to.translatedName,
      latitude: 0,
      longitude: 0
    };

    setFromQuery(getLocationDisplayName(fromLoc));
    setToQuery(getLocationDisplayName(toLoc));
    setSelectedFromLocation(fromLoc);
    setSelectedToLocation(toLoc);
    setShowSuggestionsModal(false);

    // Auto-search after applying suggestion
    if (onSearch) {
      onSearch(fromLoc, toLoc, searchOptions);
    }
  };

  return (
    <div className="transit-app" role="search" aria-label="Bus route search">
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
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-2)', gap: '12px' }}>
                <label 
                  htmlFor="from-location-input"
                  className="text-caption" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}
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
                
                {/* Use My Location Button - Positioned outside the input container */}
                {gpsSupported && (
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={isGettingLocation}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                      minWidth: 'fit-content',
                      padding: '8px 16px',
                      background: isGettingLocation 
                        ? '#E5E7EB' 
                        : locationPermission === 'granted' 
                          ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                          : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                      color: isGettingLocation ? '#6B7280' : 'white',
                      border: 'none',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: isGettingLocation ? 'wait' : 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isGettingLocation ? 'none' : '0 2px 8px rgba(99, 102, 241, 0.3)',
                      marginTop: '2px'
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
              
              {/* Input Container */}
              <div style={{ position: 'relative', width: '100%' }}>
              <input
                ref={fromInputRef}
                id="from-location-input"
                type="text"
                inputMode="search"
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
                className={`transit-input ${validationError && !validationError.valid && validationError.message?.toLowerCase().includes('origin') ? 'error' : ''}`}
                aria-label={t('search.from', 'From location')}
                aria-autocomplete="list"
                aria-controls="from-suggestions-list"
                aria-expanded={showFromSuggestions}
                aria-activedescendant={highlightedFromIndex >= 0 ? `from-suggestion-${highlightedFromIndex}` : undefined}
                aria-invalid={validationError && !validationError.valid && validationError.message?.toLowerCase().includes('origin') ? 'true' : undefined}
                autoComplete="off"
              />
              
              {/* Clear button for from input */}
              {fromQuery && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setFromQuery('');
                    setSelectedFromLocation(null);
                    setShowFromSuggestions(false);
                    setIsFromGPS(false);
                  }}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '44px',
                    height: '44px',
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(107, 114, 128, 0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    color: '#6B7280',
                    fontSize: '18px',
                    transition: 'all 0.2s ease',
                    padding: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(107, 114, 128, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(107, 114, 128, 0.1)';
                  }}
                  title={t('common.clear', 'Clear')}
                  aria-label={t('search.clearFrom', 'Clear from location')}
                >
                  ✕
                </button>
              )}
              
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
                    padding: 'var(--space-3)'
                  }}
                >
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ marginBottom: i < 3 ? 'var(--space-3)' : 0 }}>
                      <Skeleton width="70%" height="16px" />
                      <div style={{ marginTop: 'var(--space-1)' }}>
                        <Skeleton width="40%" height="12px" />
                      </div>
                    </div>
                  ))}
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
                    maxHeight: 'min(40vh, 400px)',
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    willChange: 'scroll-position',
                    overscrollBehavior: 'contain',
                    listStyle: 'none',
                    padding: 0,
                    margin: 0
                  }}>
                  {fromSuggestions.map((location, index) => {
                    const isHighlighted = index === highlightedFromIndex;
                    const isVerified = location.source === 'database';
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
                        minHeight: '44px',
                        padding: 'var(--space-3)',
                        border: 'none',
                        background: isHighlighted ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--transit-divider)',
                        transition: 'background-color 0.15s ease',
                        fontWeight: isHighlighted ? 600 : 400,
                        userSelect: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                    >
                      <div className="text-body" style={{ color: isHighlighted ? '#3B82F6' : 'inherit', flex: 1 }}>
                        {getLocationDisplayName(location)}
                      </div>
                      {isVerified && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: '#10B981',
                          color: 'white',
                          flexShrink: 0
                        }}>
                          ✓ DB
                        </span>
                      )}
                    </li>
                  );
                  })}
                </ul>
              )}
              </div>
            </div>

            {/* Swap Button */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  handleSwapLocations();
                }}
                className="transit-button secondary"
                style={{ 
                  borderRadius: '50%', 
                  width: '44px', 
                  height: '44px',
                  minWidth: '44px',
                  minHeight: '44px',
                  padding: 0,
                  fontSize: 'var(--text-lg)'
                }}
                title={t('searchForm.swapLocations', 'Swap locations')}
                aria-label={t('searchForm.swapLocations', 'Swap locations')}
              >
                ⇅
              </button>
            </div>

            {/* To Location */}
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: 'var(--space-2)' }}>
                <label 
                  htmlFor="to-location-input"
                  className="text-caption" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}
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
              </div>
              
              {/* Input Container */}
              <div style={{ position: 'relative', width: '100%' }}>
              <input
                ref={toInputRef}
                id="to-location-input"
                type="text"
                inputMode="search"
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
                className={`transit-input ${validationError && !validationError.valid && validationError.message?.toLowerCase().includes('destination') ? 'error' : ''}`}
                aria-label={t('search.to', 'To location')}
                aria-autocomplete="list"
                aria-controls="to-suggestions-list"
                aria-expanded={showToSuggestions}
                aria-activedescendant={highlightedToIndex >= 0 ? `to-suggestion-${highlightedToIndex}` : undefined}
                aria-invalid={validationError && !validationError.valid && validationError.message?.toLowerCase().includes('destination') ? 'true' : undefined}
                autoComplete="off"
              />
              
              {/* Clear button for to input */}
              {toQuery && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setToQuery('');
                    setSelectedToLocation(null);
                    setShowToSuggestions(false);
                  }}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '44px',
                    height: '44px',
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(107, 114, 128, 0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    color: '#6B7280',
                    fontSize: '18px',
                    transition: 'all 0.2s ease',
                    padding: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(107, 114, 128, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(107, 114, 128, 0.1)';
                  }}
                  title={t('common.clear', 'Clear')}
                  aria-label={t('search.clearTo', 'Clear to location')}
                >
                  ✕
                </button>
              )}
              
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
                    padding: 'var(--space-3)'
                  }}
                >
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ marginBottom: i < 3 ? 'var(--space-3)' : 0 }}>
                      <Skeleton width="70%" height="16px" />
                      <div style={{ marginTop: 'var(--space-1)' }}>
                        <Skeleton width="40%" height="12px" />
                      </div>
                    </div>
                  ))}
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
                    maxHeight: 'min(40vh, 400px)',
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    willChange: 'scroll-position',
                    overscrollBehavior: 'contain',
                    listStyle: 'none',
                    padding: 0,
                    margin: 0
                  }}>
                  {toSuggestions.map((location, index) => {
                    const isHighlighted = index === highlightedToIndex;
                    const isVerified = location.source === 'database';
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
                        minHeight: '44px',
                        padding: 'var(--space-3)',
                        border: 'none',
                        background: isHighlighted ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--transit-divider)',
                        transition: 'background-color 0.15s ease',
                        fontWeight: isHighlighted ? 600 : 400,
                        userSelect: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                    >
                      <div className="text-body" style={{ color: isHighlighted ? '#3B82F6' : 'inherit', flex: 1 }}>
                        {getLocationDisplayName(location)}
                      </div>
                      {isVerified && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: '#10B981',
                          color: 'white',
                          flexShrink: 0
                        }}>
                          ✓ DB
                        </span>
                      )}
                    </li>
                  );
                  })}
                </ul>
              )}
              </div>
            </div>
          </div>

          {/* Validation Error Display - Phase 2 Enhancement */}
          {validationError && !validationError.valid && (
            <div className="input-error-message">
              <span>{validationError.severity === 'warning' ? '⚠️' : '❌'}</span>
              <span>{validationError.message}</span>
            </div>
          )}

          {/* Search Button */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              handleSearch();
            }}
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
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      flex: 1, 
                      minWidth: 0,
                      overflow: 'hidden' 
                    }}>
                      <span style={{ color: '#10B981', flexShrink: 0 }}>●</span>
                      <span style={{ 
                        fontWeight: '500', 
                        color: '#374151', 
                        fontSize: '13px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '40%'
                      }}>
                        {getRecentSearchDisplayName(search.from)}
                      </span>
                      <span style={{ color: '#9ca3af', flexShrink: 0 }}>→</span>
                      <span style={{ color: '#EF4444', flexShrink: 0 }}>●</span>
                      <span style={{ 
                        fontWeight: '500', 
                        color: '#374151', 
                        fontSize: '13px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '40%'
                      }}>
                        {getRecentSearchDisplayName(search.to)}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      color: '#9ca3af',
                      background: '#f3f4f6',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
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
            <button 
              className="transit-button secondary" 
              style={{ fontSize: 'var(--text-sm)' }}
              onClick={() => {
                triggerHaptic('light');
                handleViewOnMap();
              }}
              aria-label={t('searchForm.viewOnMap', 'View on Map')}
            >
              🗺️ {t('searchForm.viewOnMap', 'View on Map')}
            </button>
            <button 
              className="transit-button secondary" 
              style={{ fontSize: 'var(--text-sm)' }}
              onClick={() => {
                triggerHaptic('light');
                handleScheduleView();
              }}
              aria-label={t('searchForm.scheduleView', 'Schedule View')}
            >
              🕐 {t('searchForm.scheduleView', 'Schedule View')}
            </button>
            <button 
              className="transit-button secondary" 
              style={{ fontSize: 'var(--text-sm)' }}
              onClick={() => {
                triggerHaptic('light');
                handleSuggestions();
              }}
              aria-label={t('searchForm.suggestions', 'Suggestions')}
            >
              💡 {t('searchForm.suggestions', 'Suggestions')}
            </button>
          </div>
        </div>
      </div>

      {/* Map Modal */}
      {showMapModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowMapModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="modal-content card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%',
              maxWidth: '800px',
              height: '80vh',
              maxHeight: '600px',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}
          >
            <div style={{
              padding: 'var(--spacing-md)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0 }}>🗺️ {t('searchForm.viewOnMap', 'View on Map')}</h3>
              <button 
                className="transit-button secondary" 
                onClick={() => setShowMapModal(false)}
                style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, position: 'relative', minHeight: '400px' }}>
              {selectedFromLocation && selectedToLocation ? (
                <MapComponent
                  fromLocation={selectedFromLocation}
                  toLocation={selectedToLocation}
                  style={{ height: '100%', width: '100%', minHeight: '400px' }}
                />
              ) : (
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  {!selectedFromLocation && !selectedToLocation 
                    ? t('searchForm.selectLocationsForMap', 'Please select locations to view on map')
                    : selectedFromLocation 
                      ? t('searchForm.selectDestination', 'Please select a destination')
                      : t('searchForm.selectOrigin', 'Please select an origin')
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal - Modern Design */}
      {showScheduleModal && (
        <div 
          onClick={() => setShowScheduleModal(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowScheduleModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-modal-title"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '1rem'
          }}
        >
          {/* Modal Content */}
          <div 
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              maxHeight: '85vh',
              backgroundColor: 'white',
              borderRadius: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'modalSlideIn 0.3s ease-out'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #f3f4f6',
              background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.75rem',
                    backgroundColor: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>🕐</span>
                  </div>
                  <div>
                    <h3 id="schedule-modal-title" style={{ 
                      margin: 0, 
                      fontSize: '1.125rem', 
                      fontWeight: 600, 
                      color: '#111827' 
                    }}>
                      {t('searchForm.scheduleView', 'Schedule View')}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                      {scheduleData.length} {t('searchForm.busesAvailable', 'buses available')}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    triggerHaptic('light');
                    setShowScheduleModal(false);
                  }}
                  aria-label={t('common.close', 'Close')}
                  style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: '50%',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    color: '#6b7280',
                    transition: 'all 0.2s',
                    minWidth: '44px',
                    minHeight: '44px'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Body with scroll - Mobile Optimized */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
              willChange: 'scroll-position'
            }}>
              {/* Loading State */}
              {isLoadingSchedule && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '4rem 1.5rem' 
                }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '4rem',
                      height: '4rem',
                      borderRadius: '50%',
                      border: '4px solid #dbeafe',
                      borderTopColor: '#3b82f6',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>🚌</span>
                    </div>
                  </div>
                  <p style={{ marginTop: '1rem', color: '#4b5563', fontWeight: 500 }}>
                    {t('searchForm.loadingSchedules', 'Loading schedules...')}
                  </p>
                </div>
              )}
              
              {/* Error State */}
              {scheduleError && (
                <div style={{ 
                  margin: '1rem', 
                  padding: '1rem', 
                  borderRadius: '0.75rem', 
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fee2e2'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '50%',
                      backgroundColor: '#fee2e2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500, color: '#991b1b' }}>
                        {t('searchForm.errorOccurred', 'Something went wrong')}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#dc2626' }}>
                        {scheduleError}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Empty State */}
              {!isLoadingSchedule && !scheduleError && scheduleData.length === 0 && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '4rem 1.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '5rem',
                    height: '5rem',
                    borderRadius: '50%',
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                  }}>
                    <span style={{ fontSize: '2.5rem', opacity: 0.5 }}>🚌</span>
                  </div>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
                    {t('searchForm.noSchedulesFound', 'No schedules found')}
                  </h4>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem', maxWidth: '16rem' }}>
                    {t('searchForm.tryDifferentRoute', 'Try searching for a different route or time')}
                  </p>
                </div>
              )}
              
              {/* Bus List */}
              {!isLoadingSchedule && !scheduleError && scheduleData.length > 0 && (
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {scheduleData.map((bus, index) => {
                    const isExpress = bus.busType === 'Express' || bus.busType === 'AC';
                    const isDeluxe = bus.busType === 'Deluxe' || bus.busType === 'Super Deluxe';
                    let badgeBg = '#f3f4f6';
                    let badgeColor = '#4b5563';
                    let statusBadge = 'Unknown';
                    let statusColor = '#6b7280';
                    let statusBg = '#f3f4f6';
                    
                    if (isExpress) { badgeBg = '#d1fae5'; badgeColor = '#047857'; }
                    else if (isDeluxe) { badgeBg = '#ede9fe'; badgeColor = '#6d28d9'; }
                    
                    // Determine status based on bus data
                    if (bus.status) {
                      statusBadge = bus.status;
                      if (bus.status === 'On Time') { statusColor = '#047857'; statusBg = '#d1fae5'; }
                      else if (bus.status === 'Delayed') { statusColor = '#dc2626'; statusBg = '#fee2e2'; }
                      else if (bus.status === 'Live') { statusColor = '#3b82f6'; statusBg = '#dbeafe'; }
                    }
                    
                    return (
                      <div 
                        key={bus.id || index} 
                        onClick={() => triggerHaptic('selection')}
                        role="button"
                        tabIndex={0}
                        aria-label={`Bus ${bus.busNumber || bus.routeName} departing at ${bus.departureTime}`}
                        style={{
                          position: 'relative',
                          backgroundColor: 'white',
                          borderRadius: '0.75rem',
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          overflow: 'hidden',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            triggerHaptic('selection');
                          }
                        }}
                      >
                        {/* Accent Bar */}
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '4px',
                          background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)'
                        }} />
                        
                        <div style={{ padding: '1rem', paddingLeft: '1.25rem' }}>
                          {/* Top Row */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1 }}>
                              <div style={{
                                width: '2rem',
                                height: '2rem',
                                borderRadius: '0.5rem',
                                backgroundColor: '#3b82f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <span style={{ fontSize: '0.875rem' }} role="img" aria-label="bus">🚌</span>
                              </div>
                              <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontWeight: 700, color: '#111827', fontSize: '1.125rem', marginBottom: '0.125rem' }}>
                                  {bus.busNumber || bus.routeName}
                                </div>
                                <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                                  <span style={{
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.625rem',
                                    fontWeight: 600,
                                    backgroundColor: badgeBg,
                                    color: badgeColor,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.025em'
                                  }}>
                                    {bus.busType || t('searchForm.regular', 'Regular')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span style={{
                              padding: '0.25rem 0.625rem',
                              borderRadius: '9999px',
                              fontSize: '0.625rem',
                              fontWeight: 600,
                              backgroundColor: statusBg,
                              color: statusColor,
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                              marginLeft: '0.5rem'
                            }}>
                              {statusBadge}
                            </span>
                          </div>
                          
                          {/* Route Name */}
                          {bus.routeName && bus.busNumber && (
                            <p style={{ 
                              margin: '0 0 0.75rem', 
                              fontSize: '0.875rem', 
                              color: '#6b7280',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {bus.routeName}
                            </p>
                          )}
                          
                          {/* Time Row */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.75rem',
                            backgroundColor: '#f9fafb',
                            borderRadius: '0.5rem',
                            margin: '0 -0.25rem'
                          }}>
                            {/* Departure */}
                            <div style={{ flex: 1 }}>
                              <p style={{ 
                                margin: 0, 
                                fontSize: '0.625rem', 
                                color: '#9ca3af', 
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}>
                                {t('searchForm.departure', 'Departure')}
                              </p>
                              <p style={{ 
                                margin: 0, 
                                fontSize: '1.125rem', 
                                fontWeight: 600, 
                                color: '#111827',
                                fontVariantNumeric: 'tabular-nums'
                              }}>
                                {bus.departureTime ? bus.departureTime.substring(0, 5) : '--:--'}
                              </p>
                            </div>
                            
                            {/* Journey Line */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0 0.5rem' }}>
                              <div style={{
                                width: '0.5rem',
                                height: '0.5rem',
                                borderRadius: '50%',
                                backgroundColor: '#3b82f6'
                              }} />
                              <div style={{
                                width: '2.5rem',
                                height: '2px',
                                background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)'
                              }} />
                              <span style={{ fontSize: '1rem', color: '#10b981' }}>→</span>
                            </div>
                            
                            {/* Arrival */}
                            <div style={{ flex: 1, textAlign: 'right' }}>
                              <p style={{ 
                                margin: 0, 
                                fontSize: '0.625rem', 
                                color: '#9ca3af', 
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}>
                                {t('searchForm.arrival', 'Arrival')}
                              </p>
                              <p style={{ 
                                margin: 0, 
                                fontSize: '1.125rem', 
                                fontWeight: 600, 
                                color: '#111827',
                                fontVariantNumeric: 'tabular-nums'
                              }}>
                                {bus.arrivalTime ? bus.arrivalTime.substring(0, 5) : '--:--'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suggestions Modal */}
      {showSuggestionsModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowSuggestionsModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="modal-content card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%',
              maxWidth: '500px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}
          >
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #f3f4f6',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.75rem',
                  backgroundColor: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
                }}>
                  <span style={{ fontSize: '1.25rem' }} role="img" aria-label="suggestions">💡</span>
                </div>
                <h3 id="suggestions-modal-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
                  {t('searchForm.suggestions', 'Suggestions')}
                </h3>
              </div>
              <button 
                className="transit-button secondary" 
                onClick={() => {
                  triggerHaptic('light');
                  setShowSuggestionsModal(false);
                }}
                aria-label={t('common.close', 'Close')}
                style={{ 
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: 'var(--spacing-md)',
              WebkitOverflowScrolling: 'touch',
              willChange: 'scroll-position',
              overscrollBehavior: 'contain'
            }}>
              {/* Popular Routes */}
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: 'var(--spacing-sm)',
                  padding: '0.5rem 0.75rem',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: '0.5rem',
                  border: '1px solid #fbbf24'
                }}>
                  <span style={{ fontSize: '1.125rem' }} role="img" aria-label="popular">🔥</span>
                  <h4 id="popular-routes-heading" style={{ 
                    margin: 0,
                    color: '#92400e',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {t('searchForm.popularRoutes', 'Popular Routes')}
                  </h4>
                </div>
                <div className="column column-sm" role="list" aria-labelledby="popular-routes-heading">
                  {POPULAR_ROUTES.map((route, index) => (
                    <button
                      key={index}
                      role="listitem"
                      className="transit-button secondary"
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        minHeight: '48px',
                        padding: '0.75rem 1rem'
                      }}
                      onClick={() => {
                        triggerHaptic('selection');
                        applySuggestion(route.from, route.to);
                      }}
                      aria-label={`${i18n.language === 'ta' ? route.from.translatedName : route.from.name} to ${i18n.language === 'ta' ? route.to.translatedName : route.to.name}`}
                    >
                      <span>📍</span>
                      <span style={{ flex: 1 }}>
                        {i18n.language === 'ta' ? route.from.translatedName : route.from.name}
                        <span style={{ margin: '0 var(--spacing-xs)' }}>→</span>
                        {i18n.language === 'ta' ? route.to.translatedName : route.to.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: 'var(--spacing-sm)',
                    padding: '0.5rem 0.75rem',
                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db'
                  }}>
                    <span style={{ fontSize: '1.125rem' }} role="img" aria-label="recent">🕐</span>
                    <h4 id="recent-searches-heading" style={{ 
                      margin: 0,
                      color: '#374151',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {t('searchForm.recentSearches', 'Recent Searches')}
                    </h4>
                  </div>
                  <div className="column column-sm" role="list" aria-labelledby="recent-searches-heading">
                    {recentSearches.slice(0, 5).map((search, index) => (
                      <button
                        key={index}
                        role="listitem"
                        className="transit-button secondary"
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-sm)',
                          minHeight: '48px',
                          padding: '0.75rem 1rem'
                        }}
                        onClick={() => {
                          triggerHaptic('selection');
                          applySuggestion(search.from, search.to);
                        }}
                        aria-label={`Recent search: ${search.from.name} to ${search.to.name}`}
                      >
                        <span>🔄</span>
                        <span style={{ flex: 1 }}>
                          {search.from.name}
                          <span style={{ margin: '0 var(--spacing-xs)' }}>→</span>
                          {search.to.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default React.memo(TransitSearchForm);