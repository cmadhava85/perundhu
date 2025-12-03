import React from "react";
import { useTranslation } from "react-i18next";
import { featureFlags } from "../../config/featureFlags";
import './ContributionMethodSelector.css';

interface ContributionMethodSelectorProps {
  selectedMethod: 'manual' | 'image' | 'voice' | 'paste';
  onMethodChange: (method: 'manual' | 'image' | 'voice' | 'paste') => void;
}

export const ContributionMethodSelector: React.FC<ContributionMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange
}) => {
  const { t } = useTranslation();

  return (
    <div className="enhanced-method-selector">
      <div className="method-cards">
        {featureFlags.enableManualContribution && (
          <div 
            className={`method-card ${selectedMethod === 'manual' ? 'active' : ''}`}
            onClick={() => onMethodChange('manual')}
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
          >
            <div className="method-icon-wrapper">
              <div className="method-icon">📋</div>
            </div>
            <h3 className="method-title">{t('method.paste.title', 'Paste Text')}</h3>
            <p className="method-description">{t('method.paste.desc', 'Copy-paste route info from WhatsApp, Facebook, etc.')}</p>
            <div className="method-badge new">{t('badges.fastest', 'Fastest!')}</div>
          </div>
        )}
      </div>
    </div>
  );
};