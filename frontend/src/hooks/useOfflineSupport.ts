import { useState, useEffect, useCallback } from 'react';

// Types for offline data
export interface OfflineStorage<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Custom hook for implementing offline support with caching
 * 
 * @param key Local storage key for cached data
 * @param fetchFn Function to fetch online data
 * @param expirationMinutes Time in minutes before cached data expires (defaults to 24 hours)
 * @param initialData Initial data to use before fetching
 */
export function useOfflineSupport<T>(
  key: string,
  fetchFn: () => Promise<T>,
  expirationMinutes: number = 1440, // 24 hours default
  initialData: T | null = null
) {
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch fresh data from API - define this first as it's used by other functions
  const fetchData = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchFn();
      setData(result);
      setIsStale(false);
      
      const now = Date.now();
      setLastUpdated(new Date(now));
      
      // Save to cache
      const cacheData: OfflineStorage<T> = {
        data: result,
        timestamp: now,
        expiresAt: now + expirationMinutes * 60 * 1000
      };
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`offline_${key}`, JSON.stringify(cacheData));
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setIsLoading(false);
      
      // If fetch fails, try to use cached data even if expired
      loadFromCache();
    }
  }, [fetchFn, key, expirationMinutes]);

  // Load data from cache
  const loadFromCache = useCallback(() => {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const cachedData = localStorage.getItem(`offline_${key}`);
      
      if (cachedData) {
        const parsedData: OfflineStorage<T> = JSON.parse(cachedData);
        
        // Check if data is expired
        const now = Date.now();
        const isExpired = now > parsedData.expiresAt;
        
        // Set the data from cache
        setData(parsedData.data);
        setLastUpdated(new Date(parsedData.timestamp));
        setIsStale(isExpired);
        
        // If online and data is expired, fetch fresh data
        if (!isOffline && isExpired && typeof navigator !== 'undefined' && navigator.onLine) {
          fetchData();
        } else {
          setIsLoading(false);
        }
      } else {
        // No cache, fetch fresh data if online
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          fetchData();
        } else {
          setIsLoading(false);
          setError('No cached data available while offline');
        }
      }
    } catch (err) {
      console.error('Error loading from cache:', err);
      
      // If cache loading fails but we're online, try fetching fresh data
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        fetchData();
      } else {
        setIsLoading(false);
        setError('Failed to load cached data');
      }
    }
  }, [isOffline, key, fetchData]);

  // Handle going online
  const handleOnline = useCallback(() => {
    setIsOffline(false);
    
    // When coming back online, refresh data
    fetchData();
  }, [fetchData]);

  // Handle going offline
  const handleOffline = useCallback(() => {
    setIsOffline(true);
  }, []);
  
  // Only run browser-specific code after component mounts on client
  useEffect(() => {
    // Now that we're on the client side, we can safely access browser APIs
    loadFromCache();
    
    // Register to online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Initial online status
      setIsOffline(!(typeof navigator !== 'undefined' && navigator.onLine));
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [handleOnline, handleOffline, loadFromCache]);

  // Clear cached data
  const clearCache = useCallback(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`offline_${key}`);
    }
    setData(initialData);
    setLastUpdated(null);
    setIsStale(false);
  }, [key, initialData]);

  // Manually refresh data
  const refresh = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      fetchData();
    } else {
      setError('Cannot refresh while offline');
    }
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    isOffline,
    isStale,
    lastUpdated,
    refresh,
    clearCache
  };
}

export default useOfflineSupport;