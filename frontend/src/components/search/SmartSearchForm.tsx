import React from 'react';
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
  onSearch
}) => {
  const { t } = useTranslation();

  return (
    <div className="smart-search-form">
      <div className="search-inputs-container">
        <LocationInput
          label={t('search.from', 'From')}
          value={fromLocation}
          placeholder={t('search.fromPlaceholder', 'Enter departure city')}
          icon="📍"
          suggestions={fromSuggestions}
          showSuggestions={showFromSuggestions}
          onChange={(value) => {
            const searchValue = value?.name || '';
            onFiltersChange({ ...searchFilters, from: value });
            onFromSearch(searchValue);
          }}
          onSuggestionSelect={onFromSelect}
        />

        <div className="swap-button-container">
          <button className="swap-btn" onClick={onSwapLocations}>
            <span className="swap-icon">⇄</span>
          </button>
        </div>

        <LocationInput
          label={t('search.to', 'To')}
          value={toLocation}
          placeholder={t('search.toPlaceholder', 'Enter destination city')}
          icon="🎯"
          suggestions={toSuggestions}
          showSuggestions={showToSuggestions}
          onChange={(value) => {
            const searchValue = value?.name || '';
            onFiltersChange({ ...searchFilters, to: value });
            onToSearch(searchValue);
          }}
          onSuggestionSelect={onToSelect}
        />

        <div className="input-group date-input">
          <label className="input-label">{t('search.date', 'Date')}</label>
          <input
            type="date"
            value={searchFilters.date}
            onChange={(e) => onFiltersChange({ ...searchFilters, date: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            className="smart-input date-picker"
          />
        </div>

        <button 
          className="search-btn premium"
          onClick={onSearch}
          disabled={isLoading || !fromLocation || !toLocation}
        >
          {isLoading ? (
            <>
              <span className="btn-spinner"></span>
              <span className="btn-text">{t('search.searching', 'Searching...')}</span>
            </>
          ) : (
            <>
              <span className="btn-icon">🔍</span>
              <span className="btn-text">{t('search.searchButton', 'Search Buses')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SmartSearchForm;