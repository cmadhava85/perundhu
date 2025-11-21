/**
 * LocationAutocompleteInput - Wrapper component for autocomplete functionality
 * This component provides backward compatibility for components that were using the old LocationAutocompleteInput
 * It integrates with locationAutocompleteService for DB + OpenStreetMap search
 */
import React, { useState, useEffect, useCallback } from 'react';
import { locationAutocompleteService } from '../services/locationAutocompleteService';
import type { LocationSuggestion } from '../services/locationAutocompleteService';

interface LocationAutocompleteInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (value: string, location?: LocationSuggestion) => void;
  placeholder?: string;
  required?: boolean;
  label?: string;
  language?: string;
  className?: string;
}

const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder = 'Enter location',
  required = false,
  label,
  language = 'en',
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSuggestionsCallback = useCallback((newSuggestions: LocationSuggestion[]) => {
    setSuggestions(newSuggestions);
    setShowSuggestions(newSuggestions.length > 0);
    setIsLoading(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (inputValue.length >= 3) {
      setIsLoading(true);
      try {
        locationAutocompleteService.getDebouncedSuggestions(
          inputValue,
          handleSuggestionsCallback,
          language
        );
      } catch (error) {
        console.error('Error getting suggestions:', error);
        setIsLoading(false);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setIsLoading(false);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    onChange(suggestion.name, suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && showSuggestions) {
      setShowSuggestions(false);
      e.preventDefault();
    }
  };

  useEffect(() => {
    return () => {
      locationAutocompleteService.clearDebounce();
    };
  }, []);

  return (
    <div className={`location-autocomplete-container ${className}`} style={{ position: 'relative' }}>
      {label && (
        <label htmlFor={id} style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          {label}
        </label>
      )}
      
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 3 && setShowSuggestions(suggestions.length > 0)}
          placeholder={placeholder}
          required={required}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            outline: 'none'
          }}
          autoComplete="off"
        />
        
        {isLoading && (
          <div style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '14px'
          }}>
            🔄
          </div>
        )}
        
        {showSuggestions && suggestions.length > 0 && (
          <ul style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            margin: '4px 0 0 0',
            padding: 0,
            listStyle: 'none',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            maxHeight: '200px',
            overflowY: 'auto',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}>
            {suggestions.map((suggestion, index) => (
              <li key={`${suggestion.source}-${suggestion.id || index}`}>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderBottom: index < suggestions.length - 1 ? '1px solid #eee' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span>
                    {suggestion.source === 'database' ? '🚍' : suggestion.source === 'local' ? '⚡' : '🌍'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div>{suggestion.name}</div>
                    {suggestion.translatedName && suggestion.translatedName !== suggestion.name && (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                        {suggestion.translatedName}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LocationAutocompleteInput;
