import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import '../styles/Header.css';

interface HeaderProps {
  autoLocationEnabled?: boolean;
  onToggleAutoLocation?: () => void;
  isAdmin?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  autoLocationEnabled = false, 
  onToggleAutoLocation,
  isAdmin = false
}) => {
  const { t } = useTranslation();
  
  return (
    <header className="app-header">
      <div className="header-content">
        <h1>
          {isAdmin 
            ? t('header.adminTitle', 'Admin Dashboard') 
            : t('header.title', 'Tamil Nadu Bus Schedule')
          }
        </h1>
        <div className="header-actions">
          {!isAdmin && onToggleAutoLocation && (
            <div className="location-toggle">
              <label className="toggle-switch" title={t('header.autoDetectLocationHint', 'Enable to automatically detect your current location')}>
                <input 
                  type="checkbox" 
                  checked={autoLocationEnabled}
                  onChange={onToggleAutoLocation}
                  aria-label={t('header.autoDetectLocation', 'Auto-detect location')}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">{t('header.autoDetectLocation', 'Auto-detect location')}</span>
            </div>
          )}
          {isAdmin && (
            <a href="/" className="home-link">
              {t('header.backToHome', 'Back to Home')}
            </a>
          )}
          <div className="language-switcher-wrapper">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;