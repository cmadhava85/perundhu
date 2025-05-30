import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  autoLocationEnabled?: boolean;
  onToggleAutoLocation?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  autoLocationEnabled = false, 
  onToggleAutoLocation 
}) => {
  const { t } = useTranslation();
  
  return (
    <header className="app-header">
      <div className="header-content">
        <h1>{t('header.title')}</h1>
        <div className="header-actions">
          {onToggleAutoLocation && (
            <div className="location-toggle">
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={autoLocationEnabled}
                  onChange={onToggleAutoLocation}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">{t('header.autoDetectLocation', 'Auto-detect location')}</span>
            </div>
          )}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};

export default Header;