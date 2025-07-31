import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RouteContribution as RouteContributionType, StopContribution } from '../../types';

// Import our new smaller components
import BusDetailsForm from './BusDetailsForm';
import RouteVisualization from './RouteVisualization';
import StopEntryForm from './StopEntryForm';
import FormErrorSummary from './FormErrorSummary';

interface FormError {
  field: string;
  message: string;
}

interface UnifiedRouteFormProps {
  onSubmit: (data: RouteContributionType) => void;
}

/**
 * Refactored UnifiedRouteForm that uses smaller, more manageable components
 */
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
  
  // Track if the form has been submitted once
  const [attemptedSubmit, setAttemptedSubmit] = useState<boolean>(false);
  
  // Enhanced error handling with our new FormError type
  const [errors, setErrors] = useState<{
    busIdentifier?: string;
    fromLocation?: string;
    toLocation?: string;
    timeRequired?: string;
    stopTimeRequired?: string;
    stopsOverlap?: string;
    routeLogic?: string;
  }>({});

  // Convert errors object to our FormError array for the FormErrorSummary component
  const getFormattedErrors = (): FormError[] => {
    const result: FormError[] = [];
    
    if (errors.busIdentifier) {
      result.push({
        field: t('contribution.busDetails', 'Bus Details'),
        message: errors.busIdentifier
      });
    }
    
    if (errors.fromLocation) {
      result.push({
        field: t('contribution.origin', 'Origin'),
        message: errors.fromLocation
      });
    }
    
    if (errors.toLocation) {
      result.push({
        field: t('contribution.destination', 'Destination'),
        message: errors.toLocation
      });
    }
    
    if (errors.timeRequired) {
      result.push({
        field: t('contribution.time', 'Timing'),
        message: errors.timeRequired
      });
    }
    
    if (errors.routeLogic) {
      result.push({
        field: t('contribution.routeLogic', 'Route Logic'),
        message: errors.routeLogic
      });
    }
    
    if (errors.stopTimeRequired) {
      result.push({
        field: t('contribution.stop', 'Stop'),
        message: errors.stopTimeRequired
      });
    }
    
    if (errors.stopsOverlap) {
      result.push({
        field: t('contribution.stopSequence', 'Stop Sequence'),
        message: errors.stopsOverlap
      });
    }
    
    return result;
  };
  
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
  
  const handleStopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentStop({ ...currentStop, [name]: value });
    
    // Clear error when user types
    if ((name === 'arrivalTime' || name === 'departureTime') && errors.stopTimeRequired) {
      setErrors({ ...errors, stopTimeRequired: undefined });
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

  return (
    <form className="unified-route-form" onSubmit={handleSubmit}>
      {/* Form Error Summary component */}
      <FormErrorSummary 
        errors={getFormattedErrors()} 
        show={attemptedSubmit}
      />
      
      {/* Bus Details Form component */}
      <BusDetailsForm 
        busName={formData.busName}
        busNumber={formData.busNumber}
        onChange={handleChange}
        hasError={!!errors.busIdentifier && attemptedSubmit}
      />
      
      {/* Route Information Section */}
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-icon">🗺️</span>
          {t('contribution.routeDetails', 'Route Information')}
        </h3>
        
        {/* Route Visualization component */}
        <RouteVisualization 
          fromLocation={formData.fromLocationName}
          toLocation={formData.toLocationName}
          departureTime={formData.departureTime}
          arrivalTime={formData.arrivalTime}
          stops={formData.stops}
          onChangeFrom={handleChange}
          onChangeTo={handleChange}
          onChangeTimes={handleChange}
          onRemoveStop={removeStop}
          fromError={!!errors.fromLocation && attemptedSubmit}
          toError={!!errors.toLocation && attemptedSubmit}
          timeError={!!errors.timeRequired && attemptedSubmit}
        />
      </div>
      
      {/* Stops Section */}
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-icon">🚏</span>
          {t('contribution.addStops', 'Add Stops')}
          <span className="field-hint"> {t('contribution.optional', '(Optional)')}</span>
        </h3>
        
        <p className="section-description">
          {t('contribution.stopsDescription', 'If you know intermediate stops on this route, you can add them here. This information is optional but very helpful.')}
        </p>
        
        {/* Stop Entry Form component */}
        <StopEntryForm 
          currentStop={currentStop}
          onChange={handleStopChange}
          onAddStop={handleAddStop}
          error={errors.stopTimeRequired}
        />
        
        {formData.stops.length > 0 && (
          <div className="stops-summary">
            <h4>{t('contribution.stopsAdded', 'Stops Added')}: {formData.stops.length}</h4>
          </div>
        )}
      </div>
      
      {/* Submit Button */}
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

export default UnifiedRouteForm;