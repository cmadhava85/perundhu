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
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debounced loading state setter to prevent rapid re-renders
  const setDebouncedLoading = useCallback((loading: boolean) => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    
    if (loading) {
      // Set loading immediately for better UX
      setIsLoading(true);
    } else {
      // Debounce setting loading to false to prevent flicker
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        loadingTimeoutRef.current = null;
      }, 100);
    }
  }, []); // Empty deps - setIsLoading is stable

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
    if (!isActiveRef.current) {
      return; // Prevent updates if component unmounted
    }
    
    // Batch all state updates together to prevent multiple re-renders
    React.startTransition(() => {
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
      setIsLoading(false); // Direct call instead of debounced
    });
  }, []); // No dependencies to prevent re-creation

  // Handle input changes and fetch suggestions
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    // Prevent duplicate requests
    if (lastQueryRef.current === inputValue) return;
    lastQueryRef.current = inputValue;

    if (inputValue.length >= 3) {
      // Use debounced loading to prevent excessive re-renders
      setDebouncedLoading(true);
      
      try {
        locationAutocompleteService.getDebouncedSuggestions(
          inputValue,
          handleSuggestionsCallback,
          language
        );
      } catch (error) {
        console.error('Error getting suggestions:', error);
        // Batch state updates to prevent multiple re-renders
        setDebouncedLoading(false);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      // Batch state updates to prevent multiple re-renders
      setDebouncedLoading(false);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [language]); // Minimal dependencies to prevent loops

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
      // Clear loading timeout on cleanup
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
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