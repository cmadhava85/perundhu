import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { submitRouteContribution, submitImageContribution } from "../services/api";
import AuthService from '../services/authService';
import './RouteContribution.css';

/**
 * Simple route form component for manual entry
 */
const SimpleRouteForm: React.FC<{ onSubmit: (data: any) => void }> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    busNumber: '',
    route: '',
    origin: '',
    destination: '',
    stops: '',
    operatingHours: '',
    departureTime: '',
    arrivalTime: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const enhancedData = {
      ...formData,
      fromLocationName: formData.origin || 'Unknown Origin',
      toLocationName: formData.destination || 'Unknown Destination',
      busName: formData.route || formData.busNumber || 'Unknown Bus'
    };
    
    onSubmit(enhancedData);
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

  return (
    <form onSubmit={handleSubmit} className="route-form">
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
          className="modern-input"
          placeholder="e.g., 27D, 570, MTC-123"
        />
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
          className="modern-input"
          placeholder="e.g., Chennai Central - Tambaram Express"
        />
        <span className="field-hint">Enter the route name OR bus number above</span>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="origin">
            <span className="field-icon">📍</span>
            {t('route.origin', 'Origin')}
          </label>
          <input
            type="text"
            id="origin"
            name="origin"
            value={formData.origin}
            onChange={handleChange}
            className="modern-input"
            placeholder={t('route.originPlaceholder', 'e.g., Chennai Central')}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="destination">
            <span className="field-icon">🎯</span>
            {t('route.destination', 'Destination')}
          </label>
          <input
            type="text"
            id="destination"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            className="modern-input"
            placeholder={t('route.destinationPlaceholder', 'e.g., Madurai')}
            required
          />
        </div>
      </div>
      
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

export const RouteContribution: React.FC = () => {
  const { t } = useTranslation();
  const [contributionMethod, setContributionMethod] = useState<'manual' | 'image'>('manual');
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleSecureSubmission = async (data: any, isImage: boolean) => {
    setSubmissionStatus('submitting');
    try {
      if (isImage) {
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

  return (
    <div className="premium-contribution-page">
      <div className="contribution-hero">
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
        </div>
      </div>

      {!AuthService.isAuthenticated() && (
        <div className="welcome-card">
          <div className="welcome-content">
            <div className="welcome-icon">👋</div>
            <div className="welcome-text">
              <h3 className="welcome-title">{t('welcome.title', 'Welcome, Guest!')}</h3>
              <p className="welcome-message">{t('welcome.message', 'No account needed! Start contributing right away.')}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="premium-contribution-card">
        <div className="card-header">
          <div className="header-content">
            <h2 className="card-title">
              <span className="title-icon">📝</span>
              {t('contribution.cardTitle', 'Add Route Information')}
            </h2>
            <p className="card-subtitle">{t('contribution.cardSubtitle', 'Choose your preferred method to contribute')}</p>
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
              <p className="method-description">{t('method.manual.desc', 'Fill out detailed route information')}</p>
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
              <p className="method-description">{t('method.image.desc', 'Share photos of official bus schedules')}</p>
              <div className="method-badge secondary">{t('badges.easy', 'Easy')}</div>
            </div>
          </div>
        </div>
        
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
        
        {submissionStatus === 'submitting' && (
          <div className="premium-status submitting">
            <div className="status-content">
              <h3 className="status-title">{t('status.submitting.title', 'Processing Your Contribution')}</h3>
              <p className="status-message">{t('status.submitting.message', 'Please wait...')}</p>
            </div>
          </div>
        )}
        
        {submissionStatus === 'success' && (
          <div className="premium-status success">
            <div className="status-content">
              <h3 className="status-title">{t('status.success.title', 'Contribution Successful!')}</h3>
              <p className="status-message">{statusMessage}</p>
              <div className="success-actions">
                <button className="action-btn primary" onClick={() => setSubmissionStatus('idle')}>
                  <span className="btn-icon">➕</span>
                  <span>{t('actions.addAnother', 'Add Another Route')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {submissionStatus === 'error' && (
          <div className="premium-status error">
            <div className="status-content">
              <h3 className="status-title">{t('status.error.title', 'Submission Failed')}</h3>
              <p className="status-message">{statusMessage}</p>
              <div className="error-actions">
                <button className="action-btn primary" onClick={() => setSubmissionStatus('idle')}>
                  <span className="btn-icon">🔄</span>
                  <span>{t('actions.tryAgain', 'Try Again')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteContribution;

