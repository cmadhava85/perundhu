import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { StopEntry } from './AddStopsToRoute';
import { locationAutocompleteService, type LocationSuggestion } from '../../services/locationAutocompleteService';
import './StopEntryWizard.css';

interface StopEntryWizardProps {
  stopIndex: number;
  totalStops: number;
  initialStop?: StopEntry;
  onComplete: (stop: StopEntry) => void;
  onCancel: () => void;
  onAddAnother?: (stop: StopEntry) => void;
}

type WizardStep = 'name' | 'arrival' | 'departure' | 'notes' | 'review';

const StopEntryWizard: React.FC<StopEntryWizardProps> = ({
  stopIndex,
  totalStops,
  initialStop,
  onComplete,
  onCancel,
  onAddAnother
}) => {
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState<WizardStep>('name');
  const [formData, setFormData] = useState<StopEntry>(
    initialStop || {
      locationName: '',
      arrivalTime: '',
      departureTime: '',
      order: stopIndex + 1
    }
  );

  // Autocomplete state
  const [stopLocationQuery, setStopLocationQuery] = useState(initialStop?.locationName || '');
  const [dynamicStopSuggestions, setDynamicStopSuggestions] = useState<LocationSuggestion[]>([]);
  const [showStopSuggestions, setShowStopSuggestions] = useState(false);
  const [isLoadingStopSuggestions, setIsLoadingStopSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isStopSelected, setIsStopSelected] = useState(false);
  const stopInputRef = useRef<HTMLInputElement>(null);
  const isSelectingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const steps: WizardStep[] = ['name', 'arrival', 'departure', 'notes', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  // Fetch dynamic suggestions for stop location
  const fetchDynamicSuggestions = useCallback((query: string) => {
    console.log(`🔍 Wizard: fetchDynamicSuggestions called for "${query}" (length: ${query.length})`);
    
    if (query.trim().length < 3) {
      console.log(`⏭️ Wizard: Query too short (${query.trim().length} chars), clearing suggestions`);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      setDynamicStopSuggestions([]);
      setShowStopSuggestions(false);
      setIsLoadingStopSuggestions(false);
      return;
    }
    
    console.log(`📡 Wizard: Starting API call for "${query}"`);
    setIsLoadingStopSuggestions(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    debounceTimerRef.current = setTimeout(() => {
      locationAutocompleteService.getDebouncedSuggestions(
        query,
        (suggestions) => {
          console.log(`✅ Wizard: Got ${suggestions.length} suggestions for "${query}"`);
          console.log(`📋 Wizard: Suggestions:`, suggestions);
          setDynamicStopSuggestions(suggestions);
          setIsLoadingStopSuggestions(false);
          if (suggestions.length > 0) {
            setShowStopSuggestions(true);
          }
        },
        i18n.language
      );
    }, 300);
  }, [i18n.language]);

  // Helper function to get display name based on current language
  const getLocationDisplayName = useCallback((suggestion: LocationSuggestion): string => {
    if (i18n.language === 'ta' && suggestion.translatedName) {
      return suggestion.translatedName;
    }
    return suggestion.name;
  }, [i18n.language]);

  // Handle stop location selection
  const handleSelectStopLocation = (suggestion: LocationSuggestion) => {
    const displayName = getLocationDisplayName(suggestion);
    setFormData({ ...formData, locationName: displayName });
    setStopLocationQuery(displayName);
    setShowStopSuggestions(false);
    setHighlightedIndex(-1);
    setIsStopSelected(true);
  };

  // Debug: Log render state
  React.useEffect(() => {
    console.log(`🎯 Wizard render state - showSuggestions: ${showStopSuggestions}, count: ${dynamicStopSuggestions.length}`);
  }, [showStopSuggestions, dynamicStopSuggestions]);

  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleNext = () => {
    // Validation
    if (currentStep === 'name') {
      if (!formData.locationName.trim()) {
        alert(t('addStops.enterStopName', 'Please enter a stop name'));
        return;
      }
      if (!isStopSelected) {
        alert(t('validation.location.selectFromList', 'Please select stop from the suggestions list'));
        return;
      }
    }
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const handleSubmit = () => {
    onComplete(formData);
  };

  const handleAddAnother = () => {
    if (onAddAnother) {
      onAddAnother(formData);
    }
  };

  return (
    <div className="stop-entry-wizard">
      {/* Header with Progress */}
      <div className="wizard-header">
        <div className="step-counter">
          <span className="current">{stopIndex + 1}</span>
          <span className="total">of {totalStops}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <button className="close-btn" onClick={onCancel} aria-label="Close">
          ✕
        </button>
      </div>

      {/* Main Content */}
      <div className="wizard-content">
        {/* Step 1: Stop Name */}
        {currentStep === 'name' && (
          <div className="wizard-step">
            <div className="step-icon">📍</div>
            <h2>{t('addStops.enterStopName', 'Enter Stop Name')}</h2>
            <p className="step-description">
              {t('addStops.stopNameHint', 'What is the name of this bus stop?')}
            </p>
            <div className="autocomplete-wrapper">
              <input
                ref={stopInputRef}
                type="text"
                placeholder={t('addStops.stopNamePlaceholder', 'e.g., Central Metro Station')}
                value={stopLocationQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setStopLocationQuery(value);
                  setFormData({ ...formData, locationName: value });
                  setIsStopSelected(false);
                  setShowStopSuggestions(true);
                  setHighlightedIndex(-1);
                  fetchDynamicSuggestions(value);
                }}
                onFocus={() => {
                  setShowStopSuggestions(true);
                  setHighlightedIndex(-1);
                }}
                onBlur={() => {
                  setTimeout(() => {
                    if (!isSelectingRef.current) {
                      setShowStopSuggestions(false);
                      setHighlightedIndex(-1);
                    }
                    isSelectingRef.current = false;
                  }, 200);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowStopSuggestions(false);
                    setHighlightedIndex(-1);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setShowStopSuggestions(true);
                    setHighlightedIndex(prev => 
                      prev < dynamicStopSuggestions.length - 1 ? prev + 1 : prev
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
                  } else if (e.key === 'Enter') {
                    if (highlightedIndex >= 0 && dynamicStopSuggestions[highlightedIndex]) {
                      e.preventDefault();
                      handleSelectStopLocation(dynamicStopSuggestions[highlightedIndex]);
                    }
                  } else if (e.key === 'Tab') {
                    setShowStopSuggestions(false);
                    setHighlightedIndex(-1);
                  }
                }}
                autoFocus
                className="wizard-input"
                autoComplete="off"
              />
              {isLoadingStopSuggestions && <span className="loading-indicator">⏳</span>}
              {showStopSuggestions && dynamicStopSuggestions.length > 0 ? (
                  <ul 
                    className="suggestions-list" 
                    role="listbox"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                    }}
                  >
                    {dynamicStopSuggestions.map((loc, locIndex) => {
                      const isHighlighted = locIndex === highlightedIndex;
                      return (
                        <li
                          key={loc.id}
                          role="option"
                          aria-selected={isHighlighted}
                          onMouseDown={() => {
                            isSelectingRef.current = true;
                          }}
                          onClick={() => {
                            handleSelectStopLocation(loc);
                          }}
                          onMouseEnter={() => setHighlightedIndex(locIndex)}
                          style={{
                            background: isHighlighted ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                            fontWeight: isHighlighted ? 600 : 400,
                            color: isHighlighted ? '#3B82F6' : 'inherit',
                            cursor: 'pointer',
                            padding: '12px 16px',
                            listStyle: 'none'
                          }}
                        >
                          <span className="loc-icon">📍</span>
                          <span className="loc-name">{getLocationDisplayName(loc)}</span>
                        </li>
                      );
                    })}
                  </ul>
              ) : null}
            </div>
          </div>
        )}

        {/* Step 2: Arrival Time */}
        {currentStep === 'arrival' && (
          <div className="wizard-step">
            <div className="step-icon">🕐</div>
            <h2>{t('addStops.arrivalTime', 'Arrival Time')}</h2>
            <p className="step-description">
              {t('addStops.arrivalTimeHint', 'When does the bus arrive at this stop?')}
            </p>
            <input
              type="time"
              value={formData.arrivalTime}
              onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
              autoFocus
              className="wizard-input"
            />
            <div className="step-note">
              {t('addStops.timeOptional', 'You can skip this if not known')}
            </div>
          </div>
        )}

        {/* Step 3: Departure Time */}
        {currentStep === 'departure' && (
          <div className="wizard-step">
            <div className="step-icon">🚌</div>
            <h2>{t('addStops.departureTime', 'Departure Time')}</h2>
            <p className="step-description">
              {t('addStops.departureTimeHint', 'When does the bus leave this stop?')}
            </p>
            <input
              type="time"
              value={formData.departureTime}
              onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
              autoFocus
              className="wizard-input"
            />
            <div className="step-note">
              {t('addStops.timeOptional', 'At least arrival or departure time is required')}
            </div>
          </div>
        )}

        {/* Step 4: Notes (Optional) */}
        {currentStep === 'notes' && (
          <div className="wizard-step">
            <div className="step-icon">📝</div>
            <h2>{t('addStops.notes', 'Additional Notes')}</h2>
            <p className="step-description">
              {t('addStops.notesHint', 'Any additional information about this stop?')}
            </p>
            <textarea
              placeholder={t('addStops.notesPlaceholder', 'e.g., Platform 2, Main entrance')}
              className="wizard-textarea"
              rows={3}
            />
            <div className="step-note">
              {t('addStops.notesOptional', 'This is optional')}
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 'review' && (
          <div className="wizard-step">
            <div className="step-icon">✓</div>
            <h2>{t('addStops.reviewStop', 'Review Stop Details')}</h2>
            <p className="step-description">
              {t('addStops.reviewHint', 'Please review the information before adding')}
            </p>
            <div className="review-card">
              <div className="review-item">
                <label>📍 Stop Name</label>
                <div className="review-value">{formData.locationName}</div>
              </div>
              {formData.arrivalTime && (
                <div className="review-item">
                  <label>🕐 Arrival Time</label>
                  <div className="review-value">{formData.arrivalTime.split(':').slice(0, 2).join(':')}</div>
                </div>
              )}
              {formData.departureTime && (
                <div className="review-item">
                  <label>🚌 Departure Time</label>
                  <div className="review-value">{formData.departureTime.split(':').slice(0, 2).join(':')}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer with Navigation */}
      <div className="wizard-footer">
        <button
          className="btn-secondary"
          onClick={currentStep === 'review' ? onCancel : handleBack}
          disabled={currentStepIndex === 0}
        >
          {currentStep === 'review' ? t('common.cancel', 'Cancel') : t('common.back', 'Back')}
        </button>

        {currentStep !== 'review' && (
          <button className="btn-primary" onClick={handleNext}>
            {t('common.next', 'Next')} →
          </button>
        )}

        {currentStep === 'review' && (
          <div className="button-group">
            <button className="btn-secondary" onClick={handleAddAnother}>
              {t('addStops.addAnother', 'Add Another')}
            </button>
            <button className="btn-success" onClick={handleSubmit}>
              {t('addStops.done', 'Done')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StopEntryWizard;
