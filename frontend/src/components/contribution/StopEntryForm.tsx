import React from 'react';
import { useTranslation } from 'react-i18next';
import type { StopContribution } from '../../types';
import LocationAutocompleteInput from '../LocationAutocompleteInput';

interface StopEntryFormProps {
  currentStop: StopContribution;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddStop: () => void;
  error?: string;
}

/**
 * Form component for adding individual stops to a route
 */
const StopEntryForm: React.FC<StopEntryFormProps> = ({
  currentStop,
  onChange,
  onAddStop,
  error
}) => {
  const { t } = useTranslation();

  // Handle stop name change from autocomplete
  const handleStopNameChange = (value: string, _location?: unknown) => {
    // Create a synthetic event that mimics the standard input onChange event
    const syntheticEvent = {
      target: {
        name: 'name',
        value: value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
  };

  return (
    <div className="add-stop-form">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="stopName">
            {t('contribution.stopName', 'Stop Name')} *
            <span className="field-hint">{t('contribution.stopNameHint', 'Name of the bus stop or location')}</span>
          </label>
          <LocationAutocompleteInput
            id="stopName"
            name="name"
            value={currentStop.name}
            onChange={handleStopNameChange}
            placeholder={t('contribution.stopNamePlaceholder', 'e.g. Vellore Bus Stand')}
            required={true}
          />
          {error && <div className="field-error-text">{error}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="stopArrivalTime">
            {t('contribution.arrivalTime', 'Arrival Time')}
            <span className="field-hint">{t('contribution.arrivalTimeHint', 'When bus arrives at this stop')}</span>
          </label>
          <input
            type="time"
            id="stopArrivalTime"
            name="arrivalTime"
            value={currentStop.arrivalTime}
            onChange={onChange}
            className={error && !currentStop.arrivalTime && !currentStop.departureTime ? "field-error" : ""}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="stopDepartureTime">
            {t('contribution.departureTime', 'Departure Time')}
            <span className="field-hint">{t('contribution.departureTimeHint', 'When bus leaves this stop')}</span>
          </label>
          <input
            type="time"
            id="stopDepartureTime"
            name="departureTime"
            value={currentStop.departureTime}
            onChange={onChange}
            className={error && !currentStop.arrivalTime && !currentStop.departureTime ? "field-error" : ""}
          />
        </div>
        
        <div className="form-action">
          <button 
            type="button" 
            className="add-stop-btn"
            onClick={onAddStop}
            disabled={!currentStop.name.trim()}
            title={currentStop.name.trim() ? t('contribution.addThisStop', 'Add this stop to the route') : t('contribution.enterStopName', 'Enter stop name first')}
          >
            + {t('contribution.addStop', 'Add Stop')}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="field-error-message">
          {error}
        </div>
      )}
      
      <div className="stop-timing-note">
        <span className="note-icon">💡</span>
        <span className="note-text">
          {t('contribution.stopTimingNote', 'Provide at least one time (arrival or departure). Both times help users plan better!')}
        </span>
      </div>
    </div>
  );
};

export default StopEntryForm;