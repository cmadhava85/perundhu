import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Location as AppLocation } from '../types';
import '../styles/transit-design-system.css';

interface TransitSearchFormProps {
  fromLocation?: AppLocation;
  toLocation?: AppLocation;
  onLocationChange?: (from: AppLocation, to: AppLocation) => void;
  onSearch?: (from: AppLocation, to: AppLocation, options: SearchOptions) => void;
  locations?: AppLocation[];
}

interface SearchOptions {
  // Simplified interface - only essential search parameters remain
}

const TransitSearchForm: React.FC<TransitSearchFormProps> = ({
  fromLocation,
  toLocation,
  onLocationChange,
  onSearch,
  locations = []
}) => {
  const { t } = useTranslation();
  
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    // Simplified search options - removed date, time, travelers, and accessibility options
  });

  const [fromQuery, setFromQuery] = useState(fromLocation?.name || '');
  const [toQuery, setToQuery] = useState(toLocation?.name || '');
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  // Filter locations for suggestions
  const getLocationSuggestions = (query: string) => {
    if (!query) return locations.slice(0, 5);
    return locations.filter(location => 
      location.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  };

  const fromSuggestions = getLocationSuggestions(fromQuery);
  const toSuggestions = getLocationSuggestions(toQuery);

  // Handle location selection
  const handleFromSelect = (location: AppLocation) => {
    setFromQuery(location.name);
    setShowFromSuggestions(false);
    if (toLocation && onLocationChange) {
      onLocationChange(location, toLocation);
    }
  };

  const handleToSelect = (location: AppLocation) => {
    setToQuery(location.name);
    setShowToSuggestions(false);
    if (fromLocation && onLocationChange) {
      onLocationChange(fromLocation, location);
    }
  };

  // Handle search
  const handleSearch = useCallback(() => {
    const selectedFrom = locations.find(loc => loc.name === fromQuery) || fromLocation;
    const selectedTo = locations.find(loc => loc.name === toQuery) || toLocation;
    
    if (selectedFrom && selectedTo && onSearch) {
      onSearch(selectedFrom, selectedTo, searchOptions);
    }
  }, [fromQuery, toQuery, searchOptions, locations, fromLocation, toLocation, onSearch]);

  // Swap locations
  const handleSwapLocations = () => {
    const tempQuery = fromQuery;
    setFromQuery(toQuery);
    setToQuery(tempQuery);
    
    if (fromLocation && toLocation && onLocationChange) {
      onLocationChange(toLocation, fromLocation);
    }
  };

  return (
    <div className="transit-app">
      <div className="transit-card elevated" style={{ padding: 'var(--space-6)', margin: 'var(--space-4) 0' }}>
        {/* Header */}
        <div className="stack stack-sm" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 className="text-title-2">🚌 Plan Your Journey</h2>
          <p className="text-caption">Find the best buses for your route</p>
        </div>

        <div className="stack stack-lg">
          {/* Location Inputs */}
          <div className="stack stack-md">
            {/* From Location */}
            <div style={{ position: 'relative' }}>
              <label className="text-caption" style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
                🟢 From
              </label>
              <input
                type="text"
                value={fromQuery}
                onChange={(e) => {
                  setFromQuery(e.target.value);
                  setShowFromSuggestions(true);
                }}
                onFocus={() => setShowFromSuggestions(true)}
                placeholder="Enter departure location"
                className="transit-input"
              />
              
              {/* From Suggestions */}
              {showFromSuggestions && fromSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--transit-surface)',
                  border: '1px solid var(--transit-divider)',
                  borderRadius: 'var(--radius-md)',
                  marginTop: 'var(--space-1)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 10,
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {fromSuggestions.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => handleFromSelect(location)}
                      style={{
                        width: '100%',
                        padding: 'var(--space-3)',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--transit-divider)',
                        transition: 'var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--transit-surface-elevated)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div className="text-body">{location.name}</div>
                      <div className="text-footnote" style={{ color: 'var(--transit-text-tertiary)' }}>
                        📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleSwapLocations}
                className="transit-button secondary"
                style={{ 
                  borderRadius: '50%', 
                  width: '40px', 
                  height: '40px',
                  padding: 0,
                  fontSize: 'var(--text-lg)'
                }}
                title="Swap locations"
              >
                ⇅
              </button>
            </div>

            {/* To Location */}
            <div style={{ position: 'relative' }}>
              <label className="text-caption" style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
                🔴 To
              </label>
              <input
                type="text"
                value={toQuery}
                onChange={(e) => {
                  setToQuery(e.target.value);
                  setShowToSuggestions(true);
                }}
                onFocus={() => setShowToSuggestions(true)}
                placeholder="Enter destination"
                className="transit-input"
              />
              
              {/* To Suggestions */}
              {showToSuggestions && toSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--transit-surface)',
                  border: '1px solid var(--transit-divider)',
                  borderRadius: 'var(--radius-md)',
                  marginTop: 'var(--space-1)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 10,
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {toSuggestions.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => handleToSelect(location)}
                      style={{
                        width: '100%',
                        padding: 'var(--space-3)',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--transit-divider)',
                        transition: 'var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--transit-surface-elevated)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div className="text-body">{location.name}</div>
                      <div className="text-footnote" style={{ color: 'var(--transit-text-tertiary)' }}>
                        📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="transit-button primary"
            style={{ 
              fontSize: 'var(--text-lg)', 
              fontWeight: 'var(--font-semibold)',
              padding: 'var(--space-4) var(--space-6)'
            }}
            disabled={!fromQuery || !toQuery}
          >
            🔍 Find Buses
          </button>

          {/* Quick Action Buttons */}
          <div className="row row-sm" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="transit-button secondary" style={{ fontSize: 'var(--text-sm)' }}>
              🗺️ View on Map
            </button>
            <button className="transit-button secondary" style={{ fontSize: 'var(--text-sm)' }}>
              🕐 Schedule View
            </button>
            <button className="transit-button secondary" style={{ fontSize: 'var(--text-sm)' }}>
              💡 Suggestions
            </button>
          </div>
        </div>
      </div>

      {/* Click overlay to close suggestions */}
      {(showFromSuggestions || showToSuggestions) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5
          }}
          onClick={() => {
            setShowFromSuggestions(false);
            setShowToSuggestions(false);
          }}
        />
      )}
    </div>
  );
};

export default React.memo(TransitSearchForm);