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
  autoLocationEnabled: _autoLocationEnabled = false, 
  onToggleAutoLocation: _onToggleAutoLocation,
  isAdmin = false
}) => {
  const { t } = useTranslation();
  
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-main">
          <h1>
            {isAdmin 
              ? t('header.adminTitle', 'Admin Dashboard') 
              : t('header.title', 'Tamil Nadu Bus Schedule')
            }
          </h1>
        </div>
        
        <div className="header-actions">
          
          {isAdmin && (
            <a href="/" className="home-link modern-button">
              <span className="button-icon">🏠</span>
              <span className="button-text">{t('header.backToHome', 'Back to Home')}</span>
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

export default React.memo(Header);