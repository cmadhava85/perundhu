import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { submitRouteContribution, submitImageContribution } from "../services/api";
import AuthService from '../services/authService';
import { SimpleRouteForm } from './forms/SimpleRouteForm';
import ImageContributionUpload from './ImageContributionUpload';
import { ContributionMethodSelector } from './contribution/ContributionMethodSelector';
import { VoiceContributionRecorder } from './contribution/VoiceContributionRecorder';
import { TextPasteContribution } from './contribution/TextPasteContribution';
import { featureFlags } from '../config/featureFlags';
import './RouteContribution.css';

export const RouteContribution: React.FC = () => {
  const { t } = useTranslation();
  
  // Initialize with first available method
  const getDefaultMethod = (): 'manual' | 'image' | 'voice' | 'paste' => {
    if (featureFlags.enableManualContribution) return 'manual';
    if (featureFlags.enablePasteContribution) return 'paste';
    if (featureFlags.enableImageContribution) return 'image';
    if (featureFlags.enableVoiceContribution) return 'voice';
    return 'manual'; // Fallback
  };
  
  const [contributionMethod, setContributionMethod] = useState<'manual' | 'image' | 'voice' | 'paste'>(getDefaultMethod());
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [voiceTranscription, setVoiceTranscription] = useState<string>('');

  // Update selected method if current method becomes disabled
  useEffect(() => {
    const isCurrentMethodEnabled = 
      (contributionMethod === 'manual' && featureFlags.enableManualContribution) ||
      (contributionMethod === 'image' && featureFlags.enableImageContribution) ||
      (contributionMethod === 'voice' && featureFlags.enableVoiceContribution) ||
      (contributionMethod === 'paste' && featureFlags.enablePasteContribution);
    
    if (!isCurrentMethodEnabled) {
      setContributionMethod(getDefaultMethod());
    }
  }, [contributionMethod]);

  const handleSecureSubmission = async (data: any, isImage: boolean) => {
    setSubmissionStatus('submitting');
    try {
      if (isImage) {
        const contributionData = {
          busName: data.busName || 'Unknown Bus',
          busNumber: data.busNumber || 'N/A',
          fromLocationName: data.fromLocationName || 'Unknown',
          toLocationName: data.toLocationName || 'Unknown',
          notes: data.description || 'Route contribution image'
        };
        await submitImageContribution(contributionData, data.file);
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
    } catch (error) {
      console.error('Voice submission error:', error);
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
                onSubmit={(contributionId: string) => {
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
                onSuccess={(contributionId: string) => {
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

