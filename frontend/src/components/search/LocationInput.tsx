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
  error: _error,
  onInputFocus,
  onInputBlur
}) => {
  const [inputValue, setInputValue] = useState(value?.name || '');
  const [isFocused, setIsFocused] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only update input value if not currently selecting
    if (!isSelecting) {
      setInputValue(value?.name || '');
    }
  }, [value, isSelecting]);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsSelecting(false);
    
    // Trigger search when user types at least 3 characters
    if (newValue.length >= 3) {
      onChange(null); // Clear selected location while typing
      onSearch?.(newValue); // Trigger search
    } else if (newValue.length === 0) {
      onChange(null);
    }
  };

  const handleFocus = () => {
    // Clear any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsFocused(true);
    onInputFocus?.();
  };

  const handleBlur = () => {
    // Only blur if not currently selecting
    if (!isSelecting) {
      // Delay hiding suggestions to allow click to register
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
      
      blurTimeoutRef.current = setTimeout(() => {
        setIsFocused(false);
        onInputBlur?.();
      }, 150);
    }
  };

  const handleSuggestionClick = (suggestion: Location) => {
    // Mark as selecting FIRST to prevent blur from interfering
    setIsSelecting(true);
    
    // Clear any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    
    // Immediately update UI and close dropdown
    setInputValue(suggestion.name);
    setIsFocused(false);
    
    // Then notify parent components
    onChange(suggestion);
    onSuggestionSelect(suggestion);
    onSelect?.(suggestion);
    
    // Reset selecting flag after a short delay
    setTimeout(() => setIsSelecting(false), 50);
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
        
        {(showSuggestions || isFocused) && suggestions.length > 0 && (
          <div 
            ref={dropdownRef}
            className="suggestions-dropdown has-suggestions"
            onMouseDown={(e) => {
              // Prevent input from losing focus when clicking dropdown
              e.preventDefault();
            }}
          >
            {suggestions.map((suggestion, index) => (
              <div 
                key={`${suggestion.id}-${index}`}
                className="suggestion-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSuggestionClick(suggestion);
                }}
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
            ))}
          </div>
        )}
        
        {(showSuggestions || isFocused) && suggestions.length === 0 && inputValue.length >= 2 && (
          <div className="suggestions-dropdown no-suggestions">
            <div className="no-suggestions-message">
              <span className="no-results-icon">🔍</span>
              <span className="no-results-text">No locations found for "{inputValue}"</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationInput;