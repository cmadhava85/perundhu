import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Location } from '../../types';
import { searchBuses, getLocations } from '../../services/api';
import { useEffect } from 'react';
import HoneypotFields from '../common/HoneypotFields';
import { useSubmissionSecurity } from '../../hooks/useSubmissionSecurity';
import './ReportIssue.css';

interface ReportIssueProps {
  /** Pre-selected bus (when reporting from search results) */
  preSelectedBus?: Bus;
  /** Pre-selected from location */
  preSelectedFrom?: Location;
  /** Pre-selected to location */
  preSelectedTo?: Location;
  /** Callback when issue is submitted */
  onSubmit?: (issueData: RouteIssueData) => void;
  /** Callback on error */
  onError?: (error: string) => void;
  /** Close handler */
  onClose?: () => void;
}

interface RouteIssueData {
  busId?: number;
  busName?: string;
  busNumber?: string;
  fromLocation?: string;
  toLocation?: string;
  issueType: IssueType;
  description: string;
  suggestedDepartureTime?: string;
  suggestedArrivalTime?: string;
  lastTraveledDate?: string;
  reporterId?: string;
}

type IssueType = 
  | 'BUS_NOT_AVAILABLE'
  | 'WRONG_TIMING'
  | 'WRONG_SCHEDULE'
  | 'WRONG_STOPS'
  | 'WRONG_FARE'
  | 'ROUTE_CHANGED'
  | 'SERVICE_SUSPENDED'
  | 'OTHER';

