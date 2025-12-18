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
  const [isSelecting, setIsSelecting] = useState(false);
  const blurTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Helper function to get display name based on language
  const getDisplayName = (suggestion: LocationSuggestion): string => {
    if (language === 'ta' && suggestion.translatedName) {
      return suggestion.translatedName;
    }
    return suggestion.name;
  };

  const handleSuggestionsCallback = useCallback((newSuggestions: LocationSuggestion[]) => {
    if (!isSelecting) {
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
      setIsLoading(false);
    }
  }, [isSelecting]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setIsSelecting(false);
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
    // Mark as selecting FIRST to prevent blur from interfering
    setIsSelecting(true);
    
    // Clear any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    
    // Immediately close dropdown and notify parent with display name
    setShowSuggestions(false);
    setSuggestions([]);
    onChange(getDisplayName(suggestion), suggestion);
    
    // Reset selecting flag after a short delay
    setTimeout(() => setIsSelecting(false), 50);
  };

  const handleFocus = () => {
    // Clear any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    
    if (value.length >= 3 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Only blur if not currently selecting
    if (!isSelecting) {
      // Delay hiding suggestions to allow click to register
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
      
      blurTimeoutRef.current = setTimeout(() => {
        setShowSuggestions(false);
      }, 150);
    }
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
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
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
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            outline: 'none',
            height: '48px',
            boxSizing: 'border-box'
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
          <ul 
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              margin: '4px 0 0 0',
              padding: 0,
              listStyle: 'none',
              background: 'white',
              border: '2px solid #3b82f6',
              borderRadius: '12px',
              maxHeight: '280px',
              overflowY: 'auto',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              zIndex: 9999
            }}
            onMouseDown={(e) => {
              // Prevent input from losing focus
              e.preventDefault();
            }}
          >
            {suggestions.map((suggestion, index) => (
              <li key={`${suggestion.source}-${suggestion.id || index}`}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSuggestionClick(suggestion);
                  }}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    minHeight: '48px',
                    border: 'none',
                    background: suggestion.name.includes(' - ') ? '#f0fdf4' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderBottom: index < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '15px',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = suggestion.name.includes(' - ') ? '#dcfce7' : '#f0f7ff'}
                  onMouseLeave={(e) => e.currentTarget.style.background = suggestion.name.includes(' - ') ? '#f0fdf4' : 'transparent'}
                >
                  <span style={{ fontSize: '18px' }}>
                    {suggestion.name.includes(' - ') ? '🚏' : suggestion.source === 'database' ? '🚍' : suggestion.source === 'local' ? '⚡' : '🌍'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: '#1f2937' }}>
                      {getDisplayName(suggestion)}
                      {suggestion.name.includes(' - ') && (
                        <span style={{ marginLeft: '8px', fontSize: '11px', background: '#22c55e', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Bus Stand</span>
                      )}
                    </div>
                    {/* Show secondary language name if available and different */}
                    {/* When in Tamil mode and we have translatedName (English), show it as secondary */}
                    {language === 'ta' && suggestion.translatedName && suggestion.name !== suggestion.translatedName && (
                      <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '3px' }}>
                        {suggestion.translatedName}
                      </div>
                    )}
                    {/* When in English mode and we have translatedName (Tamil), show it as secondary */}
                    {language !== 'ta' && suggestion.translatedName && suggestion.translatedName !== suggestion.name && (
                      <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '3px' }}>
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

export default React.memo(LocationAutocompleteInput);
