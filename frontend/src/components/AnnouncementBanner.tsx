import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/AnnouncementBanner.css';

export interface Announcement {
  id: string;
  type: 'info' | 'warning' | 'success' | 'new-feature' | 'maintenance';
  titleKey: string;
  messageKey: string;
  titleFallback: string;
  messageFallback: string;
  link?: string;
  linkTextKey?: string;
  linkTextFallback?: string;
  dismissible?: boolean;
  expiresAt?: string; // ISO date string
  priority?: number; // Higher = more important
}

interface AnnouncementBannerProps {
  announcements?: Announcement[];
  maxVisible?: number;
}

// Default announcements - can be replaced with API fetch
const defaultAnnouncements: Announcement[] = [
  {
    id: 'welcome-2024',
    type: 'new-feature',
    titleKey: 'announcements.welcome.title',
    messageKey: 'announcements.welcome.message',
    titleFallback: '🎉 New Feature!',
    messageFallback: 'Voice contribution is now available! Share bus timings using your voice.',
    link: '/?tab=contribute',
    linkTextKey: 'announcements.welcome.linkText',
    linkTextFallback: 'Try it now',
    dismissible: true,
    priority: 10
  }
];

const STORAGE_KEY = 'perundhu_dismissed_announcements';

const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ 
  announcements = defaultAnnouncements,
  maxVisible = 1
}) => {
  const { t } = useTranslation();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Load dismissed announcements from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDismissedIds(new Set(parsed.ids || []));
      }
    } catch (e) {
      console.warn('Failed to load dismissed announcements:', e);
    }
  }, []);

  // Filter valid announcements (not expired, not dismissed)
  const validAnnouncements = announcements.filter(a => {
    if (dismissedIds.has(a.id)) return false;
    if (a.expiresAt && new Date(a.expiresAt) < new Date()) return false;
    return true;
  }).sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const dismissAnnouncement = useCallback((id: string) => {
    setIsAnimating(true);
    setTimeout(() => {
      const newDismissed = new Set(dismissedIds);
      newDismissed.add(id);
      setDismissedIds(newDismissed);
      
      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
          ids: Array.from(newDismissed),
          lastUpdated: new Date().toISOString()
        }));
      } catch (e) {
        console.warn('Failed to save dismissed announcements:', e);
      }
      
      setIsAnimating(false);
      if (currentIndex >= validAnnouncements.length - 1) {
        setCurrentIndex(0);
      }
    }, 300);
  }, [dismissedIds, currentIndex, validAnnouncements.length]);

  // Auto-rotate announcements if multiple
  useEffect(() => {
    if (validAnnouncements.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % validAnnouncements.length);
    }, 8000); // Rotate every 8 seconds

    return () => clearInterval(timer);
  }, [validAnnouncements.length]);

  if (validAnnouncements.length === 0) {
    return null;
  }

  const visibleAnnouncements = validAnnouncements.slice(0, maxVisible);
  const currentAnnouncement = visibleAnnouncements[currentIndex % visibleAnnouncements.length];

  if (!currentAnnouncement) return null;

  const getTypeIcon = (type: Announcement['type']) => {
    switch (type) {
      case 'new-feature': return '✨';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'maintenance': return '🔧';
      case 'info':
      default: return 'ℹ️';
    }
  };

  const getTypeClass = (type: Announcement['type']) => {
    return `announcement-${type}`;
  };

  return (
    <div className={`announcement-banner-container ${isAnimating ? 'animating-out' : ''}`}>
      <div className={`announcement-banner ${getTypeClass(currentAnnouncement.type)}`}>
        <div className="announcement-content">
          <span className="announcement-icon">{getTypeIcon(currentAnnouncement.type)}</span>
          
          <div className="announcement-text">
            <strong className="announcement-title">
              {t(currentAnnouncement.titleKey, currentAnnouncement.titleFallback)}
            </strong>
            <span className="announcement-message">
              {t(currentAnnouncement.messageKey, currentAnnouncement.messageFallback)}
            </span>
            
            {currentAnnouncement.link && (
              <a 
                href={currentAnnouncement.link} 
                className="announcement-link"
                aria-label={t(currentAnnouncement.linkTextKey || '', currentAnnouncement.linkTextFallback || 'Learn more')}
              >
                {t(currentAnnouncement.linkTextKey || '', currentAnnouncement.linkTextFallback || 'Learn more')}
                <span className="link-arrow">→</span>
              </a>
            )}
          </div>
          
          {validAnnouncements.length > 1 && (
            <div className="announcement-navigation">
              <span className="announcement-counter">
                {currentIndex + 1}/{validAnnouncements.length}
              </span>
              <button 
                className="nav-button prev"
                onClick={() => setCurrentIndex(prev => prev === 0 ? validAnnouncements.length - 1 : prev - 1)}
                aria-label="Previous announcement"
              >
                ‹
              </button>
              <button 
                className="nav-button next"
                onClick={() => setCurrentIndex(prev => (prev + 1) % validAnnouncements.length)}
                aria-label="Next announcement"
              >
                ›
              </button>
            </div>
          )}
        </div>
        
        {currentAnnouncement.dismissible !== false && (
          <button 
            className="announcement-dismiss"
            onClick={() => dismissAnnouncement(currentAnnouncement.id)}
            aria-label={t('announcements.dismiss', 'Dismiss announcement')}
          >
            <span className="dismiss-icon">×</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(AnnouncementBanner);
