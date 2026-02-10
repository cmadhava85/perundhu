import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  
  // Scroll detection for header compression (mobile-first)
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Check if any modal/dialog is open - comprehensive check
      // Priority 1: Check if wizard modal (Add Route Information) is open
      const hasWizardModal = !!document.querySelector('.wizard-overlay');
      
      // Priority 2: Check global flag set by AddStopsToRoute
      const isModalOpenFlag = (globalThis as { isModalOpen?: boolean }).isModalOpen === true;
      
      // Priority 3: Check for other modal elements in DOM
      const hasOtherModal = 
        document.querySelector('[role="dialog"]') || 
        document.querySelector('.modal') ||
        document.querySelector('.modal-overlay') ||
        document.querySelector('[data-modal-open="true"]') ||
        // Check if body has overflow-hidden (indicates modal is open)
        document.body.style.overflow === 'hidden' ||
        document.body.style.position === 'fixed';
      
      // If ANY modal is open, don't compress header
      const hasOpenModal = hasWizardModal || isModalOpenFlag || hasOtherModal;
      
      // Only compress on mobile (<768px) and no modals are open
      if (window.innerWidth < 768 && !hasOpenModal) {
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
    
    // Also listen for DOM mutations to detect modal opening/closing
    const observer = new MutationObserver(() => {
      handleScroll();
    });
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-modal-open', 'style']
    });
    
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleScroll);
      observer.disconnect();
    };
  }, []);
  
  return (
    <>
      {/* Announcement Banner - Shows above header */}
      {showAnnouncements && !isAdmin && (
        <AnnouncementBanner announcements={getActiveAnnouncements()} maxVisible={3} />
      )}
      
      <header className={`app-header ${isScrolled ? 'scrolled' : ''} ${isCompact ? 'compact' : ''}`}>
        <div className="header-content">
          {/* Left Section: Back Button + Logo + Title */}
          <div className="header-left">
            {isAdmin && (
              <a href="/" className="back-button" aria-label="Back to home">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </a>
            )}
            
            <a href="/" className="brand-link" aria-label="Go to home page">
              <div className="logo-container">
                <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" fill="currentColor"/>
                </svg>
              </div>
              <div className="header-title-group">
                <h1 className="brand-name">பேருந்து</h1>
                <span className="header-subtitle">{t('common.tagline', 'Bus in Seconds')}</span>
              </div>
            </a>
          </div>

          {/* Right Section: Language Switcher */}
          <div className="header-right">
            <select 
              value={i18n.language} 
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="language-dropdown"
              aria-label="Select language"
            >
              <option value="en">EN</option>
              <option value="ta">தமிழ்</option>
            </select>
          </div>
        </div>
      </header>
    </>
  );
};

export default React.memo(Header);