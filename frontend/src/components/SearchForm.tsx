import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Location } from '../types/apiTypes';
import '../styles/SearchForm.css';
import '../styles/ModernSearchForm.css';
import LocationDropdown from './search/LocationDropdown';

export interface SearchFormProps {
  locations: Location[];
  destinations: Location[];
  fromLocation: Location;
  toLocation: Location;
  onFromLocationChange: (location: Location) => void;
  onToLocationChange: (location: Location) => void;
  onSearch: () => void;
  isLoading: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({
  locations,
  destinations,
  fromLocation,
  toLocation,
  onFromLocationChange,
  onToLocationChange,
  onSearch,
  isLoading
}) => {
  const { t } = useTranslation();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const handleSwapLocations = () => {
    if (fromLocation && toLocation) {
      const temp = fromLocation;
      onFromLocationChange(toLocation);
      onToLocationChange(temp);
    }
  };
  
  return (
    <div className="search-form-container">
      <div className="modern-search-form ria-fade-in" role="search" aria-label={t('search.formLabel', 'Bus search form')}>
        <div className="search-form-header">
          <h1 className="search-form-title" id="search-title">
            {t('search.title', 'Find Your Bus')}
          </h1>
          <p className="search-form-subtitle" id="search-description">
            {t('search.subtitle', 'Discover the best routes for your journey')}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} aria-labelledby="search-title" aria-describedby="search-description">
          <div className="ria-form-group">
            <label htmlFor="fromLocation" className="ria-form-label">
              <span aria-hidden="true">📍</span> {t('search.from', 'From')}
              <span className="sr-only">{t('search.fromDescription', 'Select departure location')}</span>
            </label>
            <div className="location-dropdown-wrapper">
              <LocationDropdown
                id="fromLocation"
                label=""
                placeholder={t('search.selectLocation', 'Select a location')}
                selectedLocation={fromLocation}
                onSelect={onFromLocationChange}
                disabled={isLoading}
                locations={locations}
                aria-describedby="from-location-help"
              />
              <div id="from-location-help" className="sr-only">
                {t('search.fromLocationHelp', 'Choose where your journey begins')}
              </div>
            </div>
          </div>
          
          <div className="location-swap-container">
            <button
              type="button"
              className="location-swap-button ria-no-tap-highlight"
              onClick={handleSwapLocations}
              disabled={!fromLocation || !toLocation || isLoading}
              aria-label={t('search.swapLocations', 'Swap from and to locations')}
              title={t('search.swapLocations', 'Swap from and to locations')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16 17L21 12L16 7V10H8V14H16V17Z"/>
                <path d="M8 7L3 12L8 17V14H16V10H8V7Z"/>
              </svg>
              <span className="sr-only">{t('search.swapLocationsDescription', 'Exchange departure and destination locations')}</span>
            </button>
          </div>
          
          <div className="ria-form-group">
            <label htmlFor="toLocation" className="ria-form-label">
              <span aria-hidden="true">🎯</span> {t('search.to', 'To')}
              <span className="sr-only">{t('search.toDescription', 'Select destination location')}</span>
            </label>
            <div className="location-dropdown-wrapper">
              <LocationDropdown
                id="toLocation"
                label=""
                placeholder={t('search.selectDestination', 'Select a destination')}
                selectedLocation={toLocation}
                onSelect={onToLocationChange}
                disabled={isLoading || !fromLocation}
                excludeLocations={fromLocation ? [fromLocation] : []}
                locations={destinations}
                aria-describedby="to-location-help"
              />
              <div id="to-location-help" className="sr-only">
                {!fromLocation 
                  ? t('search.toLocationHelpDisabled', 'Please select a departure location first')
                  : t('search.toLocationHelp', 'Choose where your journey ends')
                }
              </div>
            </div>
          </div>
        
          <div className="search-actions">
            <div className="search-button-group">
              <button 
                type="submit" 
                className="primary-search-button ria-button primary ria-touch-target"
                disabled={isLoading || !fromLocation || !toLocation}
                aria-label={t('search.findBusesLabel', 'Search for buses between selected locations')}
                aria-describedby="search-button-help"
              >
                <svg className="search-icon" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                {isLoading 
                  ? t('search.searching', 'Searching...') 
                  : t('search.findBuses', 'Find Buses')}
                {isLoading && <span className="sr-only">{t('search.searchingDescription', 'Please wait while we search for buses')}</span>}
              </button>
              <div id="search-button-help" className="sr-only">
                {!fromLocation || !toLocation 
                  ? t('search.searchButtonHelpDisabled', 'Please select both departure and destination locations to search')
                  : t('search.searchButtonHelp', 'Click to find buses for your selected route')
                }
              </div>
            </div>
          </div>
          
        </form>
        
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchForm;