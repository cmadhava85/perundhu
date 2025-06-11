import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocations } from '../services/api';
import type { Location } from '../types';

/**
 * Custom hook to fetch location data from the API
 * @returns Object containing locations, loading state, and error information
 */
const useLocationData = () => {
  const { i18n } = useTranslation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [fromLocation, setFromLocation] = useState<Location | null>(null);
  const [toLocation, setToLocation] = useState<Location | null>(null);
  const [autoLocationEnabled, setAutoLocationEnabled] = useState<boolean>(false);
  const [destinations, setDestinations] = useState<Location[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Pass the current language to the API
        const data = await getLocations(i18n.language);
        setLocations(data);
        
        // If we have locations data, set the destinations too
        if (data && data.length > 0) {
          setDestinations(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch location data'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [i18n.language]); // Use i18n.language as dependency to reload when language changes

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Toggle auto location detection
  const toggleAutoLocation = useCallback(() => {
    setAutoLocationEnabled(prev => !prev);
  }, []);

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
    toggleAutoLocation
  };
};

// Export the hook as both default and named export for flexibility
export { useLocationData };
export default useLocationData;