import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Location } from '../types';
import '../styles/SearchForm.css';

export interface SearchFormProps {
  locations: Location[];
  destinations: Location[];
  fromLocation: Location | null;
  toLocation: Location | null;
  setFromLocation: (location: Location | null) => void;
  setToLocation: (location: Location | null) => void;
  onSearch: () => void;
  resetResults: () => void;
  includeIntermediateStops?: boolean;
  onToggleIntermediateStops?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  locations,
  destinations,
  fromLocation,
  toLocation,
  setFromLocation,
  setToLocation,
  onSearch,
  resetResults,
  includeIntermediateStops,
  onToggleIntermediateStops
}) => {
  const { t, i18n } = useTranslation();
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [fromSearchTerm, setFromSearchTerm] = useState('');
  const [toSearchTerm, setToSearchTerm] = useState('');
  
  const fromDropdownRef = useRef<HTMLDivElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromDropdownRef.current && !fromDropdownRef.current.contains(event.target as Node)) {
        setShowFromDropdown(false);
      }
      if (toDropdownRef.current && !toDropdownRef.current.contains(event.target as Node)) {
        setShowToDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSelectFrom = (location: Location) => {
    setFromLocation(location);
    setShowFromDropdown(false);
    setFromSearchTerm('');
    resetResults();
  };
  
  const handleSelectTo = (location: Location) => {
    setToLocation(location);
    setShowToDropdown(false);
    setToSearchTerm('');
    resetResults();
  };
  
  // Helper function to get the display name based on current language
  const getDisplayName = (location: Location): string => {
    // Use optional chaining to safely access translatedName
    if (i18n.language === 'ta' && location.translatedName) {
      return location.translatedName;
    }
    return location.name;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  // Filter locations based on search term
  const filteredFromLocations = locations.filter(location =>
    getDisplayName(location).toLowerCase().includes(fromSearchTerm.toLowerCase())
  );
  
  const filteredToLocations = destinations.filter(location =>
    getDisplayName(location).toLowerCase().includes(toSearchTerm.toLowerCase())
  );
  
  const isSearchEnabled = fromLocation !== null && toLocation !== null;
  
  // Swap locations function
  const swapLocations = () => {
    if (fromLocation && toLocation) {
      const temp = fromLocation;
      setFromLocation(toLocation);
      setToLocation(temp);
      resetResults();
    }
  };
  
  return (
    <div className="search-form mobile-optimized">
      <div className="search-inputs-container">
        {/* From Location */}
        <div className="form-group" ref={fromDropdownRef}>
          <label htmlFor="from-location" className="sr-only">
            {t('searchForm.from', 'From:')}
          </label>
          <div className="input-container">
            <div className="input-icon">📍</div>
            <input
              id="from-location"
              type="text"
              className="location-input"
              value={showFromDropdown ? fromSearchTerm : (fromLocation ? getDisplayName(fromLocation) : '')}
              onChange={(e) => setFromSearchTerm(e.target.value)}
              onFocus={() => {
                setShowFromDropdown(true);
                setFromSearchTerm('');
              }}
              placeholder={t('common.whereLeavingFrom', 'Where are you leaving from?')}
              autoComplete="off"
            />
            {fromLocation && (
              <button 
                className="clear-button"
                onClick={() => {
                  setFromLocation(null);
                  setFromSearchTerm('');
                  resetResults();
                }}
                aria-label={t('searchForm.clearFrom', 'Clear departure location')}
              >
                ✕
              </button>
            )}
          </div>
          {showFromDropdown && (
            <div className="dropdown-content mobile-dropdown">
              {filteredFromLocations.length > 0 ? (
                filteredFromLocations.map(location => (
                  <div 
                    key={location.id}
                    className="dropdown-item"
                    onClick={() => handleSelectFrom(location)}
                  >
                    <span className="location-icon">📍</span>
                    <span className="location-name">{getDisplayName(location)}</span>
                  </div>
                ))
              ) : (
                <div className="dropdown-item disabled">
                  {t('common.noLocationsFound', 'No locations found matching your search')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Swap Button */}
        <div className="swap-container">
          <button 
            className="swap-button"
            onClick={swapLocations}
            disabled={!fromLocation || !toLocation}
            aria-label={t('searchForm.swapLocations', 'Swap locations')}
          >
            ⇅
          </button>
        </div>

        {/* To Location */}
        <div className="form-group" ref={toDropdownRef}>
          <label htmlFor="to-location" className="sr-only">
            {t('searchForm.to', 'To:')}
          </label>
          <div className="input-container">
            <div className="input-icon">🎯</div>
            <input
              id="to-location"
              type="text"
              className="location-input"
              value={showToDropdown ? toSearchTerm : (toLocation ? getDisplayName(toLocation) : '')}
              onChange={(e) => setToSearchTerm(e.target.value)}
              onFocus={() => {
                setShowToDropdown(true);
                setToSearchTerm('');
              }}
              placeholder={t('common.whereGoingTo', 'Where are you going to?')}
              disabled={fromLocation === null}
              autoComplete="off"
            />
            {toLocation && (
              <button 
                className="clear-button"
                onClick={() => {
                  setToLocation(null);
                  setToSearchTerm('');
                  resetResults();
                }}
                aria-label={t('searchForm.clearTo', 'Clear destination')}
              >
                ✕
              </button>
            )}
          </div>
          {showToDropdown && (
            <div className="dropdown-content mobile-dropdown">
              {filteredToLocations.length > 0 ? (
                filteredToLocations.map(location => (
                  <div 
                    key={location.id}
                    className="dropdown-item"
                    onClick={() => handleSelectTo(location)}
                  >
                    <span className="location-icon">🎯</span>
                    <span className="location-name">{getDisplayName(location)}</span>
                  </div>
                ))
              ) : (
                <div className="dropdown-item disabled">
                  {t('common.noLocationsFound', 'No locations found matching your search')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Search Button */}
        <button 
          className={`search-button mobile-search-button ${isSearchEnabled ? 'enabled' : 'disabled'}`}
          onClick={onSearch}
          disabled={!isSearchEnabled}
        >
          <span className="search-icon">🔍</span>
          <span className="search-text">
            {isSearchEnabled 
              ? t('searchForm.searchButton', 'Search Buses') 
              : t('common.bothLocationsRequired', 'Please select both origin and destination locations')
            }
          </span>
          {isSearchEnabled && <span className="search-arrow">→</span>}
        </button>

        {/* Intermediate Stops Toggle */}
        {includeIntermediateStops !== undefined && onToggleIntermediateStops && (
          <div className="intermediate-stops-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={includeIntermediateStops}
                onChange={onToggleIntermediateStops}
              />
              <span className="slider"></span>
              {t('searchForm.includeIntermediateStops', 'Include intermediate stops')}
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchForm;