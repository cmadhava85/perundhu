import React, { useState, useEffect, useRef } from 'react';
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

  // Helper function to check if a city is in Tamil Nadu
  const isInTamilNadu = (cityName: string): boolean => {
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
  };

  // Handle input changes and fetch suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (inputValue.length >= 2) { // Changed from 3 to 2 characters
      setIsLoading(true);
      
      locationAutocompleteService.getDebouncedSuggestions(
        inputValue,
        language,
        (newSuggestions) => {
          setSuggestions(newSuggestions);
          setShowSuggestions(newSuggestions.length > 0);
          setIsLoading(false);
        }
      );
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    onChange(suggestion.name, suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'Escape') {
      setShowSuggestions(false);
      e.preventDefault();
    }
  };

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
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.id}
                className="autocomplete-suggestion"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="suggestion-main">
                  <span className="suggestion-name">{formatLocationNameUniversal(suggestion.name)}</span>
                  {suggestion.translatedName && suggestion.translatedName !== suggestion.name && (
                    <span className="suggestion-translated">({formatLocationNameUniversal(suggestion.translatedName)})</span>
                  )}
                </div>
                <div className="suggestion-type">
                  {/* Show Tamil Nadu priority indicator */}
                  {isInTamilNadu(suggestion.name) ? (
                    <span className="tn-badge">Tamil Nadu</span>
                  ) : (
                    <span className="other-state">India</span>
                  )}
                  
                  {/* Show data source */}
                  {suggestion.source === 'database' && <span className="source-badge primary">DB</span>}
                  {suggestion.source === 'nominatim' && <span className="source-badge">OSM</span>}
                  {suggestion.source === 'google' && <span className="source-badge google">Google</span>}
                  {suggestion.source === 'local' && <span className="source-badge local">Local</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
        
        {value.length >= 2 && !isLoading && suggestions.length === 0 && showSuggestions && (
          <div className="no-suggestions">
            <span>No cities found for "{value}"</span>
            <small>Try searching for any city in Tamil Nadu or India</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationAutocompleteInput;