import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Location, SearchFilters } from '../../types';
import LocationInput from './LocationInput';

interface SmartSearchFormProps {
  searchFilters: SearchFilters;
  fromLocation: Location | null;
  toLocation: Location | null;
  fromSuggestions: Location[];
  toSuggestions: Location[];
  showFromSuggestions: boolean;
  showToSuggestions: boolean;
  isLoading: boolean;
  onFiltersChange: (filters: SearchFilters) => void;
  onFromSearch: (query: string) => void;
  onToSearch: (query: string) => void;
  onFromSelect: (location: Location) => void;
  onToSelect: (location: Location) => void;
  onSwapLocations: () => void;
  onSearch: () => void;
}

const SmartSearchForm: React.FC<SmartSearchFormProps> = ({
  searchFilters,
  fromLocation,
  toLocation,
  fromSuggestions,
  toSuggestions,
  showFromSuggestions,
  showToSuggestions,
  isLoading,
  onFiltersChange,
  onFromSearch,
  onToSearch,
  onFromSelect,
  onToSelect,
  onSwapLocations,
  onSearch,
}) => {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Get today's date in YYYY-MM-DD format for min date validation
  const today = new Date().toISOString().split('T')[0];

  // Validate form before search
  const validateForm = useCallback(() => {
    const errors: { [key: string]: string } = {};

    if (!fromLocation) {
      errors.from = t('search.errors.fromRequired', 'Please select a departure location');
    }

    if (!toLocation) {
      errors.to = t('search.errors.toRequired', 'Please select a destination location');
    }

    if (fromLocation && toLocation && fromLocation.id === toLocation.id) {
      errors.locations = t('search.errors.sameLocation', 'Departure and destination cannot be the same');
    }

    if (searchFilters.departureDate && searchFilters.departureDate < today) {
      errors.date = t('search.errors.pastDate', 'Please select a future date');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [fromLocation, toLocation, searchFilters.departureDate, today, t]);

  // Handle search with validation
  const handleSearch = useCallback(() => {
    if (validateForm()) {
      onSearch();
    }
  }, [validateForm, onSearch]);

  // Handle date change with validation
  const handleDateChange = useCallback((date: string) => {
    onFiltersChange({ ...searchFilters, departureDate: date });
    // Clear date error if it exists
    if (formErrors.date) {
      setFormErrors(prev => ({ ...prev, date: '' }));
    }
  }, [searchFilters, onFiltersChange, formErrors.date]);

  // Handle location selection with validation
  const handleFromSelect = useCallback((location: Location) => {
    onFromSelect(location);
    // Clear related errors
    setFormErrors(prev => ({ ...prev, from: '', locations: '' }));
  }, [onFromSelect]);

  const handleFromChange = useCallback((location: Location | null) => {
    if (location) {
      onFromSelect(location);
    }
  }, [onFromSelect]);

  const handleToChange = useCallback((location: Location | null) => {
    if (location) {
      onToSelect(location);
    }
  }, [onToSelect]);

  const handleToSelect = useCallback((location: Location) => {
    onToSelect(location);
    // Clear related errors
    setFormErrors(prev => ({ ...prev, to: '', locations: '' }));
  }, [onToSelect]);

  // Handle swap with validation reset
  const handleSwap = useCallback(() => {
    onSwapLocations();
    setFormErrors(prev => ({ ...prev, from: '', to: '', locations: '' }));
  }, [onSwapLocations]);

  // Clear validation errors when component mounts or locations change
  useEffect(() => {
    setFormErrors({});
  }, []);

  return (
    <div className="search-form-container">
      <div className="search-header">
        <h2 className="search-title">{t('search.title', 'Find Your Bus Route')}</h2>
        <p className="search-subtitle">
          {t('search.subtitle', 'Search for bus routes between any two locations in your city')}
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} noValidate>
        {/* Location Selection */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="from-location" className="form-label">
              <span className="label-icon">📍</span>
              {t('search.from', 'From')}
              <span className="required-asterisk" aria-label="required">*</span>
            </label>
            <LocationInput
              id="from-location"
              placeholder={t('search.fromPlaceholder', 'Enter departure location')}
              value={fromLocation}
              suggestions={fromSuggestions}
              showSuggestions={showFromSuggestions}
              onChange={handleFromChange}
              onSuggestionSelect={handleFromSelect}
              onSearch={onFromSearch}
              onSelect={handleFromSelect}
              error={formErrors.from || formErrors.locations}
              aria-describedby={formErrors.from ? "from-error" : undefined}
            />
            {formErrors.from && (
              <div id="from-error" className="error-message" role="alert">
                {formErrors.from}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="to-location" className="form-label">
              <span className="label-icon">🎯</span>
              {t('search.to', 'To')}
              <span className="required-asterisk" aria-label="required">*</span>
            </label>
            <LocationInput
              id="to-location"
              placeholder={t('search.toPlaceholder', 'Enter destination location')}
              value={toLocation}
              suggestions={toSuggestions}
              showSuggestions={showToSuggestions}
              onChange={handleToChange}
              onSuggestionSelect={handleToSelect}
              onSearch={onToSearch}
              onSelect={handleToSelect}
              error={formErrors.to || formErrors.locations}
              aria-describedby={formErrors.to ? "to-error" : undefined}
            />
            {formErrors.to && (
              <div id="to-error" className="error-message" role="alert">
                {formErrors.to}
              </div>
            )}
          </div>
        </div>

        {/* Swap Button */}
        <div className="swap-button-container">
          <button
            type="button"
            className="swap-button"
            onClick={handleSwap}
            disabled={!fromLocation && !toLocation}
            title={t('search.swapLocations', 'Swap departure and destination')}
            aria-label={t('search.swapLocations', 'Swap departure and destination')}
          >
            <span className="swap-icon">⇄</span>
          </button>
        </div>

        {/* Common location errors */}
        {formErrors.locations && (
          <div className="error-message form-error" role="alert">
            {formErrors.locations}
          </div>
        )}

        {/* Date Selection */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="departure-date" className="form-label">
              <span className="label-icon">📅</span>
              {t('search.departureDate', 'Departure Date')}
            </label>
            <input
              id="departure-date"
              type="date"
              className={`form-control ${formErrors.date ? 'error' : ''}`}
              value={searchFilters.departureDate || ''}
              min={today}
              onChange={(e) => handleDateChange(e.target.value)}
              aria-describedby={formErrors.date ? "date-error" : undefined}
            />
            {formErrors.date && (
              <div id="date-error" className="error-message" role="alert">
                {formErrors.date}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="departure-time" className="form-label">
              <span className="label-icon">🕐</span>
              {t('search.departureTime', 'Departure Time (Optional)')}
            </label>
            <input
              id="departure-time"
              type="time"
              className="form-control"
              value={searchFilters.departureTime || ''}
              onChange={(e) => onFiltersChange({ ...searchFilters, departureTime: e.target.value })}
            />
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div className="advanced-toggle-container">
          <button
            type="button"
            className={`advanced-toggle ${showAdvanced ? 'active' : ''}`}
            onClick={() => setShowAdvanced(!showAdvanced)}
            aria-expanded={showAdvanced}
            aria-controls="advanced-options"
          >
            <span className="toggle-icon">{showAdvanced ? '🔼' : '🔽'}</span>
            {t('search.advancedOptions', 'Advanced Options')}
          </button>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div id="advanced-options" className="advanced-options" role="region" aria-labelledby="advanced-toggle">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bus-type" className="form-label">
                  <span className="label-icon">🚌</span>
                  {t('search.busType', 'Bus Type')}
                </label>
                <select
                  id="bus-type"
                  className="form-control"
                  value={searchFilters.busType || ''}
                  onChange={(e) => onFiltersChange({ ...searchFilters, busType: e.target.value })}
                >
                  <option value="">{t('search.anyBusType', 'Any Bus Type')}</option>
                  <option value="express">{t('search.express', 'Express')}</option>
                  <option value="local">{t('search.local', 'Local')}</option>
                  <option value="luxury">{t('search.luxury', 'Luxury')}</option>
                  <option value="ac">{t('search.ac', 'Air Conditioned')}</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="max-transfers" className="form-label">
                  <span className="label-icon">🔄</span>
                  {t('search.maxTransfers', 'Maximum Transfers')}
                </label>
                <select
                  id="max-transfers"
                  className="form-control"
                  value={searchFilters.maxTransfers?.toString() || ''}
                  onChange={(e) => onFiltersChange({ 
                    ...searchFilters, 
                    maxTransfers: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                >
                  <option value="">{t('search.anyTransfers', 'Any Number')}</option>
                  <option value="0">{t('search.direct', 'Direct Route Only')}</option>
                  <option value="1">{t('search.oneTransfer', 'Up to 1 Transfer')}</option>
                  <option value="2">{t('search.twoTransfers', 'Up to 2 Transfers')}</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={searchFilters.accessibilityFriendly || false}
                      onChange={(e) => onFiltersChange({ 
                        ...searchFilters, 
                        accessibilityFriendly: e.target.checked 
                      })}
                    />
                    <span className="checkmark"></span>
                    <span className="label-icon">♿</span>
                    {t('search.accessibilityFriendly', 'Wheelchair Accessible')}
                  </label>
                </div>
              </div>

              <div className="form-group">
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={searchFilters.realTimeOnly || false}
                      onChange={(e) => onFiltersChange({ 
                        ...searchFilters, 
                        realTimeOnly: e.target.checked 
                      })}
                    />
                    <span className="checkmark"></span>
                    <span className="label-icon">📡</span>
                    {t('search.realTimeOnly', 'Real-time Tracking Available')}
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Actions */}
        <div className="form-actions">
          <button
            type="submit"
            className="search-button"
            disabled={isLoading || !fromLocation || !toLocation}
            aria-describedby="search-button-help"
          >
            {isLoading ? (
              <>
                <span className="loading-spinner" aria-hidden="true">⏳</span>
                {t('search.searching', 'Searching...')}
              </>
            ) : (
              <>
                <span className="search-icon" aria-hidden="true">🔍</span>
                {t('search.findRoutes', 'Find Routes')}
              </>
            )}
          </button>
        </div>

        <div id="search-button-help" className="form-help">
          {t('search.help', 'Fill in departure and destination locations to search for bus routes')}
        </div>
      </form>

      {/* Quick Search Tips */}
      <div className="search-tips">
        <h3>{t('search.tipsTitle', '💡 Search Tips')}</h3>
        <ul>
          <li>{t('search.tip1', 'Use landmark names or popular locations for better results')}</li>
          <li>{t('search.tip2', 'Select from the dropdown suggestions for accurate locations')}</li>
          <li>{t('search.tip3', 'Use advanced options to filter by bus type and accessibility needs')}</li>
          <li>{t('search.tip4', 'Book your ticket early for popular routes during peak hours')}</li>
        </ul>
      </div>
    </div>
  );
};

export default SmartSearchForm;