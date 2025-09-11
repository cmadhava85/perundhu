import React, { useState } from 'react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
          
          {/* Mobile menu toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={t('header.toggleMenu', 'Toggle menu')}
          >
            <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
        
        <div className={`header-actions ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {!isAdmin && onToggleAutoLocation && (
            <div className="auto-location-toggle">
              <div className="location-card">
                <div className="location-icon-wrapper">
                  <div className={`location-icon-container ${autoLocationEnabled ? 'active' : ''}`}>
                    <div className="location-icon">📍</div>
                    {autoLocationEnabled && (
                      <>
                        <div className="pulse-ring"></div>
                        <div className="pulse-ring delay-1"></div>
                        <div className="pulse-ring delay-2"></div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="location-content">
                  <div className="location-title">
                    {t('header.autoDetectLocation', 'Auto-detect location')}
                  </div>
                  <div className="location-subtitle">
                    {autoLocationEnabled 
                      ? t('header.locationEnabled', 'Location detection active') 
                      : t('header.locationDisabled', 'Enable for better results')
                    }
                  </div>
                </div>
                
                <button 
                  className={`modern-toggle ${autoLocationEnabled ? 'active' : ''}`}
                  onClick={onToggleAutoLocation}
                  aria-pressed={autoLocationEnabled}
                  aria-label={t('header.autoDetectLocationHint', 'Toggle automatic location detection')}
                >
                  <div className="toggle-track">
                    <div className="toggle-thumb">
                      <div className="thumb-icon">
                        {autoLocationEnabled ? '✓' : '○'}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
          
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

export default Header;