import React, { useState, useEffect, useMemo } from 'react';
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
      // Watch only body-level attributes (overflow, class, data-modal-open) — NOT subtree.
      // Subtree observation fires on every DOM mutation app-wide (hundreds/sec on list renders).
      // Modal open/close sets body.style.overflow='hidden' or body.dataset.modalOpen — body attributes only.
      attributes: true,
      attributeFilter: ['class', 'data-modal-open', 'style']
    });
    
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleScroll);
      observer.disconnect();
    };
  }, []);
  
  // Memoize announcements to prevent creating new array on every render
  // This prevents AnnouncementBanner from re-fetching API on every Header re-render
  const memoizedAnnouncements = useMemo(() => getActiveAnnouncements(), []);
  
  return (
    <>
      {/* Announcement Banner - Shows above header */}
      {showAnnouncements && !isAdmin && (
        <AnnouncementBanner announcements={memoizedAnnouncements} maxVisible={3} />
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
                <img src="/favicon.svg" alt="Perundhu Logo" className="logo-icon" />
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