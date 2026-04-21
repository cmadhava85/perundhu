import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Location as AppLocation } from '../types';

export interface RecentSearch {
  from: { id: number; name: string; translatedName?: string };
  to: { id: number; name: string; translatedName?: string };
  timestamp: number;
}

const RECENT_SEARCHES_KEY = 'perundhu_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export interface UseRecentSearchesReturn {
  recentSearches: RecentSearch[];
  saveRecentSearch: (from: AppLocation, to: AppLocation) => void;
  clearRecentSearches: () => void;
  getRecentSearchDisplayName: (loc: { name: string; translatedName?: string }) => string;
  getRelativeTime: (timestamp: number) => string;
}

export function useRecentSearches(): UseRecentSearchesReturn {
  const { i18n, t } = useTranslation();
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentSearch[];
        setRecentSearches(parsed);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const saveRecentSearch = useCallback((from: AppLocation, to: AppLocation) => {
    if (from.id === -1 || to.id === -1) return;

    const newSearch: RecentSearch = {
      from: { id: from.id, name: from.name, translatedName: from.translatedName },
      to: { id: to.id, name: to.name, translatedName: to.translatedName },
      timestamp: Date.now(),
    };

    setRecentSearches(prev => {
      const filtered = prev.filter(
        s => !(s.from.id === from.id && s.to.id === to.id)
      );
      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      return updated;
    });
  }, []);

  const getRecentSearchDisplayName = useCallback(
    (loc: { name: string; translatedName?: string }) => {
      if (i18n.language === 'ta' && loc.translatedName) {
        return loc.translatedName;
      }
      return loc.name;
    },
    [i18n.language]
  );

  const getRelativeTime = useCallback((timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('search.justNow');
    if (minutes < 60) return t('search.minutesAgo', { count: minutes });
    if (hours < 24) return t('search.hoursAgo', { count: hours });
    if (days === 1) return t('search.yesterday');
    return t('search.daysAgo', { count: days });
  }, [t]);

  const clearRecentSearches = useCallback(() => {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore localStorage errors
    }
    setRecentSearches([]);
  }, []);

  return { recentSearches, saveRecentSearch, clearRecentSearches, getRecentSearchDisplayName, getRelativeTime };
}
