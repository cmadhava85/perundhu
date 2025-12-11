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
    <div className="enhanced-method-selector">
      <div className="method-cards" role="radiogroup" aria-label={t('method.selectMethod', 'Select contribution method')}>
        {featureFlags.enableManualContribution && (
          <div 
            className={`method-card ${selectedMethod === 'manual' ? 'active' : ''}`}
            onClick={() => onMethodChange('manual')}
            onKeyDown={handleKeyDown('manual')}
            role="radio"
            aria-checked={selectedMethod === 'manual'}
            tabIndex={0}
          >
            <div className="method-icon-wrapper">
              <div className="method-icon">📝</div>
            </div>
            <h3 className="method-title">{t('method.manual.title', 'Manual Entry')}</h3>
            <p className="method-description">{t('method.manual.desc', 'Fill out detailed route information')}</p>
            <div className="method-badge">{t('badges.recommended', 'Recommended')}</div>
          </div>
        )}

        {featureFlags.enableVoiceContribution && (
          <div 
            className={`method-card ${selectedMethod === 'voice' ? 'active' : ''}`}
            onClick={() => onMethodChange('voice')}
            onKeyDown={handleKeyDown('voice')}
            role="radio"
            aria-checked={selectedMethod === 'voice'}
            tabIndex={0}
          >
            <div className="method-icon-wrapper">
              <div className="method-icon">🎤</div>
            </div>
            <h3 className="method-title">{t('method.voice.title', 'Voice Recording')}</h3>
            <p className="method-description">{t('method.voice.desc', 'Speak route details naturally')}</p>
            <div className="method-badge new">{t('badges.new', 'New!')}</div>
          </div>
        )}

        {featureFlags.enableImageContribution && (
          <div 
            className={`method-card ${selectedMethod === 'image' ? 'active' : ''}`}
            onClick={() => onMethodChange('image')}
            onKeyDown={handleKeyDown('image')}
            role="radio"
            aria-checked={selectedMethod === 'image'}
            tabIndex={0}
          >
            <div className="method-icon-wrapper">
              <div className="method-icon">📷</div>
            </div>
            <h3 className="method-title">{t('method.image.title', 'Upload Schedule')}</h3>
            <p className="method-description">{t('method.image.desc', 'Share photos of official bus schedules')}</p>
            <div className="method-badge secondary">{t('badges.easy', 'Easy')}</div>
          </div>
        )}

        {featureFlags.enablePasteContribution && (
          <div 
            className={`method-card ${selectedMethod === 'paste' ? 'active' : ''}`}
            onClick={() => onMethodChange('paste')}
            onKeyDown={handleKeyDown('paste')}
            role="radio"
            aria-checked={selectedMethod === 'paste'}
            tabIndex={0}
          >
            <div className="method-icon-wrapper">
              <div className="method-icon">📋</div>
            </div>
            <h3 className="method-title">{t('method.paste.title', 'Paste Text')}</h3>
            <p className="method-description">{t('method.paste.desc', 'Copy-paste route info from WhatsApp, Facebook, etc.')}</p>
            <div className="method-badge new">{t('badges.fastest', 'Fastest!')}</div>
          </div>
        )}

        {featureFlags.enableRouteVerification && (
          <div 
            className={`method-card ${selectedMethod === 'verify' ? 'active' : ''}`}
            onClick={() => onMethodChange('verify')}
            onKeyDown={handleKeyDown('verify')}
            role="radio"
            aria-checked={selectedMethod === 'verify'}
            tabIndex={0}
          >
            <div className="method-icon-wrapper">
              <div className="method-icon">✅</div>
            </div>
            <h3 className="method-title">{t('method.verify.title', 'Verify Routes')}</h3>
            <p className="method-description">{t('method.verify.desc', 'Help verify existing route information')}</p>
            <div className="method-badge secondary">{t('badges.helpful', 'Helpful!')}</div>
          </div>
        )}

        {featureFlags.enableAddStops && (
          <div 
            className={`method-card ${selectedMethod === 'addStops' ? 'active' : ''}`}
            onClick={() => onMethodChange('addStops')}
            onKeyDown={handleKeyDown('addStops')}
            role="radio"
            aria-checked={selectedMethod === 'addStops'}
            tabIndex={0}
          >
            <div className="method-icon-wrapper">
              <div className="method-icon">📍</div>
            </div>
            <h3 className="method-title">{t('method.addStops.title', 'Add Stops')}</h3>
            <p className="method-description">{t('method.addStops.desc', 'Add intermediate stops to existing routes')}</p>
            <div className="method-badge new">{t('badges.new', 'New!')}</div>
          </div>
        )}

        {featureFlags.enableReportIssue && (
          <div 
            className={`method-card ${selectedMethod === 'reportIssue' ? 'active' : ''}`}
            onClick={() => onMethodChange('reportIssue')}
            onKeyDown={handleKeyDown('reportIssue')}
            role="radio"
            aria-checked={selectedMethod === 'reportIssue'}
            tabIndex={0}
          >
            <div className="method-icon-wrapper">
              <div className="method-icon">🚨</div>
            </div>
            <h3 className="method-title">{t('method.reportIssue.title', 'Report Issue')}</h3>
            <p className="method-description">{t('method.reportIssue.desc', 'Report wrong timings or discontinued buses')}</p>
            <div className="method-badge warning">{t('badges.important', 'Important!')}</div>
          </div>
        )}
      </div>
    </div>
  );
};