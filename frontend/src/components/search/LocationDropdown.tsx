import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Location } from '../../types';
import { searchLocations } from '../../services/locationService';
import { formatLocationNameUniversal } from '../../services/geocodingService';
import debounce from 'lodash/debounce';
import '../LocationAutocompleteInput.css';

interface LocationDropdownProps {
  id: string;
  label: string;
  placeholder: string;
  selectedLocation: Location | null;
  onSelect: (location: Location) => void;
  disabled?: boolean;
  showValidationFeedback?: boolean;
  excludeLocations?: Location[];
  locations?: Location[];
}

/**
 * Location dropdown component with autocomplete functionality
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
  
  // Get display name based on current language with consistent city-first formatting
  const getDisplayName = useCallback((location: Location): string => {
    let displayName = location.name;
    
    // Use translated name if available and in Tamil
    if (i18n.language === 'ta' && location.translatedName) {
      displayName = location.translatedName;
    }
    
    // Apply universal formatting to ensure city name appears first
    return formatLocationNameUniversal(displayName);
  }, [i18n.language]);

  // Filter out excluded locations
  const filterExcludedLocations = (locations: Location[]): Location[] => {
    if (!excludeLocations || excludeLocations.length === 0) return locations;
    
    const filtered = locations.filter(location => {
      if (!location || !location.name) return false;
      
      // Check if this location should be excluded
      const shouldExclude = excludeLocations.some(excluded => {
        if (!excluded || !excluded.name) return false;
        
        const exactIdMatch = excluded.id && location.id && excluded.id === location.id;
        
        // Extract the main location name without address details
        const excludedBaseName = excluded.name.split(',')[0].toLowerCase().trim();
        const locationBaseName = location.name.split(',')[0].toLowerCase().trim();
        
        const exactBaseNameMatch = 
          excludedBaseName === locationBaseName && 
          !(location.source === 'map' && excluded.name !== location.name);
        
        return exactIdMatch || exactBaseNameMatch;
      });
      
      return !shouldExclude;
    });
    
    return filtered;
  };

  // Load all locations when the component mounts or when locations prop changes
  useEffect(() => {
    const fetchAllLocations = async () => {
      // If locations prop is provided, use it directly
      if (locations && locations.length > 0) {
        const filteredLocations = filterExcludedLocations(locations as Location[]);
        setAllLocations(filteredLocations);
        return;
      }

      // Otherwise, fetch all locations from the API
      try {
        setIsLoading(true);
        const allLocationsData = await searchLocations('');
        const filteredLocations = filterExcludedLocations(allLocationsData as Location[]);
        setAllLocations(filteredLocations);
      } catch (err) {
        console.error('Error fetching all locations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllLocations();
  }, [locations, excludeLocations]);

  // Create a debounced search function with reduced delay for better performance
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query) {
        setResults(allLocations);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        let searchResults: Location[] = [];
        
        // If locations prop is provided, use it for filtering
        if (locations && locations.length > 0) {
          searchResults = locations.filter(loc => 
            loc.name.toLowerCase().includes(query.toLowerCase())
          );
        } else {
          // Use smart search for better performance
          if (query.length >= 2) {
            searchResults = await searchLocations(query);
          }
        }
        
        // Filter out any excluded locations
        const filteredResults = filterExcludedLocations(searchResults);
        setResults(filteredResults);
      } catch (err) {
        console.error('Error searching locations:', err);
        setError(t('error.searchFailed', 'Failed to search locations'));
      } finally {
        setIsLoading(false);
      }
    }, 100),
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
    <div className={`location-dropdown-container ${isOpen ? 'open' : ''}`} ref={dropdownRef}>
      {label && <label htmlFor={id}>{label}</label>}
      
      <div 
        className="dropdown-input-wrapper" 
        onClick={() => {
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
            <div className="dropdown-message">{t('common.loading', 'Loading...')}</div>
          ) : (
            <div className="dropdown-message">{t('common.noLocationsFound', 'No locations found matching your search')}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationDropdown;