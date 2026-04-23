import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { submitRouteContribution, submitImageContribution, ApiError } from "../services/api";
import AuthService from '../services/authService';
import { SimpleRouteForm } from './forms/SimpleRouteForm';
import ImageContributionUpload from './ImageContributionUpload';
import { ContributionMethodSelector } from './contribution/ContributionMethodSelector';
import { VoiceContributionRecorder } from './contribution/VoiceContributionRecorder';
import { TextPasteContribution } from './contribution/TextPasteContribution';
import { RouteVerification } from './contribution/RouteVerification';
import { AddStopsToRoute } from './contribution/AddStopsToRoute';
import { ReportIssue } from './contribution/ReportIssue';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext';
import { usePublicFeatureFlags } from '../hooks/usePublicFeatureFlag';
import { useRecaptcha } from '../hooks/useRecaptcha';
import { useLocationData } from '../hooks/useLocationData';
import type { Bus } from '../types';
import './RouteContribution.css';

export const RouteContribution: React.FC = () => {
  const { t } = useTranslation();
  const routerLocation = useLocation();
  const { flags } = useFeatureFlags();
  const { locations } = useLocationData();
  
  // Fetch feature flags from public endpoint for Add Stops and Report Issue
  // These should be publicly available without auth since they're on search results
  const { flags: publicFlags } = usePublicFeatureFlags(['enableAddStops', 'enableReportIssue']);
  const { executeRecaptcha, isConfigured } = useRecaptcha();
  
  // Get pre-selected bus from navigation state (from search results "Add Stops" button)
  const navigationState = routerLocation.state as { 
    selectedBus?: Bus; 
    method?: string;
    fromSearch?: boolean;
    fromLocation?: { id: number; name: string; translatedName?: string; latitude: number; longitude: number };
    toLocation?: { id: number; name: string; translatedName?: string; latitude: number; longitude: number };
  } | null;
  
  // Initialize with first available method
  const getDefaultMethod = (): 'manual' | 'image' | 'voice' | 'paste' | 'verify' | 'addStops' | 'reportIssue' => {
    // If coming from search results with "Add Stops", use addStops method (bypass feature flag)
    if (navigationState?.method === 'add-stops' && navigationState?.fromSearch) {
      return 'addStops';
    }
    // If coming from search results with "Report Issue", use reportIssue method (bypass feature flag)
    if (navigationState?.method === 'report-issue' && navigationState?.fromSearch) {
      return 'reportIssue';
    }
    if (flags.enableManualContribution) return 'manual';
    if (flags.enablePasteContribution) return 'paste';
    if (flags.enableImageContribution) return 'image';
    if (flags.enableVoiceContribution) return 'voice';
    if (flags.enableRouteVerification) return 'verify';
    if (publicFlags.enableAddStops) return 'addStops';
    if (publicFlags.enableReportIssue) return 'reportIssue';
    return 'manual'; // Fallback
  };
  
  const [contributionMethod, setContributionMethod] = useState<'manual' | 'image' | 'voice' | 'paste' | 'verify' | 'addStops' | 'reportIssue'>(getDefaultMethod());
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorType, setErrorType] = useState<'general' | 'duplicate'>('general');
  const [voiceTranscription, setVoiceTranscription] = useState<string>('');
  const [formKey, setFormKey] = useState<number>(0); // Key to force form reset
  // Store pre-selected bus for AddStopsToRoute component
  const preSelectedBus = navigationState?.selectedBus || undefined;
  const preSelectedFromLocation = navigationState?.fromLocation || undefined;
  const preSelectedToLocation = navigationState?.toLocation || undefined;
  
  // Lock body scroll when modal is open
  useEffect(() => {
    if (submissionStatus !== 'idle') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [submissionStatus]);

  // If user came from bus results with Add Stops, disable switching to image/text/paste
  const isAddStopsFromSearch = navigationState?.method === 'add-stops' && navigationState?.fromSearch === true;
  const disabledMethods = isAddStopsFromSearch ? (['image', 'manual', 'paste'] as const) : ([] as const);

  // When navigating from search results with a method, update the contribution method
  useEffect(() => {
    // Bypass feature flag when coming from search results
    if (navigationState?.method === 'add-stops' && navigationState?.fromSearch) {
      setContributionMethod('addStops');
    } else if (navigationState?.method === 'report-issue' && navigationState?.fromSearch) {
      setContributionMethod('reportIssue');
    }
  }, [navigationState]);

  // Update selected method if current method becomes disabled
  // But allow addStops/reportIssue when coming from search results
  useEffect(() => {
    const isFromSearch = navigationState?.fromSearch === true;
    const isCurrentMethodEnabled = 
      (contributionMethod === 'manual' && flags.enableManualContribution) ||
      (contributionMethod === 'image' && flags.enableImageContribution) ||
      (contributionMethod === 'voice' && flags.enableVoiceContribution) ||
      (contributionMethod === 'paste' && flags.enablePasteContribution) ||
      (contributionMethod === 'verify' && flags.enableRouteVerification) ||
      (contributionMethod === 'addStops' && (publicFlags.enableAddStops || isFromSearch)) ||
      (contributionMethod === 'reportIssue' && (publicFlags.enableReportIssue || isFromSearch));
    
    if (!isCurrentMethodEnabled) {
      // Find the first enabled method instead of calling getDefaultMethod
      if (flags.enableManualContribution) setContributionMethod('manual');
      else if (flags.enablePasteContribution) setContributionMethod('paste');
      else if (flags.enableImageContribution) setContributionMethod('image');
      else if (flags.enableVoiceContribution) setContributionMethod('voice');
      else if (flags.enableRouteVerification) setContributionMethod('verify');
      else if (publicFlags.enableAddStops) setContributionMethod('addStops');
      else if (publicFlags.enableReportIssue) setContributionMethod('reportIssue');
      else setContributionMethod('manual');
    }
  }, [
    contributionMethod, 
    navigationState, 
    flags,
    publicFlags
  ]);

  // Clear submission status and messages when switching tabs/methods
  useEffect(() => {
    setSubmissionStatus('idle');
    setStatusMessage('');
    setErrorType('general');
  }, [contributionMethod]);

  interface ContributionData {
    busName?: string;
    busNumber?: string;
    fromLocationName?: string;
    toLocationName?: string;
    departureTime?: string;
    arrivalTime?: string;
    stops?: Array<{ name: string; arrivalTime?: string; departureTime?: string; stopOrder?: number }> | string;
    intermediateStops?: Array<{ name: string; arrivalTime?: string; departureTime?: string; stopOrder?: number }>;
    stopsData?: Array<{ name: string; arrivalTime?: string; departureTime?: string; stopOrder?: number }> | string;
    description?: string;
    file?: File;
  }

  const handleSecureSubmission = async (data: ContributionData, isImage: boolean) => {
    setSubmissionStatus('submitting');
    try {
      // Generate reCAPTCHA token for SUBMIT_CONTRIBUTION action
      const recaptchaToken = isConfigured() ? await executeRecaptcha('SUBMIT_CONTRIBUTION') : null;

      if (isImage && data.file) {
        const contributionData = {
          busName: data.busName || 'Unknown Bus',
          busNumber: data.busNumber || 'N/A',
          fromLocationName: data.fromLocationName || 'Unknown',
          toLocationName: data.toLocationName || 'Unknown',
          notes: data.description || 'Route contribution image'
        };
        await submitImageContribution(contributionData, data.file, recaptchaToken);
      } else if (!isImage) {
        // For non-image contributions, we need to pass the full route data
        // The data should include all required RouteContribution fields
        // Convert intermediate stops to the expected format
        // Prioritize intermediateStops (array), then check if stops is an array
        const stopsArray = data.intermediateStops || (Array.isArray(data.stops) ? data.stops : []);
        const formattedStops = stopsArray.map((stop, index) => ({
            name: stop.name,
            arrivalTime: stop.arrivalTime || '',
            departureTime: stop.departureTime || '',
            stopOrder: stop.stopOrder ?? index + 1
          }));
        
        await submitRouteContribution({
          busName: data.busName || '',
          busNumber: data.busNumber || '',
          fromLocationName: data.fromLocationName || '',
          toLocationName: data.toLocationName || '',
          departureTime: data.departureTime || '',
          arrivalTime: data.arrivalTime || '',
          stops: formattedStops
        }, recaptchaToken);
      }
      setSubmissionStatus('success');
      setStatusMessage(t('contribution.successMessage', 'Thank you for your contribution!'));
    } catch (error) {
      // Check for duplicate submission (409 status)
      if (error instanceof ApiError && error.status === 409) {
        setSubmissionStatus('error');
        setErrorType('duplicate');
        setStatusMessage(
          t('contribution.duplicateErrorMessage', 'This route was already submitted. Please modify the details or try a different route.')
        );
      } else {
        // General submission failure
        setSubmissionStatus('error');
        setErrorType('general');
        setStatusMessage(
          t('contribution.errorMessage', 'Failed to submit contribution. Please try again.')
        );
      }
    }
  };

  const handleVoiceTranscription = async (transcribedText: string, audioBlob: Blob) => {
    // Store transcription for display
    setVoiceTranscription(transcribedText);
    
    // Show transcription in an info box and allow user to review/edit before submitting
    // For now, we'll auto-submit the voice contribution
    setSubmissionStatus('submitting');
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-contribution.webm');
      formData.append('transcribedText', transcribedText);
      formData.append('language', 'auto');
      
      const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${API_URL}/v1/contributions/voice`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Voice contribution failed');
      }
      
      setSubmissionStatus('success');
      setStatusMessage(t('contribution.voice.successMessage', 'Voice contribution submitted successfully!'));
      setVoiceTranscription('');
    } catch (error) {
      // Voice submission failed
      console.error('Voice contribution error:', error);
      setSubmissionStatus('error');
      setErrorType('general');
      setStatusMessage(
        t('contribution.voice.errorMessage', 'Failed to submit voice contribution. Please try again.')
      );
    }
  };

  // Reset form to fresh state for adding a new route
  const handleResetForm = () => {
    setSubmissionStatus('idle');
    setStatusMessage('');
    setErrorType('general');
    setVoiceTranscription('');
    setFormKey(prev => prev + 1); // Increment key to force form remount/reset
  };

  return (
    <div className="premium-contribution-page">
      {/* Enhanced Header */}
      <div className="compact-header enhanced">
        <div className="header-icon-wrapper">
          <span className="header-main-icon">🚌</span>
        </div>
        <div className="header-content-wrapper">
          <div className="header-top">
            <h1 className="header-title">{t('contribution.heroTitleShort', 'Share Route Knowledge')}</h1>
            {!AuthService.isAuthenticated() && (
              <div className="header-welcome">
                <span className="wave-icon">👋</span>
                <span className="welcome-text">{t('welcome.short', 'Guest • No account needed')}</span>
              </div>
            )}
          </div>
          <p className="header-subtitle">
            {t('contribution.subtitle', 'Help travelers by sharing bus routes, timings, and stops. Every contribution makes a difference!')}
          </p>
          <div className="header-benefits">
            <div className="benefit-item">
              <span className="benefit-icon">✅</span>
              <span className="benefit-text">{t('contribution.benefit1', 'Quick & Easy')}</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🎯</span>
              <span className="benefit-text">{t('contribution.benefit2', 'No Login Required')}</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🌟</span>
              <span className="benefit-text">{t('contribution.benefit3', 'Help Fellow Travelers')}</span>
            </div>
          </div>
        </div>
      </div>
      
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

        <ContributionMethodSelector 
          selectedMethod={contributionMethod}
          onMethodChange={setContributionMethod}
          disabledMethods={Array.from(disabledMethods)}
        />
        
        <div className="form-container">
          {contributionMethod === 'manual' && (
            <div>
              <SimpleRouteForm 
                key={formKey}
                onSubmit={(data) => handleSecureSubmission(data, false)}
                locations={locations}
              />
            </div>
          )}
          
          {contributionMethod === 'voice' && (
            <div>
              <VoiceContributionRecorder
                onTranscription={handleVoiceTranscription}
                language="auto"
                maxDuration={120}
              />
              {voiceTranscription && (
                <div className="transcription-preview">
                  <h4>{t('voice.transcription', 'Transcribed Text:')}</h4>
                  <p>{voiceTranscription}</p>
                </div>
              )}
            </div>
          )}
          
          {contributionMethod === 'paste' && (
            <div>
              <TextPasteContribution
                key={formKey}
                onSubmit={(_contributionId: string) => {
                  setSubmissionStatus('success');
                  setStatusMessage(t('contribution.successMessage', 'Thank you for your contribution!'));
                }}
                onError={(error: string) => {
                  setSubmissionStatus('error');
                  setStatusMessage(error);
                }}
              />
            </div>
          )}
          
          {contributionMethod === 'image' && (
            <div>
              <ImageContributionUpload 
                key={formKey}
                onSuccess={(_contributionId: string) => {
                  setSubmissionStatus('success');
                  setStatusMessage(t('contribution.successMessage', 'Thank you for your contribution!'));
                }}
                onError={(error: string) => {
                  setSubmissionStatus('error');
                  setStatusMessage(error);
                }}
                onClearStatus={() => {
                  setSubmissionStatus('idle');
                  setStatusMessage('');
                  setErrorType('general');
                }}
              />
            </div>
          )}
          
          {contributionMethod === 'verify' && (
            <div>
              <RouteVerification
                key={formKey}
                onVerificationSubmit={() => {
                  setSubmissionStatus('success');
                  setStatusMessage(t('contribution.verificationSuccess', 'Thank you for verifying this route!'));
                }}
                onError={(error: string) => {
                  setSubmissionStatus('error');
                  setStatusMessage(error);
                }}
              />
            </div>
          )}
          
          {contributionMethod === 'addStops' && (
            <div>
              <AddStopsToRoute
                key={formKey}
                preSelectedBus={preSelectedBus}
                fromLocation={preSelectedFromLocation}
                toLocation={preSelectedToLocation}
                onSubmit={() => {
                  setSubmissionStatus('success');
                  setStatusMessage(t('contribution.addStopsSuccess', 'Thank you for adding stops to this route!'));
                }}
                onError={(error: string) => {
                  setSubmissionStatus('error');
                  setStatusMessage(error);
                }}
              />
            </div>
          )}
          
          {contributionMethod === 'reportIssue' && (
            <div>
              <ReportIssue
                key={formKey}
                onSubmit={() => {
                  setSubmissionStatus('success');
                  setStatusMessage(t('reportIssue.successMessage', 'Your report has been submitted. We\'ll review and update the information.'));
                }}
                onError={(error: string) => {
                  setSubmissionStatus('error');
                  setStatusMessage(error);
                }}
              />
            </div>
          )}
        </div>
        
      </div>

      {/* ── Status Modal Overlay ── */}
      {submissionStatus !== 'idle' && (
        <div
          className={`status-modal-overlay ${submissionStatus === 'submitting' ? 'non-dismissible' : ''}`}
          onClick={submissionStatus !== 'submitting' ? handleResetForm : undefined}
          role="dialog"
          aria-modal="true"
          aria-live="polite"
          aria-labelledby="contribution-status-title"
        >
          <div
            className={`status-modal ${submissionStatus}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`status-modal-icon ${submissionStatus}`}>
              {submissionStatus === 'submitting' && <span className="modal-spinner" />}
              {submissionStatus === 'success' && '✓'}
              {submissionStatus === 'error' && (errorType === 'duplicate' ? '!' : '✕')}
            </div>

            <h3 className="status-modal-title" id="contribution-status-title">
              {submissionStatus === 'submitting' && t('status.submitting.title', 'Processing Your Contribution')}
              {submissionStatus === 'success' && t('status.success.title', 'Contribution Successful!')}
              {submissionStatus === 'error' && (
                errorType === 'duplicate'
                  ? t('contribution.duplicateErrorTitle', 'Route Already Submitted')
                  : t('status.error.title', 'Submission Failed')
              )}
            </h3>

            <p className="status-modal-message">
              {submissionStatus === 'submitting' && t('status.submitting.message', 'Please wait while we save your route...')}
              {(submissionStatus === 'success' || submissionStatus === 'error') && statusMessage}
            </p>

            {submissionStatus === 'success' && (
              <div className="status-modal-actions">
                <button className="status-modal-btn primary" onClick={handleResetForm}>
                  <span>➕</span>
                  <span>{t('actions.addAnother', 'Add Another Route')}</span>
                </button>
              </div>
            )}

            {submissionStatus === 'error' && (
              <div className="status-modal-actions">
                <button className="status-modal-btn primary" onClick={handleResetForm}>
                  <span>{errorType === 'duplicate' ? '✏️' : '🔄'}</span>
                  <span>{errorType === 'duplicate'
                    ? t('actions.modifyDetails', 'Modify Details')
                    : t('actions.tryAgain', 'Try Again')
                  }</span>
                </button>
              </div>
            )}

            {submissionStatus !== 'submitting' && (
              <button className="status-modal-close" onClick={handleResetForm} aria-label="Close">✕</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteContribution;

