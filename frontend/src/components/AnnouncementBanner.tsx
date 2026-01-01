import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import AnnouncementService from '../services/announcementService';
import '../styles/AnnouncementBanner.css';

// Simplified local announcement interface for static announcements
export interface Announcement {
  id?: string | number;
  type: 'info' | 'warning' | 'success' | 'new-feature' | 'maintenance' | 'INFO' | 'WARNING' | 'SUCCESS' | 'NEW_FEATURE' | 'MAINTENANCE';
  titleKey: string;
  messageKey: string;
  titleFallback: string;
  messageFallback: string;
  link?: string;
  linkTextKey?: string;
  linkTextFallback?: string;
  dismissible?: boolean;
  isDismissible?: boolean;
  expiresAt?: string;
  priority?: number;
  uniqueId?: string;
  isActive?: boolean;
  targetUsers?: 'ALL' | 'ADMIN' | 'CONTRIBUTORS' | 'REGULAR_USERS';
  displayBanner?: boolean;
  displayModal?: boolean;
  status?: 'DRAFT' | 'PUBLISHED';
}

interface AnnouncementBannerProps {
  announcements?: Announcement[];
  maxVisible?: number;
  fetchFromAPI?: boolean;
}

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
  maxVisible = 1,
  fetchFromAPI = true
}) => {
  const { t } = useTranslation();
  const [displayAnnouncements, setDisplayAnnouncements] = useState<Announcement[]>(announcements);
  const [dismissedIds, setDismissedIds] = useState<Set<string | number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(fetchFromAPI);

  // Load announcements from API
  useEffect(() => {
    if (!fetchFromAPI) return;

    const loadAnnouncements = async () => {
      try {
        const apiAnnouncements = await AnnouncementService.getActiveAnnouncements();
        const converted: Announcement[] = apiAnnouncements.map(a => ({
          ...a,
          id: a.id || a.uniqueId,
          dismissible: a.isDismissible,
          type: (a.type.toLowerCase() as 'info' | 'warning' | 'success' | 'new-feature' | 'maintenance')
        }));
        setDisplayAnnouncements(converted);
      } catch (error) {
        console.warn('Failed to load announcements from API, using defaults:', error);
        setDisplayAnnouncements(announcements);
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, [fetchFromAPI, announcements]);

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
  const validAnnouncements = displayAnnouncements.filter(a => {
    if (a.id && (dismissedIds.has(String(a.id)) || dismissedIds.has(a.id))) return false;
    if (a.expiresAt && new Date(a.expiresAt) < new Date()) return false;
    return true;
  }).sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const dismissAnnouncement = useCallback((id: string | number | undefined) => {
    if (id === undefined) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      const newDismissed = new Set(dismissedIds);
      newDismissed.add(String(id));
      setDismissedIds(newDismissed);
      
      // Persist to localStorage and API
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
          ids: Array.from(newDismissed),
          lastUpdated: new Date().toISOString()
        }));
        // Track dismiss in backend
        if (typeof id === 'number') {
          AnnouncementService.trackDismiss(id);
        }
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
    }, 8000);

    return () => clearInterval(timer);
  }, [validAnnouncements.length]);

  if (loading || validAnnouncements.length === 0) {
    return null;
  }

  const visibleAnnouncements = validAnnouncements.slice(0, maxVisible);
  const currentAnnouncement = visibleAnnouncements[currentIndex % visibleAnnouncements.length];

  if (!currentAnnouncement) return null;

  const getTypeIcon = (type: Announcement['type']) => {
    const normalizedType = String(type).toLowerCase();
    switch (normalizedType) {
      case 'new_feature':
      case 'new-feature': return '✨';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'maintenance': return '🔧';
      case 'info':
      default: return 'ℹ️';
    }
  };

  const getTypeClass = (type: Announcement['type']) => {
    const normalizedType = String(type).toLowerCase().replace('_', '-');
    return `announcement-${normalizedType}`;
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
        
        {(currentAnnouncement.dismissible !== false && currentAnnouncement.isDismissible !== false) && (
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
