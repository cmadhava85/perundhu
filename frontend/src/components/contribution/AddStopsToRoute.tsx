import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Stop, Location } from '../../types';
import { searchBuses, getStops, getLocations, submitStopsContribution } from '../../services/api';
import { locationAutocompleteService, type LocationSuggestion } from '../../services/locationAutocompleteService';
import './AddStopsToRoute.css';

interface AddStopsToRouteProps {
  // Pre-selected bus (when coming from search results)
  preSelectedBus?: Bus;
  // Pre-populated origin/destination from search
  fromLocation?: Location;
  toLocation?: Location;
  onSubmit?: (busId: number, stops: StopEntry[]) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
}

export interface StopEntry {
  id?: number;
  locationName: string;
  locationId?: number;
  arrivalTime: string;
  departureTime: string;
  order: number;
}

export const AddStopsToRoute: React.FC<AddStopsToRouteProps> = ({
  preSelectedBus,
  fromLocation: preSelectedFromLocation,
  toLocation: preSelectedToLocation,
  onSubmit,
  onCancel,
  onError
}) => {
  const { t, i18n } = useTranslation();

  // Debug logging
  console.log('AddStopsToRoute - preSelectedBus:', preSelectedBus);
  console.log('AddStopsToRoute - fromLocation:', preSelectedFromLocation);
  console.log('AddStopsToRoute - toLocation:', preSelectedToLocation);
  
  // State for route selection (when not pre-selected)
  const [locations, setLocations] = useState<Location[]>([]);
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [selectedFrom, setSelectedFrom] = useState<Location | null>(null);
  const [selectedTo, setSelectedTo] = useState<Location | null>(null);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  
  // Bus selection state
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(preSelectedBus || null);
  const [existingStops, setExistingStops] = useState<Stop[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingStops, setIsLoadingStops] = useState(false);
  
  // Stops entry state
  const [newStops, setNewStops] = useState<StopEntry[]>([]);
  const [stopLocationQuery, setStopLocationQuery] = useState('');
  const [showStopSuggestions, setShowStopSuggestions] = useState(false);
  const [activeStopInputIndex, setActiveStopInputIndex] = useState<number | null>(null);
  const [highlightedStopIndex, setHighlightedStopIndex] = useState(-1);
  const isSelectingStopRef = React.useRef(false);
  
  // Dynamic autocomplete state (DB + local + OpenStreetMap)
  const [dynamicFromSuggestions, setDynamicFromSuggestions] = useState<LocationSuggestion[]>([]);
  const [dynamicToSuggestions, setDynamicToSuggestions] = useState<LocationSuggestion[]>([]);
  const [dynamicStopSuggestions, setDynamicStopSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoadingFrom, setIsLoadingFrom] = useState(false);
  const [isLoadingTo, setIsLoadingTo] = useState(false);
  const [isLoadingStopSuggestions, setIsLoadingStopSuggestions] = useState(false);
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // If preSelectedBus is provided, use it directly
  useEffect(() => {
    console.log('AddStopsToRoute useEffect - preSelectedBus changed:', preSelectedBus);
    if (preSelectedBus) {
      console.log('Setting selectedBus to:', preSelectedBus);
      setSelectedBus(preSelectedBus);
      loadExistingStops(preSelectedBus.id);
    }
  }, [preSelectedBus]);

  // Also handle initial mount with preSelectedBus
  useEffect(() => {
    if (preSelectedBus && !selectedBus) {
      console.log('Initial mount - setting selectedBus from preSelectedBus');
      setSelectedBus(preSelectedBus);
      loadExistingStops(preSelectedBus.id);
    }
  }, []);

  // Load locations on mount
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const locs = await getLocations();
        setLocations(locs);
      } catch {
        // Failed to load locations
      }
    };
    loadLocations();
  }, []);

  // Load existing stops for selected bus
  const loadExistingStops = async (busId: number) => {
    setIsLoadingStops(true);
    try {
      const stops = await getStops(busId);
      // Sort stops by time (departure time first, then arrival time)
      const sortedStops = [...stops].sort((a, b) => {
        const timeA = a.departureTime || a.arrivalTime || '00:00';
        const timeB = b.departureTime || b.arrivalTime || '00:00';
        return timeA.localeCompare(timeB);
      });
      setExistingStops(sortedStops);
      
      // Initialize new stops after existing ones
      if (sortedStops.length === 0) {
        // No existing stops, start fresh with from/to as first and last
        setNewStops([]);
      }
    } catch {
      // Failed to load stops
    } finally {
      setIsLoadingStops(false);
    }
  };

  // Filter locations for suggestions (static from pre-loaded locations)
  const filterLocations = useCallback((query: string): Location[] => {
    if (!query || query.length < 2) return [];
    const lowerQuery = query.toLowerCase();
    return locations
      .filter(loc => 
        loc.name.toLowerCase().includes(lowerQuery) ||
        loc.translatedName?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 8);
  }, [locations]);

  // Convert LocationSuggestion to Location
  const suggestionToLocation = useCallback((suggestion: LocationSuggestion): Location => ({
    id: suggestion.id,
    name: suggestion.name,
    translatedName: suggestion.translatedName,
    latitude: suggestion.latitude || 0,
    longitude: suggestion.longitude || 0,
    source: (suggestion.source as 'database' | 'nominatim' | 'local') || 'database'
  }), []);

  // Fetch dynamic suggestions (DB + local + OpenStreetMap)
  const fetchDynamicSuggestions = useCallback((
    query: string, 
    type: 'from' | 'to' | 'stop'
  ) => {
    if (query.trim().length < 3) {
      if (type === 'from') setDynamicFromSuggestions([]);
      else if (type === 'to') setDynamicToSuggestions([]);
      else setDynamicStopSuggestions([]);
      return;
    }
    
    if (type === 'from') setIsLoadingFrom(true);
    else if (type === 'to') setIsLoadingTo(true);
    else setIsLoadingStopSuggestions(true);
    
    locationAutocompleteService.getDebouncedSuggestions(
      query,
      (suggestions) => {
        if (type === 'from') {
          setDynamicFromSuggestions(suggestions);
          setIsLoadingFrom(false);
        } else if (type === 'to') {
          setDynamicToSuggestions(suggestions);
          setIsLoadingTo(false);
        } else {
          setDynamicStopSuggestions(suggestions);
          setIsLoadingStopSuggestions(false);
        }
      },
      i18n.language
    );
  }, [i18n.language]);

  // Combine static and dynamic suggestions
  const getCombinedSuggestions = useCallback((
    query: string, 
    dynamicSuggestions: LocationSuggestion[]
  ): Location[] => {
    const staticResults = filterLocations(query);
    const dynamicResults = dynamicSuggestions.map(suggestionToLocation);
    
    const seen = new Set<number>();
    const combined: Location[] = [];
    
    for (const loc of staticResults) {
      if (!seen.has(loc.id)) {
        seen.add(loc.id);
        combined.push(loc);
      }
    }
    
    for (const loc of dynamicResults) {
      if (!seen.has(loc.id)) {
        seen.add(loc.id);
        combined.push(loc);
      }
    }
    
    return combined.slice(0, 10);
  }, [filterLocations, suggestionToLocation]);

  // Get suggestions for each field
  const fromSuggestions = getCombinedSuggestions(fromQuery, dynamicFromSuggestions);
  const toSuggestions = getCombinedSuggestions(toQuery, dynamicToSuggestions);
  const stopSuggestions = getCombinedSuggestions(stopLocationQuery, dynamicStopSuggestions);

  // Search for buses
  const handleSearchBuses = async () => {
    if (!selectedFrom || !selectedTo) return;
    
    setIsSearching(true);
    setBuses([]);
    setSelectedBus(null);
    
    try {
      const results = await searchBuses(selectedFrom, selectedTo, true);
      setBuses(results);
      if (results.length === 0) {
        onError?.(t('addStops.noBusesFound', 'No buses found for this route'));
      }
    } catch {
      onError?.(t('addStops.searchFailed', 'Failed to search buses'));
    } finally {
      setIsSearching(false);
    }
  };

  // Handle bus selection
  const handleSelectBus = async (bus: Bus) => {
    setSelectedBus(bus);
    setNewStops([]);
    await loadExistingStops(bus.id);
  };

  // Add new stop entry
  const handleAddStop = () => {
    const lastOrder = newStops.length > 0 
      ? Math.max(...newStops.map(s => s.order)) 
      : existingStops.length;
    
    setNewStops([...newStops, {
      locationName: '',
      arrivalTime: '',
      departureTime: '',
      order: lastOrder + 1
    }]);
  };

  // Update stop entry
  const handleUpdateStop = (index: number, field: keyof StopEntry, value: string | number) => {
    const updated = [...newStops];
    updated[index] = { ...updated[index], [field]: value };
    setNewStops(updated);
  };

  // Remove stop entry
  const handleRemoveStop = (index: number) => {
    const updated = newStops.filter((_, i) => i !== index);
    // Reorder remaining stops
    for (let i = 0; i < updated.length; i++) {
      updated[i].order = existingStops.length + i + 1;
    }
    setNewStops(updated);
  };

  // Select location for a stop
  const handleSelectStopLocation = (index: number, location: Location) => {
    handleUpdateStop(index, 'locationName', location.name);
    handleUpdateStop(index, 'locationId', location.id);
    setStopLocationQuery('');
    setShowStopSuggestions(false);
    setActiveStopInputIndex(null);
    setHighlightedStopIndex(-1);
  };

  // Validate stops before submission
  const validateStops = (): boolean => {
    if (newStops.length === 0) {
      onError?.(t('addStops.noStopsAdded', 'Please add at least one stop'));
      return false;
    }

    for (const stop of newStops) {
      if (!stop.locationName.trim()) {
        onError?.(t('addStops.missingLocation', 'Please enter location for all stops'));
        return false;
      }
      if (!stop.arrivalTime && !stop.departureTime) {
        onError?.(t('addStops.missingTime', 'Please enter at least arrival or departure time for all stops'));
        return false;
      }
    }

    return true;
  };

  // Submit stops
  const handleSubmit = async () => {
    if (!selectedBus || !validateStops()) return;

    setIsSubmitting(true);
    
    try {
      // Prepare the submission data
      const submissionData = {
        busId: selectedBus.id,
        busNumber: selectedBus.busNumber,
        busName: selectedBus.busName,
        fromLocationName: selectedBus.from,
        toLocationName: selectedBus.to,
        departureTime: selectedBus.departureTime,
        arrivalTime: selectedBus.arrivalTime,
        stops: newStops.map(stop => ({
          locationName: stop.locationName,
          locationId: stop.locationId,
          arrivalTime: stop.arrivalTime,
          departureTime: stop.departureTime,
          order: stop.order
        })),
        additionalNotes: `User contributed ${newStops.length} intermediate stop(s) for this route`
      };

      console.log('Submitting stops contribution:', submissionData);
      
      // Call the actual API
      const response = await submitStopsContribution(submissionData);
      
      if (response.success) {
        console.log('Stops contribution submitted successfully:', response);
        onSubmit?.(selectedBus.id, newStops);
        setSubmitSuccess(true);
        
        // Reset after success
        setTimeout(() => {
          setNewStops([]);
          setSubmitSuccess(false);
          if (!preSelectedBus) {
            setSelectedBus(null);
          }
        }, 3000);
      } else {
        // API returned an error
        const errorMessage = response.message || t('addStops.submitFailed', 'Failed to submit stops');
        console.error('Stops contribution failed:', response);
        onError?.(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting stops:', error);
      onError?.(t('addStops.submitFailed', 'Failed to submit stops'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if bus has missing stops
  const hasMissingStops = selectedBus && existingStops.length < 2;

  // Helper function to get stop marker
  const getStopMarker = (index: number, total: number): string => {
    if (index === 0) return '🟢';
    if (index === total - 1) return '🔴';
    return '⚪';
  };

  // Helper function to get submit button content
  const getSubmitButtonContent = (): React.ReactNode => {
    if (isSubmitting) {
      return <span className="loading-spinner" />;
    }
    if (submitSuccess) {
      return <>✅ {t('addStops.submitted', 'Stops Submitted!')}</>;
    }
    return <>📤 {t('addStops.submit', 'Submit Stops')}</>;
  };

  return (
    <div className="add-stops-container">
      {/* Info Banner */}
      <div className="info-banner">
        <span className="info-icon">📍</span>
        <div className="info-text">
          <strong>{t('addStops.title', 'Add Stops to Existing Route')}</strong>
          <p>{t('addStops.description', 'Help improve our data by adding intermediate stops with timings to routes that are missing this information.')}</p>
        </div>
      </div>

      {/* Step 1: Route Selection (only if no preSelectedBus) */}
      {!preSelectedBus && !selectedBus && (
        <div className="add-stops-section">
          <div className="section-header">
            <span className="step-badge">1</span>
            <h3>{t('addStops.step1', 'Find the Route')}</h3>
          </div>
          
          <div className="route-selection">
            <div className="location-input-group">
              <label>🟢 {t('addStops.from', 'From')}</label>
              <div className="autocomplete-wrapper">
                <input
                  type="text"
                  value={fromQuery}
                  onChange={(e) => {
                    setFromQuery(e.target.value);
                    setSelectedFrom(null);
                    setShowFromSuggestions(true);
                    fetchDynamicSuggestions(e.target.value, 'from');
                  }}
                  onFocus={() => setShowFromSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowFromSuggestions(false), 200)}
                  placeholder={t('addStops.fromPlaceholder', 'Enter starting location')}
                  className="location-input"
                />
                {isLoadingFrom && <span className="loading-indicator">⏳</span>}
                {selectedFrom && <span className="verified-badge">✓</span>}
                {showFromSuggestions && fromSuggestions.length > 0 && (
                  <ul className="suggestions-list" role="listbox">
                    {fromSuggestions.map(loc => (
                      <li
                        key={loc.id}
                        role="option"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedFrom(loc);
                          setFromQuery(loc.name);
                          setShowFromSuggestions(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedFrom(loc);
                            setFromQuery(loc.name);
                            setShowFromSuggestions(false);
                          }
                        }}
                      >
                        <span className="loc-icon">🚍</span>
                        <span className="loc-name">{loc.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="location-input-group">
              <label>🔴 {t('addStops.to', 'To')}</label>
              <div className="autocomplete-wrapper">
                <input
                  type="text"
                  value={toQuery}
                  onChange={(e) => {
                    setToQuery(e.target.value);
                    setSelectedTo(null);
                    setShowToSuggestions(true);
                    fetchDynamicSuggestions(e.target.value, 'to');
                  }}
                  onFocus={() => setShowToSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
                  placeholder={t('addStops.toPlaceholder', 'Enter destination')}
                  className="location-input"
                />
                {isLoadingTo && <span className="loading-indicator">⏳</span>}
                {selectedTo && <span className="verified-badge">✓</span>}
                {showToSuggestions && toSuggestions.length > 0 && (
                  <ul className="suggestions-list" role="listbox">
                    {toSuggestions.map(loc => (
                      <li
                        key={loc.id}
                        role="option"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedTo(loc);
                          setToQuery(loc.name);
                          setShowToSuggestions(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedTo(loc);
                            setToQuery(loc.name);
                            setShowToSuggestions(false);
                          }
                        }}
                      >
                        <span className="loc-icon">🚍</span>
                        <span className="loc-name">{loc.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <button
              className="search-btn"
              onClick={handleSearchBuses}
              disabled={!selectedFrom || !selectedTo || isSearching}
            >
              {isSearching ? (
                <span className="loading-spinner" />
              ) : (
                <>🔍 {t('addStops.findBuses', 'Find Buses')}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Bus Selection (when buses are found) */}
      {!preSelectedBus && buses.length > 0 && !selectedBus && (
        <div className="add-stops-section">
          <div className="section-header">
            <span className="step-badge">2</span>
            <h3>{t('addStops.step2', 'Select a Bus')}</h3>
          </div>
          
          <div className="buses-grid">
            {buses.map(bus => (
              <button
                key={bus.id}
                type="button"
                className="bus-selection-card"
                onClick={() => handleSelectBus(bus)}
              >
                <div className="bus-info">
                  <span className="bus-number">{bus.busNumber}</span>
                  <span className="bus-name">{bus.busName}</span>
                </div>
                <div className="bus-timing">
                  <span>🟢 {bus.departureTime}</span>
                  <span className="arrow">→</span>
                  <span>🔴 {bus.arrivalTime}</span>
                </div>
                <div className="bus-meta">
                  {bus.fare && <span className="fare">₹{bus.fare}</span>}
                  {bus.duration && <span className="duration">⏱️ {bus.duration}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Bus Display (READ-ONLY) */}
      {selectedBus && (
        <div className="add-stops-section">
          <div className="section-header">
            <span className="step-badge">{preSelectedBus ? '1' : '2'}</span>
            <h3>{t('addStops.selectedRoute', 'Selected Route')}</h3>
            <span className="locked-badge">🔒 {t('addStops.locked', 'Locked')}</span>
          </div>
          
          <div className="selected-bus-card readonly">
            <div className="readonly-notice">
              <span className="notice-icon">ℹ️</span>
              <span>{t('addStops.readonlyNotice', 'Route details cannot be edited. You can only add stops.')}</span>
            </div>
            
            {/* Route Visual Display */}
            <div className="route-visual-display">
              <div className="route-endpoint origin">
                <span className="endpoint-icon">🟢</span>
                <div className="endpoint-details">
                  <span className="endpoint-label">{t('addStops.fromLocation', 'From')}</span>
                  <span className="endpoint-name">{selectedBus.from}</span>
                  <span className="endpoint-time">{selectedBus.departureTime}</span>
                </div>
              </div>
              
              <div className="route-line-connector">
                <div className="line"></div>
                <span className="add-stops-hint">+ {t('addStops.addIntermediateStops', 'Add intermediate stops here')}</span>
              </div>
              
              <div className="route-endpoint destination">
                <span className="endpoint-icon">🔴</span>
                <div className="endpoint-details">
                  <span className="endpoint-label">{t('addStops.toLocation', 'To')}</span>
                  <span className="endpoint-name">{selectedBus.to}</span>
                  <span className="endpoint-time">{selectedBus.arrivalTime}</span>
                </div>
              </div>
            </div>
            
            <div className="bus-details-grid">
              <div className="detail-item">
                <label>{t('addStops.busNumber', 'Bus Number')}</label>
                <input type="text" value={selectedBus.busNumber} disabled className="disabled-input" />
              </div>
              <div className="detail-item">
                <label>{t('addStops.busName', 'Bus Name')}</label>
                <input type="text" value={selectedBus.busName} disabled className="disabled-input" />
              </div>
              {selectedBus.busType && (
                <div className="detail-item">
                  <label>{t('addStops.busType', 'Bus Type')}</label>
                  <input type="text" value={selectedBus.busType} disabled className="disabled-input" />
                </div>
              )}
              {selectedBus.fare !== undefined && selectedBus.fare !== null && (
                <div className="detail-item">
                  <label>{t('addStops.fare', 'Fare')}</label>
                  <input type="text" value={`₹${selectedBus.fare}`} disabled className="disabled-input" />
                </div>
              )}
              {selectedBus.duration && (
                <div className="detail-item">
                  <label>{t('addStops.duration', 'Duration')}</label>
                  <input type="text" value={selectedBus.duration} disabled className="disabled-input" />
                </div>
              )}
            </div>

            {!preSelectedBus && (
              <button 
                className="change-bus-btn"
                onClick={() => {
                  setSelectedBus(null);
                  setExistingStops([]);
                  setNewStops([]);
                }}
              >
                ↩️ {t('addStops.changeBus', 'Select Different Bus')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Existing Stops Display */}
      {selectedBus && !isLoadingStops && (
        <div className="add-stops-section">
          <div className="section-header">
            <span className="step-badge">{preSelectedBus ? '2' : '3'}</span>
            <h3>{t('addStops.existingStops', 'Existing Stops')}</h3>
            {existingStops.length === 0 && (
              <span className="missing-badge">⚠️ {t('addStops.noStops', 'No stops recorded')}</span>
            )}
          </div>

          {existingStops.length > 0 ? (
            <div className="existing-stops-list">
              {existingStops.map((stop, index) => (
                <div key={stop.id} className={`existing-stop-item ${index === 0 ? 'first' : ''} ${index === existingStops.length - 1 ? 'last' : ''}`}>
                  <div className="stop-marker">
                    {getStopMarker(index, existingStops.length)}
                  </div>
                  <div className="stop-details">
                    <span className="stop-name">{stop.name}</span>
                    <span className="stop-time">
                      {stop.arrivalTime && `Arr: ${stop.arrivalTime}`}
                      {stop.arrivalTime && stop.departureTime && ' | '}
                      {stop.departureTime && `Dep: ${stop.departureTime}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-stops-message">
              <span className="empty-icon">📭</span>
              <p>{t('addStops.noStopsMessage', 'This route has no stops recorded yet. Be the first to add them!')}</p>
            </div>
          )}
        </div>
      )}

      {/* Loading Stops */}
      {isLoadingStops && (
        <div className="loading-section">
          <span className="loading-spinner" />
          <span>{t('addStops.loadingStops', 'Loading existing stops...')}</span>
        </div>
      )}

      {/* Add New Stops Section */}
      {selectedBus && !isLoadingStops && (
        <div className="add-stops-section">
          <div className="section-header">
            <span className="step-badge">{preSelectedBus ? '3' : '4'}</span>
            <h3>{t('addStops.addNewStops', 'Add New Stops')}</h3>
          </div>

          {hasMissingStops && (
            <div className="help-tip">
              <span className="tip-icon">💡</span>
              <span>{t('addStops.helpTip', 'Add intermediate stops between the starting and ending points with their arrival/departure times.')}</span>
            </div>
          )}

          {/* New Stops List */}
          <div className="new-stops-list">
            {newStops.map((stop, index) => (
              <div key={`stop-${stop.order}-${index}`} className="new-stop-entry">
                <div className="stop-order">
                  <span className="order-number">{index + 1}</span>
                </div>
                
                <div className="stop-fields">
                  <div className="field-group location-field">
                    <label>{t('addStops.stopLocation', 'Stop Location')}</label>
                    <div className="autocomplete-wrapper">
                      <input
                        type="text"
                        value={stop.locationName}
                        onChange={(e) => {
                          handleUpdateStop(index, 'locationName', e.target.value);
                          setStopLocationQuery(e.target.value);
                          setShowStopSuggestions(true);
                          setActiveStopInputIndex(index);
                          setHighlightedStopIndex(-1);
                          fetchDynamicSuggestions(e.target.value, 'stop');
                        }}
                        onFocus={() => {
                          setStopLocationQuery(stop.locationName);
                          setShowStopSuggestions(true);
                          setActiveStopInputIndex(index);
                          setHighlightedStopIndex(-1);
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            if (!isSelectingStopRef.current) {
                              setShowStopSuggestions(false);
                              setActiveStopInputIndex(null);
                              setHighlightedStopIndex(-1);
                            }
                            isSelectingStopRef.current = false;
                          }, 200);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setShowStopSuggestions(false);
                            setHighlightedStopIndex(-1);
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setShowStopSuggestions(true);
                            setHighlightedStopIndex(prev => 
                              prev < stopSuggestions.length - 1 ? prev + 1 : prev
                            );
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setHighlightedStopIndex(prev => prev > 0 ? prev - 1 : -1);
                          } else if (e.key === 'Enter') {
                            if (highlightedStopIndex >= 0 && stopSuggestions[highlightedStopIndex]) {
                              e.preventDefault();
                              handleSelectStopLocation(index, stopSuggestions[highlightedStopIndex]);
                            }
                          } else if (e.key === 'Tab') {
                            setShowStopSuggestions(false);
                            setHighlightedStopIndex(-1);
                          }
                        }}
                        placeholder={t('addStops.enterStopName', 'Enter stop name')}
                        className="stop-input"
                        autoComplete="off"
                      />
                      {isLoadingStopSuggestions && activeStopInputIndex === index && (
                        <span className="loading-indicator">⏳</span>
                      )}
                      {showStopSuggestions && activeStopInputIndex === index && stopSuggestions.length > 0 && (
                        <ul className="suggestions-list" role="listbox">
                          {stopSuggestions.map((loc, locIndex) => {
                            const isHighlighted = locIndex === highlightedStopIndex;
                            return (
                              <li
                                key={loc.id}
                                role="option"
                                aria-selected={isHighlighted}
                                onMouseDown={() => {
                                  isSelectingStopRef.current = true;
                                }}
                                onClick={() => {
                                  handleSelectStopLocation(index, loc);
                                }}
                                onMouseEnter={() => setHighlightedStopIndex(locIndex)}
                                style={{
                                  background: isHighlighted ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                  fontWeight: isHighlighted ? 600 : 400,
                                  color: isHighlighted ? '#3B82F6' : 'inherit'
                                }}
                              >
                                <span className="loc-icon">→</span>
                                <span className="loc-icon">📍</span>
                                <span className="loc-name">{loc.name}</span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="time-fields">
                    <div className="field-group">
                      <label>{t('addStops.arrivalTime', 'Arrival')}</label>
                      <input
                        type="time"
                        value={stop.arrivalTime}
                        onChange={(e) => handleUpdateStop(index, 'arrivalTime', e.target.value)}
                        className="time-input"
                      />
                    </div>
                    <div className="field-group">
                      <label>{t('addStops.departureTime', 'Departure')}</label>
                      <input
                        type="time"
                        value={stop.departureTime}
                        onChange={(e) => handleUpdateStop(index, 'departureTime', e.target.value)}
                        className="time-input"
                      />
                    </div>
                  </div>
                </div>

                <button
                  className="remove-stop-btn"
                  onClick={() => handleRemoveStop(index)}
                  title={t('addStops.removeStop', 'Remove stop')}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Add Stop Button */}
          <button className="add-stop-btn" onClick={handleAddStop}>
            <span className="plus-icon">+</span>
            {t('addStops.addStop', 'Add Stop')}
          </button>

          {/* Action Buttons */}
          <div className="action-buttons">
            {onCancel && (
              <button className="cancel-btn" onClick={onCancel}>
                {t('addStops.cancel', 'Cancel')}
              </button>
            )}
            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={newStops.length === 0 || isSubmitting || submitSuccess}
            >
              {getSubmitButtonContent()}
            </button>
          </div>

          {/* Success Message */}
          {submitSuccess && (
            <div className="success-message">
              <span className="success-icon">🎉</span>
              <div className="success-content">
                <h4>{t('addStops.thankYou', 'Thank you for contributing!')}</h4>
                <p>{t('addStops.successMessage', 'Your stop information will help thousands of travelers.')}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddStopsToRoute;
