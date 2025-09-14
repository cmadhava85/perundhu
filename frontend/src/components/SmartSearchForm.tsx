import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Location } from '../types';
import '../styles/mobile-first.css';

interface SmartSearchFormProps {
  locations: Location[];
  destinations: Location[];
  fromLocation: Location | null;
  toLocation: Location | null;
  onFromLocationChange: (location: Location | null) => void;
  onToLocationChange: (location: Location | null) => void;
  onSearch: () => void;
  isLoading?: boolean;
  className?: string;
}

const SmartSearchForm: React.FC<SmartSearchFormProps> = ({
  locations,
  destinations,
  fromLocation,
  toLocation,
  onFromLocationChange,
  onToLocationChange,
  onSearch,
  isLoading = false,
  className = ''
}) => {
  const { t } = useTranslation();
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const fromDropdownRef = useRef<HTMLDivElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);

  // Filter locations based on query
  const getFilteredLocations = (query: string, locationList: Location[]) => {
    if (!query.trim()) return locationList.slice(0, 8);
    return locationList
      .filter(location => 
        location.name.toLowerCase().includes(query.toLowerCase()) ||
        location.name.toLowerCase().startsWith(query.toLowerCase())
      )
      .slice(0, 8);
  };

  const filteredFromLocations = getFilteredLocations(fromQuery, locations);
  const filteredToLocations = getFilteredLocations(toQuery, destinations);

  // Handle location selection
  const handleFromSelect = (location: Location) => {
    onFromLocationChange(location);
    setFromQuery(location.name);
    setShowFromSuggestions(false);
  };

  const handleToSelect = (location: Location) => {
    onToLocationChange(location);
    setToQuery(location.name);
    setShowToSuggestions(false);
  };

  // Handle input changes
  const handleFromInput = (value: string) => {
    setFromQuery(value);
    setShowFromSuggestions(true);
    if (!value.trim()) {
      onFromLocationChange(null);
    }
  };

  const handleToInput = (value: string) => {
    setToQuery(value);
    setShowToSuggestions(true);
    if (!value.trim()) {
      onToLocationChange(null);
    }
  };

  // Swap locations with animation
  const handleSwapLocations = () => {
    setIsSwapping(true);
    setTimeout(() => {
      const tempLocation = fromLocation;
      const tempQuery = fromQuery;
      
      onFromLocationChange(toLocation);
      onToLocationChange(tempLocation);
      setFromQuery(toQuery);
      setToQuery(tempQuery);
      
      setIsSwapping(false);
    }, 150);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromDropdownRef.current && !fromDropdownRef.current.contains(event.target as Node)) {
        setShowFromSuggestions(false);
      }
      if (toDropdownRef.current && !toDropdownRef.current.contains(event.target as Node)) {
        setShowToSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize input values when locations change
  useEffect(() => {
    if (fromLocation && fromQuery !== fromLocation.name) {
      setFromQuery(fromLocation.name);
    }
  }, [fromLocation, fromQuery]);

  useEffect(() => {
    if (toLocation && toQuery !== toLocation.name) {
      setToQuery(toLocation.name);
    }
  }, [toLocation, toQuery]);

  const canSearch = fromLocation && toLocation && !isLoading;

  return (
    <div className={`card animate-fade-in ${className}`}>
      <div className="card-body">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('search.title', 'Find Your Journey')}
          </h2>
          <p className="text-gray-600">
            {t('search.subtitle', 'Discover bus routes across Tamil Nadu')}
          </p>
        </div>

        {/* Search Form */}
        <div className="space-y-4">
          {/* Location Inputs Container */}
          <div className="relative">
            {/* From Location */}
            <div className="relative" ref={fromDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <span className="text-green-600">🟢</span>
                  {t('search.from', 'From')}
                </span>
              </label>
              <div className="relative">
                <input
                  ref={fromInputRef}
                  type="text"
                  value={fromQuery}
                  onChange={(e) => handleFromInput(e.target.value)}
                  onFocus={() => setShowFromSuggestions(true)}
                  placeholder={t('search.fromPlaceholder', 'Enter departure location')}
                  className="form-control pl-12 pr-10"
                  autoComplete="off"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-gray-400">📍</span>
                </div>
                {fromLocation && (
                  <button
                    onClick={() => {
                      onFromLocationChange(null);
                      setFromQuery('');
                      fromInputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* From Suggestions Dropdown */}
              {showFromSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-64 overflow-y-auto">
                  {filteredFromLocations.length > 0 ? (
                    filteredFromLocations.map((location) => (
                      <button
                        key={location.id}
                        onClick={() => handleFromSelect(location)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                      >
                        <span className="text-gray-400">📍</span>
                        <div>
                          <div className="font-medium text-gray-900">{location.name}</div>
                          <div className="text-sm text-gray-500">
                            {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-center">
                      {t('search.noLocationsFound', 'No locations found')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center my-4">
              <button
                onClick={handleSwapLocations}
                disabled={isSwapping}
                className={`
                  w-12 h-12 rounded-full border-2 border-gray-200 bg-white shadow-md
                  flex items-center justify-center transition-all duration-200
                  hover:border-primary-300 hover:bg-primary-50 hover:shadow-lg
                  disabled:opacity-50
                  ${isSwapping ? 'animate-spin' : ''}
                `}
                aria-label={t('search.swapLocations', 'Swap locations')}
              >
                <span className="text-lg">🔄</span>
              </button>
            </div>

            {/* To Location */}
            <div className="relative" ref={toDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <span className="text-red-600">🔴</span>
                  {t('search.to', 'To')}
                </span>
              </label>
              <div className="relative">
                <input
                  ref={toInputRef}
                  type="text"
                  value={toQuery}
                  onChange={(e) => handleToInput(e.target.value)}
                  onFocus={() => setShowToSuggestions(true)}
                  placeholder={t('search.toPlaceholder', 'Enter destination')}
                  className="form-control pl-12 pr-10"
                  autoComplete="off"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-gray-400">🎯</span>
                </div>
                {toLocation && (
                  <button
                    onClick={() => {
                      onToLocationChange(null);
                      setToQuery('');
                      toInputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* To Suggestions Dropdown */}
              {showToSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-64 overflow-y-auto">
                  {filteredToLocations.length > 0 ? (
                    filteredToLocations.map((location) => (
                      <button
                        key={location.id}
                        onClick={() => handleToSelect(location)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                      >
                        <span className="text-gray-400">🎯</span>
                        <div>
                          <div className="font-medium text-gray-900">{location.name}</div>
                          <div className="text-sm text-gray-500">
                            {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-center">
                      {t('search.noLocationsFound', 'No locations found')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={onSearch}
            disabled={!canSearch}
            className={`
              w-full btn btn-lg transition-all duration-200
              ${canSearch 
                ? 'btn-primary hover:shadow-lg active:scale-98' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t('search.searching', 'Searching...')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span>🔍</span>
                <span>{t('search.findBuses', 'Find Buses')}</span>
                <span>→</span>
              </div>
            )}
          </button>

          {/* Quick Tips */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <span>💡</span>
              {t('search.tips', 'Search Tips')}
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• {t('search.tip1', 'Type the first few letters of your location')}</li>
              <li>• {t('search.tip2', 'Use the swap button to reverse your journey')}</li>
              <li>• {t('search.tip3', 'Select from the dropdown for accurate results')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSearchForm;