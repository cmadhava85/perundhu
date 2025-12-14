import React, { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from 'lucide-react';
import { FormInput } from "../ui/FormInput";
import { FormTextArea } from "../ui/FormTextArea";
import LocationAutocompleteInput from "../LocationAutocompleteInput";
import { getRecaptchaToken } from '../../services/recaptchaService';
import './SimpleRouteForm.css';

interface LocationData {
  lat?: number;
  lng?: number;
  name?: string;
}

interface Stop {
  id: string;
  name: string;
  arrivalTime?: string;
  departureTime?: string;
  notes?: string;
}

interface FormData {
  busNumber: string;
  route: string;
  origin: string;
  destination: string;
  stops: string;
  departureTime: string;
  arrivalTime: string;
}

interface EnhancedFormData extends FormData {
  fromLocationName: string;
  toLocationName: string;
  busName: string;
  intermediateStops: Stop[];
  stopsData: Stop[] | string;
  website?: string; // Honeypot field for bot detection
  captchaToken?: string | null;
}

interface SimpleRouteFormProps {
  onSubmit: (data: EnhancedFormData) => void;
}

export const SimpleRouteForm: React.FC<SimpleRouteFormProps> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    busNumber: '',
    route: '',
    origin: '',
    destination: '',
    stops: '',
    departureTime: '',
    arrivalTime: ''
  });

  const [intermediateStops, setIntermediateStops] = useState<Stop[]>([]);
  const [showStopForm, setShowStopForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  // Track if locations were selected from autocomplete suggestions
  const [locationVerified, setLocationVerified] = useState<{
    origin: boolean;
    destination: boolean;
  }>({ origin: false, destination: false });
  
  // Track location warnings (unverified locations)
  const [locationWarnings, setLocationWarnings] = useState<{[key: string]: string}>({});
  
  // Honeypot field for bot detection (invisible to users)
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate form before submission
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    const warnings: {[key: string]: string} = {};
    
    // Either bus number or route name is required
    if (!formData.busNumber?.trim() && !formData.route?.trim()) {
      errors.busNumber = 'Either Bus Number or Route Name is required';
    }
    
    // Origin is required
    if (!formData.origin?.trim()) {
      errors.origin = 'Departure location is required';
    } else if (!locationVerified.origin) {
      // Warn if origin was typed but not selected from autocomplete
      warnings.origin = 'Location not recognized. Select from suggestions for better accuracy.';
    }
    
    // Destination is required
    if (!formData.destination?.trim()) {
      errors.destination = 'Arrival location is required';
    } else if (!locationVerified.destination) {
      // Warn if destination was typed but not selected from autocomplete
      warnings.destination = 'Location not recognized. Select from suggestions for better accuracy.';
    }
    
    // Departure time is required
    if (!formData.departureTime?.trim()) {
      errors.departureTime = 'Departure time is required';
    }
    
    // Arrival time is optional but show a hint
    // No error for missing arrival time - it will be estimated by backend
    
    setValidationErrors(errors);
    setLocationWarnings(warnings);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate before submission
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = document.querySelector('.field-error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get reCAPTCHA token for spam protection
      const captchaToken = await getRecaptchaToken('manual_contribution');
      
      const enhancedData = {
        ...formData,
        fromLocationName: formData.origin || 'Unknown Origin',
        toLocationName: formData.destination || 'Unknown Destination',
        busName: formData.route || formData.busNumber || 'Unknown Bus',
        intermediateStops: intermediateStops,
        stopsData: intermediateStops.length > 0 ? intermediateStops : formData.stops,
        website: honeypot, // Honeypot for bot detection
        captchaToken
      };
      
      onSubmit(enhancedData);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use stable counter for stop IDs to prevent re-renders
  const stopIdCounterRef = useRef(1);

  // Functions for managing intermediate stops
  const addStop = () => {
    const newStop: Stop = {
      id: `stop-${stopIdCounterRef.current++}`,
      name: '',
      arrivalTime: '',
      departureTime: '',
      notes: ''
    };
    setIntermediateStops([...intermediateStops, newStop]);
    setShowStopForm(true);
  };

  const updateStop = (id: string, field: keyof Stop, value: string) => {
    setIntermediateStops(prev => 
      prev.map(stop => 
        stop.id === id ? { ...stop, [field]: value } : stop
      )
    );
  };

  // Handle stop name autocomplete
  const updateStopName = (id: string, value: string, _location?: LocationData) => {
    setIntermediateStops(prev => 
      prev.map(stop => 
        stop.id === id ? { ...stop, name: value } : stop
      )
    );
    // Stop name selected with location data
  };

  const removeStop = (id: string) => {
    setIntermediateStops(prev => prev.filter(stop => stop.id !== id));
  };

  const toggleStopForm = () => {
    setShowStopForm(!showStopForm);
  };

  const _getBusIdentificationValidation = () => {
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

  // Handle location autocomplete changes - Memoized to prevent refresh issues
  const handleOriginChange = useCallback((value: string, location?: LocationData) => {
    setFormData(prev => ({
      ...prev,
      origin: value
    }));
    
    // Track if location was selected from autocomplete (has lat/lng data)
    const wasSelected = !!(location?.lat && location?.lng);
    setLocationVerified(prev => ({ ...prev, origin: wasSelected }));
    
    // Clear warning if location was verified, or if value is empty
    if (wasSelected || !value.trim()) {
      setLocationWarnings(prev => {
        const { origin: _, ...rest } = prev;
        return rest;
      });
    }
  }, []);

  const handleDestinationChange = useCallback((value: string, location?: LocationData) => {
    setFormData(prev => ({
      ...prev,
      destination: value
    }));
    
    // Track if location was selected from autocomplete (has lat/lng data)
    const wasSelected = !!(location?.lat && location?.lng);
    setLocationVerified(prev => ({ ...prev, destination: wasSelected }));
    
    // Clear warning if location was verified, or if value is empty
    if (wasSelected || !value.trim()) {
      setLocationWarnings(prev => {
        const { destination: _, ...rest } = prev;
        return rest;
      });
    }
  }, []);

  // Helper function to calculate journey duration
  const calculateJourneyDuration = (departureTime: string, arrivalTime: string): string => {
    if (!departureTime || !arrivalTime) return '';
    
    const departure = new Date(`2000-01-01T${departureTime}`);
    const arrival = new Date(`2000-01-01T${arrivalTime}`);
    let diffMs = arrival.getTime() - departure.getTime();
    
    // Handle overnight journeys
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000; // Add 24 hours
    }
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours === 0) {
      return `${mins} minutes`;
    } else if (mins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours}h ${mins}m`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="route-form">
      {/* Validation Error Summary */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="validation-error-summary" style={{
          background: 'linear-gradient(135deg, #fef2f2, #fecaca)',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div>
            <h4 style={{ margin: 0, color: '#dc2626', fontSize: '1rem', fontWeight: '600' }}>
              {t('route.fixErrors', 'Please fix the following errors:')}
            </h4>
            <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem', color: '#991b1b', fontSize: '0.9rem' }}>
              {Object.values(validationErrors).map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Location Warnings Summary */}
      {Object.keys(locationWarnings).length > 0 && Object.keys(validationErrors).length === 0 && (
        <div className="validation-warning-summary" style={{
          background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
          border: '2px solid #f59e0b',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}>
          <AlertTriangle size={24} style={{ color: '#d97706', flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: 0, color: '#b45309', fontSize: '1rem', fontWeight: '600' }}>
              {t('route.locationWarning', 'Location Warning')}
            </h4>
            <p style={{ margin: '0.5rem 0 0 0', color: '#92400e', fontSize: '0.9rem' }}>
              {t('route.locationWarningDescription', 'Some locations were not selected from suggestions. You can still submit, but selecting from the autocomplete dropdown ensures better accuracy.')}
            </p>
          </div>
        </div>
      )}

      {/* Bus Number + Route Name - Compact Row */}
      <div className="bus-route-row">
        <div className={`bus-field ${validationErrors.busNumber ? 'field-error' : ''}`}>
          <FormInput
            id="busNumber"
            name="busNumber"
            value={formData.busNumber}
            onChange={handleChange}
            label={t('route.busNumber', 'Bus Number')}
            placeholder={t('route.busNumberPlaceholder', 'e.g., 27D, 570')}
            icon="🚌"
          />
        </div>
        <div className="route-field">
          <FormInput
            id="route"
            name="route"
            value={formData.route}
            onChange={handleChange}
            label={t('route.routeName', 'Route Name')}
            placeholder={t('route.routeNamePlaceholder', 'e.g., Chennai - Tambaram')}
            icon="🛣️"
          />
        </div>
      </div>
      {validationErrors.busNumber && (
        <span className="error-text" style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '-0.5rem', marginBottom: '0.5rem', display: 'block' }}>
          {validationErrors.busNumber}
        </span>
      )}
      <p className="bus-route-hint">{t('route.busRouteHint', 'Enter either bus number or route name (at least one required)')}</p>
      
      <div className="form-section route-details-compact">
        <h3 className="section-title-compact">
          📍 {t('route.routeInformation', 'Route Information')}
        </h3>
        
        <div className="form-row-compact">
          <div className={`form-group-compact ${validationErrors.origin ? 'field-error' : ''}`}>
            <label htmlFor="origin" className="compact-label">
              📍 {t('route.from', 'From')} <span className="required">*</span>
              {locationVerified.origin && <span className="verified">✓</span>}
            </label>
            <div className="compact-location-time">
              <LocationAutocompleteInput
                id="origin"
                name="origin"
                value={formData.origin}
                onChange={handleOriginChange}
                placeholder={t('route.originPlaceholder', 'e.g., Chennai Central')}
                label=""
                required
              />
              <div className="compact-time">
                <span className="time-icon">⏰</span>
                <input
                  type="time"
                  id="departureTime"
                  name="departureTime"
                  value={formData.departureTime}
                  onChange={handleChange}
                  className={`compact-time-input ${validationErrors.departureTime ? 'input-error' : ''}`}
                  style={validationErrors.departureTime ? { borderColor: '#dc2626' } : {}}
                />
              </div>
            </div>
            {(validationErrors.origin || validationErrors.departureTime) && (
              <span className="error-text-compact">
                {validationErrors.origin || t('route.timeRequired', 'Time required')}
              </span>
            )}
            {locationWarnings.origin && !validationErrors.origin && (
              <span className="warning-text-compact"><AlertTriangle size={12} /> {locationWarnings.origin}</span>
            )}
          </div>
          
          <div className={`form-group-compact ${validationErrors.destination ? 'field-error' : ''}`}>
            <label htmlFor="destination" className="compact-label">
              🎯 {t('route.to', 'To')} <span className="required">*</span>
              {locationVerified.destination && <span className="verified">✓</span>}
            </label>
            <div className="compact-location-time">
              <LocationAutocompleteInput
                id="destination"
                name="destination"
                value={formData.destination}
                onChange={handleDestinationChange}
                placeholder={t('route.destinationPlaceholder', 'e.g., Madurai')}
                label=""
                required
              />
              <div className="compact-time optional">
                <span className="time-icon">⏰</span>
                <input
                  type="time"
                  id="arrivalTime"
                  name="arrivalTime"
                  value={formData.arrivalTime}
                  onChange={handleChange}
                  className="compact-time-input"
                />
              </div>
            </div>
            {validationErrors.destination && (
              <span className="error-text-compact">{validationErrors.destination}</span>
            )}
            {locationWarnings.destination && !validationErrors.destination && (
              <span className="warning-text-compact"><AlertTriangle size={12} /> {locationWarnings.destination}</span>
            )}
          </div>
        </div>
        
        {/* Journey Duration Display */}
        {formData.departureTime && formData.arrivalTime && (
          <div className="journey-summary">
            <div className="duration-card">
              <span className="duration-icon">⏱️</span>
              <div className="duration-info">
                <span className="duration-label">{t('route.journeyDuration', 'Journey Duration')}</span>
                <span className="duration-value">
                  {calculateJourneyDuration(formData.departureTime, formData.arrivalTime)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Enhanced Stops Management Section */}
      <div className="form-section stops-section">
        <div className="section-header">
          <h3 className="section-title">
            <span className="section-icon">🚏</span>
            {t('route.intermediateStops', 'Intermediate Stops')} ({intermediateStops.length} {t('route.stops', 'stops')})
          </h3>
          <div className="stops-actions">
            <button 
              type="button" 
              onClick={addStop}
              className="add-stop-btn"
            >
              <span className="btn-icon">➕</span>
              {t('route.addStop', 'Add Stop')}
            </button>
            {intermediateStops.length > 0 && (
              <button 
                type="button" 
                onClick={toggleStopForm}
                className="toggle-view-btn"
              >
                <span className="btn-icon">{showStopForm ? '📋' : '📝'}</span>
                {showStopForm ? t('route.simpleView', 'Simple View') : t('route.detailedView', 'Detailed View')}
              </button>
            )}
          </div>
        </div>

        {intermediateStops.length === 0 ? (
          <div className="empty-stops-state">
            <div className="empty-icon">🚏</div>
            <h4>{t('route.noStopsYet', 'No stops added yet')}</h4>
            <p>{t('route.noStopsDescription', 'Add intermediate stops with specific timings for better route tracking')}</p>
            <button 
              type="button" 
              onClick={addStop}
              className="add-first-stop-btn"
            >
              <span className="btn-icon">➕</span>
              {t('route.addFirstStop', 'Add First Stop')}
            </button>
          </div>
        ) : (
          <div className="stops-container">
            {showStopForm ? (
              // Detailed view with timing
              <div className="detailed-stops-view">
                {intermediateStops.map((stop, index) => (
                  <div key={stop.id} className="stop-card">
                    <div className="stop-header">
                      <div className="stop-number">{t('route.stop', 'Stop')} {index + 1}</div>
                      <button 
                        type="button" 
                        onClick={() => removeStop(stop.id)}
                        className="remove-stop-btn"
                        title={t('route.removeStop', 'Remove stop')}
                      >
                        <span className="btn-icon">❌</span>
                      </button>
                    </div>
                    
                    <div className="stop-form-grid">
                      <div className="stop-name-field">
                        <label>
                          <span className="field-icon">📍</span>
                          {t('route.stopName', 'Stop Name')}
                          <span className="field-requirement">*</span>
                        </label>
                        <LocationAutocompleteInput
                          id={`stop-name-${stop.id}`}
                          name="stopName"
                          value={stop.name}
                          onChange={(value, location) => updateStopName(stop.id, value, location)}
                          placeholder={t('route.stopNamePlaceholder', 'e.g., Central Metro Station')}
                          label=""
                          required
                        />
                      </div>
                      
                      <div className="stop-timing-fields">
                        <div className="timing-field">
                          <label>
                            <span className="field-icon">🕐</span>
                            {t('route.arrivalTime', 'Arrival Time')}
                          </label>
                          <input
                            type="time"
                            value={stop.arrivalTime || ''}
                            onChange={(e) => updateStop(stop.id, 'arrivalTime', e.target.value)}
                            className="time-input"
                          />
                        </div>
                        
                        <div className="timing-field">
                          <label>
                            <span className="field-icon">🕑</span>
                            {t('route.departureTime', 'Departure Time')}
                          </label>
                          <input
                            type="time"
                            value={stop.departureTime || ''}
                            onChange={(e) => updateStop(stop.id, 'departureTime', e.target.value)}
                            className="time-input"
                          />
                        </div>
                      </div>
                      
                      <div className="stop-notes-field">
                        <label>
                          <span className="field-icon">📝</span>
                          {t('route.notes', 'Notes (Optional)')}
                        </label>
                        <input
                          type="text"
                          value={stop.notes || ''}
                          onChange={(e) => updateStop(stop.id, 'notes', e.target.value)}
                          placeholder={t('route.notesPlaceholder', 'e.g., Platform 2, Main entrance')}
                          className="stop-input"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Simple list view
              <div className="simple-stops-view">
                {intermediateStops.map((stop, index) => (
                  <div key={stop.id} className="stop-item">
                    <span className="stop-bullet">•</span>
                    <span className="stop-name">{stop.name || `${t('route.stop', 'Stop')} ${index + 1}`}</span>
                    {stop.arrivalTime && (
                      <span className="stop-time">
                        📍 {stop.arrivalTime}
                        {stop.departureTime && stop.departureTime !== stop.arrivalTime && 
                          ` - ${stop.departureTime}`
                        }
                      </span>
                    )}
                    <button 
                      type="button" 
                      onClick={() => removeStop(stop.id)}
                      className="remove-stop-btn-simple"
                      title="Remove stop"
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Fallback to simple text input for quick entry */}
        {intermediateStops.length === 0 && (
          <div className="simple-stops-fallback">
            <FormTextArea
              id="stops"
              name="stops"
              value={formData.stops}
              onChange={handleChange}
              label={t('route.quickAddStops', 'Or quickly add stops (comma-separated)')}
              placeholder={t('route.stopsPlaceholder', 'e.g., Central Station, City Mall, University')}
              hint={t('route.simpleStopsHint', 'Quick entry for stop names only')}
              rows={2}
            />
          </div>
        )}
      </div>
      
      {/* Honeypot field - hidden from users, visible to bots */}
      <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      
      <div className="form-actions">
        <button type="submit" className="submit-button modern-submit-btn" disabled={isSubmitting}>
          <div className="submit-btn-content">
            <span className="submit-icon">{isSubmitting ? '⏳' : '🚌'}</span>
            <span className="submit-text">{isSubmitting ? t('contribution.submitting', 'Submitting...') : t('contribution.submitRoute', 'Submit Route Information')}</span>
            <span className="submit-arrow">{isSubmitting ? '' : '→'}</span>
          </div>
        </button>
      </div>
    </form>
  );
};