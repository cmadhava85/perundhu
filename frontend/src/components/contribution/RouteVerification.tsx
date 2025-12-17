import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Stop, Location } from '../../types';
import { searchBuses, getStops, getLocations } from '../../services/api';
import './RouteVerification.css';

interface RouteVerificationProps {
  onVerificationSubmit?: (verification: RouteVerificationData) => void;
  onError?: (error: string) => void;
}

interface RouteVerificationData {
  busId: number;
  busName: string;
  isAccurate: boolean;
  timingAccuracy: 'accurate' | 'slightly-off' | 'significantly-off' | 'unknown';
  stopsAccuracy: 'all-correct' | 'some-missing' | 'some-wrong' | 'unknown';
  fareAccuracy: 'accurate' | 'higher' | 'lower' | 'unknown';
  comments: string;
  lastTraveled?: string;
  suggestedChanges?: {
    departureTime?: string;
    arrivalTime?: string;
    fare?: number;
    missingStops?: string[];
  };
}

interface VerificationStats {
  totalVerifications: number;
  routesVerified: number;
  accuracy: number;
  recentActivity: number;
}

export const RouteVerification: React.FC<RouteVerificationProps> = ({
  onVerificationSubmit,
  onError
}) => {
  const { t } = useTranslation();
  
  // State for route selection
  const [locations, setLocations] = useState<Location[]>([]);
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [selectedFrom, setSelectedFrom] = useState<Location | null>(null);
  const [selectedTo, setSelectedTo] = useState<Location | null>(null);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  
  // State for buses and verification
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [busStops, setBusStops] = useState<Stop[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingStops, setIsLoadingStops] = useState(false);
  
  // Verification form state
  const [isAccurate, setIsAccurate] = useState<boolean | null>(null);
  const [timingAccuracy, setTimingAccuracy] = useState<RouteVerificationData['timingAccuracy']>('unknown');
  const [stopsAccuracy, setStopsAccuracy] = useState<RouteVerificationData['stopsAccuracy']>('unknown');
  const [fareAccuracy, setFareAccuracy] = useState<RouteVerificationData['fareAccuracy']>('unknown');
  const [comments, setComments] = useState('');
  const [lastTraveled, setLastTraveled] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Stats for gamification
  const [stats] = useState<VerificationStats>({
    totalVerifications: 1247,
    routesVerified: 89,
    accuracy: 94.2,
    recentActivity: 23
  });

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
    
    try {
      const results = await searchBuses(selectedFrom, selectedTo, true);
      setBuses(results);
      if (results.length === 0) {
        onError?.(t('verification.noBusesFound', 'No buses found for this route'));
      }
    } catch {
      onError?.(t('verification.searchFailed', 'Failed to search buses'));
    } finally {
      setIsSearching(false);
    }
  };

  // Load stops when bus is selected
  const handleSelectBus = async (bus: Bus) => {
    setSelectedBus(bus);
    setIsLoadingStops(true);
    setBusStops([]);
    
    // Reset form
    setIsAccurate(null);
    setTimingAccuracy('unknown');
    setStopsAccuracy('unknown');
    setFareAccuracy('unknown');
    setComments('');
    setSubmitSuccess(false);
    
    try {
      const stops = await getStops(bus.id);
      // Sort stops by time (departure time first, then arrival time)
      const sortedStops = [...stops].sort((a, b) => {
        const timeA = a.departureTime || a.arrivalTime || '00:00';
        const timeB = b.departureTime || b.arrivalTime || '00:00';
        return timeA.localeCompare(timeB);
      });
      setBusStops(sortedStops);
    } catch {
      // Failed to load stops
    } finally {
      setIsLoadingStops(false);
    }
  };

  // Submit verification
  const handleSubmitVerification = async () => {
    if (!selectedBus || isAccurate === null) return;
    
    setIsSubmitting(true);
    
    const verificationData: RouteVerificationData = {
      busId: selectedBus.id,
      busName: selectedBus.busName,
      isAccurate,
      timingAccuracy,
      stopsAccuracy,
      fareAccuracy,
      comments,
      lastTraveled: lastTraveled || undefined
    };
    
    try {
      // Simulate API call - in real implementation, call backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onVerificationSubmit?.(verificationData);
      setSubmitSuccess(true);
      
      // Reset after success
      setTimeout(() => {
        setSelectedBus(null);
        setBusStops([]);
        setSubmitSuccess(false);
      }, 3000);
    } catch {
      onError?.(t('verification.submitFailed', 'Failed to submit verification'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fromSuggestions = filterLocations(fromQuery);
  const toSuggestions = filterLocations(toQuery);

  return (
    <div className="route-verification">
      {/* Community Stats Banner */}
      <div className="verification-stats-banner">
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{stats.totalVerifications.toLocaleString()}</span>
            <span className="stat-label">{t('verification.stats.totalVerifications', 'Verifications')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.routesVerified}</span>
            <span className="stat-label">{t('verification.stats.routes', 'Routes Verified')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.accuracy}%</span>
            <span className="stat-label">{t('verification.stats.accuracy', 'Data Accuracy')}</span>
          </div>
          <div className="stat-item highlight">
            <span className="stat-value">{stats.recentActivity}</span>
            <span className="stat-label">{t('verification.stats.today', 'Today')}</span>
          </div>
        </div>
      </div>

      {/* Step 1: Route Selection */}
      <div className="verification-section">
        <div className="section-header">
          <span className="step-badge">1</span>
          <h3>{t('verification.step1.title', 'Select a Route to Verify')}</h3>
        </div>
        
        <div className="route-selection">
          <div className="location-input-group">
            <label>🟢 {t('verification.from', 'From')}</label>
            <div className="autocomplete-wrapper">
              <input
                type="text"
                value={fromQuery}
                onChange={(e) => {
                  setFromQuery(e.target.value);
                  setSelectedFrom(null);
                  setShowFromSuggestions(true);
                }}
                onFocus={() => setShowFromSuggestions(true)}
                onBlur={() => setTimeout(() => setShowFromSuggestions(false), 200)}
                placeholder={t('verification.fromPlaceholder', 'Enter starting location')}
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
            <label>🔴 {t('verification.to', 'To')}</label>
            <div className="autocomplete-wrapper">
              <input
                type="text"
                value={toQuery}
                onChange={(e) => {
                  setToQuery(e.target.value);
                  setSelectedTo(null);
                  setShowToSuggestions(true);
                }}
                onFocus={() => setShowToSuggestions(true)}
                onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
                placeholder={t('verification.toPlaceholder', 'Enter destination')}
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
              <>🔍 {t('verification.searchBuses', 'Find Buses')}</>
            )}
          </button>
        </div>
      </div>

      {/* Step 2: Bus Selection */}
      {buses.length > 0 && (
        <div className="verification-section">
          <div className="section-header">
            <span className="step-badge">2</span>
            <h3>{t('verification.step2.title', 'Select a Bus to Verify')}</h3>
          </div>
          
          <div className="buses-list">
            {buses.map(bus => (
              <div
                key={bus.id}
                className={`bus-card ${selectedBus?.id === bus.id ? 'selected' : ''}`}
                onClick={() => handleSelectBus(bus)}
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
                {bus.fare && <span className="bus-fare">₹{bus.fare}</span>}
                {bus.duration && <span className="bus-duration">⏱️ {bus.duration}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Verification Form */}
      {selectedBus && (
        <div className="verification-section">
          <div className="section-header">
            <span className="step-badge">3</span>
            <h3>{t('verification.step3.title', 'Verify Route Details')}</h3>
          </div>

          {/* Show bus stops */}
          {isLoadingStops ? (
            <div className="loading-stops">
              <span className="loading-spinner" />
              <span>{t('verification.loadingStops', 'Loading stops...')}</span>
            </div>
          ) : busStops.length > 0 && (
            <div className="stops-preview">
              <h4>📍 {t('verification.routeStops', 'Route Stops')}</h4>
              <div className="stops-timeline">
                {busStops.map((stop, index) => (
                  <div key={stop.id} className="stop-item">
                    <div className={`stop-marker ${index === 0 ? 'start' : index === busStops.length - 1 ? 'end' : ''}`} />
                    <div className="stop-info">
                      <span className="stop-name">{stop.name}</span>
                      <span className="stop-time">{stop.departureTime || stop.arrivalTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Questions */}
          <div className="verification-form">
            {/* Main accuracy question */}
            <div className="question-group main-question">
              <label>{t('verification.isAccurate', 'Is this route information accurate?')}</label>
              <div className="accuracy-buttons">
                <button
                  className={`accuracy-btn yes ${isAccurate === true ? 'selected' : ''}`}
                  onClick={() => setIsAccurate(true)}
                >
                  <span className="btn-icon">✅</span>
                  <span className="btn-text">{t('verification.yes', 'Yes, Accurate')}</span>
                </button>
                <button
                  className={`accuracy-btn no ${isAccurate === false ? 'selected' : ''}`}
                  onClick={() => setIsAccurate(false)}
                >
                  <span className="btn-icon">❌</span>
                  <span className="btn-text">{t('verification.no', 'Needs Updates')}</span>
                </button>
              </div>
            </div>

            {/* Detailed questions */}
            {isAccurate !== null && (
              <div className="detailed-questions">
                {/* Timing accuracy */}
                <div className="question-group">
                  <label>⏰ {t('verification.timingAccuracy', 'Timing Accuracy')}</label>
                  <div className="radio-options">
                    {['accurate', 'slightly-off', 'significantly-off', 'unknown'].map(option => (
                      <label key={option} className="radio-option">
                        <input
                          type="radio"
                          name="timing"
                          value={option}
                          checked={timingAccuracy === option}
                          onChange={() => setTimingAccuracy(option as RouteVerificationData['timingAccuracy'])}
                        />
                        <span className="radio-label">
                          {t(`verification.timing.${option}`, option.replace(/-/g, ' '))}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Stops accuracy */}
                <div className="question-group">
                  <label>📍 {t('verification.stopsAccuracy', 'Stops Accuracy')}</label>
                  <div className="radio-options">
                    {['all-correct', 'some-missing', 'some-wrong', 'unknown'].map(option => (
                      <label key={option} className="radio-option">
                        <input
                          type="radio"
                          name="stops"
                          value={option}
                          checked={stopsAccuracy === option}
                          onChange={() => setStopsAccuracy(option as RouteVerificationData['stopsAccuracy'])}
                        />
                        <span className="radio-label">
                          {t(`verification.stops.${option}`, option.replace(/-/g, ' '))}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Fare accuracy */}
                <div className="question-group">
                  <label>💰 {t('verification.fareAccuracy', 'Fare Accuracy')}</label>
                  <div className="radio-options">
                    {['accurate', 'higher', 'lower', 'unknown'].map(option => (
                      <label key={option} className="radio-option">
                        <input
                          type="radio"
                          name="fare"
                          value={option}
                          checked={fareAccuracy === option}
                          onChange={() => setFareAccuracy(option as RouteVerificationData['fareAccuracy'])}
                        />
                        <span className="radio-label">
                          {t(`verification.fare.${option}`, option)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Last traveled */}
                <div className="question-group">
                  <label>📅 {t('verification.lastTraveled', 'When did you last travel this route?')}</label>
                  <select
                    value={lastTraveled}
                    onChange={(e) => setLastTraveled(e.target.value)}
                    className="select-input"
                  >
                    <option value="">{t('verification.selectDate', 'Select...')}</option>
                    <option value="today">{t('verification.date.today', 'Today')}</option>
                    <option value="this-week">{t('verification.date.thisWeek', 'This week')}</option>
                    <option value="this-month">{t('verification.date.thisMonth', 'This month')}</option>
                    <option value="few-months">{t('verification.date.fewMonths', 'Few months ago')}</option>
                    <option value="long-ago">{t('verification.date.longAgo', 'Long time ago')}</option>
                  </select>
                </div>

                {/* Comments */}
                <div className="question-group">
                  <label>💬 {t('verification.comments', 'Additional Comments (optional)')}</label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder={t('verification.commentsPlaceholder', 'Any specific issues or suggestions...')}
                    rows={3}
                    className="comments-input"
                  />
                </div>
              </div>
            )}

            {/* Submit button */}
            {isAccurate !== null && (
              <button
                className="submit-verification-btn"
                onClick={handleSubmitVerification}
                disabled={isSubmitting || submitSuccess}
              >
                {isSubmitting ? (
                  <span className="loading-spinner" />
                ) : submitSuccess ? (
                  <>✅ {t('verification.submitted', 'Verification Submitted!')}</>
                ) : (
                  <>📤 {t('verification.submit', 'Submit Verification')}</>
                )}
              </button>
            )}

            {/* Success message */}
            {submitSuccess && (
              <div className="success-message">
                <span className="success-icon">🎉</span>
                <div className="success-content">
                  <h4>{t('verification.thankYou', 'Thank you for your contribution!')}</h4>
                  <p>{t('verification.successMessage', 'Your verification helps keep our data accurate for everyone.')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help tip */}
      <div className="verification-tip">
        <span className="tip-icon">💡</span>
        <div className="tip-content">
          <strong>{t('verification.tipTitle', 'Why verify routes?')}</strong>
          <p>{t('verification.tipText', 'Your verification helps improve data accuracy. Routes verified by multiple users get a reliability badge!')}</p>
        </div>
      </div>
    </div>
  );
};

export default RouteVerification;
