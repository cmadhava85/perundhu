import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
<<<<<<< HEAD
import { submitRouteContribution, submitImageContribution, getContributionStatus } from "../services/api";
import type { RouteContribution as RouteContributionType, StopContribution, Location } from '../types';
import LocationDropdown from './search/LocationDropdown';
import '../styles/RouteContribution.css';
import { apiService } from '../services/apiService';
import type { RouteType, BusType, Operator } from '../services/referenceDataService';
import { getRouteTypes, getBusTypes, getOperators } from '../services/referenceDataService';

interface RouteContributionComponentProps {
  userId: string;
}
=======
import { submitRouteContribution, submitImageContribution } from "../services/api";
import type { RouteContribution as RouteContributionType } from '../types';
import AuthService from '../services/authService';
import LocationAutocompleteInput from './LocationAutocompleteInput';
import type { LocationSuggestion } from '../services/locationAutocompleteService';
import { RouteValidationService } from '../services/routeValidationService';
import './RouteContribution.css';
>>>>>>> 75c2859 (production ready code need to test)

/**
 * Simple route form component for manual entry
 */
<<<<<<< HEAD
const RouteContributionComponent: React.FC<RouteContributionComponentProps> = ({ userId }) => {
=======
const SimpleRouteForm: React.FC<{ onSubmit: (data: any) => void }> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    busNumber: '',
    route: '',
    origin: '',
    destination: '',
    stops: '',
    frequency: '',
    operatingHours: '',
    fare: '',
    departureTime: '',
    arrivalTime: '',
    estimatedDuration: ''
  });

  // Store selected location details for enhanced submission
  const [selectedOrigin, setSelectedOrigin] = useState<LocationSuggestion | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<LocationSuggestion | null>(null);

  // Enhanced stops with timing
  const [detailedStops, setDetailedStops] = useState<Array<{
    id: string;
    name: string;
    arrivalTime: string;
    departureTime: string;
    order: number;
  }>>([]);

  const [useDetailedStops, setUseDetailedStops] = useState(false);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // Real-time validation
  useEffect(() => {
    if (showValidation) {
      validateForm();
    }
  }, [formData, selectedOrigin, selectedDestination, detailedStops, useDetailedStops, showValidation]);

  const validateForm = async () => {
    setIsValidating(true);
    
    try {
      const validationData = {
        ...formData,
        origin: formData.origin || selectedOrigin?.name,
        destination: formData.destination || selectedDestination?.name,
        fromLocationName: formData.origin || selectedOrigin?.name,
        toLocationName: formData.destination || selectedDestination?.name,
        detailedStops: useDetailedStops ? detailedStops : null
      };

      const result = await RouteValidationService.validateRouteContribution(validationData);
      setValidationErrors(result.errors);
      setValidationWarnings(result.warnings);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationErrors(['Validation service temporarily unavailable']);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    
    // Run validation before submission
    await validateForm();
    
    // Check if validation passed
    if (validationErrors.length > 0) {
      // Scroll to first error
      const firstErrorElement = document.querySelector('.validation-error');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // Ensure we have valid location names
    const fromLocationName = formData.origin?.trim() || selectedOrigin?.name?.trim() || 'Unknown Start Location';
    const toLocationName = formData.destination?.trim() || selectedDestination?.name?.trim() || 'Unknown End Location';
    
    // Enhanced form data with detailed stops if available
    const enhancedData = {
      ...formData,
      // Include detailed stops data if using enhanced mode
      detailedStops: useDetailedStops ? detailedStops : null,
      // Keep basic stops for backward compatibility
      stops: useDetailedStops ? detailedStops.map(s => s.name).join(', ') : formData.stops,
      fromLatitude: selectedOrigin?.latitude,
      fromLongitude: selectedOrigin?.longitude,
      toLatitude: selectedDestination?.latitude,
      toLongitude: selectedDestination?.longitude,
      // Ensure these are never null/empty
      fromLocationName,
      toLocationName,
      busName: formData.route?.trim() || formData.busNumber?.trim() || 'Unknown Bus'
    };
    
    console.log('DEBUG Frontend: Submitting data with locations:', {
      fromLocationName,
      toLocationName,
      originalOrigin: formData.origin,
      originalDestination: formData.destination,
      selectedOrigin: selectedOrigin?.name,
      selectedDestination: selectedDestination?.name,
      coordinates: {
        fromLatitude: selectedOrigin?.latitude,
        fromLongitude: selectedOrigin?.longitude,
        toLatitude: selectedDestination?.latitude,
        toLongitude: selectedDestination?.longitude
      }
    });
    
    onSubmit(enhancedData);
  };

  // Validation helpers
  const getBusIdentificationValidation = () => {
    const busNumber = formData.busNumber?.trim();
    const routeName = formData.route?.trim();
    
    if (!busNumber && !routeName) {
      return { isValid: false, message: 'Either Bus Number or Route Name is required' };
    }
    return { isValid: true, message: '' };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle autocomplete selection for origin
  const handleOriginChange = (value: string, location?: LocationSuggestion) => {
    setFormData({ ...formData, origin: value });
    setSelectedOrigin(location || null);
  };

  // Handle autocomplete selection for destination
  const handleDestinationChange = (value: string, location?: LocationSuggestion) => {
    setFormData({ ...formData, destination: value });
    setSelectedDestination(location || null);
  };

  // Calculate estimated duration when departure/arrival times change
  const calculateDuration = (departure: string, arrival: string) => {
    if (!departure || !arrival) return '';
    
    try {
      const [depHour, depMin] = departure.split(':').map(Number);
      const [arrHour, arrMin] = arrival.split(':').map(Number);
      
      let depMinutes = depHour * 60 + depMin;
      let arrMinutes = arrHour * 60 + arrMin;
      
      // Handle overnight journeys
      if (arrMinutes < depMinutes) {
        arrMinutes += 24 * 60;
      }
      
      const durationMinutes = arrMinutes - depMinutes;
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      
      return `${hours}h ${minutes}m`;
    } catch {
      return '';
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    
    // Auto-calculate duration when both times are available
    if (name === 'departureTime' || name === 'arrivalTime') {
      const departure = name === 'departureTime' ? value : formData.departureTime;
      const arrival = name === 'arrivalTime' ? value : formData.arrivalTime;
      newFormData.estimatedDuration = calculateDuration(departure, arrival);
    }
    
    setFormData(newFormData);
  };

  // Add new stop with timing
  const addDetailedStop = () => {
    const newStop = {
      id: `stop_${Date.now()}`,
      name: '',
      arrivalTime: '',
      departureTime: '',
      order: detailedStops.length + 1
    };
    setDetailedStops([...detailedStops, newStop]);
  };

  // Remove stop
  const removeDetailedStop = (id: string) => {
    setDetailedStops(detailedStops.filter(stop => stop.id !== id));
  };

  // Update stop details
  const updateDetailedStop = (id: string, field: string, value: string) => {
    setDetailedStops(detailedStops.map(stop => 
      stop.id === id ? { ...stop, [field]: value } : stop
    ));
  };

  // Auto-populate departure time same as arrival time when arrival is set
  const handleStopArrivalChange = (id: string, arrivalTime: string) => {
    updateDetailedStop(id, 'arrivalTime', arrivalTime);
    // Auto-set departure time to arrival time (user can modify if different)
    const stop = detailedStops.find(s => s.id === id);
    if (stop && !stop.departureTime) {
      updateDetailedStop(id, 'departureTime', arrivalTime);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="route-form">
      {/* Validation Results Display */}
      {showValidation && (validationErrors.length > 0 || validationWarnings.length > 0) && (
        <div className="validation-panel">
          {validationErrors.length > 0 && (
            <div className="validation-errors">
              <div className="validation-header error">
                <span className="validation-icon">⚠️</span>
                <h4 className="validation-title">Please fix the following issues:</h4>
              </div>
              <ul className="validation-list">
                {validationErrors.map((error, index) => (
                  <li key={index} className="validation-item error">
                    <span className="validation-bullet">•</span>
                    <span className="validation-text">{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {validationWarnings.length > 0 && (
            <div className="validation-warnings">
              <div className="validation-header warning">
                <span className="validation-icon">⚡</span>
                <h4 className="validation-title">Please review:</h4>
              </div>
              <ul className="validation-list">
                {validationWarnings.map((warning, index) => (
                  <li key={index} className="validation-item warning">
                    <span className="validation-bullet">•</span>
                    <span className="validation-text">{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Validation Status Indicator */}
      {showValidation && (
        <div className="validation-status">
          {isValidating ? (
            <div className="validation-loading">
              <span className="loading-spinner">⏳</span>
              <span>Validating...</span>
            </div>
          ) : validationErrors.length === 0 ? (
            <div className="validation-success">
              <span className="success-icon">✅</span>
              <span>Form validation passed!</span>
            </div>
          ) : (
            <div className="validation-failed">
              <span className="error-icon">❌</span>
              <span>{validationErrors.length} issue(s) need attention</span>
            </div>
          )}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="busNumber">
          <span className="field-icon">🚌</span>
          {t('route.busNumber', 'Bus Number')}
          <span className="field-requirement">*</span>
        </label>
        <input
          type="text"
          id="busNumber"
          name="busNumber"
          value={formData.busNumber}
          onChange={handleChange}
          className={`modern-input ${showValidation && !getBusIdentificationValidation().isValid ? 'error' : ''}`}
          placeholder="e.g., 27D, 570, MTC-123"
        />
        {showValidation && !getBusIdentificationValidation().isValid && !formData.route && (
          <span className="field-error">{getBusIdentificationValidation().message}</span>
        )}
        <span className="field-hint">Enter the bus number OR route name below</span>
      </div>
      
      <div className="form-group">
        <label htmlFor="route">
          <span className="field-icon">🛣️</span>
          {t('route.routeName', 'Route Name')}
          <span className="field-requirement">*</span>
        </label>
        <input
          type="text"
          id="route"
          name="route"
          value={formData.route}
          onChange={handleChange}
          className={`modern-input ${showValidation && !getBusIdentificationValidation().isValid ? 'error' : ''}`}
          placeholder="e.g., Chennai Central - Tambaram Express"
        />
        {showValidation && !getBusIdentificationValidation().isValid && !formData.busNumber && (
          <span className="field-error">{getBusIdentificationValidation().message}</span>
        )}
        <span className="field-hint">Enter the route name OR bus number above</span>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <LocationAutocompleteInput
            id="origin"
            name="origin"
            value={formData.origin}
            onChange={handleOriginChange}
            label={t('route.origin', 'Origin')}
            placeholder={t('route.originPlaceholder', 'e.g., Chennai Central')}
            required
          />
        </div>
        
        <div className="form-group">
          <LocationAutocompleteInput
            id="destination"
            name="destination"
            value={formData.destination}
            onChange={handleDestinationChange}
            label={t('route.destination', 'Destination')}
            placeholder={t('route.destinationPlaceholder', 'e.g., Madurai')}
            required
          />
        </div>
      </div>
      
      {/* Show selected location info if available */}
      {(selectedOrigin || selectedDestination) && (
        <div className="selected-locations-info">
          {selectedOrigin && (
            <div className="location-info">
              <span className="info-label">Origin:</span>
              <span className="info-value">{selectedOrigin.name}</span>
              {selectedOrigin.latitude && selectedOrigin.longitude && (
                <span className="coordinates">
                  ({selectedOrigin.latitude.toFixed(4)}, {selectedOrigin.longitude.toFixed(4)})
                </span>
              )}
            </div>
          )}
          {selectedDestination && (
            <div className="location-info">
              <span className="info-label">Destination:</span>
              <span className="info-value">{selectedDestination.name}</span>
              {selectedDestination.latitude && selectedDestination.longitude && (
                <span className="coordinates">
                  ({selectedDestination.latitude.toFixed(4)}, {selectedDestination.longitude.toFixed(4)})
                </span>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Enhanced Stops Section */}
      <div className="form-section stops-section">
        <div className="section-header">
          <h3 className="section-title">
            <span className="section-icon">🚏</span>
            {t('route.stopsDetails', 'Stops & Timing')}
          </h3>
          <div className="stops-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${!useDetailedStops ? 'active' : ''}`}
              onClick={() => setUseDetailedStops(false)}
            >
              <span className="mode-icon">📝</span>
              {t('route.simpleStops', 'Simple')}
            </button>
            <button
              type="button"
              className={`mode-btn ${useDetailedStops ? 'active' : ''}`}
              onClick={() => setUseDetailedStops(true)}
            >
              <span className="mode-icon">⏰</span>
              {t('route.detailedStops', 'With Timing')}
            </button>
          </div>
        </div>

        {!useDetailedStops ? (
          // Simple stops mode (existing)
          <div className="simple-stops-mode">
            <div className="form-group">
              <label htmlFor="stops">{t('route.stops', 'Stops (comma-separated)')}</label>
              <textarea
                id="stops"
                name="stops"
                value={formData.stops}
                onChange={handleChange}
                rows={3}
                placeholder={t('route.stopsPlaceholder', 'Enter stop names separated by commas')}
                className="modern-input"
              />
              <span className="field-hint">{t('route.simpleStopsHint', 'Quick entry for stop names only')}</span>
            </div>
          </div>
        ) : (
          // Detailed stops mode with timing
          <div className="detailed-stops-mode">
            <div className="stops-intro">
              <div className="intro-card">
                <span className="intro-icon">💡</span>
                <div className="intro-content">
                  <span className="intro-title">{t('route.timingHelp', 'Super Helpful!')}</span>
                  <span className="intro-text">{t('route.timingHelpText', 'Add arrival/departure times for each stop to help travelers plan better')}</span>
                </div>
              </div>
            </div>

            {detailedStops.length === 0 ? (
              <div className="no-stops-state">
                <div className="empty-stops-icon">🚏</div>
                <p className="empty-stops-text">{t('route.noStops', 'No stops added yet')}</p>
                <button
                  type="button"
                  className="add-first-stop-btn"
                  onClick={addDetailedStop}
                >
                  <span className="btn-icon">➕</span>
                  {t('route.addFirstStop', 'Add First Stop')}
                </button>
              </div>
            ) : (
              <div className="stops-timeline">
                {detailedStops.map((stop, index) => (
                  <div key={stop.id} className="stop-entry">
                    <div className="stop-number">
                      <span className="number">{index + 1}</span>
                      <div className="timeline-line"></div>
                    </div>
                    
                    <div className="stop-details">
                      <div className="stop-header">
                        <input
                          type="text"
                          placeholder={t('route.stopNamePlaceholder', 'Stop name (e.g., Koyambedu)')}
                          value={stop.name}
                          onChange={(e) => updateDetailedStop(stop.id, 'name', e.target.value)}
                          className="stop-name-input"
                          required
                        />
                        <button
                          type="button"
                          className="remove-stop-btn"
                          onClick={() => removeDetailedStop(stop.id)}
                          title={t('route.removeStop', 'Remove stop')}
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="stop-timing">
                        <div className="timing-input-group">
                          <label className="timing-label">
                            <span className="timing-icon">🛬</span>
                            {t('route.arrival', 'Arrival')}
                          </label>
                          <input
                            type="time"
                            value={stop.arrivalTime}
                            onChange={(e) => handleStopArrivalChange(stop.id, e.target.value)}
                            className="time-input stop-time"
                          />
                        </div>
                        
                        <div className="timing-separator">
                          <span className="separator-icon">⏳</span>
                        </div>
                        
                        <div className="timing-input-group">
                          <label className="timing-label">
                            <span className="timing-icon">🛫</span>
                            {t('route.departure', 'Departure')}
                          </label>
                          <input
                            type="time"
                            value={stop.departureTime}
                            onChange={(e) => updateDetailedStop(stop.id, 'departureTime', e.target.value)}
                            className="time-input stop-time"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="add-stop-section">
                  <button
                    type="button"
                    className="add-stop-btn"
                    onClick={addDetailedStop}
                  >
                    <span className="btn-icon">➕</span>
                    {t('route.addStop', 'Add Another Stop')}
                  </button>
                </div>
              </div>
            )}

            {detailedStops.length > 0 && (
              <div className="stops-summary">
                <div className="summary-header">
                  <span className="summary-icon">📊</span>
                  <span className="summary-title">{t('route.stopsSummary', 'Route Summary')}</span>
                </div>
                <div className="summary-stats">
                  <div className="stat-item">
                    <span className="stat-label">{t('route.totalStops', 'Total Stops')}</span>
                    <span className="stat-value">{detailedStops.length}</span>
                  </div>
                  {detailedStops.filter(s => s.arrivalTime && s.departureTime).length > 0 && (
                    <div className="stat-item">
                      <span className="stat-label">{t('route.withTiming', 'With Timing')}</span>
                      <span className="stat-value">
                        {detailedStops.filter(s => s.arrivalTime && s.departureTime).length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* New Timing Section */}
      <div className="form-section timing-section">
        <div className="section-header">
          <h3 className="section-title">
            <span className="section-icon">🕐</span>
            {t('route.timingDetails', 'Timing Details')}
          </h3>
          <span className="section-badge">{t('route.helpful', 'Very Helpful')}</span>
        </div>
        
        <div className="form-row timing-row">
          <div className="form-group">
            <label htmlFor="departureTime">
              <span className="field-icon">🚀</span>
              {t('route.departureTime', 'Departure Time')}
            </label>
            <input
              type="time"
              id="departureTime"
              name="departureTime"
              value={formData.departureTime}
              onChange={handleTimeChange}
              className="modern-input time-input"
              placeholder="HH:MM"
            />
            <span className="field-hint">{t('route.departureHint', 'From origin')}</span>
          </div>
          
          <div className="timing-arrow">
            <span className="arrow-icon">→</span>
            {formData.estimatedDuration && (
              <span className="duration-display">{formData.estimatedDuration}</span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="arrivalTime">
              <span className="field-icon">🏁</span>
              {t('route.arrivalTime', 'Arrival Time')}
            </label>
            <input
              type="time"
              id="arrivalTime"
              name="arrivalTime"
              value={formData.arrivalTime}
              onChange={handleTimeChange}
              className="modern-input time-input"
              placeholder="HH:MM"
            />
            <span className="field-hint">{t('route.arrivalHint', 'At destination')}</span>
          </div>
        </div>
        
        {formData.departureTime && formData.arrivalTime && (
          <div className="timing-summary">
            <div className="summary-card">
              <span className="summary-icon">⏱️</span>
              <div className="summary-content">
                <span className="summary-label">{t('route.journeyTime', 'Journey Time')}</span>
                <span className="summary-value">{formData.estimatedDuration}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="operatingHours">{t('route.operatingHours', 'Operating Hours')}</label>
        <input
          type="text"
          id="operatingHours"
          name="operatingHours"
          value={formData.operatingHours}
          onChange={handleChange}
          className="modern-input"
          placeholder={t('route.operatingHoursPlaceholder', 'e.g., 6:00 AM - 10:00 PM')}
        />
      </div>
      
      <div className="form-actions">
        <button type="submit" className="submit-button modern-submit-btn">
          <div className="submit-btn-content">
            <span className="submit-icon">🚌</span>
            <span className="submit-text">{t('contribution.submitRoute', 'Submit Route Information')}</span>
            <span className="submit-arrow">→</span>
          </div>
        </button>
      </div>
    </form>
  );
};

/**
 * Simple image upload form component
 */
const SimpleImageForm: React.FC<{ onSubmit: (data: any, file: File) => void }> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      onSubmit({ description }, file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="image-form">
      <div className="form-group">
        <label htmlFor="imageFile">{t('contribution.selectImage', 'Select Schedule Image')}</label>
        <input
          type="file"
          id="imageFile"
          accept="image/*"
          onChange={handleFileChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="description">{t('contribution.description', 'Description (optional)')}</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder={t('contribution.descriptionPlaceholder', 'Describe the image or any additional details...')}
          className="modern-input"
        />
      </div>
      
      <div className="form-actions">
        <button type="submit" className="submit-button modern-submit-btn">
          <div className="submit-btn-content">
            <span className="submit-icon">📷</span>
            <span className="submit-text">{t('contribution.submitImage', 'Submit Schedule Image')}</span>
            <span className="submit-arrow">→</span>
          </div>
        </button>
      </div>
    </form>
  );
};

const RouteContributionComponent: React.FC = () => {
>>>>>>> 75c2859 (production ready code need to test)
  const { t } = useTranslation();
  const [contributionMethod, setContributionMethod] = useState<'manual' | 'image'>('manual');
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showContributions, setShowContributions] = useState<boolean>(false);
  const [userContributions] = useState<any[]>([]);

  const handleSecureSubmission = async (data: any, isImage: boolean) => {
    setSubmissionStatus('submitting');
    try {
      if (isImage) {
        // Create FormData object for image submission
        const formData = new FormData();
        formData.append('image', data.file);
        formData.append('description', data.description || '');
        await submitImageContribution(formData);
      } else {
        await submitRouteContribution(data);
      }
      setSubmissionStatus('success');
      setStatusMessage(t('contribution.successMessage', 'Thank you for your contribution!'));
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionStatus('error');
      setStatusMessage(
        t('contribution.errorMessage', 'Failed to submit contribution. Please try again.')
      );
    }
  };

  const toggleContributions = () => {
    if (!AuthService.isAuthenticated()) {
      // Show a helpful message for anonymous users
      setStatusMessage(t('contribution.loginToViewHistory', 'Please log in to view your contribution history.'));
      return;
    }
    
    setShowContributions(!showContributions);
  };

  const resetForm = () => {
    setSubmissionStatus('idle');
    setStatusMessage('');
  };

  return (
<<<<<<< HEAD
    <div className="route-contribution-container">
      <div className="contribution-header">
        <h2>{t('contribution.title', 'Contribute Route Information')}</h2>
        <p className="contribution-intro">
          {t('contribution.intro', 'Help expand our bus route database by adding new routes or updating existing ones.')}
        </p>
      </div>
      
      <div className="contribution-card">
        <div className="contribution-method-selector">
          <button 
            className={`method-button ${contributionMethod === 'manual' ? 'active' : ''}`}
            onClick={() => {
              setContributionMethod('manual');
              resetForm();
            }}
          >
            <span className="icon">📝</span>
            {t('contribution.manualEntry', 'Manual Entry')}
          </button>
          <button 
            className={`method-button ${contributionMethod === 'image' ? 'active' : ''}`}
            onClick={() => {
              setContributionMethod('image');
              resetForm();
            }}
          >
            <span className="icon">📷</span>
            {t('contribution.uploadImage', 'Upload Schedule Image')}
          </button>
        </div>
        
        <div className="contribution-form-container">
          {contributionMethod === 'manual' ? (
            <UnifiedRouteForm 
              onSubmit={(data) => {
                setSubmissionStatus('submitting');
                submitRouteContribution(data)
                  .then(() => {
                    setSubmissionStatus('success');
                    setStatusMessage(t('contribution.successMessage', 'Your contribution has been submitted. Thank you!'));
                  })
                  .catch(err => {
                    setSubmissionStatus('error');
                    setStatusMessage(t('contribution.errorMessage', 'Failed to submit contribution. Please try again.'));
                    console.error(err);
                  });
              }} 
            />
          ) : (
            <SimpleImageUploadForm 
              onSubmit={(data, file) => {
                setSubmissionStatus('submitting');
                submitImageContribution(data, file)
                  .then(() => {
                    setSubmissionStatus('success');
                    setStatusMessage(t('contribution.successMessage', 'Your image has been uploaded. Thank you!'));
                  })
                  .catch(err => {
                    setSubmissionStatus('error');
                    setStatusMessage(t('contribution.errorMessage', 'Failed to upload image. Please try again.'));
                    console.error(err);
                  });
              }}
            />
          )}
        </div>
        
        {submissionStatus === 'submitting' && (
          <div className="submission-status">
            <div className="loading-spinner"></div>
            <p>{t('contribution.submitting', 'Submitting your contribution...')}</p>
          </div>
        )}
        
        {submissionStatus === 'success' && (
          <div className="success-message">
            <div className="check-icon">✓</div>
            <p>{statusMessage}</p>
          </div>
        )}
        
        {submissionStatus === 'error' && (
          <div className="error-message">
            <div className="error-icon">⚠</div>
            <p>{statusMessage}</p>
          </div>
        )}
      </div>
      
      <div className="user-contributions-section">
        <button 
          className="contributions-toggle"
          onClick={toggleContributions}
        >
          <span className="toggle-icon">{showContributions ? '▼' : '▶'}</span>
          {showContributions 
            ? t('contribution.hideContributions', 'Hide My Contributions') 
            : t('contribution.showContributions', 'Show My Contributions')}
        </button>
        
        {showContributions && (
          <div className="contributions-list">
            <h3>{t('contribution.yourContributions', 'Your Contributions')}</h3>
            {userContributions.length === 0 ? (
              <p>{t('contribution.noContributions', 'You haven\'t made any contributions yet.')}</p>
            ) : (
              <div className="contributions-table-container">
                <table className="contributions-table">
                  <thead>
                    <tr>
                      <th>{t('contribution.type', 'Type')}</th>
                      <th>{t('contribution.details', 'Details')}</th>
                      <th>{t('contribution.submitDate', 'Date')}</th>
                      <th>{t('contribution.status', 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userContributions.map((contribution, index) => (
                      <tr key={index}>
                        <td>{contribution.type}</td>
                        <td>{contribution.details}</td>
                        <td>{new Date(contribution.submissionDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-badge ${contribution.status.toLowerCase()}`}>
                            {contribution.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Unified form that combines route information and stops in one view
 */
interface UnifiedRouteFormProps {
  onSubmit: (data: RouteContributionType) => void;
}

const UnifiedRouteForm: React.FC<UnifiedRouteFormProps> = ({ onSubmit }) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language; // Get current language (e.g., 'en', 'ta')
  
  const [formData, setFormData] = useState<RouteContributionType>({
    busName: '',
    busNumber: '',
    fromLocationName: '',
    toLocationName: '',
    
    // Initialize secondary language fields
    busName_secondary: '',
    fromLocationName_secondary: '',
    toLocationName_secondary: '',
    
    // Set source language based on current UI language
    sourceLanguage: currentLanguage,
    
    departureTime: '',
    arrivalTime: '',
    stops: []
  });
  
  const [fromLocation, setFromLocation] = useState<Location | null>(null);
  const [toLocation, setToLocation] = useState<Location | null>(null);
  
  const [currentStop, setCurrentStop] = useState<StopContribution>({
    name: '',
    name_secondary: '',
    arrivalTime: '',
    departureTime: '',
    stopOrder: 0
  });
  
  // Enhanced error states for validation
  const [errors, setErrors] = useState<{
    busIdentifier?: string;
    fromLocation?: string;
    toLocation?: string;
    timeRequired?: string;
    stopTimeRequired?: string;
    stopsOverlap?: string;
    routeLogic?: string;
  }>({});

  // Track if the form has been submitted once
  const [attemptedSubmit, setAttemptedSubmit] = useState<boolean>(false);
  
  // Handle primary and secondary language fields based on current language setting
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear errors when user types
    if ((name === 'busName' || name === 'busNumber') && errors.busIdentifier) {
      setErrors({ ...errors, busIdentifier: undefined });
    }
    
    if ((name === 'departureTime' || name === 'arrivalTime') && errors.timeRequired) {
      setErrors({ ...errors, timeRequired: undefined });
      
      // Check if departure and arrival times are both present and logical
      if (formData.departureTime && formData.arrivalTime) {
        validateTimesLogic(formData.departureTime, formData.arrivalTime);
      }
    }
  };

  const handleFromLocationSelect = (location: Location) => {
    setFromLocation(location);
    
    // Set the primary name based on the current language
    const isCurrentLanguageTamil = currentLanguage === 'ta';
    const primaryName = location.name;
    const secondaryName = isCurrentLanguageTamil 
      ? location.name // If current language is Tamil, the English name is the original
      : (location.translatedName || primaryName); // If current language is English, use the Tamil name if available
    
    setFormData({
      ...formData,
      fromLocationName: primaryName,
      fromLocationName_secondary: secondaryName,
      fromLatitude: location.latitude,
      fromLongitude: location.longitude
    });
    
    if (errors.fromLocation) {
      setErrors({ ...errors, fromLocation: undefined });
    }
    
    if (toLocation) {
      validateLocationLogic();
    }
  };
  
  const handleToLocationSelect = (location: Location) => {
    // Log the location data to help with debugging
    console.log('Destination location selected:', location);
    
    // Set the full location object in state, including coordinates
    setToLocation(location);
    
    // Set the primary name based on the current language
    const isCurrentLanguageTamil = currentLanguage === 'ta';
    const primaryName = location.name;
    const secondaryName = isCurrentLanguageTamil 
      ? location.name // If current language is Tamil, the English name is the original
      : (location.translatedName || primaryName); // If current language is English, use the Tamil name if available
    
    // Update the form data with the location name and coordinates
    setFormData({
      ...formData,
      toLocationName: primaryName,
      toLocationName_secondary: secondaryName,
      toLatitude: location.latitude,
      toLongitude: location.longitude
    });
    
    // Clear any validation errors
    if (errors.toLocation) {
      setErrors({ ...errors, toLocation: undefined });
    }
    
    // Check location logic if we also have an origin selected
    if (fromLocation) {
      validateLocationLogic();
    }
  };

  const handleStopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentStop({ ...currentStop, [name]: value });
    
    if ((name === 'arrivalTime' || name === 'departureTime') && errors.stopTimeRequired) {
      setErrors({ ...errors, stopTimeRequired: undefined });
    }
  };

  const validateTimesLogic = (departureTime: string, arrivalTime: string) => {
    if (departureTime && arrivalTime) {
      const depParts = departureTime.split(':');
      const arrParts = arrivalTime.split(':');
      
      const depMinutes = parseInt(depParts[0]) * 60 + parseInt(depParts[1]);
      const arrMinutes = parseInt(arrParts[0]) * 60 + parseInt(arrParts[1]);
      
      if (depMinutes >= arrMinutes) {
        setErrors({
          ...errors,
          routeLogic: t(
            'contribution.timeLogicError', 
            'Departure time must be before arrival time'
          )
        });
        return false;
      } else {
        if (errors.routeLogic) {
          setErrors({
            ...errors,
            routeLogic: undefined
          });
        }
        return true;
      }
    }
    return true;
  };
  
  const validateLocationLogic = () => {
    if (!fromLocation || !toLocation) return true;
    
    const from = fromLocation.name.trim().toLowerCase();
    const to = toLocation.name.trim().toLowerCase();
    
    if (from && to && from === to) {
      setErrors({
        ...errors,
        routeLogic: t(
          'contribution.sameLocationError', 
          'Origin and destination cannot be the same location'
        )
      });
      return false;
    }
    return true;
  };
  
  const handleAddStop = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentStop.name) {
      setErrors({
        ...errors,
        stopTimeRequired: t('contribution.stopNameRequired', 'Stop name is required')
      });
      return;
    }
    
    const newStop = {
      ...currentStop,
      stopOrder: formData.stops.length + 1
    };
    
    setFormData({
      ...formData,
      stops: [...formData.stops, newStop]
    });
    
    setCurrentStop({
      name: '',
      name_secondary: '',
      arrivalTime: '',
      departureTime: '',
      stopOrder: 0
    });
  };
  
  const handleRemoveStop = (stopIndex: number) => {
    const updatedStops = formData.stops.filter((_, index) => index !== stopIndex)
      .map((stop, index) => ({ ...stop, stopOrder: index + 1 }));
    
    setFormData({
      ...formData,
      stops: updatedStops
    });
  };
  
  const validateForm = () => {
    const newErrors: any = {};
    let isValid = true;
    
    if (!formData.busName && !formData.busNumber) {
      newErrors.busIdentifier = t(
        'contribution.busIdentifierRequired', 
        'Either bus name or number is required'
      );
      isValid = false;
    }
    
    if (!formData.fromLocationName.trim()) {
      newErrors.fromLocation = t(
        'contribution.fromLocationRequired', 
        'Origin location is required'
      );
      isValid = false;
    }
    
    if (!formData.toLocationName.trim()) {
      newErrors.toLocation = t(
        'contribution.toLocationRequired', 
        'Destination location is required'
      );
      isValid = false;
    }
    
    if (!formData.departureTime && !formData.arrivalTime) {
      newErrors.timeRequired = t(
        'contribution.timeRequired', 
        'Either departure or arrival time is required'
      );
      isValid = false;
    }
    
    setErrors(newErrors);
    
    isValid = validateLocationLogic() && isValid;
    
    if (formData.departureTime && formData.arrivalTime) {
      isValid = validateTimesLogic(formData.departureTime, formData.arrivalTime) && isValid;
    }
    
    return isValid;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    
    if (validateForm()) {
      // Ensure the source language is set correctly before submission
      const dataToSubmit = {
        ...formData,
        sourceLanguage: currentLanguage
      };
      
      onSubmit(dataToSubmit);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-icon">🚌</span>
          {t('contribution.busDetails', 'Bus Details')}
        </h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="busName">
              {t('contribution.busName', 'Bus Name')} 
              <span className="field-hint"> ({t('contribution.eitherRequired', 'Either name or number required')})</span>
            </label>
            <input 
              type="text" 
              id="busName" 
              name="busName" 
              value={formData.busName} 
              onChange={handleChange} 
              placeholder={t('contribution.busNamePlaceholder', 'e.g. SETC Chennai Express')} 
              className={attemptedSubmit && errors.busIdentifier && !formData.busName && !formData.busNumber ? 'field-error' : ''}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="busNumber">
              {t('contribution.busNumber', 'Bus Number')}
              <span className="field-hint"> ({t('contribution.eitherRequired', 'Either name or number required')})</span>
            </label>
            <input 
              type="text" 
              id="busNumber" 
              name="busNumber" 
              value={formData.busNumber} 
              onChange={handleChange}
              placeholder={t('contribution.busNumberPlaceholder', 'e.g. TN-01-1234')}
              className={attemptedSubmit && errors.busIdentifier && !formData.busName && !formData.busNumber ? 'field-error' : ''}
            />
          </div>
        </div>
        
        {attemptedSubmit && errors.busIdentifier && (
          <p className="error-message">
            <span className="error-icon">⚠</span> {errors.busIdentifier}
          </p>
        )}
      </div>
      
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-icon">🗺️</span>
          {t('contribution.routeDetails', 'Route Information')}
        </h3>
        
        <div className="route-visualization">
          <div className="visualization-container">
            <div className="route-start-point">
              <div className="location-marker origin-marker"></div>
              <div className="route-location-input">
                <LocationDropdown
                  id="fromLocationName"
                  label={t('contribution.origin', 'Origin')}
                  placeholder={t('contribution.originPlaceholder', 'Starting location')}
                  selectedLocation={fromLocation}
                  onSelect={handleFromLocationSelect}
                  showValidationFeedback={attemptedSubmit}
                />
                {attemptedSubmit && errors.fromLocation && (
                  <p className="error-message">
                    <span className="error-icon">⚠</span> {errors.fromLocation}
                  </p>
                )}
              </div>
              <div className="time-input">
                <label htmlFor="departureTime">{t('contribution.departureTime', 'Departure')}</label>
                <input 
                  type="time" 
                  id="departureTime" 
                  name="departureTime" 
                  value={formData.departureTime} 
                  onChange={handleChange}
                  className={attemptedSubmit && errors.timeRequired && !formData.departureTime && !formData.arrivalTime ? 'field-error' : ''}
                />
              </div>
            </div>
            
            {formData.stops.length > 0 && (
              <div className="route-stops-container">
                {formData.stops.map((stop, index) => (
                  <div className="route-stop-point" key={index}>
                    <div className="location-marker stop-marker"></div>
                    <div className="stop-info">
                      <div className="stop-name">{stop.name}</div>
                      <div className="stop-times">
                        {stop.arrivalTime && (
                          <span>
                            {t('contribution.arrives', 'Arrives')}: {stop.arrivalTime}
                          </span>
                        )}
                        {stop.arrivalTime && stop.departureTime && ' | '}
                        {stop.departureTime && (
                          <span>
                            {t('contribution.departs', 'Departs')}: {stop.departureTime}
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="remove-stop-btn"
                      onClick={() => handleRemoveStop(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="route-end-point">
              <div className="location-marker destination-marker"></div>
              <div className="route-location-input">
                <LocationDropdown
                  id="toLocationName"
                  label={t('contribution.destination', 'Destination')}
                  placeholder={t('contribution.destinationPlaceholder', 'Final destination')}
                  selectedLocation={toLocation}
                  onSelect={handleToLocationSelect}
                  showValidationFeedback={attemptedSubmit}
                  excludeLocations={fromLocation ? [fromLocation] : []}
                />
                {attemptedSubmit && errors.toLocation && (
                  <p className="error-message">
                    <span className="error-icon">⚠</span> {errors.toLocation}
                  </p>
                )}
              </div>
              <div className="time-input">
                <label htmlFor="arrivalTime">{t('contribution.arrivalTime', 'Arrival')}</label>
                <input 
                  type="time" 
                  id="arrivalTime" 
                  name="arrivalTime" 
                  value={formData.arrivalTime} 
                  onChange={handleChange}
                  className={attemptedSubmit && errors.timeRequired && !formData.departureTime && !formData.arrivalTime ? 'field-error' : ''}
                />
              </div>
=======
    <div className="premium-contribution-page">
      {/* Hero Header Section */}
      <div className="contribution-hero">
        <div className="hero-background">
          <div className="floating-shapes">
            <div className="shape shape-1">🚌</div>
            <div className="shape shape-2">🗺️</div>
            <div className="shape shape-3">⏰</div>
            <div className="shape shape-4">📍</div>
            <div className="shape shape-5">🚏</div>
            <div className="shape shape-6">🛣️</div>
          </div>
        </div>
        
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">✨</span>
            <span className="badge-text">{t('contribution.communityPowered', 'Community Powered')}</span>
          </div>
          
          <h1 className="hero-title">
            <span className="title-gradient">{t('contribution.heroTitle', 'Share Your Route Knowledge')}</span>
          </h1>
          
          <p className="hero-description">
            {t('contribution.heroDescription', 'Help fellow travelers by contributing accurate bus route information. Your local knowledge makes a difference!')}
          </p>
          
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-icon">🚌</div>
              <div className="stat-content">
                <span className="stat-number">10,000+</span>
                <span className="stat-label">{t('stats.routes', 'Routes')}</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <span className="stat-number">5,000+</span>
                <span className="stat-label">{t('stats.contributors', 'Contributors')}</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🌟</div>
              <div className="stat-content">
                <span className="stat-number">50,000+</span>
                <span className="stat-label">{t('stats.helped', 'Helped')}</span>
              </div>
>>>>>>> 75c2859 (production ready code need to test)
            </div>
          </div>
          
          {attemptedSubmit && errors.timeRequired && (
            <p className="error-message">
              <span className="error-icon">⚠</span> {errors.timeRequired}
            </p>
          )}
          
          {attemptedSubmit && errors.routeLogic && (
            <p className="error-message">
              <span className="error-icon">⚠</span> {errors.routeLogic}
            </p>
          )}
        </div>
      </div>
<<<<<<< HEAD
      
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-icon">🚏</span>
          {t('contribution.addStops', 'Add Intermediate Stops')} 
          <span className="field-hint"> ({t('contribution.optional', 'Optional')})</span>
        </h3>
        
        <p className="section-description">
          {t('contribution.stopsDescription', 'If you know intermediate stops on this route, you can add them here. This information is optional but very helpful.')}
        </p>
        
        <div className="add-stop-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stopName">{t('contribution.stopName', 'Stop Name')}</label>
              <input 
                type="text" 
                id="stopName" 
                name="name" 
                value={currentStop.name} 
                onChange={handleStopChange}
                placeholder={t('contribution.stopNamePlaceholder', 'e.g. Vellore')}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="stopArrivalTime">{t('contribution.arrivalTime', 'Arrival Time')}</label>
              <input 
                type="time" 
                id="stopArrivalTime" 
                name="arrivalTime" 
                value={currentStop.arrivalTime} 
                onChange={handleStopChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="stopDepartureTime">{t('contribution.departureTime', 'Departure Time')}</label>
              <input 
                type="time" 
                id="stopDepartureTime" 
                name="departureTime" 
                value={currentStop.departureTime} 
                onChange={handleStopChange}
              />
=======

      {/* Benefits Section */}
      <div className="benefits-section">
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">🎯</div>
            <h3 className="benefit-title">{t('benefits.accurate', 'Accurate Information')}</h3>
            <p className="benefit-description">{t('benefits.accurateDesc', 'Provide real-time, accurate route details that travelers can rely on')}</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">⚡</div>
            <h3 className="benefit-title">{t('benefits.quick', 'Quick & Easy')}</h3>
            <p className="benefit-description">{t('benefits.quickDesc', 'Simple forms that take just minutes to fill out')}</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">🏆</div>
            <h3 className="benefit-title">{t('benefits.impact', 'Make an Impact')}</h3>
            <p className="benefit-description">{t('benefits.impactDesc', 'Your contributions help thousands of daily commuters')}</p>
          </div>
        </div>
      </div>

      {/* Anonymous User Welcome */}
      {!AuthService.isAuthenticated() && (
        <div className="welcome-card">
          <div className="welcome-content">
            <div className="welcome-icon">👋</div>
            <div className="welcome-text">
              <h3 className="welcome-title">{t('welcome.title', 'Welcome, Guest!')}</h3>
              <p className="welcome-message">{t('welcome.message', 'No account needed! Start contributing right away. Create an account later to track your contributions.')}</p>
            </div>
            <div className="welcome-actions">
              <button className="welcome-btn primary">
                <span className="btn-icon">🚀</span>
                <span>{t('welcome.getStarted', 'Get Started')}</span>
              </button>
              <button className="welcome-btn secondary">
                <span className="btn-icon">🔐</span>
                <span>{t('welcome.signUp', 'Sign Up')}</span>
              </button>
>>>>>>> 75c2859 (production ready code need to test)
            </div>
          </div>
          
          <div className="form-action">
            <button 
              type="button" 
              className="add-stop-btn"
              onClick={handleAddStop}
              disabled={!currentStop.name}
            >
              {t('contribution.addStop', '+ Add Stop')}
            </button>
          </div>
          
          {errors.stopTimeRequired && (
            <p className="error-message">
              <span className="error-icon">⚠</span> {errors.stopTimeRequired}
            </p>
          )}
          
          {errors.stopsOverlap && (
            <p className="error-message">
              <span className="error-icon">⚠</span> {errors.stopsOverlap}
            </p>
          )}
        </div>
      )}
      
      {/* Enhanced Contribution Card */}
      <div className="premium-contribution-card">
        <div className="card-header">
          <div className="header-content">
            <h2 className="card-title">
              <span className="title-icon">📝</span>
              {t('contribution.cardTitle', 'Add Route Information')}
            </h2>
            <p className="card-subtitle">{t('contribution.cardSubtitle', 'Choose your preferred method to contribute')}</p>
          </div>
          
          <div className="progress-indicator">
            <div className="progress-step active">
              <div className="step-number">1</div>
              <span className="step-label">{t('steps.method', 'Method')}</span>
            </div>
            <div className="progress-line"></div>
            <div className="progress-step">
              <div className="step-number">2</div>
              <span className="step-label">{t('steps.details', 'Details')}</span>
            </div>
            <div className="progress-line"></div>
            <div className="progress-step">
              <div className="step-number">3</div>
              <span className="step-label">{t('steps.submit', 'Submit')}</span>
            </div>
          </div>
        </div>

        <div className="enhanced-method-selector">
          <div className="method-cards">
            <div 
              className={`method-card ${contributionMethod === 'manual' ? 'active' : ''}`}
              onClick={() => setContributionMethod('manual')}
            >
              <div className="method-icon-wrapper">
                <div className="method-icon">📝</div>
              </div>
              <h3 className="method-title">{t('method.manual.title', 'Manual Entry')}</h3>
              <p className="method-description">{t('method.manual.desc', 'Fill out detailed route information using our smart forms')}</p>
              <div className="method-features">
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>{t('features.timing', 'Timing Details')}</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>{t('features.stops', 'Stop Information')}</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>{t('features.validation', 'Smart Validation')}</span>
                </div>
              </div>
              <div className="method-badge">{t('badges.recommended', 'Recommended')}</div>
            </div>

            <div 
              className={`method-card ${contributionMethod === 'image' ? 'active' : ''}`}
              onClick={() => setContributionMethod('image')}
            >
              <div className="method-icon-wrapper">
                <div className="method-icon">📷</div>
              </div>
              <h3 className="method-title">{t('method.image.title', 'Upload Schedule')}</h3>
              <p className="method-description">{t('method.image.desc', 'Share photos of official bus schedules or timetables')}</p>
              <div className="method-features">
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>{t('features.quick', 'Quick Upload')}</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>{t('features.official', 'Official Docs')}</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>{t('features.extract', 'Auto Extract')}</span>
                </div>
              </div>
              <div className="method-badge secondary">{t('badges.easy', 'Easy')}</div>
            </div>
          </div>
        </div>
        
<<<<<<< HEAD
        {formData.stops.length > 0 && (
          <div className="stops-summary">
            <h4>{t('contribution.addedStops', `${formData.stops.length} stops added`)}</h4>
          </div>
        )}
      </div>
      
      <div className="form-actions">
        <button type="submit" className="submit-btn">
          {t('contribution.submitRoute', 'Submit Route Information')}
        </button>
      </div>
    </form>
  );
};

/**
 * Simple form for uploading bus schedule images
 */
interface SimpleImageUploadFormProps {
  onSubmit: (data: ImageContribution, file: File) => void;
}

// Update the ImageContribution interface to include the new fields
interface ImageContribution {
  busName: string;
  busNumber: string;
  fromLocationName: string;
  toLocationName: string;
  notes: string;
  busTypeId?: number;
  operatorId?: number;
}

const SimpleImageUploadForm: React.FC<SimpleImageUploadFormProps> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ImageContribution>({
    busName: '',
    busNumber: '',
    fromLocationName: '',
    toLocationName: '',
    notes: '',
    busTypeId: 0,
    operatorId: 0,
  });
  
  const [fromLocation, setFromLocation] = useState<Location | null>(null);
  const [toLocation, setToLocation] = useState<Location | null>(null);
  const [busTypes, setBusTypes] = useState<BusType[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    file?: string;
    busIdentifier?: string;
  }>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState<boolean>(false);
  
  // Fetch reference data when component mounts
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [busTypesData, operatorsData] = await Promise.all([
          getBusTypes(),
          getOperators()
        ]);
        
        setBusTypes(busTypesData);
        setOperators(operatorsData);
      } catch (err) {
        console.error('Error fetching reference data:', err);
      }
    };
    
    fetchReferenceData();
  }, []);
  
  const handleFromLocationSelect = (location: Location) => {
    setFromLocation(location);
    setFormData({
      ...formData,
      fromLocationName: location.name
    });
  };
  
  const handleToLocationSelect = (location: Location) => {
    setToLocation(location);
    setFormData({
      ...formData,
      toLocationName: location.name
    });
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if ((name === 'busName' || name === 'busNumber') && errors.busIdentifier) {
      setErrors({ ...errors, busIdentifier: undefined });
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.includes('image/')) {
        setErrors({ ...errors, file: t('contribution.invalidFileType', 'Please select an image file') });
        return;
      }
      
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrors({ ...errors, file: undefined });
    }
  };
  
  const validateForm = () => {
    const newErrors: any = {};
    let isValid = true;
    
    if (!selectedFile) {
      newErrors.file = t(
        'contribution.fileRequired', 
        'Please select an image file to upload'
      );
      isValid = false;
    }
    
    if (!formData.busName && !formData.busNumber) {
      newErrors.busIdentifier = t(
        'contribution.identifierRequired', 
        'Either bus name or number is required'
      );
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    
    if (validateForm() && selectedFile) {
      onSubmit(formData, selectedFile);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="image-form">
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-icon">📷</span>
          {t('contribution.uploadScheduleImage', 'Upload Schedule Image')}
        </h3>
        
        <p className="section-description">
          {t('contribution.uploadDescription', 'Upload a clear image of the bus schedule. This helps us quickly add the route information to our database.')}
        </p>
        
        <div className={`file-upload-container ${errors.file ? 'has-error' : ''}`}>
          <input
            type="file"
            id="scheduleImage"
            name="scheduleImage"
            accept="image/*"
            onChange={handleFileChange}
            className="file-input"
          />
          <label htmlFor="scheduleImage" className="file-label">
            <span className="upload-icon">📤</span>
            {t('contribution.selectImage', 'Select Image')}
          </label>
          
          <p className="upload-tip">
            <span className="tip-icon">💡</span>
            {t('contribution.imageTip', 'Upload a clear, well-lit photo of the schedule for best results')}
          </p>
          
          {previewUrl && (
            <div className="image-preview-container">
              <img src={previewUrl} alt="Preview" className="image-preview" />
            </div>
          )}
          
          {attemptedSubmit && errors.file && (
            <p className="error-message">
              <span className="error-icon">⚠</span> {errors.file}
            </p>
          )}
        </div>
      </div>
      
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-icon">ℹ️</span>
          {t('contribution.additionalInfo', 'Additional Information')}
        </h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="uploadBusName">
              {t('contribution.busName', 'Bus Name')}
              <span className="field-hint"> ({t('contribution.eitherRequired', 'Either name or number required')})</span>
            </label>
            <input 
              type="text" 
              id="uploadBusName" 
              name="busName" 
              value={formData.busName} 
              onChange={handleChange}
              placeholder={t('contribution.busNamePlaceholder', 'e.g. SETC Chennai Express')}
              className={attemptedSubmit && errors.busIdentifier && !formData.busName && !formData.busNumber ? 'field-error' : ''}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="uploadBusNumber">
              {t('contribution.busNumber', 'Bus Number')}
              <span className="field-hint"> ({t('contribution.eitherRequired', 'Either name or number required')})</span>
            </label>
            <input 
              type="text" 
              id="uploadBusNumber" 
              name="busNumber" 
              value={formData.busNumber} 
              onChange={handleChange}
              placeholder={t('contribution.busNumberPlaceholder', 'e.g. TN-01-1234')}
              className={attemptedSubmit && errors.busIdentifier && !formData.busName && !formData.busNumber ? 'field-error' : ''}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="busType">
              {t('contribution.busType', 'Bus Type')}
              <span className="field-hint"> ({t('contribution.optional', 'Optional')})</span>
            </label>
            <select
              id="busType"
              name="busTypeId"
              value={formData.busTypeId || ''}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">{t('contribution.selectBusType', 'Select bus type')}</option>
              {busTypes.map((type) => (
                <option key={`bus-type-${type.id}`} value={type.id}>
                  {type.name} {type.description ? `(${type.description})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="operator">
              {t('contribution.operator', 'Operator')}
              <span className="field-hint"> ({t('contribution.optional', 'Optional')})</span>
            </label>
            <select
              id="operator"
              name="operatorId"
              value={formData.operatorId || ''}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">{t('contribution.selectOperator', 'Select operator')}</option>
              {operators.map((op) => (
                <option key={`operator-${op.id}`} value={op.id}>
                  {op.name} {op.description ? `(${op.description})` : ''}
                </option>
              ))}
            </select>
=======
        <div className="form-container">
          {contributionMethod === 'manual' ? (
            <SimpleRouteForm 
              onSubmit={(data) => handleSecureSubmission(data, false)} 
            />
          ) : (
            <SimpleImageForm 
              onSubmit={(data, file) => handleSecureSubmission({ ...data, file }, true)}
            />
          )}
        </div>
        
        {/* Enhanced Status Messages */}
        {submissionStatus === 'submitting' && (
          <div className="premium-status submitting">
            <div className="status-animation">
              <div className="spinner-modern"></div>
              <div className="pulse-rings">
                <div className="pulse-ring"></div>
                <div className="pulse-ring"></div>
                <div className="pulse-ring"></div>
              </div>
            </div>
            <div className="status-content">
              <h3 className="status-title">{t('status.submitting.title', 'Processing Your Contribution')}</h3>
              <p className="status-message">{t('status.submitting.message', 'Please wait while we validate and save your route information...')}</p>
            </div>
          </div>
        )}
        
        {submissionStatus === 'success' && (
          <div className="premium-status success">
            <div className="status-animation">
              <div className="success-checkmark">
                <div className="check-icon">✓</div>
              </div>
              <div className="success-particles">
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
              </div>
            </div>
            <div className="status-content">
              <h3 className="status-title">{t('status.success.title', 'Contribution Successful!')}</h3>
              <p className="status-message">{statusMessage}</p>
              <div className="success-actions">
                <button className="action-btn primary" onClick={() => setSubmissionStatus('idle')}>
                  <span className="btn-icon">➕</span>
                  <span>{t('actions.addAnother', 'Add Another Route')}</span>
                </button>
                <button className="action-btn secondary" onClick={() => setShowContributions(true)}>
                  <span className="btn-icon">📊</span>
                  <span>{t('actions.viewHistory', 'View My Contributions')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {submissionStatus === 'error' && (
          <div className="premium-status error">
            <div className="status-animation">
              <div className="error-icon">⚠️</div>
            </div>
            <div className="status-content">
              <h3 className="status-title">{t('status.error.title', 'Submission Failed')}</h3>
              <p className="status-message">{statusMessage}</p>
              <div className="error-actions">
                <button className="action-btn primary" onClick={() => setSubmissionStatus('idle')}>
                  <span className="btn-icon">🔄</span>
                  <span>{t('actions.tryAgain', 'Try Again')}</span>
                </button>
                <button className="action-btn secondary">
                  <span className="btn-icon">💬</span>
                  <span>{t('actions.getHelp', 'Get Help')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Contributions History */}
      <div className="contributions-history-section">
        <button 
          className="history-toggle-btn"
          onClick={toggleContributions}
        >
          <div className="toggle-content">
            <div className="toggle-icon">
              {showContributions ? '📊' : '📈'}
            </div>
            <div className="toggle-text">
              <h3 className="toggle-title">
                {showContributions 
                  ? t('history.hide', 'Hide My Contributions') 
                  : t('history.show', 'View My Contributions')}
              </h3>
              <p className="toggle-subtitle">
                {t('history.subtitle', 'Track your contribution impact')}
              </p>
            </div>
            <div className="toggle-arrow">
              {showContributions ? '▼' : '▶'}
            </div>
          </div>
        </button>
        
        {showContributions && (
          <div className="premium-contributions-panel">
            <div className="contributions-header">
              <h3 className="contributions-title">
                <span className="title-icon">📋</span>
                {t('contribution.yourContributions', 'Your Contributions')}
              </h3>
              {userContributions.length > 0 && (
                <div className="contributions-count-badge">
                  {userContributions.length} {userContributions.length === 1 ? 'item' : 'items'}
                </div>
              )}
            </div>
            
            {userContributions.length === 0 ? (
              <div className="no-contributions-state">
                <div className="empty-state-icon">📝</div>
                <h4 className="empty-state-title">No contributions yet</h4>
                <p className="empty-state-message">
                  {t('contribution.noContributions', 'You haven\'t made any contributions yet.')}
                </p>
                <div className="empty-state-tip">
                  <span className="tip-icon">💡</span>
                  <span>Start by submitting a route above to see your contribution history here!</span>
                </div>
              </div>
            ) : (
              <div className="contributions-table-container modern-table-container">
                <div className="table-wrapper">
                  <table className="contributions-table modern-table">
                    <thead>
                      <tr>
                        <th>
                          <span className="header-icon">🏷️</span>
                          {t('contribution.type', 'Type')}
                        </th>
                        <th>
                          <span className="header-icon">📍</span>
                          {t('contribution.details', 'Details')}
                        </th>
                        <th>
                          <span className="header-icon">📅</span>
                          {t('contribution.submitDate', 'Date')}
                        </th>
                        <th>
                          <span className="header-icon">⚡</span>
                          {t('contribution.status', 'Status')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {userContributions.map((contribution, index) => (
                        <tr key={index} className="contribution-row">
                          <td className="type-cell">
                            <span className="type-badge">{contribution.type}</span>
                          </td>
                          <td className="details-cell">
                            <div className="details-content">
                              {contribution.details}
                            </div>
                          </td>
                          <td className="date-cell">
                            <span className="date-value">
                              {new Date(contribution.submissionDate).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="status-cell">
                            <span className={`status-badge modern-status-badge ${contribution.status.toLowerCase()}`}>
                              <span className="status-indicator"></span>
                              {contribution.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Community Impact Section */}
      <div className="community-impact">
        <div className="impact-header">
          <h2 className="impact-title">{t('impact.title', 'Your Impact Matters')}</h2>
          <p className="impact-subtitle">{t('impact.subtitle', 'See how your contributions help the community')}</p>
        </div>
        
        <div className="impact-metrics">
          <div className="metric-card">
            <div className="metric-icon">👁️</div>
            <div className="metric-content">
              <span className="metric-number">1,250</span>
              <span className="metric-label">{t('metrics.views', 'Route Views')}</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">🚌</div>
            <div className="metric-content">
              <span className="metric-number">89</span>
              <span className="metric-label">{t('metrics.trips', 'Successful Trips')}</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">⭐</div>
            <div className="metric-content">
              <span className="metric-number">4.8</span>
              <span className="metric-label">{t('metrics.rating', 'Avg Rating')}</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">💝</div>
            <div className="metric-content">
              <span className="metric-number">24</span>
              <span className="metric-label">{t('metrics.thanks', 'Thank You Notes')}</span>
            </div>
>>>>>>> 75c2859 (production ready code need to test)
          </div>
        </div>
        
        {attemptedSubmit && errors.busIdentifier && (
          <p className="error-message">
            <span className="error-icon">⚠</span> {errors.busIdentifier}
          </p>
        )}
        
        <div className="form-group">
          <label htmlFor="uploadNotes">
            {t('contribution.notes', 'Additional Notes')}
            <span className="field-hint"> ({t('contribution.optional', 'Optional')})</span>
          </label>
          <textarea 
            id="uploadNotes" 
            name="notes" 
            value={formData.notes} 
            onChange={handleChange}
            placeholder={t('contribution.notesPlaceholder', 'Any additional information about this schedule')}
            rows={3}
          />
        </div>
      </div>
      
      <div className="form-actions">
        <button type="submit" className="submit-btn">
          {t('contribution.uploadSchedule', 'Upload Schedule')}
        </button>
      </div>
    </div>
  );
};

/**
 * RouteContribution component for contributing route information
 */
interface RouteContributionProps {
  userId: string;
}

const RouteContribution: React.FC<RouteContributionProps> = ({ userId }) => {
  const { t } = useTranslation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [fromLocationId, setFromLocationId] = useState<number>(0);
  const [toLocationId, setToLocationId] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [routeType, setRouteType] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [routeTypes, setRouteTypes] = useState<RouteType[]>([]);

  useEffect(() => {
    // Fetch available locations and route types
    const fetchData = async () => {
      try {
        setLoading(true);
        const [locationsData, routeTypesData] = await Promise.all([
          apiService.getLocations(),
          getRouteTypes()
        ]);
        setLocations(locationsData);
        setRouteTypes(routeTypesData);
        
        // Set default route type if available
        if (routeTypesData.length > 0) {
          setRouteType(routeTypesData[0].id.toString());
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(t('contribution.error.fetchData', 'Failed to load necessary data. Please try again.'));
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromLocationId || !toLocationId) {
      setError(t('contribution.error.missingLocations', 'Please select both origin and destination.'));
      return;
    }
    
    if (fromLocationId === toLocationId) {
      setError(t('contribution.error.sameLocations', 'Origin and destination cannot be the same.'));
      return;
    }
    
    if (!description.trim()) {
      setError(t('contribution.error.missingDescription', 'Please provide a description.'));
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await apiService.submitRouteContribution({
        userId,
        routeType,
        fromLocationId,
        toLocationId,
        description
      });
      
      setSuccess(true);
      // Reset form
      setFromLocationId(0);
      setToLocationId(0);
      setDescription('');
      setRouteType('');
      
      // Reset success message after a delay
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('Error submitting route contribution:', err);
      setError(t('contribution.error.submission', 'Failed to submit contribution. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="route-contribution-container">
      <h2 className="contribution-title">{t('contribution.title', 'Contribute a Route')}</h2>
      <p className="contribution-description">
        {t('contribution.description', 'Help improve our route database by contributing routes you know about.')}
      </p>
      
      {success && (
        <div className="success-message">
          {t('contribution.successMessage', 'Thank you for your contribution! It will be reviewed by our team.')}
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="contribution-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="routeType">{t('contribution.routeType', 'Route Type')}</label>
            <select 
              id="routeType"
              value={routeType}
              onChange={(e) => setRouteType(e.target.value)}
              disabled={loading}
              className="form-select"
            >
              <option value="">{t('contribution.selectRouteType', 'Select a route type')}</option>
              {routeTypes.map((type) => (
                <option key={`type-${type.id}`} value={type.id.toString()}>
                  {type.name} {type.description ? `(${type.description})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fromLocation">{t('contribution.from', 'From')}</label>
            <select 
              id="fromLocation"
              value={fromLocationId}
              onChange={(e) => setFromLocationId(Number(e.target.value))}
              disabled={loading || locations.length === 0}
              className="form-select"
            >
              <option value={0}>{t('contribution.selectLocation', 'Select a location')}</option>
              {locations.map((loc) => (
                <option key={`from-${loc.id}`} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="toLocation">{t('contribution.to', 'To')}</label>
            <select 
              id="toLocation"
              value={toLocationId}
              onChange={(e) => setToLocationId(Number(e.target.value))}
              disabled={loading || locations.length === 0}
              className="form-select"
            >
              <option value={0}>{t('contribution.selectLocation', 'Select a location')}</option>
              {locations.map((loc) => (
                <option key={`to-${loc.id}`} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="description">{t('contribution.description', 'Description')}</label>
          <textarea 
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            placeholder={t('contribution.descriptionPlaceholder', 'Provide details about the route, such as schedule, stops, fare, etc.')}
            className="form-textarea"
            rows={4}
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            disabled={loading || !fromLocationId || !toLocationId || !description.trim()}
            className="submit-button"
          >
            {loading 
              ? t('contribution.submitting', 'Submitting...') 
              : t('contribution.submit', 'Submit Contribution')}
          </button>
        </div>
      </form>
      
      <div className="contribution-info">
        <h3>{t('contribution.whyContribute', 'Why Contribute?')}</h3>
        <ul>
          <li>{t('contribution.reason1', 'Help other travelers find the best routes')}</li>
          <li>{t('contribution.reason2', 'Improve transportation data for your community')}</li>
          <li>{t('contribution.reason3', 'Earn reward points for verified contributions')}</li>
        </ul>
      </div>
    </div>
  );
};

export default RouteContributionComponent;
export { RouteContribution };

