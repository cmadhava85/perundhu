import React from "react";
import { useTranslation } from "react-i18next";
import './ContributionMethodSelector.css';

interface ContributionMethodSelectorProps {
  selectedMethod: 'manual' | 'image';
  onMethodChange: (method: 'manual' | 'image') => void;
}

export const ContributionMethodSelector: React.FC<ContributionMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange
}) => {
  const { t } = useTranslation();

  return (
    <div className="enhanced-method-selector">
      <div className="method-cards">
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
      </div>
    </div>
  );
};