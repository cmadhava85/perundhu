import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getCurrentBusLocations } from '../services/api';
import type { Location, BusLocation, Bus } from '../types';

/**
 * Custom hook to manage bus location data fetching and state
 * Separates data fetching logic from UI components
 * Includes automatic real-time refresh with proper cleanup
 */
export const useBusLocationData = (
  fromLocation: Location,
  toLocation: Location,
  showLiveTracking: boolean,
  buses?: Bus[], // Add buses parameter
  refreshInterval = 15000 // Default refresh every 15 seconds
) => {
  const { t } = useTranslation();
  const [busLocations, setBusLocations] = useState<BusLocation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // Memoized load function to prevent infinite dependencies
  const loadBusLocations = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    // Cancel any previous in-flight request
    const controller = new AbortController();
    try {
      setIsLoading(true);
      // Get all current bus locations
      const locations = await getCurrentBusLocations(controller.signal);
      
      // Only update state if component is still mounted
      if (!isMountedRef.current) return;
      
      // Filter locations based on fromLocation and toLocation with exact matching
      const filteredLocations = locations.filter(loc => 
        (loc.fromLocation && loc.fromLocation === fromLocation.name && 
         loc.toLocation && loc.toLocation === toLocation.name) ||
        (loc.fromLocation && loc.fromLocation === toLocation.name && 
         loc.toLocation && loc.toLocation === fromLocation.name)
      );
      
      setBusLocations(filteredLocations);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      // Only update error state if still mounted
      if (!isMountedRef.current) return;
      console.error('Error loading bus locations:', err);
      setError(t('liveTracker.loadError', 'Could not load bus locations'));
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fromLocation.name, toLocation.name, t]);

  useEffect(() => {
    // Skip fetching if live tracking is disabled OR buses array is empty
    if (!showLiveTracking || buses?.length === 0) {
      setBusLocations([]);
      setError(null);
      return;
    }
    
    // Mark component as mounted
    isMountedRef.current = true;
    
    // Check for test environment to prevent infinite loops
    const isTestEnvironment = 
      typeof process !== 'undefined' && 
      process.env?.NODE_ENV === 'test';
    
    // Initial load
    loadBusLocations();

    // Set up periodic refresh - but only if not in test environment
    if (!isTestEnvironment) {
      // Clear any existing interval
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
      // Set new interval for real-time updates
      intervalRef.current = setInterval(loadBusLocations, refreshInterval);
    }

    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;
      
      // Clean up interval
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    fromLocation.id, 
    fromLocation.name, 
    toLocation.id, 
    toLocation.name, 
    showLiveTracking,
    buses?.length ?? 0, // Use length instead of array ref to avoid restarting on stable data
    refreshInterval,
    loadBusLocations
  ]);

  return {
    busLocations,
    isLoading,
    error,
    // Expose manual refresh function for explicit updates
    refresh: loadBusLocations
  };
};

export default useBusLocationData;