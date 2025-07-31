import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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

/**
 * Component that allows users to contribute bus route information
 * through manual entry or image uploads.
 */
const RouteContributionComponent: React.FC<RouteContributionComponentProps> = ({ userId }) => {
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

  const resetForm = () => {
    setSubmissionStatus('idle');
    setStatusMessage('');
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
    </form>
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

