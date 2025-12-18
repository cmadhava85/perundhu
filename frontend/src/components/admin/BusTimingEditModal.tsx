import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Clock, Save, AlertTriangle } from 'lucide-react';
import BusDatabaseService from '../../services/busDatabaseService';
import type { BusListItem } from '../../services/busDatabaseService';
import {
  validateTimeFormat,
  validateArrivalAfterDeparture
} from '../../utils/validationService';
import './BusTimingEditModal.css';

interface BusTimingEditModalProps {
  bus: BusListItem;
  onClose: () => void;
  onSave: () => void;
}

/**
 * Modal for editing bus departure and arrival times
 */
const BusTimingEditModal: React.FC<BusTimingEditModalProps> = ({ bus, onClose, onSave }) => {
  const { t } = useTranslation();
  
  const [departureTime, setDepartureTime] = useState(bus.departureTime || '');
  const [arrivalTime, setArrivalTime] = useState(bus.arrivalTime || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    departureTime?: string;
    arrivalTime?: string;
  }>({});
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Validate times when they change
  const validateTimes = (departure: string, arrival: string): boolean => {
    const errors: { departureTime?: string; arrivalTime?: string } = {};
    let warning: string | null = null;
    
    // Validate departure time format
    if (departure) {
      const depValidation = validateTimeFormat(departure);
      if (!depValidation.valid) {
        errors.departureTime = depValidation.message || 'Invalid time format';
      }
    }
    
    // Validate arrival time format
    if (arrival) {
      const arrValidation = validateTimeFormat(arrival);
      if (!arrValidation.valid) {
        errors.arrivalTime = arrValidation.message || 'Invalid time format';
      }
    }
    
    // Check arrival is after departure
    if (departure && arrival && !errors.departureTime && !errors.arrivalTime) {
      const arrivalCheck = validateArrivalAfterDeparture(departure, arrival);
      if (!arrivalCheck.valid) {
        errors.arrivalTime = arrivalCheck.message || 'Arrival must be after departure';
      } else if (arrivalCheck.severity === 'warning') {
        // Overnight journey warning
        warning = arrivalCheck.message || 'This appears to be an overnight journey';
      }
    }
    
    setValidationErrors(errors);
    setValidationWarning(warning);
    return Object.keys(errors).length === 0;
  };

  const handleDepartureChange = (value: string) => {
    setDepartureTime(value);
    validateTimes(value, arrivalTime);
  };

  const handleArrivalChange = (value: string) => {
    setArrivalTime(value);
    validateTimes(departureTime, value);
  };

  const handleSave = async () => {
    if (!departureTime && !arrivalTime) {
      setError(t('admin.timing.errorNoTime', 'Please provide at least one time value'));
      return;
    }
    
    // Run validation before saving
    if (!validateTimes(departureTime, arrivalTime)) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      await BusDatabaseService.updateBusTiming(
        bus.id,
        departureTime || undefined,
        arrivalTime || undefined
      );
      
      onSave();
    } catch (err) {
      console.error('Failed to update timing:', err);
      setError(t('admin.timing.errorSave', 'Failed to update timing. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="timing-modal-overlay" onClick={handleBackdropClick}>
      <div className="timing-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-content">
            <h3 className="modal-title">
              <Clock size={20} />
              {t('admin.timing.title', 'Edit Bus Timing')}
            </h3>
            <p className="modal-subtitle">
              {bus.busNumber}: {bus.origin} → {bus.destination}
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="modal-error">
            {error}
          </div>
        )}
        
        {validationWarning && (
          <div className="modal-warning">
            <AlertTriangle size={16} />
            {validationWarning}
          </div>
        )}

        <div className="modal-content">
          <div className="timing-form">
            <div className="form-group">
              <label htmlFor="departure-time">
                <Clock size={14} />
                {t('admin.timing.departure', 'Departure Time')}
              </label>
              <input
                type="time"
                id="departure-time"
                value={departureTime}
                onChange={(e) => handleDepartureChange(e.target.value)}
                className={`time-input ${validationErrors.departureTime ? 'input-error' : ''}`}
              />
              {validationErrors.departureTime && (
                <span className="error-text">{validationErrors.departureTime}</span>
              )}
              {!bus.departureTime && (
                <span className="warning-text">
                  ⚠️ {t('admin.timing.currentlyMissing', 'Currently missing')}
                </span>
              )}
              {bus.departureTime && (
                <span className="current-value">
                  {t('admin.timing.current', 'Current')}: {bus.departureTime}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="arrival-time">
                <Clock size={14} />
                {t('admin.timing.arrival', 'Arrival Time')}
              </label>
              <input
                type="time"
                id="arrival-time"
                value={arrivalTime}
                onChange={(e) => handleArrivalChange(e.target.value)}
                className={`time-input ${validationErrors.arrivalTime ? 'input-error' : ''}`}
              />
              {validationErrors.arrivalTime && (
                <span className="error-text">{validationErrors.arrivalTime}</span>
              )}
              {!bus.arrivalTime && !validationErrors.arrivalTime && (
                <span className="warning-text">
                  ⚠️ {t('admin.timing.currentlyMissing', 'Currently missing')}
                </span>
              )}
              {bus.arrivalTime && !validationErrors.arrivalTime && (
                <span className="current-value">
                  {t('admin.timing.current', 'Current')}: {bus.arrivalTime}
                </span>
              )}
            </div>
          </div>

          <div className="timing-preview">
            <h4>{t('admin.timing.preview', 'Preview')}</h4>
            <div className="preview-content">
              <div className="preview-item">
                <span className="label">{t('admin.timing.departure', 'Departure')}:</span>
                <span className={`value ${departureTime ? '' : 'missing'}`}>
                  {departureTime || t('admin.timing.notSet', 'Not set')}
                </span>
              </div>
              <div className="preview-arrow">→</div>
              <div className="preview-item">
                <span className="label">{t('admin.timing.arrival', 'Arrival')}:</span>
                <span className={`value ${arrivalTime ? '' : 'missing'}`}>
                  {arrivalTime || t('admin.timing.notSet', 'Not set')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            {t('admin.timing.cancel', 'Cancel')}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={saving || (!departureTime && !arrivalTime)}
          >
            <Save size={14} />
            {saving 
              ? t('admin.timing.saving', 'Saving...') 
              : t('admin.timing.save', 'Save Changes')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusTimingEditModal;
