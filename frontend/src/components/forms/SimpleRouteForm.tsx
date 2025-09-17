import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormInput } from "../ui/FormInput";
import { FormTextArea } from "../ui/FormTextArea";
import './SimpleRouteForm.css';

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
  operatingHours: string;
  departureTime: string;
  arrivalTime: string;
}

interface SimpleRouteFormProps {
  onSubmit: (data: any) => void;
}

export const SimpleRouteForm: React.FC<SimpleRouteFormProps> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    busNumber: '',
    route: '',
    origin: '',
    destination: '',
    stops: '',
    operatingHours: '',
    departureTime: '',
    arrivalTime: ''
  });

  const [intermediateStops, setIntermediateStops] = useState<Stop[]>([]);
  const [showStopForm, setShowStopForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const enhancedData = {
      ...formData,
      fromLocationName: formData.origin || 'Unknown Origin',
      toLocationName: formData.destination || 'Unknown Destination',
      busName: formData.route || formData.busNumber || 'Unknown Bus',
      intermediateStops: intermediateStops,
      stopsData: intermediateStops.length > 0 ? intermediateStops : formData.stops
    };
    
    onSubmit(enhancedData);
  };

  // Functions for managing intermediate stops
  const addStop = () => {
    const newStop: Stop = {
      id: Date.now().toString(),
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

  const removeStop = (id: string) => {
    setIntermediateStops(prev => prev.filter(stop => stop.id !== id));
  };

  const toggleStopForm = () => {
    setShowStopForm(!showStopForm);
  };

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
      <FormInput
        id="busNumber"
        name="busNumber"
        value={formData.busNumber}
        onChange={handleChange}
        label={t('route.busNumber', 'Bus Number')}
        placeholder="e.g., 27D, 570, MTC-123"
        icon="🚌"
        hint="Enter the bus number OR route name below"
        required
      />
      
      <FormInput
        id="route"
        name="route"
        value={formData.route}
        onChange={handleChange}
        label={t('route.routeName', 'Route Name')}
        placeholder="e.g., Chennai Central - Tambaram Express"
        icon="🛣️"
        hint="Enter the route name OR bus number above"
        required
      />
      
      <div className="form-section route-details">
        <h3 className="section-title">
          <span className="section-icon">🚌</span>
          Route Information
        </h3>
        
        <div className="form-row">
          <div className="form-group departure-group">
            <label htmlFor="origin">
              <span className="field-icon">📍</span>
              {t('route.departure', 'Departure')}
            </label>
            <div className="location-time-container">
              <input
                type="text"
                id="origin"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                className="modern-input location-input"
                placeholder={t('route.originPlaceholder', 'e.g., Chennai Central')}
                required
              />
              <div className="time-input-group">
                <label htmlFor="departureTime" className="time-label">
                  <span className="time-icon">🕐</span>
                  Time
                </label>
                <input
                  type="time"
                  id="departureTime"
                  name="departureTime"
                  value={formData.departureTime}
                  onChange={handleChange}
                  className="time-input"
                  placeholder="--:--"
                />
              </div>
            </div>
          </div>
          
          <div className="form-group arrival-group">
            <label htmlFor="destination">
              <span className="field-icon">🏁</span>
              {t('route.arrival', 'Arrival')}
            </label>
            <div className="location-time-container">
              <input
                type="text"
                id="destination"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                className="modern-input location-input"
                placeholder={t('route.destinationPlaceholder', 'e.g., Madurai')}
                required
              />
              <div className="time-input-group">
                <label htmlFor="arrivalTime" className="time-label">
                  <span className="time-icon">🕑</span>
                  Time
                </label>
                <input
                  type="time"
                  id="arrivalTime"
                  name="arrivalTime"
                  value={formData.arrivalTime}
                  onChange={handleChange}
                  className="time-input"
                  placeholder="--:--"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Journey Duration Display */}
        {formData.departureTime && formData.arrivalTime && (
          <div className="journey-summary">
            <div className="duration-card">
              <span className="duration-icon">⏱️</span>
              <div className="duration-info">
                <span className="duration-label">Journey Duration</span>
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
            Intermediate Stops ({intermediateStops.length} stops)
          </h3>
          <div className="stops-actions">
            <button 
              type="button" 
              onClick={addStop}
              className="add-stop-btn"
            >
              <span className="btn-icon">➕</span>
              Add Stop
            </button>
            {intermediateStops.length > 0 && (
              <button 
                type="button" 
                onClick={toggleStopForm}
                className="toggle-view-btn"
              >
                <span className="btn-icon">{showStopForm ? '📋' : '📝'}</span>
                {showStopForm ? 'Simple View' : 'Detailed View'}
              </button>
            )}
          </div>
        </div>

        {intermediateStops.length === 0 ? (
          <div className="empty-stops-state">
            <div className="empty-icon">🚏</div>
            <h4>No stops added yet</h4>
            <p>Add intermediate stops with specific timings for better route tracking</p>
            <button 
              type="button" 
              onClick={addStop}
              className="add-first-stop-btn"
            >
              <span className="btn-icon">➕</span>
              Add First Stop
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
                      <div className="stop-number">Stop {index + 1}</div>
                      <button 
                        type="button" 
                        onClick={() => removeStop(stop.id)}
                        className="remove-stop-btn"
                        title="Remove stop"
                      >
                        <span className="btn-icon">❌</span>
                      </button>
                    </div>
                    
                    <div className="stop-form-grid">
                      <div className="stop-name-field">
                        <label>
                          <span className="field-icon">📍</span>
                          Stop Name
                          <span className="field-requirement">*</span>
                        </label>
                        <input
                          type="text"
                          value={stop.name}
                          onChange={(e) => updateStop(stop.id, 'name', e.target.value)}
                          placeholder="e.g., Central Metro Station"
                          className="stop-input"
                          required
                        />
                      </div>
                      
                      <div className="stop-timing-fields">
                        <div className="timing-field">
                          <label>
                            <span className="field-icon">🕐</span>
                            Arrival Time
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
                            Departure Time
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
                          Notes (Optional)
                        </label>
                        <input
                          type="text"
                          value={stop.notes || ''}
                          onChange={(e) => updateStop(stop.id, 'notes', e.target.value)}
                          placeholder="e.g., Platform 2, Main entrance"
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
                    <span className="stop-name">{stop.name || `Stop ${index + 1}`}</span>
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
              label={t('route.stops', 'Or quickly add stops (comma-separated)')}
              placeholder={t('route.stopsPlaceholder', 'e.g., Central Station, City Mall, University')}
              hint={t('route.simpleStopsHint', 'Quick entry for stop names only')}
              rows={2}
            />
          </div>
        )}
      </div>
      
      <FormInput
        id="operatingHours"
        name="operatingHours"
        value={formData.operatingHours}
        onChange={handleChange}
        label={t('route.operatingHours', 'Operating Hours')}
        placeholder={t('route.operatingHoursPlaceholder', 'e.g., 6:00 AM - 10:00 PM')}
      />
      
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