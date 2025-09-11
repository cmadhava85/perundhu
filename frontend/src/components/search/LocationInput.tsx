import React from 'react';
import type { Location } from '../../types';

interface LocationInputProps {
  label?: string;
  value?: Location | null;
  placeholder?: string;
  icon?: string;
  suggestions: Location[];
  showSuggestions: boolean;
  onChange: (location: Location | null) => void;
  onSuggestionSelect: (location: Location) => void;
}

const LocationInput: React.FC<LocationInputProps> = ({ 
  label,
  value, 
  placeholder,
  icon,
  suggestions,
  showSuggestions,
  onChange, 
  onSuggestionSelect
}) => {
  return (
    <div className="input-group location-input">
      {label && <label className="input-label">{label}</label>}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input 
          type="text"
          className="smart-input location-field"
          placeholder={placeholder}
          value={value?.name || ''}
          onChange={(e) => {
            const inputValue = e.target.value;
            const location = suggestions.find(loc => loc.name === inputValue);
            onChange(location || null);
          }}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {suggestions.map((suggestion, index) => (
              <div 
                key={`${suggestion.id}-${index}`}
                className="suggestion-item"
                onClick={() => onSuggestionSelect(suggestion)}
              >
                <span className="suggestion-name">{suggestion.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationInput;