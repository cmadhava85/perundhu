<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
=======
import React, { useState, useRef, useEffect } from 'react';
>>>>>>> 75c2859 (production ready code need to test)
import { useTranslation } from 'react-i18next';
import type { Location } from '../types/apiTypes';
import '../styles/SearchForm.css';
import type { 
  BusType, 
  Operator, 
  DepartureTimeSlot 
} from '../services/referenceDataService';
import { 
  getBusTypes, 
  getOperators, 
  getDepartureTimeSlots
} from '../services/referenceDataService';

export interface SearchFormProps {
  locations: Location[];
  destinations: Location[];
<<<<<<< HEAD
  fromLocation: Location;
  toLocation: Location;
  onFromLocationChange: (location: Location) => void;
  onToLocationChange: (location: Location) => void;
  onSearch: () => void;
  isLoading: boolean;
=======
  fromLocation: Location | null;
  toLocation: Location | null;
  setFromLocation: (location: Location | null) => void;
  setToLocation: (location: Location | null) => void;
  onSearch: () => void;
  resetResults: () => void;
  // Add back these props for desktop compatibility
  includeIntermediateStops?: boolean;
  onToggleIntermediateStops?: () => void;
  // Additional props expected by tests
  onFromChange?: (location: Location | null) => void;
  onToChange?: (location: Location | null) => void;
  isLoading?: boolean;
  error?: string | null;
>>>>>>> 75c2859 (production ready code need to test)
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
<<<<<<< HEAD
  const { t } = useTranslation();
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  
  // Reference data state
  const [busTypes, setBusTypes] = useState<BusType[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [departureTimeSlots, setDepartureTimeSlots] = useState<DepartureTimeSlot[]>([]);
  const [isLoadingReferenceData, setIsLoadingReferenceData] = useState<boolean>(false);
  
  // Fetch reference data when component mounts or when advanced options are shown
  useEffect(() => {
    if (showAdvanced && !busTypes.length) {
      fetchReferenceData();
    }
  }, [showAdvanced]);
  
  const fetchReferenceData = async () => {
    setIsLoadingReferenceData(true);
    try {
      const [busTypesData, operatorsData, departureTimeSlotsData] = await Promise.all([
        getBusTypes(),
        getOperators(),
        getDepartureTimeSlots()
      ]);
      
      setBusTypes(busTypesData);
      setOperators(operatorsData);
      setDepartureTimeSlots(departureTimeSlotsData);
    } catch (error) {
      console.error('Error fetching reference data:', error);
    } finally {
      setIsLoadingReferenceData(false);
=======
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
    if (i18n.language === 'ta' && location.translatedName) {
      return location.translatedName;
>>>>>>> 75c2859 (production ready code need to test)
    }
  };
  
<<<<<<< HEAD
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };
=======
  // Filter locations based on search term
  const filteredFromLocations = locations.filter(location =>
    getDisplayName(location).toLowerCase().includes(fromSearchTerm.toLowerCase())
  );
  
  const filteredToLocations = destinations.filter(location =>
    getDisplayName(location).toLowerCase().includes(toSearchTerm.toLowerCase())
  );
  
  const isSearchEnabled = fromLocation !== null && toLocation !== null;
>>>>>>> 75c2859 (production ready code need to test)
  
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
<<<<<<< HEAD
    <div className="search-form-container">
      <h1 className="search-title">{t('search.title', 'Find Your Bus')}</h1>
      
      <form onSubmit={handleSubmit} className="search-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fromLocation">{t('search.from', 'From')}</label>
            <select
              id="fromLocation"
              value={fromLocation?.id || ''}
              onChange={(e) => {
                const selectedId = Number(e.target.value);
                const selectedLocation = locations.find(loc => loc.id === selectedId);
                if (selectedLocation) {
                  onFromLocationChange(selectedLocation);
                }
              }}
              disabled={isLoading}
              className="form-control"
            >
              <option value="">{t('search.selectLocation', 'Select a location')}</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="toLocation">{t('search.to', 'To')}</label>
            <select
              id="toLocation"
              value={toLocation?.id || ''}
              onChange={(e) => {
                const selectedId = Number(e.target.value);
                const selectedLocation = destinations.find(loc => loc.id === selectedId);
                if (selectedLocation) {
                  onToLocationChange(selectedLocation);
                }
              }}
              disabled={isLoading}
              className="form-control"
            >
              <option value="">{t('search.selectDestination', 'Select a destination')}</option>
              {destinations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="date">{t('search.date', 'Date')}</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              disabled={isLoading}
              className="form-control"
            />
          </div>
=======
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
                  setFromLocation(null as any);
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
                  setToLocation(null as any);
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
>>>>>>> 75c2859 (production ready code need to test)
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced 
              ? t('search.hideAdvanced', 'Hide Advanced Options') 
              : t('search.showAdvanced', 'Show Advanced Options')}
          </button>
          
          <button 
            type="submit" 
            className="search-button"
            disabled={isLoading || !fromLocation || !toLocation}
          >
            {isLoading 
              ? t('search.searching', 'Searching...') 
              : t('search.findBuses', 'Find Buses')}
          </button>
        </div>
        
        {showAdvanced && (
          <div className="advanced-options">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="busType">{t('search.busType', 'Bus Type')}</label>
                <select 
                  id="busType" 
                  className="form-control"
                  disabled={isLoading || isLoadingReferenceData}
                >
                  <option value="">{t('search.allTypes', 'All Types')}</option>
                  {busTypes.map(busType => (
                    <option key={busType.id} value={busType.id.toString()}>
                      {busType.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="departureTime">{t('search.departureTime', 'Departure Time')}</label>
                <select 
                  id="departureTime" 
                  className="form-control"
                  disabled={isLoading || isLoadingReferenceData}
                >
                  <option value="">{t('search.anyTime', 'Any Time')}</option>
                  {departureTimeSlots.map(slot => (
                    <option key={slot.id} value={slot.id.toString()}>
                      {slot.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="operator">{t('search.operator', 'Operator')}</label>
                <select 
                  id="operator" 
                  className="form-control"
                  disabled={isLoading || isLoadingReferenceData}
                >
                  <option value="">{t('search.allOperators', 'All Operators')}</option>
                  {operators.map(operator => (
                    <option key={operator.id} value={operator.id.toString()}>
                      {operator.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </form>
      
<<<<<<< HEAD
      <div className="search-tips">
        <h3>{t('search.tipsTitle', 'Search Tips')}</h3>
        <ul>
          <li>{t('search.tip1', 'Book in advance for better availability')}</li>
          <li>{t('search.tip2', 'Check for connecting buses if direct routes are not available')}</li>
          <li>{t('search.tip3', 'Night buses often have better availability')}</li>
        </ul>
      </div>
=======
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
>>>>>>> 75c2859 (production ready code need to test)
    </div>
  );
};

export default SearchForm;