interface IssueTypeOption {
  value: IssueType;
  label: string;
  icon: string;
  description: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const ReportIssue: React.FC<ReportIssueProps> = ({
  preSelectedBus,
  preSelectedFrom,
  preSelectedTo,
  onSubmit,
  onError,
  onClose
}) => {
  const { t } = useTranslation();
  const { prepareSubmission, isLoading: isSecurityLoading } = useSubmissionSecurity();
  
  // Route selection state
  const [locations, setLocations] = useState<Location[]>([]);
  const [fromQuery, setFromQuery] = useState(preSelectedFrom?.name || '');
  const [toQuery, setToQuery] = useState(preSelectedTo?.name || '');
  const [selectedFrom, setSelectedFrom] = useState<Location | null>(preSelectedFrom || null);
  const [selectedTo, setSelectedTo] = useState<Location | null>(preSelectedTo || null);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  
  // Bus selection state
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(preSelectedBus || null);
  const [isSearching, setIsSearching] = useState(false);
  const [busSearched, setBusSearched] = useState(false);
  
  // Issue form state
  const [issueType, setIssueType] = useState<IssueType | null>(null);
  const [description, setDescription] = useState('');
  const [suggestedDepartureTime, setSuggestedDepartureTime] = useState('');
  const [suggestedArrivalTime, setSuggestedArrivalTime] = useState('');
  const [lastTraveledDate, setLastTraveledDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const issueTypes: IssueTypeOption[] = [
    {
      value: 'BUS_NOT_AVAILABLE',
      label: t('reportIssue.types.busNotAvailable', 'Bus Not Running'),
      icon: '🚫',
      description: t('reportIssue.types.busNotAvailableDesc', 'This bus no longer operates on this route')
    },
    {
      value: 'WRONG_TIMING',
      label: t('reportIssue.types.wrongTiming', 'Wrong Timings'),
      icon: '⏰',
      description: t('reportIssue.types.wrongTimingDesc', 'Departure/arrival times are incorrect')
    },
    {
      value: 'WRONG_SCHEDULE',
      label: t('reportIssue.types.wrongSchedule', 'Wrong Schedule'),
      icon: '📅',
      description: t('reportIssue.types.wrongScheduleDesc', 'Bus doesn\'t run on certain days shown')
    },
    {
      value: 'WRONG_STOPS',
      label: t('reportIssue.types.wrongStops', 'Wrong Stops'),
      icon: '📍',
      description: t('reportIssue.types.wrongStopsDesc', 'Stops information is incorrect')
    },
    {
      value: 'ROUTE_CHANGED',
      label: t('reportIssue.types.routeChanged', 'Route Changed'),
      icon: '🔄',
      description: t('reportIssue.types.routeChangedDesc', 'Bus now takes a different route')
    },
    {
      value: 'SERVICE_SUSPENDED',
      label: t('reportIssue.types.serviceSuspended', 'Service Suspended'),
      icon: '⚠️',
      description: t('reportIssue.types.serviceSuspendedDesc', 'Temporarily not running')
    },
    {
      value: 'WRONG_FARE',
      label: t('reportIssue.types.wrongFare', 'Wrong Fare'),
      icon: '💰',
      description: t('reportIssue.types.wrongFareDesc', 'Ticket price is different')
    },
    {
      value: 'OTHER',
      label: t('reportIssue.types.other', 'Other Issue'),
      icon: '❓',
      description: t('reportIssue.types.otherDesc', 'Something else is wrong')
    }
  ];

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

  // Filter locations for suggestions
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

  // Search for buses
  const handleSearchBuses = async () => {
    if (!selectedFrom || !selectedTo) return;
    
    setIsSearching(true);
    setBuses([]);
    setSelectedBus(null);
    setBusSearched(true);
    
    try {
      const results = await searchBuses(selectedFrom, selectedTo, true);
      setBuses(results);
    } catch {
      onError?.(t('reportIssue.searchFailed', 'Failed to search buses'));
    } finally {
      setIsSearching(false);
    }
  };

  // Submit the issue report
  const handleSubmit = async () => {
    if (!issueType) {
      setSubmitError(t('reportIssue.selectIssueType', 'Please select an issue type'));
      return;
    }
    
    if (!description.trim() && issueType !== 'BUS_NOT_AVAILABLE') {
      setSubmitError(t('reportIssue.descriptionRequired', 'Please describe the issue'));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    
    const issueData: RouteIssueData = {
      busId: selectedBus?.id,
      busName: selectedBus?.busName,
      busNumber: selectedBus?.busNumber,
      fromLocation: selectedFrom?.name || fromQuery,
      toLocation: selectedTo?.name || toQuery,
      issueType,
      description: description.trim(),
      suggestedDepartureTime: suggestedDepartureTime || undefined,
      suggestedArrivalTime: suggestedArrivalTime || undefined,
      lastTraveledDate: lastTraveledDate || undefined,
      reporterId: localStorage.getItem('userId') || `anon_${Date.now()}`
    };
    
    // Validate security (honeypot, reCAPTCHA)
    const securePayload = await prepareSubmission(issueData as unknown as Record<string, unknown>);
    if (!securePayload.isValid) {
      setSubmitError(t('reportIssue.securityFailed', 'Security validation failed. Please try again.'));
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/route-issues`, {
        method: 'POST',
        headers: securePayload.headers,
        body: JSON.stringify(securePayload.data)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSubmitSuccess(true);
        onSubmit?.(issueData);
        
        // Close after showing success
        setTimeout(() => {
          onClose?.();
        }, 3000);
      } else {
        setSubmitError(data.error || t('reportIssue.submitFailed', 'Failed to submit report'));
      }
    } catch (error) {
      console.error('Error submitting issue:', error);
      setSubmitError(t('reportIssue.submitFailed', 'Failed to submit report. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fromSuggestions = filterLocations(fromQuery);
  const toSuggestions = filterLocations(toQuery);

  // If preSelectedBus is provided, skip step 1 and 2
  const showRouteSelection = !preSelectedBus;

  return (
    <div className="report-issue-container">
      {/* Header */}
      <div className="report-issue-header">
        <div className="header-icon">🚨</div>
        <div className="header-content">
          <h2>{t('reportIssue.title', 'Report an Issue')}</h2>
          <p>{t('reportIssue.subtitle', 'Help us keep information accurate for everyone')}</p>
        </div>
        {onClose && (
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
      </div>

      {submitSuccess ? (
        <div className="success-container">
          <div className="success-icon">✅</div>
          <h3>{t('reportIssue.thankYou', 'Thank you!')}</h3>
          <p>{t('reportIssue.successMessage', 'Your report has been submitted. We\'ll review and update the information.')}</p>
        </div>
      ) : (
        <div className="report-issue-form">
          {/* Hidden honeypot fields for bot detection */}
          <HoneypotFields />
          
          {/* Step 1: Route Selection (if not pre-selected) */}
          {showRouteSelection && (
            <div className="form-section">
              <div className="section-header">
                <span className="step-number">1</span>
                <h3>{t('reportIssue.step1', 'Which route has the issue?')}</h3>
              </div>
              
              <div className="route-selection">
                <div className="location-input-group">
                  <label>🟢 {t('reportIssue.from', 'From')}</label>
                  <div className="autocomplete-wrapper">
                    <input
                      type="text"
                      value={fromQuery}
                      onChange={(e) => {
                        setFromQuery(e.target.value);
                        setSelectedFrom(null);
                        setShowFromSuggestions(true);
                        setBusSearched(false);
                      }}
                      onFocus={() => setShowFromSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowFromSuggestions(false), 200)}
                      placeholder={t('reportIssue.fromPlaceholder', 'Enter starting location')}
                      className="location-input"
                    />
                    {selectedFrom && <span className="verified-badge">✓</span>}
                    {showFromSuggestions && fromSuggestions.length > 0 && (
                      <ul className="suggestions-list">
                        {fromSuggestions.map(loc => (
                          <li
                            key={loc.id}
                            onClick={() => {
                              setSelectedFrom(loc);
                              setFromQuery(loc.name);
                              setShowFromSuggestions(false);
                            }}
                          >
                            <span className="loc-icon">🚍</span>
                            <span className="loc-name">{loc.name}</span>
                            {loc.translatedName && (
                              <span className="loc-translated">{loc.translatedName}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="location-input-group">
                  <label>🔴 {t('reportIssue.to', 'To')}</label>
                  <div className="autocomplete-wrapper">
                    <input
                      type="text"
                      value={toQuery}
                      onChange={(e) => {
                        setToQuery(e.target.value);
                        setSelectedTo(null);
                        setShowToSuggestions(true);
                        setBusSearched(false);
                      }}
                      onFocus={() => setShowToSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
                      placeholder={t('reportIssue.toPlaceholder', 'Enter destination')}
                      className="location-input"
                    />
                    {selectedTo && <span className="verified-badge">✓</span>}
                    {showToSuggestions && toSuggestions.length > 0 && (
                      <ul className="suggestions-list">
                        {toSuggestions.map(loc => (
                          <li
                            key={loc.id}
                            onClick={() => {
                              setSelectedTo(loc);
                              setToQuery(loc.name);
                              setShowToSuggestions(false);
                            }}
                          >
                            <span className="loc-icon">🚍</span>
                            <span className="loc-name">{loc.name}</span>
                            {loc.translatedName && (
                              <span className="loc-translated">{loc.translatedName}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <button
                  className="search-buses-btn"
                  onClick={handleSearchBuses}
                  disabled={!selectedFrom || !selectedTo || isSearching}
                >
                  {isSearching ? (
                    <span className="loading-spinner" />
                  ) : (
                    <>🔍 {t('reportIssue.findBuses', 'Find Buses')}</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Bus Selection */}
          {(busSearched || preSelectedBus) && (
            <div className="form-section">
              <div className="section-header">
                <span className="step-number">{showRouteSelection ? '2' : '1'}</span>
                <h3>{t('reportIssue.step2', 'Select the bus with the issue')}</h3>
              </div>
              
              {preSelectedBus ? (
                <div className="selected-bus-card">
                  <div className="bus-header">
                    <span className="bus-number">{preSelectedBus.busNumber}</span>
                    <span className="bus-name">{preSelectedBus.busName}</span>
                  </div>
                  <div className="bus-timing">
                    <span className="departure">🟢 {preSelectedBus.departureTime}</span>
                    <span className="arrow">→</span>
                    <span className="arrival">🔴 {preSelectedBus.arrivalTime}</span>
                  </div>
                </div>
              ) : buses.length > 0 ? (
                <div className="buses-list">
                  {buses.map(bus => (
                    <div
                      key={bus.id}
                      className={`bus-card ${selectedBus?.id === bus.id ? 'selected' : ''}`}
                      onClick={() => setSelectedBus(bus)}
                    >
                      <div className="bus-header">
                        <span className="bus-number">{bus.busNumber}</span>
                        <span className="bus-name">{bus.busName}</span>
                      </div>
                      <div className="bus-timing">
                        <span className="departure">🟢 {bus.departureTime}</span>
                        <span className="arrow">→</span>
                        <span className="arrival">🔴 {bus.arrivalTime}</span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Option to report without selecting a bus */}
                  <div
                    className={`bus-card general-report ${!selectedBus ? 'selected' : ''}`}
                    onClick={() => setSelectedBus(null)}
                  >
                    <div className="bus-header">
                      <span className="bus-icon">🚌</span>
                      <span className="bus-name">{t('reportIssue.generalIssue', 'General Route Issue')}</span>
                    </div>
                    <p className="general-note">{t('reportIssue.generalIssueDesc', 'Report an issue that applies to the entire route')}</p>
                  </div>
                </div>
              ) : (
                <div className="no-buses-found">
                  <p>{t('reportIssue.noBusesFound', 'No buses found for this route.')}</p>
                  <p className="hint">{t('reportIssue.noBusesHint', 'You can still report that a bus should exist on this route.')}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Issue Type */}
          {(selectedBus || busSearched || preSelectedBus) && (
            <div className="form-section">
              <div className="section-header">
                <span className="step-number">{showRouteSelection ? '3' : '2'}</span>
                <h3>{t('reportIssue.step3', 'What\'s the issue?')}</h3>
              </div>
              
              <div className="issue-types-grid">
                {issueTypes.map(type => (
                  <div
                    key={type.value}
                    className={`issue-type-card ${issueType === type.value ? 'selected' : ''}`}
                    onClick={() => {
                      setIssueType(type.value);
                      setSubmitError(null);
                    }}
                  >
                    <span className="type-icon">{type.icon}</span>
                    <span className="type-label">{type.label}</span>
                    <span className="type-desc">{type.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Details */}
          {issueType && (
            <div className="form-section">
              <div className="section-header">
                <span className="step-number">{showRouteSelection ? '4' : '3'}</span>
                <h3>{t('reportIssue.step4', 'Provide details')}</h3>
              </div>
              
              <div className="details-form">
                {/* Show suggested time fields for timing issues */}
                {(issueType === 'WRONG_TIMING' || issueType === 'WRONG_SCHEDULE') && (
                  <div className="timing-suggestion compact">
                    <div className="timing-header">
                      <span className="timing-label">{t('reportIssue.suggestedTimes', 'Suggested times')}</span>
                      <span className="optional-tag">{t('reportIssue.optional', 'optional')}</span>
                    </div>
                    <div className="time-inputs-inline">
                      <div className="time-chip">
                        <span className="time-indicator departure">●</span>
                        <input
                          type="time"
                          value={suggestedDepartureTime}
                          onChange={(e) => setSuggestedDepartureTime(e.target.value)}
                          placeholder="--:--"
                        />
                      </div>
                      <span className="time-separator">→</span>
                      <div className="time-chip">
                        <span className="time-indicator arrival">●</span>
                        <input
                          type="time"
                          value={suggestedArrivalTime}
                          onChange={(e) => setSuggestedArrivalTime(e.target.value)}
                          placeholder="--:--"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Description */}
                <div className="description-group compact">
                  <label>
                    💬 {t('reportIssue.description', 'Describe the issue')}
                    {issueType !== 'BUS_NOT_AVAILABLE' && <span className="required">*</span>}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setSubmitError(null);
                    }}
                    placeholder={getDescriptionPlaceholder(issueType, t)}
                    rows={2}
                  />
                  <span className="char-count">{description.length}/500</span>
                </div>
                
                {/* Last traveled */}
                <div className="last-traveled-inline">
                  <span className="inline-label">📅 {t('reportIssue.lastTraveledShort', 'Last traveled')}</span>
                  <select
                    value={lastTraveledDate}
                    onChange={(e) => setLastTraveledDate(e.target.value)}
                    className="inline-select"
                  >
                    <option value="">{t('reportIssue.selectDate', 'Select...')}</option>
                    <option value="today">{t('reportIssue.date.today', 'Today')}</option>
                    <option value="this-week">{t('reportIssue.date.thisWeek', 'This week')}</option>
                    <option value="this-month">{t('reportIssue.date.thisMonth', 'This month')}</option>
                    <option value="few-months">{t('reportIssue.date.fewMonths', 'Few months ago')}</option>
                    <option value="never">{t('reportIssue.date.never', 'Never')}</option>
                  </select>
                </div>
                
                {/* Error message */}
                {submitError && (
                  <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    {submitError}
                  </div>
                )}
                
                {/* Submit button */}
                <button
                  className="submit-btn"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isSecurityLoading}
                >
                  {isSubmitting || isSecurityLoading ? (
                    <>
                      <span className="loading-spinner" />
                      {t('reportIssue.submitting', 'Submitting...')}
                    </>
                  ) : (
                    <>📤 {t('reportIssue.submit', 'Submit Report')}</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info tip */}
      <div className="report-tip">
        <span className="tip-icon">💡</span>
        <div className="tip-content">
          <strong>{t('reportIssue.tipTitle', 'Your reports matter!')}</strong>
          <p>{t('reportIssue.tipText', 'Multiple reports for the same issue help us prioritize fixes. We review reports daily.')}</p>
        </div>
      </div>
    </div>
  );
};

function getDescriptionPlaceholder(issueType: IssueType, t: (key: string, defaultValue: string) => string): string {
  switch (issueType) {
    case 'BUS_NOT_AVAILABLE':
      return t('reportIssue.placeholder.busNotAvailable', 'When did this bus stop running? Any alternative you know?');
    case 'WRONG_TIMING':
      return t('reportIssue.placeholder.wrongTiming', 'What are the actual timings you observed?');
    case 'WRONG_SCHEDULE':
      return t('reportIssue.placeholder.wrongSchedule', 'Which days does this bus actually run?');
    case 'WRONG_STOPS':
      return t('reportIssue.placeholder.wrongStops', 'Which stops are missing or incorrect?');
    case 'ROUTE_CHANGED':
      return t('reportIssue.placeholder.routeChanged', 'How has the route changed?');
    case 'SERVICE_SUSPENDED':
      return t('reportIssue.placeholder.serviceSuspended', 'Any information about when service might resume?');
    case 'WRONG_FARE':
      return t('reportIssue.placeholder.wrongFare', 'What is the actual fare?');
    default:
      return t('reportIssue.placeholder.other', 'Describe the issue in detail...');
  }
}

export default ReportIssue;
