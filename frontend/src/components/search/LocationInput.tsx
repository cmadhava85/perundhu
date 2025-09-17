import React, { useState, useRef, useEffect } from 'react';
import type { Location } from '../../types';

interface LocationInputProps {
  id?: string;
  label?: string;
  value?: Location | null;
  placeholder?: string;
  icon?: string;
  suggestions: Location[];
  showSuggestions: boolean;
  onChange: (location: Location | null) => void;
  onSuggestionSelect: (location: Location) => void;
  onSearch?: (query: string) => void;
  onSelect?: (location: Location) => void;
  error?: string;
  onInputFocus?: () => void;
  onInputBlur?: () => void;
}

const LocationInput: React.FC<LocationInputProps> = ({ 
  label,
  value, 
  placeholder,
  icon,
  suggestions,
  showSuggestions,
  onChange, 
  onSuggestionSelect,
  onSearch,
  onSelect,
  error,
  onInputFocus,
  onInputBlur
}) => {
  const [inputValue, setInputValue] = useState(value?.name || '');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value?.name || '');
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Trigger search when user types
    if (newValue.length >= 2) {
      onChange(null); // Clear selected location while typing
      onSearch?.(newValue); // Trigger search
    } else if (newValue.length === 0) {
      onChange(null);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    onInputFocus?.();
  };

  const handleBlur = () => {
    // Delay blur to allow suggestion click
    setTimeout(() => {
      setIsFocused(false);
      onInputBlur?.();
    }, 150);
  };

  const handleSuggestionClick = (suggestion: Location) => {
    setInputValue(suggestion.name);
    onChange(suggestion);
    onSuggestionSelect(suggestion);
    onSelect?.(suggestion);
    setIsFocused(false);
  };

  const clearInput = () => {
    setInputValue('');
    onChange(null);
    inputRef.current?.focus();
  };

  return (
    <div className={`input-group location-input ${isFocused ? 'focused' : ''}`}>
      {label && (
        <label className="input-label">
          {icon && <span className="label-icon">{icon}</span>}
          {label}
        </label>
      )}
      <div className="input-wrapper">
        <div className="input-container">
          <input 
            ref={inputRef}
            type="text"
            className="smart-input location-field"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoComplete="off"
          />
          {inputValue && (
            <button 
              type="button"
              className="clear-input-btn"
              onClick={clearInput}
              tabIndex={-1}
            >
              ✕
            </button>
          )}
          <div className="input-border"></div>
        </div>
        
        {(showSuggestions || isFocused) && (
          <div 
            ref={dropdownRef}
            className={`suggestions-dropdown ${suggestions.length > 0 ? 'has-suggestions' : 'no-suggestions'}`}
          >
            {suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <div 
                  key={`${suggestion.id}-${index}`}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="suggestion-content">
                    <span className="suggestion-icon">📍</span>
                    <div className="suggestion-text">
                      <span className="suggestion-name">{suggestion.name}</span>
                      {suggestion.state && (
                        <span className="suggestion-state">{suggestion.state}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : inputValue.length >= 2 ? (
              <div className="no-suggestions-message">
                <span className="no-results-icon">🔍</span>
                <span className="no-results-text">No locations found for "{inputValue}"</span>
              </div>
            ) : inputValue.length === 1 ? (
              <div className="search-tip">
                <span className="tip-icon">💡</span>
                <span className="tip-text">Type at least 2 characters to search</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationInput;