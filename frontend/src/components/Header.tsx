import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AnnouncementBanner from './AnnouncementBanner';
import { getActiveAnnouncements } from '../config/announcements';
import { triggerHaptic } from '../utils/haptic';
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
  const { t, i18n } = useTranslation();
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Scroll detection for header compression (mobile-first)
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Only compress on mobile (<768px)
      if (window.innerWidth < 768) {
        // Add 'scrolled' class immediately when scrolling down
        setIsScrolled(currentScrollY > 10);
        
        // Compress when scrolled past 80px
        setIsCompact(currentScrollY > 80);
      } else {
        setIsScrolled(currentScrollY > 10);
        setIsCompact(false);
      }
      
      ticking = false;
    };
    
    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };
    
    const onScroll = () => {
      requestTick();
    };
    
    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);
  
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
      
      <header className={`app-header ${isScrolled ? 'scrolled' : ''} ${isCompact ? 'compact' : ''}`}>
        <div className="header-content">
          {/* Left Section: Back Button + Bus Icon + Title */}
          <div className="header-left">
            {isAdmin && (
              <a href="/" className="back-button" aria-label="Back to home">
                <span className="back-icon">←</span>
              </a>
            )}
            
            <a href="/" className="brand-link" aria-label="Go to home page">
              <span className="logo-icon" aria-hidden="true">🚌</span>
              <div className="header-title-group">
                <h1 className="brand-name">பேருந்து</h1>
                <p className="header-subtitle">{t('common.tagline', 'Bus in Seconds')}</p>
              </div>
            </a>
          </div>

          {/* Right Section: Actions */}
          <div className="header-right">
            {/* What's New Button - Disabled for now */}
            {/* {!isAdmin && (
              <button 
                className={`whats-new-btn ${hasNewUpdates ? 'has-updates' : ''}`}
                onClick={() => {
                  triggerHaptic('selection');
                  setShowWhatsNew(!showWhatsNew);
                }}
                aria-label={t('header.whatsNew', "What's New")}
                title={t('header.whatsNew', "What's New")}
              >
                <span className="whats-new-icon">✨</span>
                {hasNewUpdates && <span className="update-badge" aria-label="New updates available"></span>}
              </button>
            )} */}
            
            {/* Language Switcher Dropdown */}
            <div className="language-switcher-wrapper">
              <select 
                value={i18n.language} 
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="language-dropdown"
                aria-label="Select language"
              >
                <option value="en">🌐 English</option>
                <option value="ta">🌐 தமிழ்</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* What's New Dropdown Panel - Disabled for now */}
        {/* {showWhatsNew && (
          <div className="whats-new-panel">
            <div className="whats-new-header">
              <h3>✨ {t('header.whatsNewTitle', "What's New")}</h3>
              <button 
                className="close-panel-btn"
                onClick={() => {
                  triggerHaptic('light');
                  setShowWhatsNew(false);
                }}
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
        */ }
      </header>
    </>
  );
};

export default React.memo(Header);