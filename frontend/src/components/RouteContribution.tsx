import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { submitRouteContribution, submitImageContribution, getContributionStatus } from "../services/api";
import type { RouteContribution as RouteContributionType, StopContribution, ImageContribution } from '../types';
import './RouteContribution.css';

/**
 * Component that allows users to contribute bus route information
 * through manual entry or image uploads.
 */
const RouteContributionComponent: React.FC = () => {
  const { t } = useTranslation();
  const [contributionMethod, setContributionMethod] = useState<'manual' | 'image'>('manual');
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [userContributions, setUserContributions] = useState<any[]>([]);
  const [showContributions, setShowContributions] = useState<boolean>(false);
  
  // Load user's previous contributions
  useEffect(() => {
    if (showContributions) {
      getContributionStatus()
        .then(data => {
          setUserContributions(data);
        })
        .catch(error => {
          console.error("Failed to load contribution history:", error);
        });
    }
  }, [showContributions]);
  
  const toggleContributions = () => {
    setShowContributions(!showContributions);
  };

  return (
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
            onClick={() => setContributionMethod('manual')}
          >
            <span className="icon">📝</span>
            {t('contribution.manualEntry', 'Manual Entry')}
          </button>
          <button 
            className={`method-button ${contributionMethod === 'image' ? 'active' : ''}`}
            onClick={() => setContributionMethod('image')}
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
  const { t } = useTranslation();
  const [formData, setFormData] = useState<RouteContributionType>({
    busName: '',
    busNumber: '',
    fromLocationName: '',
    toLocationName: '',
    departureTime: '',
    arrivalTime: '',
    stops: []
  });
  
  const [currentStop, setCurrentStop] = useState<StopContribution>({
    name: '',
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
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear errors when user types
    if ((name === 'busName' || name === 'busNumber') && errors.busIdentifier) {
      setErrors({ ...errors, busIdentifier: undefined });
    }
    
    if (name === 'fromLocationName' && errors.fromLocation) {
      setErrors({ ...errors, fromLocation: undefined });
    }
    
    if (name === 'toLocationName' && errors.toLocation) {
      setErrors({ ...errors, toLocation: undefined });
    }
    
    if ((name === 'departureTime' || name === 'arrivalTime') && errors.timeRequired) {
      setErrors({ ...errors, timeRequired: undefined });
      
      // Check if departure and arrival times are both present and logical
      if (formData.departureTime && formData.arrivalTime) {
        validateTimesLogic(formData.departureTime, formData.arrivalTime);
      }
    }
  };
  
  // Validate that departure time is before arrival time
  const validateTimesLogic = (departureTime: string, arrivalTime: string) => {
    if (departureTime && arrivalTime) {
      // Convert times to comparable format
      const depParts = departureTime.split(':');
      const arrParts = arrivalTime.split(':');
      
      const depMinutes = parseInt(depParts[0]) * 60 + parseInt(depParts[1]);
      const arrMinutes = parseInt(arrParts[0]) * 60 + parseInt(arrParts[1]);
      
      // Check if departure is after arrival
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
        // Clear the error if times are now valid
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
  
  // Check for duplicate or overlapping locations
  const validateLocationLogic = () => {
    const from = formData.fromLocationName.trim().toLowerCase();
    const to = formData.toLocationName.trim().toLowerCase();
    
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
  
  // Validate that stops are in a logical sequence
  const validateStopsSequence = () => {
    // Skip if there are no stops or just one stop
    if (!formData.stops.length || formData.stops.length < 2) return true;
    
    // If both arrival and departure times are provided for all stops, check sequence
    const stopsWithTimes = formData.stops.filter(stop => stop.arrivalTime && stop.departureTime);
    
    if (stopsWithTimes.length < 2) return true; // Not enough stops with complete times to check
    
    let isValid = true;
    for (let i = 0; i < stopsWithTimes.length - 1; i++) {
      const currentStop = stopsWithTimes[i];
      const nextStop = stopsWithTimes[i + 1];
      
      // Convert times to minutes for comparison
      const currentDepartureTime = currentStop.departureTime.split(':');
      const nextArrivalTime = nextStop.arrivalTime.split(':');
      
      const currentDepartureMinutes = parseInt(currentDepartureTime[0]) * 60 + parseInt(currentDepartureTime[1]);
      const nextArrivalMinutes = parseInt(nextArrivalTime[0]) * 60 + parseInt(nextArrivalTime[1]);
      
      if (currentDepartureMinutes >= nextArrivalMinutes) {
        setErrors({
          ...errors,
          stopsOverlap: t(
            'contribution.stopsSequenceError', 
            'Stop sequence has timing issues. Ensure each stop\'s departure time is before the next stop\'s arrival time.'
          )
        });
        isValid = false;
        break;
      }
    }
    
    if (isValid && errors.stopsOverlap) {
      // Clear error if it's now valid
      setErrors({
        ...errors,
        stopsOverlap: undefined
      });
    }
    
    return isValid;
  };
  
  const handleStopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentStop({ ...currentStop, [name]: value });
    
    // Clear error when user types
    if ((name === 'arrivalTime' || name === 'departureTime') && errors.stopTimeRequired) {
      setErrors({ ...errors, stopTimeRequired: undefined });
    }
  };
  
  const handleAddStop = () => {
    // Validate that the stop has a name and at least one time
    if (!currentStop.name.trim()) {
      setErrors({
        ...errors,
        stopTimeRequired: t(
          'contribution.stopNameRequired',
          'Stop name is required'
        )
      });
      return;
    }
    
    const hasArrivalTime = !!currentStop.arrivalTime;
    const hasDepartureTime = !!currentStop.departureTime;
    
    if (!hasArrivalTime && !hasDepartureTime) {
      setErrors({
        ...errors,
        stopTimeRequired: t(
          'contribution.stopTimeRequired',
          'Please provide either an arrival time or departure time for the stop'
        )
      });
      return;
    }
    
    // Validate that this stop's name isn't the same as origin or destination
    const stopName = currentStop.name.trim().toLowerCase();
    const fromLocation = formData.fromLocationName.trim().toLowerCase();
    const toLocation = formData.toLocationName.trim().toLowerCase();
    
    if ((stopName === fromLocation) || (stopName === toLocation)) {
      setErrors({
        ...errors,
        stopTimeRequired: t(
          'contribution.stopSameAsEndpoint',
          'A stop cannot have the same name as the origin or destination'
        )
      });
      return;
    }
    
    // Check for duplicate stop names
    const stopNames = formData.stops.map(s => s.name.trim().toLowerCase());
    if (stopNames.includes(stopName)) {
      setErrors({
        ...errors,
        stopTimeRequired: t(
          'contribution.duplicateStop',
          'This stop name already exists in your route'
        )
      });
      return;
    }
    
    setErrors({ ...errors, stopTimeRequired: undefined });
    
    // Add the stop to the route with the next order number
    const newStop = { ...currentStop, stopOrder: formData.stops.length + 1 };
    setFormData({
      ...formData,
      stops: [...formData.stops, newStop]
    });
    
    // Reset the stop form
    setCurrentStop({ name: '', arrivalTime: '', departureTime: '', stopOrder: 0 });
  };
  
  const removeStop = (index: number) => {
    const updatedStops = [...formData.stops];
    updatedStops.splice(index, 1);
    
    // Update stop orders
    updatedStops.forEach((stop, idx) => {
      stop.stopOrder = idx + 1;
    });
    
    setFormData({
      ...formData,
      stops: updatedStops
    });
    
    // Validate stop sequence again after removing a stop
    if (errors.stopsOverlap) {
      validateStopsSequence();
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    
    // Validate that at least one bus identifier is provided
    const hasBusName = !!formData.busName.trim();
    const hasBusNumber = !!formData.busNumber.trim();
    
    // Validate that from/to locations are provided
    const hasFromLocation = !!formData.fromLocationName.trim();
    const hasToLocation = !!formData.toLocationName.trim();
    
    // Validate that at least one time is provided
    const hasDepartureTime = !!formData.departureTime;
    const hasArrivalTime = !!formData.arrivalTime;
    
    const newErrors: any = {};
    
    if (!hasBusName && !hasBusNumber) {
      newErrors.busIdentifier = t(
        'contribution.busIdentifierRequired', 
        'Please provide either a bus name or bus number'
      );
    }
    
    if (!hasFromLocation) {
      newErrors.fromLocation = t(
        'contribution.fromLocationRequired', 
        'Origin location is required'
      );
    }
    
    if (!hasToLocation) {
      newErrors.toLocation = t(
        'contribution.toLocationRequired', 
        'Destination location is required'
      );
    }
    
    if (!hasDepartureTime && !hasArrivalTime) {
      newErrors.timeRequired = t(
        'contribution.timeRequired', 
        'Please provide either a departure time or arrival time'
      );
    }
    
    // Check for logical validation only if basic validation passes
    if (Object.keys(newErrors).length === 0) {
      const isLocationsValid = validateLocationLogic();
      const isTimesValid = hasDepartureTime && hasArrivalTime ? 
        validateTimesLogic(formData.departureTime, formData.arrivalTime) : true;
      const isStopsValid = validateStopsSequence();
      
      if (!isLocationsValid || !isTimesValid || !isStopsValid) {
        // Don't submit if any logical validation fails
        return;
      }
    }
    
    // If there are errors, set them and stop submission
    if (Object.keys(newErrors).length > 0) {
      setErrors({...errors, ...newErrors});
      return;
    }
    
    // No errors, proceed with submission
    onSubmit(formData);
  };

  // Define field error highlighting class
  const fieldErrorClass = (errorKey: keyof typeof errors) => {
    return attemptedSubmit && errors[errorKey] ? 'field-error' : '';
  };

  // Check if we have any errors to display
  const hasErrors = Object.values(errors).some(error => error !== undefined);

  return (
    <form className="unified-route-form" onSubmit={handleSubmit}>
      {/* Consolidated error messages section - moved to the top of the form */}
      {attemptedSubmit && hasErrors && (
        <div className="errors-summary">
          <div className="errors-header">
            <span className="error-icon">⚠</span>
            {t('contribution.errorSummary', 'Please correct the following issues:')}
          </div>
          <div className="errors-grid">
            {errors.busIdentifier && (
              <div className="error-category">
                <div className="error-field">{t('contribution.busDetails', 'Bus Details')}</div>
                <div className="error-message">{errors.busIdentifier}</div>
              </div>
            )}
            
            {errors.fromLocation && (
              <div className="error-category">
                <div className="error-field">{t('contribution.origin', 'Origin')}</div>
                <div className="error-message">{errors.fromLocation}</div>
              </div>
            )}
            
            {errors.toLocation && (
              <div className="error-category">
                <div className="error-field">{t('contribution.destination', 'Destination')}</div>
                <div className="error-message">{errors.toLocation}</div>
              </div>
            )}
            
            {errors.timeRequired && (
              <div className="error-category">
                <div className="error-field">{t('contribution.time', 'Timing')}</div>
                <div className="error-message">{errors.timeRequired}</div>
              </div>
            )}
            
            {errors.routeLogic && (
              <div className="error-category">
                <div className="error-field">{t('contribution.routeLogic', 'Route Logic')}</div>
                <div className="error-message">{errors.routeLogic}</div>
              </div>
            )}
            
            {errors.stopTimeRequired && (
              <div className="error-category">
                <div className="error-field">{t('contribution.stop', 'Stop')}</div>
                <div className="error-message">{errors.stopTimeRequired}</div>
              </div>
            )}
            
            {errors.stopsOverlap && (
              <div className="error-category">
                <div className="error-field">{t('contribution.stopSequence', 'Stop Sequence')}</div>
                <div className="error-message">{errors.stopsOverlap}</div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-icon">🚌</span>
          {t('contribution.busDetails', 'Bus Details')}
        </h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="busName">
              {t('contribution.busName', 'Bus Name')}
              <span className="field-hint"> {t('contribution.eitherRequired', '(Either name or number required)')}</span>
            </label>
            <input
              type="text"
              id="busName"
              name="busName"
              value={formData.busName}
              onChange={handleChange}
              placeholder={t('contribution.busNamePlaceholder', 'e.g. SETC Chennai Express')}
              className={fieldErrorClass('busIdentifier')}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="busNumber">
              {t('contribution.busNumber', 'Bus Number')}
              <span className="field-hint"> {t('contribution.eitherRequired', '(Either name or number required)')}</span>
            </label>
            <input
              type="text"
              id="busNumber"
              name="busNumber"
              value={formData.busNumber}
              onChange={handleChange}
              placeholder={t('contribution.busNumberPlaceholder', 'e.g. TN-01-1234')}
              className={fieldErrorClass('busIdentifier')}
            />
          </div>
        </div>
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
              <input
                type="text"
                id="fromLocationName"
                name="fromLocationName"
                value={formData.fromLocationName}
                onChange={handleChange}
                placeholder={t('contribution.fromLocation', 'Origin')}
                className={`route-location-input ${fieldErrorClass('fromLocation')}`}
              />
              <input
                type="time"
                id="departureTime"
                name="departureTime"
                value={formData.departureTime}
                onChange={handleChange}
                className={`time-input ${fieldErrorClass('timeRequired')}`}
              />
            </div>
            
            {formData.stops.length > 0 && (
              <div className="route-stops-container">
                {formData.stops.map((stop, index) => (
                  <div key={index} className="route-stop-point">
                    <div className="location-marker stop-marker"></div>
                    <div className="stop-info">
                      <div className="stop-name">{stop.name}</div>
                      <div className="stop-times">
                        {stop.arrivalTime && <span className="arrival-time">{stop.arrivalTime}</span>}
                        {stop.arrivalTime && stop.departureTime && <span> - </span>}
                        {stop.departureTime && <span className="departure-time">{stop.departureTime}</span>}
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="remove-stop-btn"
                      onClick={() => removeStop(index)}
                      aria-label="Remove stop"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="route-end-point">
              <div className="location-marker destination-marker"></div>
              <input
                type="text"
                id="toLocationName"
                name="toLocationName"
                value={formData.toLocationName}
                onChange={handleChange}
                placeholder={t('contribution.toLocation', 'Destination')}
                className={`route-location-input ${fieldErrorClass('toLocation')}`}
              />
              <input
                type="time"
                id="arrivalTime"
                name="arrivalTime"
                value={formData.arrivalTime}
                onChange={handleChange}
                className={`time-input ${fieldErrorClass('timeRequired')}`}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-icon">🚏</span>
          {t('contribution.addStops', 'Add Stops')}
          <span className="field-hint"> {t('contribution.optional', '(Optional)')}</span>
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
                className={errors.stopTimeRequired ? "field-error" : ""}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="stopArrivalTime">
                {t('contribution.arrivalTime', 'Arrival Time')}
                <span className="field-hint"> {t('contribution.eitherRequired', '(Either required)')}</span>
              </label>
              <input
                type="time"
                id="stopArrivalTime"
                name="arrivalTime"
                value={currentStop.arrivalTime}
                onChange={handleStopChange}
                className={errors.stopTimeRequired && !currentStop.arrivalTime && !currentStop.departureTime ? "field-error" : ""}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="stopDepartureTime">
                {t('contribution.departureTime', 'Departure Time')}
                <span className="field-hint"> {t('contribution.eitherRequired', '(Either required)')}</span>
              </label>
              <input
                type="time"
                id="stopDepartureTime"
                name="departureTime"
                value={currentStop.departureTime}
                onChange={handleStopChange}
                className={errors.stopTimeRequired && !currentStop.arrivalTime && !currentStop.departureTime ? "field-error" : ""}
              />
            </div>
            
            <div className="form-action">
              <button 
                type="button" 
                className="add-stop-btn"
                onClick={handleAddStop}
                disabled={!currentStop.name}
              >
                + {t('contribution.addStop', 'Add Stop')}
              </button>
            </div>
          </div>
        </div>
        
        {formData.stops.length > 0 && (
          <div className="stops-summary">
            <h4>{t('contribution.stopsAdded', 'Stops Added')}: {formData.stops.length}</h4>
          </div>
        )}
      </div>
      
      <div className="form-actions">
        <button 
          type="submit" 
          className="submit-btn"
        >
          {t('contribution.submitRoute', 'Submit Route')}
        </button>
      </div>
    </form>
  );
};

/**
 * Simplified form for uploading bus schedule images
 */
interface SimpleImageUploadFormProps {
  onSubmit: (data: ImageContribution, file: File) => void;
}

const SimpleImageUploadForm: React.FC<SimpleImageUploadFormProps> = ({ onSubmit }) => {
  const { t } = useTranslation();
  // Create a form state with properly typed properties that match our updated ImageContribution type
  const [formData, setFormData] = useState<{
    description: string, 
    busNumber: string
  }>({
    description: '',
    busNumber: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Validate file size (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError(t(
          'contribution.fileTooLarge', 
          'File is too large. Please select an image under 5MB.'
        ));
        return;
      }
      
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        setError(t(
          'contribution.invalidFileType', 
          'Please select a valid image file (JPEG, PNG, etc.)'
        ));
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError(t(
        'contribution.noFileSelected', 
        'Please select an image file to upload'
      ));
      return;
    }
    
    onSubmit(formData, file);
  };

  return (
    <form className="image-form" onSubmit={handleSubmit}>
      {/* Error message at the top for image form */}
      {error && (
        <div className="errors-summary">
          <div className="errors-header">
            <span className="error-icon">⚠</span>
            {t('contribution.errorSummary', 'Please correct the following issues:')}
          </div>
          <div className="errors-grid">
            <div className="error-category">
              <div className="error-field">{t('contribution.image', 'Image')}</div>
              <div className="error-message">{error}</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="form-section expanded">
        <div className="section-header">
          <h3>
            <span className="section-icon">📷</span>
            {t('contribution.uploadSchedule', 'Upload Bus Schedule')}
          </h3>
        </div>
        
        <div className="section-content">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="busNumber">{t('contribution.busNumber', 'Bus Number (if known)')}</label>
              <input
                type="text"
                id="busNumber"
                name="busNumber"
                value={formData.busNumber}
                onChange={handleChange}
                placeholder={t('contribution.busNumberPlaceholder', 'e.g. TN-01-1234')}
              />
            </div>
          </div>
          
          <div className={`file-upload-container ${error ? 'has-error' : ''}`}>
            <input
              type="file"
              id="schedule-image"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input"
            />
            <label htmlFor="schedule-image" className="file-label">
              <span className="upload-icon">📁</span>
              {t('contribution.selectImage', 'Select an image')}
            </label>
            
            {preview && (
              <div className="image-preview-container">
                <img src={preview} alt="Schedule preview" className="image-preview" />
              </div>
            )}
            
            <p className="upload-tip">
              <span className="tip-icon">💡</span>
              {t('contribution.imageTip', 'For best results, ensure the schedule is clearly visible (max 5MB)')}
            </p>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">{t('contribution.description', 'Description (Optional)')}</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('contribution.descriptionPlaceholder', 'Add any details that might help us process this image...')}
              rows={3}
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={!file}
            >
              {t('contribution.submitImage', 'Upload Schedule')}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

// Export both the type and the component
export type { RouteContributionType };
export default RouteContributionComponent;

