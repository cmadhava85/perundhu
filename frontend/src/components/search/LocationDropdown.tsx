import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Location } from '../../types';
import { searchLocations } from '../../services/locationService';
import debounce from 'lodash/debounce';
import '../../styles/LocationDropdown.css';

interface LocationDropdownProps {
  id: string;
  label: string;
  placeholder: string;
  selectedLocation: Location | null;
  onSelect: (location: Location) => void;
  disabled?: boolean;
  showValidationFeedback?: boolean;
  excludeLocations?: Location[];
  locations?: Location[]; // Add locations prop since it's used in SearchForm
}

/**
 * Location dropdown component with autocomplete functionality
 * First retrieves data from database, then fallbacks to map API if needed
 */
const LocationDropdown: React.FC<LocationDropdownProps> = ({
  id,
  label,
  placeholder,
  selectedLocation,
  onSelect,
  disabled = false,
  showValidationFeedback = false,
  excludeLocations = [],
  locations = []
}) => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get display name based on current language
  const getDisplayName = useCallback((location: Location): string => {
    if (i18n.language === 'ta' && location.translatedName) {
      return location.translatedName;
    }
    return location.name;
  }, [i18n.language]);

  // Filter out excluded locations
  const filterExcludedLocations = (locations: Location[]): Location[] => {
    if (!excludeLocations || excludeLocations.length === 0) return locations;
    
    // Add debug logging to help diagnose filtering issues
    console.log(`Filtering ${locations.length} locations against ${excludeLocations.length} excluded locations`);
    
    const filtered = locations.filter(location => {
      if (!location || !location.name) return false;
      
      // Check if this location should be excluded
      const shouldExclude = excludeLocations.some(excluded => {
        if (!excluded || !excluded.name) return false;
        
        // For map API results that contain full addresses, we need to be more lenient
        // Only exclude if the exact IDs match or if the base names (not full addresses) are identical
        
        const exactIdMatch = excluded.id && location.id && excluded.id === location.id;
        
        // Extract the main location name without address details (before the first comma)
        const excludedBaseName = excluded.name.split(',')[0].toLowerCase().trim();
        const locationBaseName = location.name.split(',')[0].toLowerCase().trim();
        
        const exactBaseNameMatch = 
          excludedBaseName === locationBaseName && 
          // Don't exclude map results that have the same base name but different full addresses
          !(location.source === 'map' && excluded.name !== location.name);
        
        return exactIdMatch || exactBaseNameMatch;
      });
      
      return !shouldExclude;
    });
    
    // More debugging to show what happened after filtering
    const removedCount = locations.length - filtered.length;
    if (removedCount > 0) {
      console.log(`Filtered out ${removedCount} locations, ${filtered.length} remain`);
    }
    
    return filtered;
  };

  // Load all locations when the component mounts or when locations prop changes
  useEffect(() => {
    const fetchAllLocations = async () => {
      // If locations prop is provided, use it directly
      if (locations && locations.length > 0) {
        const filteredLocations = filterExcludedLocations(locations);
        setAllLocations(filteredLocations);
        return;
      }

      // Otherwise, fetch all locations from the API
      try {
        setIsLoading(true);
        const allLocationsData = await searchLocations(''); // Fetch all locations
        const filteredLocations = filterExcludedLocations(allLocationsData);
        setAllLocations(filteredLocations);
      } catch (err) {
        console.error('Error fetching all locations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllLocations();
  }, [locations, excludeLocations]);

  // Create a debounced search function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query) {
        // When query is empty, show all locations
        setResults(allLocations);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`Searching locations for: "${query}"`);
        
        let searchResults: Location[] = [];
        
        // If locations prop is provided, use it for filtering instead of making API call
        if (locations && locations.length > 0) {
          searchResults = locations.filter(loc => 
            loc.name.toLowerCase().includes(query.toLowerCase())
          );
        } else {
          // This API call will first check database, then fall back to map API
          searchResults = await searchLocations(query);
        }
        
        // Filter out any excluded locations
        const filteredResults = filterExcludedLocations(searchResults);
        setResults(filteredResults);
        
        if (filteredResults.length === 0) {
          console.log(`No results found for: "${query}"`);
        } else {
          console.log(`Found ${filteredResults.length} locations for: "${query}"`);
        }
      } catch (err) {
        console.error('Error searching locations:', err);
        setError(t('error.searchFailed', 'Failed to search locations'));
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [t, excludeLocations, locations, allLocations]
  );

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsOpen(true);
    debouncedSearch(value);
  };

  // Handle focus on input
  const handleInputFocus = () => {
    setIsOpen(true);
    // Show all locations when focused if no query is entered or if already selected
    setResults(allLocations);
  };

  // Handle selection of a location
  const handleSelect = (location: Location) => {
    onSelect(location);
    setSearchQuery(getDisplayName(location));
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update query when selectedLocation changes
  useEffect(() => {
    if (selectedLocation) {
      setSearchQuery(getDisplayName(selectedLocation));
    } else {
      setSearchQuery('');
    }
  }, [selectedLocation, i18n.language, getDisplayName]);

  return (
    <div className="location-dropdown-container" ref={dropdownRef}>
      {label && <label htmlFor={id}>{label}</label>}
      
      <div 
        className="dropdown-input-wrapper" 
        onClick={() => {
          // When clicking on the input wrapper, show all locations
          setIsOpen(true);
          setResults(allLocations);
        }}
      >
        <input
          type="text"
          id={id}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={showValidationFeedback ? (selectedLocation ? 'valid-input' : 'invalid-input') : ''}
          disabled={disabled}
          autoComplete="off"
        />
        {isLoading && <div className="dropdown-loader"></div>}
      </div>
      
      {isOpen && (
        <div className="dropdown-results-container">
          {error ? (
            <div className="dropdown-error">{error}</div>
          ) : results.length > 0 ? (
            <ul className="dropdown-results">
              {results.map((location) => (
                <li 
                  key={location.id || `loc-${location.name}-${location.latitude}-${location.longitude}`} 
                  onClick={() => handleSelect(location)}
                  className={selectedLocation?.id === location.id ? 'selected' : ''}
                >
                  <div className="location-name">{getDisplayName(location)}</div>
                  {location.latitude && location.longitude && (
                    <div className="location-coords">
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      {location.source === 'map' || !location.id ? (
                        <span className="location-source api"> Map</span>
                      ) : (
                        <span className="location-source database"> DB</span>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : isLoading ? (
            <div className="dropdown-message">{t('search.searching', 'Searching...')}</div>
          ) : (
            <div className="dropdown-message">{t('search.noResults', 'No locations found')}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationDropdown;