import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Location } from '../types';

interface SearchFormProps {
  locations: Location[];
  destinations: Location[];
  fromLocation: Location | null;
  toLocation: Location | null;
  setFromLocation: (location: Location | null) => void;
  setToLocation: (location: Location | null) => void;
  onSearch: () => void;
  resetResults: () => void;
}

const SearchForm: React.FC<SearchFormProps> = ({
  locations,
  destinations,
  fromLocation,
  toLocation,
  setFromLocation,
  setToLocation,
  onSearch,
  resetResults
}) => {
  const { t, i18n } = useTranslation();
  const [showSearchPrompt, setShowSearchPrompt] = useState<boolean>(false);
  
  // State for autocomplete functionality
  const [fromSearchText, setFromSearchText] = useState<string>('');
  const [toSearchText, setToSearchText] = useState<string>('');
  const [showFromDropdown, setShowFromDropdown] = useState<boolean>(false);
  const [showToDropdown, setShowToDropdown] = useState<boolean>(false);
  
  // Refs for detecting clicks outside of dropdowns
  const fromInputRef = useRef<HTMLDivElement>(null);
  const toInputRef = useRef<HTMLDivElement>(null);
  
  // Get the display name for a location based on current language
  const getLocalizedName = useCallback((location: Location): string => {
    // Check for translation in different possible location properties
    if (i18n.language === 'ta') {
      // Try all possible ways the translation might be available
      if (location.translations && location.translations.ta && location.translations.ta.name) {
        return location.translations.ta.name;
      } else if (location.translatedNames && location.translatedNames.ta) {
        return location.translatedNames.ta;
      } else if (location.translatedName) {
        return location.translatedName;
      } else if (location.taName) {
        return location.taName;
      } else {
        // If location name is one of the known locations, provide hardcoded Tamil name
        // as a fallback
        const tamilNames: Record<string, string> = {
          'Chennai': 'சென்னை',
          'Coimbatore': 'கோயம்புத்தூர்',
          'Madurai': 'மதுரை',
          'Trichy': 'திருச்சி',
          'Salem': 'சேலம்',
          'Tirunelveli': 'திருநெல்வேலி',
          'Vellore': 'வேலூர்',
          'Thanjavur': 'தஞ்சாவூர்',
          'Kanyakumari': 'கன்னியாகுமரி'
        };
        
        return tamilNames[location.name] || location.name;
      }
    }
    return location.name;
  }, [i18n.language]);

  // Ensure locations and destinations are arrays before attempting to filter
  const locationsArray = Array.isArray(locations) ? locations : [];
  const destinationsArray = Array.isArray(destinations) ? destinations : [];

  // Filter locations based on search text
  const filteredFromLocations = locationsArray.filter(location => 
    fromSearchText === '' || getLocalizedName(location).toLowerCase().includes(fromSearchText.toLowerCase())
  );
  
  const filteredToLocations = destinationsArray.filter(location => 
    toSearchText === '' || getLocalizedName(location).toLowerCase().includes(toSearchText.toLowerCase())
  );
  
  // Listen for language changes and update text displays without resetting selected values
  useEffect(() => {
    // When language changes, just update the display text without changing selections
    const handleLanguageChange = () => {
      if (fromLocation) {
        setFromSearchText(getLocalizedName(fromLocation));
      }
      if (toLocation) {
        setToSearchText(getLocalizedName(toLocation));
      }
    };

    // Add listener for language changes
    i18n.on('languageChanged', handleLanguageChange);
    
    // Call immediately when mounting to ensure proper initial state
    handleLanguageChange();

    // Clean up listener when component unmounts
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n, fromLocation, toLocation, getLocalizedName]);
  
  // Initialize search text when locations are selected (separate from language changes)
  useEffect(() => {
    if (fromLocation) {
      setFromSearchText(getLocalizedName(fromLocation));
    } else {
      setFromSearchText('');
    }
  }, [fromLocation, getLocalizedName]);
  
  useEffect(() => {
    if (toLocation) {
      setToSearchText(getLocalizedName(toLocation));
    } else {
      setToSearchText('');
    }
  }, [toLocation, getLocalizedName]);
  
  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromInputRef.current && !fromInputRef.current.contains(event.target as Node)) {
        setShowFromDropdown(false);
      }
      if (toInputRef.current && !toInputRef.current.contains(event.target as Node)) {
        setShowToDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle from input change
  const handleFromInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFromSearchText(value);
    setShowFromDropdown(true);
    
    // If input is cleared, reset from location
    if (value === '') {
      setFromLocation(null);
      setToLocation(null);
      resetResults();
    } else {
      // Try to find exact match
      const exactMatch = locationsArray.find(
        location => getLocalizedName(location).toLowerCase() === value.toLowerCase()
      );
      
      if (exactMatch) {
        setFromLocation(exactMatch);
        setToLocation(null);
        resetResults();
      }
    }
  };
  
  // Handle to input change
  const handleToInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToSearchText(value);
    setShowToDropdown(true);
    
    // If input is cleared, reset to location
    if (value === '') {
      setToLocation(null);
      resetResults();
    } else {
      // Try to find exact match
      const exactMatch = destinationsArray.find(
        location => getLocalizedName(location).toLowerCase() === value.toLowerCase()
      );
      
      if (exactMatch) {
        setToLocation(exactMatch);
        setShowSearchPrompt(true);
        resetResults();
      }
    }
  };
  
  // Handle location selection from dropdown
  const handleFromLocationSelect = (location: Location) => {
    setFromLocation(location);
    setFromSearchText(getLocalizedName(location));
    setShowFromDropdown(false);
    setToLocation(null);
    setToSearchText('');
    resetResults();
  };
  
  const handleToLocationSelect = (location: Location) => {
    setToLocation(location);
    setToSearchText(getLocalizedName(location));
    setShowToDropdown(false);
    setShowSearchPrompt(true);
    resetResults();
  };
  
  // Toggle dropdown visibility
  const toggleFromDropdown = () => {
    setShowFromDropdown(!showFromDropdown);
    if (!showFromDropdown) {
      setShowToDropdown(false);
    }
  };
  
  const toggleToDropdown = () => {
    if (fromLocation) {
      setShowToDropdown(!showToDropdown);
      if (!showToDropdown) {
        setShowFromDropdown(false);
      }
    }
  };
  
  return (
    <section className="search-section">
      <div className="search-container">
        <div className="form-group" ref={fromInputRef}>
          <label htmlFor="from">{t('search.from')}</label>
          <div className="combobox-container">
            <input 
              id="from"
              type="text"
              className="form-input combobox-input"
              value={fromSearchText}
              onChange={handleFromInputChange}
              placeholder={t('search.typeDeparture', 'Type or select departure location')}
              onClick={() => setShowFromDropdown(true)}
              aria-expanded={showFromDropdown}
              role="combobox"
            />
            <button 
              type="button"
              className="dropdown-toggle"
              onClick={toggleFromDropdown}
              aria-label={t('common.toggleDropdown', 'Toggle dropdown')}
            >
            </button>
            {showFromDropdown && filteredFromLocations.length > 0 && (
              <div className="location-dropdown" role="listbox">
                {filteredFromLocations.map(location => (
                  <div 
                    key={location.id} 
                    className={`location-item ${fromLocation?.id === location.id ? 'selected' : ''}`}
                    onClick={() => handleFromLocationSelect(location)}
                    role="option"
                    aria-selected={fromLocation?.id === location.id}
                  >
                    {getLocalizedName(location)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-group" ref={toInputRef}>
          <label htmlFor="to">{t('search.to')}</label>
          <div className="combobox-container">
            <input 
              id="to"
              type="text"
              className="form-input combobox-input"
              value={toSearchText}
              onChange={handleToInputChange}
              placeholder={t('search.typeDestination', 'Type or select destination location')}
              onClick={() => fromLocation && setShowToDropdown(true)}
              disabled={!fromLocation}
              aria-expanded={showToDropdown}
              role="combobox"
            />
            <button 
              type="button"
              className="dropdown-toggle"
              onClick={toggleToDropdown}
              disabled={!fromLocation}
              aria-label={t('common.toggleDropdown', 'Toggle dropdown')}
            >
            </button>
            {showToDropdown && filteredToLocations.length > 0 && fromLocation && (
              <div className="location-dropdown" role="listbox">
                {filteredToLocations.map(location => (
                  <div 
                    key={location.id} 
                    className={`location-item ${toLocation?.id === location.id ? 'selected' : ''}`}
                    onClick={() => handleToLocationSelect(location)}
                    role="option"
                    aria-selected={toLocation?.id === location.id}
                  >
                    {getLocalizedName(location)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button 
          className="search-button" 
          onClick={() => {
            onSearch();
            setShowSearchPrompt(false);
          }}
          disabled={!fromLocation || !toLocation}
        >
          {t('search.searchButton')}
        </button>
        
        {showSearchPrompt && fromLocation && toLocation && (
          <div className="search-prompt">
            <p>{t('search.clickSearch', { 
              from: getLocalizedName(fromLocation), 
              to: getLocalizedName(toLocation) 
            })}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default SearchForm;