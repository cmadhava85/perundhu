import React from "react";
import { useTranslation } from "react-i18next";
import { useFeatureFlags } from "../../contexts/FeatureFlagsContext";
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
  const { flags } = useFeatureFlags();

  const handleKeyDown = (method: 'manual' | 'image' | 'voice' | 'paste' | 'verify' | 'addStops' | 'reportIssue') => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onMethodChange(method);
    }
  };

  return (
    <div className="compact-method-selector">
      <div className="method-chips" aria-label={t('method.selectMethod', 'Select contribution method')}>
        {flags.enableManualContribution && (
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

        {flags.enableVoiceContribution && (
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

        {flags.enableImageContribution && (
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

        {flags.enablePasteContribution && (
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

        {flags.enableRouteVerification && (
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

        {/* Note: enableAddStops and enableReportIssue are for search result actions, not contribution methods */}
        {/* They should not appear here - they belong on route search result cards */}
      </div>
    </div>
  );
};