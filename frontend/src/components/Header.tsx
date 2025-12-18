import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import AnnouncementBanner from './AnnouncementBanner';
import { getActiveAnnouncements } from '../config/announcements';
import '../styles/Header.css';

interface HeaderProps {
  autoLocationEnabled?: boolean;
  onToggleAutoLocation?: () => void;
  isAdmin?: boolean;
  showAnnouncements?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  autoLocationEnabled: _autoLocationEnabled = false, 
  onToggleAutoLocation: _onToggleAutoLocation,
  isAdmin = false,
  showAnnouncements = true
}) => {
  const { t } = useTranslation();
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  
  // Check for new updates (based on announcements)
  useEffect(() => {
    const announcements = getActiveAnnouncements();
    const dismissedStr = localStorage.getItem('perundhu_dismissed_announcements');
    if (dismissedStr) {
      try {
        const dismissed = JSON.parse(dismissedStr);
        const undismissedCount = announcements.filter(a => !dismissed.ids?.includes(a.id)).length;
        setHasNewUpdates(undismissedCount > 0);
      } catch {
        setHasNewUpdates(announcements.length > 0);
      }
    } else {
      setHasNewUpdates(announcements.length > 0);
    }
  }, []);
  
  return (
    <>
      {/* Announcement Banner - Shows above header */}
      {showAnnouncements && !isAdmin && (
        <AnnouncementBanner announcements={getActiveAnnouncements()} maxVisible={3} />
      )}
      
      <header className="app-header">
        <div className="header-content">
          {/* Logo and Brand */}
          <div className="header-brand">
            <a href="/" className="brand-link" aria-label="Go to home page">
              <div className="brand-logo">
                <span className="logo-icon" aria-hidden="true">🚌</span>
                <div className="logo-animation">
                  <span className="wheel wheel-front"></span>
                  <span className="wheel wheel-back"></span>
                </div>
              </div>
              <div className="brand-text">
                <span className="brand-name">பேருந்து</span>
                <span className="brand-tagline">Perundhu</span>
              </div>
            </a>
          </div>
          
          {/* Title */}
          <div className="header-main">
            <h1>
              {isAdmin 
                ? t('header.adminTitle', 'Admin Dashboard') 
                : t('header.title', 'Tamil Nadu Bus Schedule')
              }
            </h1>
            {!isAdmin && (
              <p className="header-subtitle">
                {t('header.subtitle', 'Find your bus in seconds')}
              </p>
            )}
          </div>
          
          <div className="header-actions">
            {/* What's New Button */}
            {!isAdmin && (
              <button 
                className={`whats-new-btn ${hasNewUpdates ? 'has-updates' : ''}`}
                onClick={() => setShowWhatsNew(!showWhatsNew)}
                aria-label={t('header.whatsNew', "What's New")}
                title={t('header.whatsNew', "What's New")}
              >
                <span className="whats-new-icon">✨</span>
                {hasNewUpdates && <span className="update-badge" aria-label="New updates available"></span>}
              </button>
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
        
        {/* What's New Dropdown Panel */}
        {showWhatsNew && (
          <div className="whats-new-panel">
            <div className="whats-new-header">
              <h3>✨ {t('header.whatsNewTitle', "What's New")}</h3>
              <button 
                className="close-panel-btn"
                onClick={() => setShowWhatsNew(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="whats-new-content">
              <div className="update-item">
                <span className="update-date">Dec 2024</span>
                <span className="update-badge-type new">NEW</span>
                <p>{t('updates.voiceContribution', 'Voice contribution feature - share bus timings using your voice!')}</p>
              </div>
              <div className="update-item">
                <span className="update-date">Dec 2024</span>
                <span className="update-badge-type improvement">IMPROVED</span>
                <p>{t('updates.tamilSupport', 'Tamil language support with OpenStreetMap integration')}</p>
              </div>
              <div className="update-item">
                <span className="update-date">Dec 2024</span>
                <span className="update-badge-type improvement">IMPROVED</span>
                <p>{t('updates.dataValidation', 'Enhanced data quality validation for contributions')}</p>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default React.memo(Header);