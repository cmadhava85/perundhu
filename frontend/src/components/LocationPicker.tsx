import React, { useState, useCallback, useEffect } from 'react';
import { MapPin, Target, Search, Globe, X, Check } from 'lucide-react';
import { getCurrentPosition, getGeolocationSupport } from '../services/geolocation';
import { searchLocations } from '../services/locationService';
import type { Location } from '../types';
import './LocationPicker.css';

interface LocationPickerProps {
  value?: Location | null;
  onChange: (location: Location | null) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
  showMap?: boolean;
}

interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  placeholder = "Search or select location...",
  className = "",
  label,
  required = false,
  showMap = true
}) => {
  const [query, setQuery] = useState(value?.name || '');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<GeolocationResult | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(value || null);

  // Debounced search function
  const debouncedSearch = useCallback((searchQuery: string) => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsLoading(true);
        try {
          const results = await searchLocations(searchQuery, 8);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Location search failed:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    debouncedSearch(newQuery);
  };

  // Handle location selection
  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setQuery(location.name);
    setShowSuggestions(false);
    onChange(location);
  };

  // Clear selection
  const handleClear = () => {
    setSelectedLocation(null);
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    onChange(null);
  };

  // Detect current location
  const detectCurrentLocation = () => {
    if (!getGeolocationSupport()) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsDetectingLocation(true);
    getCurrentPosition(
      async (position) => {
        setUserLocation(position);
        setIsDetectingLocation(false);
        
        // Try to reverse geocode the coordinates
        try {
          const results = await searchLocations(
            `${position.latitude},${position.longitude}`, 
            1
          );
          
          if (results.length > 0) {
            const currentLocation: Location = {
              ...results[0],
              latitude: position.latitude,
              longitude: position.longitude,
              source: 'map'
            };
            handleLocationSelect(currentLocation);
          } else {
            // Create a generic location if reverse geocoding fails
            const genericLocation: Location = {
              id: Date.now(),
              name: `Current Location (${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)})`,
              latitude: position.latitude,
              longitude: position.longitude,
              source: 'map',
              state: 'Unknown'
            };
            handleLocationSelect(genericLocation);
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsDetectingLocation(false);
        alert(`Location detection failed: ${error.message}`);
      }
    );
  };

  // Handle map selection (when map is integrated)
  const handleMapSelect = (lat: number, lng: number) => {
    const mapLocation: Location = {
      id: Date.now(),
      name: `Selected Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      latitude: lat,
      longitude: lng,
      source: 'map',
      state: 'Unknown'
    };
    handleLocationSelect(mapLocation);
    setMapVisible(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.location-picker-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`location-picker-container ${className}`}>
      {label && (
        <label className="location-picker-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="location-picker-input-container">
        <div className="location-picker-input-wrapper">
          <Search className="location-picker-search-icon" />
          
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="location-picker-input"
          />
          
          <div className="location-picker-actions">
            {getGeolocationSupport() && (
              <button
                type="button"
                onClick={detectCurrentLocation}
                disabled={isDetectingLocation}
                className="location-picker-gps-btn"
                title="Detect current location"
              >
                <Target className={`w-4 h-4 ${isDetectingLocation ? 'animate-spin' : ''}`} />
              </button>
            )}
            
            {showMap && (
              <button
                type="button"
                onClick={() => setMapVisible(!mapVisible)}
                className="location-picker-map-btn"
                title="Select on map"
              >
                <Globe className="w-4 h-4" />
              </button>
            )}
            
            {selectedLocation && (
              <button
                type="button"
                onClick={handleClear}
                className="location-picker-clear-btn"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <div className="location-picker-suggestions">
            {isLoading ? (
              <div className="location-picker-loading">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span>Searching locations...</span>
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((location) => (
                <button
                  key={location.id || `${location.latitude}-${location.longitude}`}
                  type="button"
                  onClick={() => handleLocationSelect(location)}
                  className="location-picker-suggestion"
                >
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div className="location-picker-suggestion-content">
                    <div className="location-picker-suggestion-name">
                      {location.name}
                    </div>
                    {location.state && (
                      <div className="location-picker-suggestion-details">
                        {location.state}
                      </div>
                    )}
                    <div className="location-picker-suggestion-source">
                      {location.source === 'database' && '📍 Database'}
                      {location.source === 'nominatim' && '🌍 OpenStreetMap'}
                      {location.source === 'map' && '📍 Selected Location'}
                      {location.source === 'offline' && '💾 Offline'}
                    </div>
                  </div>
                  {Boolean(location.latitude && location.longitude) && (
                    <div className="location-picker-suggestion-coords">
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </div>
                  )}
                </button>
              ))
            ) : query.length >= 2 ? (
              <div className="location-picker-no-results">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>No locations found for "{query}"</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
      
      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="location-picker-selected">
          <Check className="w-4 h-4 text-green-600" />
          <div className="location-picker-selected-content">
            <div className="location-picker-selected-name">
              {selectedLocation.name}
            </div>
            {Boolean(selectedLocation.latitude && selectedLocation.longitude) && (
              <div className="location-picker-selected-coords">
                Coordinates: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Simple Map Integration Placeholder */}
      {mapVisible && showMap && (
        <div className="location-picker-map">
          <div className="location-picker-map-header">
            <h4>Select Location on Map</h4>
            <button
              type="button"
              onClick={() => setMapVisible(false)}
              className="location-picker-map-close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="location-picker-map-container">
            <div className="location-picker-map-placeholder">
              <MapPin className="w-8 h-8 text-gray-400" />
              <p>Interactive map integration would go here</p>
              <p className="text-sm text-gray-500">
                Click on the map to select a location
              </p>
              {/* Example coordinates for demo */}
              <button
                type="button"
                onClick={() => handleMapSelect(11.0168, 76.9558)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Select Coimbatore (Demo)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;