import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocations } from '../services/api';
import type { Location } from '../types';

/**
 * Custom hook to fetch location data from the API
 * @param language Optional language code for fetching translated content
 * @returns Object containing locations, loading state, and error information
 */
const useLocationData = (language?: string) => {
  const { i18n } = useTranslation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [fromLocation, setFromLocation] = useState<Location | null>(null);
  const [toLocation, setToLocation] = useState<Location | null>(null);
  const [autoLocationEnabled, setAutoLocationEnabled] = useState<boolean>(false);
  const [destinations, setDestinations] = useState<Location[]>([]);
  const [lastFetchLanguage, setLastFetchLanguage] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchLocations = async () => {
      try {
        // Use provided language parameter or fall back to i18n.language
        const currentLanguage = language || i18n.language;
        
        // Prevent excessive API calls - only fetch if language actually changed and not currently fetching
        if (currentLanguage === lastFetchLanguage || isFetching) {
          return;
        }

        if (isMounted) {
          setIsFetching(true);
          setIsLoading(true);
          setError(null);
        }
        
        // Pass the current language to the API
        const data = await getLocations(currentLanguage);
        
        // Only update state if component is still mounted and language hasn't changed
        if (isMounted && currentLanguage === (language || i18n.language)) {
          setLocations(data);
          setLastFetchLanguage(currentLanguage);
          
          // If we have locations data, set the destinations too
          if (data && data.length > 0) {
            setDestinations(data);
          }
        }
      } catch (err: unknown) {
        const error = err as { name?: string };
        if (error.name === 'AbortError' || error.name === 'CanceledError') {
          return; // Ignore aborted requests
        }
        // Error logged for debugging fetchLocations issues
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch location data'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsFetching(false);
        }
      }
    };

    fetchLocations();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [i18n.language, language]); // Only language changes should trigger fetch

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Toggle auto location detection
  const toggleAutoLocation = useCallback(() => {
    setAutoLocationEnabled(prev => !prev);
  }, []);

  // Get destinations for a specific fromLocationId
  const getDestinations = useCallback((fromLocationId: number) => {
    // Filter out the source location from destinations
    const filtered = locations.filter(location => location.id !== fromLocationId);
    setDestinations(filtered);
    return filtered;
  }, [locations]);

  return {
    // Data
    locations,
    destinations,
    fromLocation,
    toLocation,
    
    // State
    isLoading,
    loading: isLoading, // Add this for backward compatibility
    error,
    autoLocationEnabled,
    
    // Actions
    setFromLocation,
    setToLocation,
    clearError,
    toggleAutoLocation,
    getDestinations
  };
};

// Export the hook as both default and named export for flexibility
export { useLocationData };
export default useLocationData;