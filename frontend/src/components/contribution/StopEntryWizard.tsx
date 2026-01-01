import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { StopEntry } from './AddStopsToRoute';
import './StopEntryWizard.css';

interface StopEntryWizardProps {
  stopIndex: number;
  totalStops: number;
  initialStop?: StopEntry;
  onComplete: (stop: StopEntry) => void;
  onCancel: () => void;
  onAddAnother?: (stop: StopEntry) => void;
}

type WizardStep = 'name' | 'arrival' | 'departure' | 'notes' | 'review';

const StopEntryWizard: React.FC<StopEntryWizardProps> = ({
  stopIndex,
  totalStops,
  initialStop,
  onComplete,
  onCancel,
  onAddAnother
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<WizardStep>('name');
  const [formData, setFormData] = useState<StopEntry>(
    initialStop || {
      locationName: '',
      arrivalTime: '',
      departureTime: '',
      order: stopIndex + 1
    }
  );

  const steps: WizardStep[] = ['name', 'arrival', 'departure', 'notes', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    // Validation
    if (currentStep === 'name' && !formData.locationName.trim()) {
      alert(t('addStops.enterStopName', 'Please enter a stop name'));
      return;
    }
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const handleSubmit = () => {
    onComplete(formData);
  };

  const handleAddAnother = () => {
    if (onAddAnother) {
      onAddAnother(formData);
    }
  };

  return (
    <div className="stop-entry-wizard">
      {/* Header with Progress */}
      <div className="wizard-header">
        <div className="step-counter">
          <span className="current">{stopIndex + 1}</span>
          <span className="total">of {totalStops}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <button className="close-btn" onClick={onCancel} aria-label="Close">
          ✕
        </button>
      </div>

      {/* Main Content */}
      <div className="wizard-content">
        {/* Step 1: Stop Name */}
        {currentStep === 'name' && (
          <div className="wizard-step">
            <div className="step-icon">📍</div>
            <h2>{t('addStops.enterStopName', 'Enter Stop Name')}</h2>
            <p className="step-description">
              {t('addStops.stopNameHint', 'What is the name of this bus stop?')}
            </p>
            <input
              type="text"
              placeholder={t('addStops.stopNamePlaceholder', 'e.g., Central Metro Station')}
              value={formData.locationName}
              onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
              autoFocus
              className="wizard-input"
            />
          </div>
        )}

        {/* Step 2: Arrival Time */}
        {currentStep === 'arrival' && (
          <div className="wizard-step">
            <div className="step-icon">🕐</div>
            <h2>{t('addStops.arrivalTime', 'Arrival Time')}</h2>
            <p className="step-description">
              {t('addStops.arrivalTimeHint', 'When does the bus arrive at this stop?')}
            </p>
            <input
              type="time"
              value={formData.arrivalTime}
              onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
              autoFocus
              className="wizard-input"
            />
            <div className="step-note">
              {t('addStops.timeOptional', 'You can skip this if not known')}
            </div>
          </div>
        )}

        {/* Step 3: Departure Time */}
        {currentStep === 'departure' && (
          <div className="wizard-step">
            <div className="step-icon">🚌</div>
            <h2>{t('addStops.departureTime', 'Departure Time')}</h2>
            <p className="step-description">
              {t('addStops.departureTimeHint', 'When does the bus leave this stop?')}
            </p>
            <input
              type="time"
              value={formData.departureTime}
              onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
              autoFocus
              className="wizard-input"
            />
            <div className="step-note">
              {t('addStops.timeOptional', 'At least arrival or departure time is required')}
            </div>
          </div>
        )}

        {/* Step 4: Notes (Optional) */}
        {currentStep === 'notes' && (
          <div className="wizard-step">
            <div className="step-icon">📝</div>
            <h2>{t('addStops.notes', 'Additional Notes')}</h2>
            <p className="step-description">
              {t('addStops.notesHint', 'Any additional information about this stop?')}
            </p>
            <textarea
              placeholder={t('addStops.notesPlaceholder', 'e.g., Platform 2, Main entrance')}
              className="wizard-textarea"
              rows={3}
            />
            <div className="step-note">
              {t('addStops.notesOptional', 'This is optional')}
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 'review' && (
          <div className="wizard-step">
            <div className="step-icon">✓</div>
            <h2>{t('addStops.reviewStop', 'Review Stop Details')}</h2>
            <p className="step-description">
              {t('addStops.reviewHint', 'Please review the information before adding')}
            </p>
            <div className="review-card">
              <div className="review-item">
                <label>📍 Stop Name</label>
                <div className="review-value">{formData.locationName}</div>
              </div>
              {formData.arrivalTime && (
                <div className="review-item">
                  <label>🕐 Arrival Time</label>
                  <div className="review-value">{formData.arrivalTime}</div>
                </div>
              )}
              {formData.departureTime && (
                <div className="review-item">
                  <label>🚌 Departure Time</label>
                  <div className="review-value">{formData.departureTime}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer with Navigation */}
      <div className="wizard-footer">
        <button
          className="btn-secondary"
          onClick={currentStep === 'review' ? onCancel : handleBack}
          disabled={currentStepIndex === 0}
        >
          {currentStep === 'review' ? t('common.cancel', 'Cancel') : t('common.back', 'Back')}
        </button>

        {currentStep !== 'review' && (
          <button className="btn-primary" onClick={handleNext}>
            {t('common.next', 'Next')} →
          </button>
        )}

        {currentStep === 'review' && (
          <div className="button-group">
            <button className="btn-secondary" onClick={handleAddAnother}>
              {t('addStops.addAnother', 'Add Another')}
            </button>
            <button className="btn-success" onClick={handleSubmit}>
              {t('addStops.done', 'Done')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StopEntryWizard;
