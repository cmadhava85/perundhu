import React from "react";
import { useTranslation } from "react-i18next";
import { useFeatureFlags } from "../../contexts/FeatureFlagsContext";
import './ContributionMethodSelector.css';

type ContributionMethod = 'manual' | 'image' | 'voice' | 'paste' | 'verify' | 'addStops' | 'reportIssue';

interface ContributionMethodSelectorProps {
  selectedMethod: ContributionMethod;
  onMethodChange: (method: ContributionMethod) => void;
}

export const ContributionMethodSelector: React.FC<ContributionMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange
}) => {
  const { t } = useTranslation();
  const { flags } = useFeatureFlags();

  const handleKeyDown = (method: ContributionMethod) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onMethodChange(method);
    }
  };

  return (
    <div className="compact-method-selector">
      <div className="method-chips" aria-label={t('method.selectMethod', 'Select contribution method')}>
        {flags.enableImageContribution && (
          <button 
            className={`method-chip ${selectedMethod === 'image' ? 'active' : ''}`}
            onClick={() => onMethodChange('image')}
            onKeyDown={handleKeyDown('image')}
            aria-pressed={selectedMethod === 'image'}
            type="button"
            title={t('method.image.title', 'Upload an image of the bus schedule')}
          >
            <span className="chip-icon">📸</span>
            <span className="chip-label">{t('method.image.label', 'Image')}</span>
          </button>
        )}

        {flags.enableVoiceContribution && (
          <button 
            className={`method-chip ${selectedMethod === 'voice' ? 'active' : ''}`}
            onClick={() => onMethodChange('voice')}
            onKeyDown={handleKeyDown('voice')}
            aria-pressed={selectedMethod === 'voice'}
            type="button"
            title={t('method.voice.title', 'Record voice contribution')}
          >
            <span className="chip-icon">🎤</span>
            <span className="chip-label">{t('method.voice.label', 'Voice')}</span>
          </button>
        )}

        {flags.enableManualContribution && (
          <button 
            className={`method-chip ${selectedMethod === 'manual' ? 'active' : ''}`}
            onClick={() => onMethodChange('manual')}
            onKeyDown={handleKeyDown('manual')}
            aria-pressed={selectedMethod === 'manual'}
            type="button"
            title={t('method.manual.title', 'Manually enter route information')}
          >
            <span className="chip-icon">✍️</span>
            <span className="chip-label">{t('method.text.label', 'Text')}</span>
          </button>
        )}

        {flags.enablePasteContribution && (
          <button 
            className={`method-chip ${selectedMethod === 'paste' ? 'active' : ''}`}
            onClick={() => onMethodChange('paste')}
            onKeyDown={handleKeyDown('paste')}
            aria-pressed={selectedMethod === 'paste'}
            type="button"
            title={t('method.paste.title', 'Paste route information')}
          >
            <span className="chip-icon">📋</span>
            <span className="chip-label">{t('method.paste.label', 'Paste')}</span>
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
            title={t('method.verify.title', 'Verify existing route information')}
          >
            <span className="chip-icon">✅</span>
            <span className="chip-label">{t('method.verify.label', 'Verify')}</span>
          </button>
        )}

        {/* Note: enableAddStops and enableReportIssue are for search result actions, not contribution methods */}
        {/* They should not appear here - they belong on route search result cards */}
      </div>
    </div>
  );
};