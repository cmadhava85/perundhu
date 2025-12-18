/**
 * Announcements Configuration
 * 
 * This file contains all announcements that appear in the header banner.
 * To add a new announcement:
 * 1. Add a new entry to the announcements array
 * 2. Give it a unique ID
 * 3. Set the type, message, and optionally an expiration date
 * 
 * Types: 'info' | 'warning' | 'success' | 'new-feature' | 'maintenance'
 */

import type { Announcement } from '../components/AnnouncementBanner';

export const announcements: Announcement[] = [
  // ===== ACTIVE ANNOUNCEMENTS =====
  // Add new announcements here at the top (highest priority first)
  
  {
    id: 'voice-contribution-launch',
    type: 'new-feature',
    titleKey: 'announcements.voice.title',
    messageKey: 'announcements.voice.message',
    titleFallback: '🎙️ New Feature!',
    messageFallback: 'Voice contribution is now available! Share bus timings using your voice.',
    link: '/?tab=contribute',
    linkTextKey: 'announcements.voice.linkText',
    linkTextFallback: 'Try it now',
    dismissible: true,
    priority: 10,
    // expiresAt: '2024-12-31T23:59:59Z' // Uncomment to set expiration
  },

  {
    id: 'tamil-language-support',
    type: 'success',
    titleKey: 'announcements.tamil.title',
    messageKey: 'announcements.tamil.message',
    titleFallback: '🇮🇳 Tamil Support!',
    messageFallback: 'Full Tamil language support with OpenStreetMap integration for accurate place names.',
    dismissible: true,
    priority: 8
  },

  // ===== TEMPLATE ANNOUNCEMENTS (Uncomment when needed) =====

  // Maintenance Notice
  // {
  //   id: 'scheduled-maintenance-jan-2025',
  //   type: 'maintenance',
  //   titleKey: 'announcements.maintenance.title',
  //   messageKey: 'announcements.maintenance.message',
  //   titleFallback: '🔧 Scheduled Maintenance',
  //   messageFallback: 'System maintenance on Jan 15, 2025 from 2:00 AM to 4:00 AM IST.',
  //   dismissible: false,
  //   priority: 100, // High priority - always show first
  //   expiresAt: '2025-01-15T04:00:00+05:30'
  // },

  // Warning/Outage
  // {
  //   id: 'service-degradation',
  //   type: 'warning',
  //   titleKey: 'announcements.warning.title',
  //   messageKey: 'announcements.warning.message',
  //   titleFallback: '⚠️ Service Notice',
  //   messageFallback: 'Some users may experience slow loading times. We are working on it.',
  //   dismissible: true,
  //   priority: 90
  // },

  // Info/General Update
  // {
  //   id: 'new-routes-added',
  //   type: 'info',
  //   titleKey: 'announcements.routes.title',
  //   messageKey: 'announcements.routes.message',
  //   titleFallback: 'ℹ️ New Routes!',
  //   messageFallback: '50 new bus routes added covering Chennai, Madurai, and Coimbatore.',
  //   link: '/search',
  //   linkTextKey: 'announcements.routes.linkText',
  //   linkTextFallback: 'Search routes',
  //   dismissible: true,
  //   priority: 5
  // },

  // Success/Achievement
  // {
  //   id: 'milestone-10k',
  //   type: 'success',
  //   titleKey: 'announcements.milestone.title',
  //   messageKey: 'announcements.milestone.message',
  //   titleFallback: '🎉 Milestone!',
  //   messageFallback: 'We just crossed 10,000 community contributions! Thank you!',
  //   dismissible: true,
  //   priority: 3
  // },
];

/**
 * Get active announcements (filters expired ones)
 */
export const getActiveAnnouncements = (): Announcement[] => {
  const now = new Date();
  return announcements.filter(a => {
    if (a.expiresAt && new Date(a.expiresAt) < now) {
      return false;
    }
    return true;
  });
};

/**
 * Get announcement by ID
 */
export const getAnnouncementById = (id: string): Announcement | undefined => {
  return announcements.find(a => a.id === id);
};

export default announcements;
