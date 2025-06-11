import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Location } from '../types';

interface SearchFormProps {
  locations: Location[];
  destinations: Location[];
  fromLocation: Location | null;
  toLocation: Location | null;
  setFromLocation: (location: Location) => void;
  setToLocation: (location: Location) => void;
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
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  
  const handleSelectFrom = (location: Location) => {
    setFromLocation(location);
    setShowFromDropdown(false);
    resetResults();
  };
  
  const handleSelectTo = (location: Location) => {
    setToLocation(location);
    setShowToDropdown(false);
    resetResults();
  };
  
  // Helper function to get the display name based on current language
  const getDisplayName = (location: Location): string => {
    if (i18n.language === 'ta' && location.translatedName) {
      return location.translatedName;
    }
    return location.name;
  };
  
  const isSearchEnabled = fromLocation !== null && toLocation !== null;
  
  return (
    <div className="search-form">
      <div className="form-group">
        <label htmlFor="from-location">{t('searchForm.from', 'From:')}</label>
        <div className="dropdown">
          <input
            id="from-location"
            type="text"
            value={fromLocation ? getDisplayName(fromLocation) : ''}
            onClick={() => setShowFromDropdown(!showFromDropdown)}
            readOnly
            placeholder={t('searchForm.selectDeparture', 'Select departure location')}
          />
          {showFromDropdown && (
            <div className="dropdown-content">
              {locations.map(location => (
                <div 
                  key={location.id}
                  className="dropdown-item"
                  onClick={() => handleSelectFrom(location)}
                >
                  {getDisplayName(location)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="to-location">{t('searchForm.to', 'To:')}</label>
        <div className="dropdown">
          <input
            id="to-location"
            type="text"
            value={toLocation ? getDisplayName(toLocation) : ''}
            onClick={() => setShowToDropdown(!showToDropdown)}
            readOnly
            placeholder={t('searchForm.selectDestination', 'Select destination')}
            disabled={fromLocation === null}
          />
          {showToDropdown && (
            <div className="dropdown-content">
              {destinations.map(location => (
                <div 
                  key={location.id}
                  className="dropdown-item"
                  onClick={() => handleSelectTo(location)}
                >
                  {getDisplayName(location)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <button 
        className="search-button"
        onClick={onSearch}
        disabled={!isSearchEnabled}
      >
        {t('searchForm.searchButton', 'Search Buses')}
      </button>
    </div>
  );
};

export default SearchForm;