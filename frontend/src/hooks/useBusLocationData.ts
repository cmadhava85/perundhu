import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getCurrentBusLocations } from '../services/api';
import type { Location, BusLocation, Bus } from '../types';

/**
 * Custom hook to manage bus location data fetching and state
 * Separates data fetching logic from UI components
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

  useEffect(() => {
    // Skip fetching if live tracking is disabled OR buses array is empty
    if (!showLiveTracking || buses?.length === 0) return;
    
    let isMounted = true;
    
    // Check for test environment to prevent infinite loops
    const isTestEnvironment = 
      typeof process !== 'undefined' && 
      process.env?.NODE_ENV === 'test';
    
    const loadBusLocations = async () => {
      if (!isMounted) return;
      
      try {
        setIsLoading(true);
        // Get all current bus locations
        const locations = await getCurrentBusLocations();
        
        // Only update state if component is still mounted
        if (!isMounted) return;
        
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
        // Only update error state if still mounted
        if (!isMounted) return;
        console.error('Error loading bus locations:', err);
        setError(t('liveTracker.loadError', 'Could not load bus locations'));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Initial load
    loadBusLocations();

    // Set up periodic refresh - but only if not in test environment
    if (!isTestEnvironment) {
      // Clear any existing interval
      if (intervalRef.current !== null) {
        globalThis.clearInterval(intervalRef.current);
      }
      // Set new interval
      intervalRef.current = globalThis.setInterval(loadBusLocations, refreshInterval);
    }

    return () => {
      isMounted = false;
      if (intervalRef.current !== null) {
        globalThis.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    fromLocation.id, 
    fromLocation.name, 
    toLocation.id, 
    toLocation.name, 
    showLiveTracking,
    buses, // Add buses to dependency array
    refreshInterval, 
    t
  ]);

  return {
    busLocations,
    isLoading,
    error
  };
};

export default useBusLocationData;