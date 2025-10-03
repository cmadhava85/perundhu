import React, { useState, useEffect, useRef, useCallback } from 'react';
import { locationAutocompleteService } from '../services/locationAutocompleteService';
import { formatLocationNameUniversal } from '../services/geocodingService';
import type { LocationSuggestion } from '../services/locationAutocompleteService';
import './LocationAutocompleteInput.css';

interface LocationAutocompleteInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (value: string, location?: LocationSuggestion) => void;
  placeholder?: string;
  required?: boolean;
  label?: string;
  language?: string;
}

const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  label,
  language = 'en'
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionListRef = useRef<HTMLUListElement>(null);
  const lastQueryRef = useRef<string>('');
  const isActiveRef = useRef<boolean>(true);

  // Helper function to check if a city is in Tamil Nadu
  const isInTamilNadu = useCallback((cityName: string): boolean => {
    const tnCities = [
      'Chennai', 'Madurai', 'Coimbatore', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur',
      'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur', 'Udhagamandalam', 'Hosur',
      'Nagercoil', 'Kanchipuram', 'Erode', 'Tiruvannamalai', 'Pollachi', 'Rajapalayam',
      'Arcot', 'Dharmapuri', 'Chidambaram', 'Ambur', 'Nagapattinam', 'Arakkonam', 'Kumbakonam',
      'Neyveli', 'Cuddalore', 'Mayiladuthurai', 'Pallavaram', 'Pudukkottai', 'Aruppukottai',
      'Virudhunagar', 'Kodaikanal', 'Yercaud', 'Kanyakumari', 'Srivilliputhur', 'Ramanathapuram',
      'Tenkasi', 'Theni', 'Palani', 'Krishnagiri', 'Namakkal', 'Villupuram', 'Vellore',
      'Tiruvallur', 'Tirupattur', 'Kallakurichi', 'Chengalpattu', 'Thoothukudi', 'Tiruvarur',
      'Perambalur', 'Ariyalur', 'Nilgiris', 'Thenkasi'
    ];
    
    return tnCities.some(tnCity => 
      tnCity.toLowerCase() === cityName.toLowerCase() ||
      cityName.toLowerCase().includes(tnCity.toLowerCase())
    );
  }, []);

  // Stable callback for handling suggestions
  const handleSuggestionsCallback = useCallback((newSuggestions: LocationSuggestion[]) => {
    if (!isActiveRef.current) return; // Prevent updates if component unmounted
    
    setSuggestions(newSuggestions);
    setShowSuggestions(newSuggestions.length > 0);
    setIsLoading(false);
  }, []);

  // Handle input changes and fetch suggestions
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    // Prevent duplicate requests
    if (lastQueryRef.current === inputValue) return;
    lastQueryRef.current = inputValue;

    if (inputValue.length >= 2) {
      setIsLoading(true);
      
      try {
        locationAutocompleteService.getDebouncedSuggestions(
          inputValue,
          language,
          handleSuggestionsCallback
        );
      } catch (error) {
        console.error('Error getting suggestions:', error);
        setIsLoading(false);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }
  }, [onChange, language, handleSuggestionsCallback]);

  // Handle suggestion selection
  const handleSuggestionClick = useCallback((suggestion: LocationSuggestion) => {
    onChange(suggestion.name, suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [onChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'Escape') {
      setShowSuggestions(false);
      e.preventDefault();
    }
  }, [showSuggestions, suggestions.length]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionListRef.current &&
        !suggestionListRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Clear debounce on cleanup
      locationAutocompleteService.clearDebounce();
    };
  }, []);

  // Component cleanup
  useEffect(() => {
    isActiveRef.current = true;
    
    return () => {
      isActiveRef.current = false;
      locationAutocompleteService.clearDebounce();
    };
  }, []);

  return (
    <div className="location-autocomplete-container">
      {label && (
        <label htmlFor={id} className="autocomplete-label">
          {label}
        </label>
      )}
      
      <div className="autocomplete-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className="autocomplete-input"
          autoComplete="off"
        />
        
        {isLoading && (
          <div className="autocomplete-loading">
            <div className="loading-spinner"></div>
          </div>
        )}
        
        {showSuggestions && suggestions.length > 0 && (
          <ul ref={suggestionListRef} className="autocomplete-suggestions">
            {suggestions.map((suggestion) => {
              const getSourceIcon = (source: string) => {
                if (source === 'database') return '🚍';
                if (source === 'local') return '⚡';
                return '🌍';
              };

              return (
                <li key={`${suggestion.source}-${suggestion.id}`}>
                  <button
                    type="button"
                    className={`autocomplete-suggestion ${isInTamilNadu(suggestion.name) ? 'tn-city' : ''}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="suggestion-content">
                      <span className="suggestion-name">
                        {formatLocationNameUniversal(suggestion.name)}
                      </span>
                      {suggestion.translatedName && suggestion.translatedName !== suggestion.name && (
                        <span className="suggestion-translated">
                          {suggestion.translatedName}
                        </span>
                      )}
                      <span className="suggestion-source">
                        {getSourceIcon(suggestion.source || '')}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LocationAutocompleteInput;