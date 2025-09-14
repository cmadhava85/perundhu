import React, { useState, useEffect, useCallback } from 'react';
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
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  
  // Reference data state
  const [busTypes, setBusTypes] = useState<BusType[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [departureTimeSlots, setDepartureTimeSlots] = useState<DepartureTimeSlot[]>([]);
  const [isLoadingReferenceData, setIsLoadingReferenceData] = useState<boolean>(false);
  
  // Memoize fetchReferenceData to prevent recreation on each render
  const fetchReferenceData = useCallback(async () => {
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
    }
  }, []);
  
  // Fetch reference data when component mounts or when advanced options are shown
  useEffect(() => {
    if (showAdvanced && !busTypes.length) {
      fetchReferenceData();
    }
  }, [showAdvanced, busTypes.length, fetchReferenceData]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };
  
  return (
    <div className="search-form-container">
      <h1 className="search-title">{t('search.title', 'Find Your Bus')}</h1>
      
      <form onSubmit={handleSubmit} className="search-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fromLocation">{t('search.from', 'From')}</label>
            <LocationDropdown
              id="fromLocation"
              label=""
              placeholder={t('search.selectLocation', 'Select a location')}
              selectedLocation={fromLocation}
              onSelect={onFromLocationChange}
              disabled={isLoading}
              locations={locations}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="toLocation">{t('search.to', 'To')}</label>
            <LocationDropdown
              id="toLocation"
              label=""
              placeholder={t('search.selectDestination', 'Select a destination')}
              selectedLocation={toLocation}
              onSelect={onToLocationChange}
              disabled={isLoading || !fromLocation}
              excludeLocations={fromLocation ? [fromLocation] : []}
              locations={destinations}
            />
          </div>
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
      
      <div className="search-tips">
        <h3>{t('search.tipsTitle', 'Search Tips')}</h3>
        <ul>
          <li>{t('search.tip1', 'Book in advance for better availability')}</li>
          <li>{t('search.tip2', 'Check for connecting buses if direct routes are not available')}</li>
          <li>{t('search.tip3', 'Night buses often have better availability')}</li>
        </ul>
      </div>
    </div>
  );
};

export default SearchForm;