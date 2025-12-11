import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { submitRouteContribution, submitImageContribution } from "../services/api";
import AuthService from '../services/authService';
import { SimpleRouteForm } from './forms/SimpleRouteForm';
import ImageContributionUpload from './ImageContributionUpload';
import { ContributionMethodSelector } from './contribution/ContributionMethodSelector';
import { VoiceContributionRecorder } from './contribution/VoiceContributionRecorder';
import { TextPasteContribution } from './contribution/TextPasteContribution';
import { RouteVerification } from './contribution/RouteVerification';
import { AddStopsToRoute } from './contribution/AddStopsToRoute';
import { ReportIssue } from './contribution/ReportIssue';
import { featureFlags } from '../config/featureFlags';
import type { Bus } from '../types';
import './RouteContribution.css';

export const RouteContribution: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  
  // Get pre-selected bus from navigation state (from search results "Add Stops" button)
  const navigationState = location.state as { 
    selectedBus?: Bus; 
    method?: string;
    fromSearch?: boolean;
  } | null;
  
  // Initialize with first available method
  const getDefaultMethod = (): 'manual' | 'image' | 'voice' | 'paste' | 'verify' | 'addStops' | 'reportIssue' => {
    // If coming from search results with "Add Stops", use addStops method
    if (navigationState?.method === 'add-stops' && featureFlags.enableAddStops) {
      return 'addStops';
    }
    if (navigationState?.method === 'report-issue' && featureFlags.enableReportIssue) {
      return 'reportIssue';
    }
    if (featureFlags.enableManualContribution) return 'manual';
    if (featureFlags.enablePasteContribution) return 'paste';
    if (featureFlags.enableImageContribution) return 'image';
    if (featureFlags.enableVoiceContribution) return 'voice';
    if (featureFlags.enableRouteVerification) return 'verify';
    if (featureFlags.enableAddStops) return 'addStops';
    if (featureFlags.enableReportIssue) return 'reportIssue';
    return 'manual'; // Fallback
  };
  
  const [contributionMethod, setContributionMethod] = useState<'manual' | 'image' | 'voice' | 'paste' | 'verify' | 'addStops' | 'reportIssue'>(getDefaultMethod());
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [voiceTranscription, setVoiceTranscription] = useState<string>('');
  
  // Store pre-selected bus for AddStopsToRoute component
  const preSelectedBus = navigationState?.selectedBus || undefined;

  // Update selected method if current method becomes disabled
  useEffect(() => {
    const isCurrentMethodEnabled = 
      (contributionMethod === 'manual' && featureFlags.enableManualContribution) ||
      (contributionMethod === 'image' && featureFlags.enableImageContribution) ||
      (contributionMethod === 'voice' && featureFlags.enableVoiceContribution) ||
      (contributionMethod === 'paste' && featureFlags.enablePasteContribution) ||
      (contributionMethod === 'verify' && featureFlags.enableRouteVerification) ||
      (contributionMethod === 'addStops' && featureFlags.enableAddStops) ||
      (contributionMethod === 'reportIssue' && featureFlags.enableReportIssue);
    
    if (!isCurrentMethodEnabled) {
      setContributionMethod(getDefaultMethod());
    }
  }, [contributionMethod]);

  interface ContributionData {
    busName?: string;
    busNumber?: string;
    fromLocationName?: string;
    toLocationName?: string;
    description?: string;
    file?: File;
  }

  const handleSecureSubmission = async (data: ContributionData, isImage: boolean) => {
    setSubmissionStatus('submitting');
    try {
      if (isImage && data.file) {
        const contributionData = {
          busName: data.busName || 'Unknown Bus',
          busNumber: data.busNumber || 'N/A',
          fromLocationName: data.fromLocationName || 'Unknown',
          toLocationName: data.toLocationName || 'Unknown',
          notes: data.description || 'Route contribution image'
        };
        await submitImageContribution(contributionData, data.file);
      } else if (!isImage) {
        // For non-image contributions, we need to pass the full route data
        // The data should include all required RouteContribution fields
        await submitRouteContribution({
          busName: data.busName || '',
          busNumber: data.busNumber || '',
          fromLocationName: data.fromLocationName || '',
          toLocationName: data.toLocationName || '',
          departureTime: '',
          arrivalTime: '',
          stops: []
        });
      }
      setSubmissionStatus('success');
      setStatusMessage(t('contribution.successMessage', 'Thank you for your contribution!'));
    } catch (_error) {
      // Submission failed
      setSubmissionStatus('error');
      setStatusMessage(
        t('contribution.errorMessage', 'Failed to submit contribution. Please try again.')
      );
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
      
      const response = await fetch('/api/v1/contributions/voice', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Voice contribution failed');
      }
      
      setSubmissionStatus('success');
      setStatusMessage(t('contribution.voice.successMessage', 'Voice contribution submitted successfully!'));
      setVoiceTranscription('');
    } catch (_error) {
      // Voice submission failed
      setSubmissionStatus('error');
      setStatusMessage(
        t('contribution.voice.errorMessage', 'Failed to submit voice contribution. Please try again.')
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

        <ContributionMethodSelector 
          selectedMethod={contributionMethod}
          onMethodChange={setContributionMethod}
        />
        
        <div className="form-container">
          {contributionMethod === 'manual' && (
            <div>
              <SimpleRouteForm 
                onSubmit={(data) => handleSecureSubmission(data, false)} 
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
                onSuccess={(_contributionId: string) => {
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
          
          {contributionMethod === 'verify' && (
            <div>
              <RouteVerification
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
                preSelectedBus={preSelectedBus}
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

