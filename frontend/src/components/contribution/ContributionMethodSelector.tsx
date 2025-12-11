import React from "react";
import { useTranslation } from "react-i18next";
import { featureFlags } from "../../config/featureFlags";
import './ContributionMethodSelector.css';

interface ContributionMethodSelectorProps {
  selectedMethod: 'manual' | 'image' | 'voice' | 'paste' | 'verify' | 'addStops' | 'reportIssue';
  onMethodChange: (method: 'manual' | 'image' | 'voice' | 'paste' | 'verify' | 'addStops' | 'reportIssue') => void;
}

export const ContributionMethodSelector: React.FC<ContributionMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange
}) => {
  const { t } = useTranslation();

  const handleKeyDown = (method: 'manual' | 'image' | 'voice' | 'paste' | 'verify' | 'addStops' | 'reportIssue') => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onMethodChange(method);
    }
  };

  return (
    <div className="compact-method-selector">
      <div className="method-chips" aria-label={t('method.selectMethod', 'Select contribution method')}>
        {featureFlags.enableManualContribution && (
          <button 
            className={`method-chip ${selectedMethod === 'manual' ? 'active' : ''}`}
            onClick={() => onMethodChange('manual')}
            onKeyDown={handleKeyDown('manual')}
            aria-pressed={selectedMethod === 'manual'}
            type="button"
          >
            <span className="chip-icon">📝</span>
            <span className="chip-label">{t('method.manual.short', 'Manual')}</span>
            <span className="chip-badge recommended">★</span>
          </button>
        )}

        {featureFlags.enableVoiceContribution && (
          <button 
            className={`method-chip ${selectedMethod === 'voice' ? 'active' : ''}`}
            onClick={() => onMethodChange('voice')}
            onKeyDown={handleKeyDown('voice')}
            aria-pressed={selectedMethod === 'voice'}
            type="button"
          >
            <span className="chip-icon">🎤</span>
            <span className="chip-label">{t('method.voice.short', 'Voice')}</span>
          </button>
        )}

        {featureFlags.enableImageContribution && (
          <button 
            className={`method-chip ${selectedMethod === 'image' ? 'active' : ''}`}
            onClick={() => onMethodChange('image')}
            onKeyDown={handleKeyDown('image')}
            aria-pressed={selectedMethod === 'image'}
            type="button"
          >
            <span className="chip-icon">📷</span>
            <span className="chip-label">{t('method.image.short', 'Upload')}</span>
          </button>
        )}

        {featureFlags.enablePasteContribution && (
          <button 
            className={`method-chip ${selectedMethod === 'paste' ? 'active' : ''}`}
            onClick={() => onMethodChange('paste')}
            onKeyDown={handleKeyDown('paste')}
            aria-pressed={selectedMethod === 'paste'}
            type="button"
          >
            <span className="chip-icon">📋</span>
            <span className="chip-label">{t('method.paste.short', 'Paste')}</span>
            <span className="chip-badge fast">⚡</span>
          </button>
        )}

        {featureFlags.enableRouteVerification && (
          <button 
            className={`method-chip ${selectedMethod === 'verify' ? 'active' : ''}`}
            onClick={() => onMethodChange('verify')}
            onKeyDown={handleKeyDown('verify')}
            aria-pressed={selectedMethod === 'verify'}
            type="button"
          >
            <span className="chip-icon">✅</span>
            <span className="chip-label">{t('method.verify.short', 'Verify')}</span>
          </button>
        )}

        {featureFlags.enableAddStops && (
          <button 
            className={`method-chip ${selectedMethod === 'addStops' ? 'active' : ''}`}
            onClick={() => onMethodChange('addStops')}
            onKeyDown={handleKeyDown('addStops')}
            aria-pressed={selectedMethod === 'addStops'}
            type="button"
          >
            <span className="chip-icon">📍</span>
            <span className="chip-label">{t('method.addStops.short', 'Stops')}</span>
          </button>
        )}

        {featureFlags.enableReportIssue && (
          <button 
            className={`method-chip ${selectedMethod === 'reportIssue' ? 'active' : ''}`}
            onClick={() => onMethodChange('reportIssue')}
            onKeyDown={handleKeyDown('reportIssue')}
            aria-pressed={selectedMethod === 'reportIssue'}
            type="button"
          >
            <span className="chip-icon">🚨</span>
            <span className="chip-label">{t('method.reportIssue.short', 'Report')}</span>
          </button>
        )}
      </div>
    </div>
  );
};