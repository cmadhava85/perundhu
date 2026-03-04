/**
 * LocationAutocompleteInputGrouped - Enhanced component with grouped location results
 * Displays locations organized by city with bus stands and neighborhoods grouped together
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { locationAutocompleteService } from '../services/locationAutocompleteService';
import type { LocationSuggestion } from '../services/locationAutocompleteService';
import type { LocationGroupDTO } from '../types/LocationGroupTypes';

interface LocationAutocompleteInputGroupedProps {
  id: string;
  name: string;
  value: string;
  onChange: (value: string, location?: LocationSuggestion) => void;
  placeholder?: string;
  required?: boolean;
  label?: string;
  language?: string;
  className?: string;
  useGrouped?: boolean; // Enable grouped results
}

const LocationAutocompleteInputGrouped: React.FC<LocationAutocompleteInputGroupedProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder = 'Enter location',
  required = false,
  label,
  language = 'en',
  className = '',
  useGrouped = false
}) => {
  const { i18n } = useTranslation();
  const [suggestionGroups, setSuggestionGroups] = useState<LocationGroupDTO[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const blurTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Helper function to get the display name based on current language
  const getDisplayName = useCallback((location: LocationSuggestion) => {
    if (i18n.language === 'ta' && location.translatedName) {
      return location.translatedName;
    }
    return location.name;
  }, [i18n.language]);

  // Get flat list of all items for keyboard navigation
  const _getAllItems = useCallback((): (LocationSuggestion & { groupIndex: number; type: 'city' | 'bus_stand' | 'neighborhood' })[] => {
    const items: (LocationSuggestion & { groupIndex: number; type: 'city' | 'bus_stand' | 'neighborhood' })[] = [];
    
    suggestionGroups.forEach((group, groupIndex) => {
      if (group.cityOption) {
        items.push({ ...group.cityOption, groupIndex, type: 'city' });
      }
      group.busStands.forEach(stand => {
        items.push({ ...stand, groupIndex, type: 'bus_stand' });
      });
      group.neighborhoods.forEach(area => {
        items.push({ ...area, groupIndex, type: 'neighborhood' });
      });
    });
    
    return items;
  }, [suggestionGroups]);

  const handleGroupedSuggestionsCallback = useCallback((newGroups: LocationGroupDTO[]) => {
    if (!isSelecting) {
      setSuggestionGroups(newGroups);
      setShowSuggestions(newGroups.length > 0);
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
        setSearchError(false);
        if (useGrouped) {
          locationAutocompleteService.getDebouncedGroupedSuggestions(
            inputValue,
            handleGroupedSuggestionsCallback,
            language
          );
        } else {
          // Fallback to regular suggestions
          const handleCallback = (suggestions: LocationSuggestion[]) => {
            setSuggestionGroups([]);
            setShowSuggestions(suggestions.length > 0);
            setIsLoading(false);
          };
          locationAutocompleteService.getDebouncedSuggestions(
            inputValue,
            handleCallback,
            language
          );
        }
      } catch (error) {
        console.error('Error getting suggestions:', error);
        setIsLoading(false);
        setSuggestionGroups([]);
        setShowSuggestions(false);
        setSearchError(true);
      }
    } else {
      setIsLoading(false);
      setSuggestionGroups([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    
    setShowSuggestions(false);
    setSuggestionGroups([]);
    onChange(suggestion.name, suggestion);
    setIsSelecting(false);
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    
    if (value.length >= 3 && suggestionGroups.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    if (!isSelecting) {
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
    <div className={`location-autocomplete-container-grouped ${className}`} style={{ position: 'relative', overflow: 'visible' }}>
      {label && (
        <label htmlFor={id} style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          {label}
        </label>
      )}
      
      <div style={{ position: 'relative', overflow: 'visible' }}>
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
        
        {searchError && !isLoading && (
          <div role="alert" style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            margin: '4px 0 0 0',
            padding: '8px 12px',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#856404',
            zIndex: 1000
          }}>
            {i18n.t('search.suggestionsUnavailable', 'Search unavailable. Please try again.')}
          </div>
        )}
        
        {showSuggestions && suggestionGroups.length > 0 && (
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
              maxHeight: '360px',
              overflowY: 'auto',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              zIndex: 9999
            }}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
          >
            {suggestionGroups.map((group) => (
              <li key={group.cityName} className="location-group" style={{ padding: '0' }}>
                {/* Group Header */}
                <div style={{
                  padding: '8px 16px 4px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  {group.cityName}
                </div>

                {/* City Option - Highlighted */}
                {group.cityOption && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSuggestionClick(group.cityOption!);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      minHeight: '56px',
                      border: 'none',
                      background: '#f0fdf4',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '15px',
                      fontWeight: 500,
                      transition: 'background-color 0.15s',
                      borderBottom: '1px solid #e5e7eb'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dcfce7'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                  >
                    <span style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      background: '#dcfce7',
                      color: '#166534',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      📍 City
                    </span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {getDisplayName(group.cityOption)}
                    </span>
                  </button>
                )}

                {/* Bus Stands Section */}
                {group.busStands.length > 0 && (
                  <>
                    <div style={{
                      padding: '6px 16px',
                      fontSize: '12px',
                      color: '#9ca3af',
                      fontWeight: 500
                    }}>
                      🚌 Bus Stands
                    </div>
                    {group.busStands.map((stand) => (
                      <button
                        key={`${stand.id}-${stand.name}`}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSuggestionClick(stand);
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 32px',
                          minHeight: '56px',
                          border: 'none',
                          background: 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '15px',
                          transition: 'background-color 0.15s',
                          borderBottom: '1px solid #f0f0f0'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          background: '#dbeafe',
                          color: '#1e40af',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}>
                          🚌 Stand
                        </span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {getDisplayName(stand)}
                        </span>
                      </button>
                    ))}
                  </>
                )}

                {/* Neighborhoods Section */}
                {group.neighborhoods.length > 0 && (
                  <>
                    <div style={{
                      padding: '6px 16px',
                      fontSize: '12px',
                      color: '#9ca3af',
                      fontWeight: 500
                    }}>
                      🏘️ Nearby Areas
                    </div>
                    {group.neighborhoods.map((area) => (
                      <button
                        key={`${area.id}-${area.name}`}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSuggestionClick(area);
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 32px',
                          minHeight: '56px',
                          border: 'none',
                          background: 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '15px',
                          transition: 'background-color 0.15s',
                          borderBottom: '1px solid #f0f0f0'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          background: '#fce7f3',
                          color: '#9d174d',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}>
                          🏘️ Area
                        </span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {getDisplayName(area)}
                        </span>
                      </button>
                    ))}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {showSuggestions && suggestionGroups.length === 0 && value.length >= 3 && !isLoading && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            margin: '4px 0 0 0',
            padding: '20px',
            background: 'white',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            textAlign: 'center',
            color: '#6b7280',
            zIndex: 9999
          }}>
            🔍 No locations found for "{value}"
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(LocationAutocompleteInputGrouped);
