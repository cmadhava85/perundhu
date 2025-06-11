import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { searchBuses as apiSearchBuses, getStops, getConnectingRoutes as apiGetConnectingRoutes, ApiError } from '../services/api';
import type { Bus, Location, Stop, ConnectingRoute } from '../types';

/**
 * Custom hook for managing bus search state and operations
 */
const useBusSearch = () => {
  const { t, i18n } = useTranslation();
  
  // Search results state
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [stopsMap, setStopsMap] = useState<Record<number, Stop[]>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | ApiError | null>(null);
  const [connectingRoutes, setConnectingRoutes] = useState<ConnectingRoute[]>([]);

  /**
   * Reset all search results
   */
  const resetResults = useCallback(() => {
    setBuses([]);
    setSelectedBusId(null);
    setStopsMap({});
    setError(null);
    setConnectingRoutes([]);
  }, []);

  /**
   * Search for buses between two locations
   */
  const searchBuses = useCallback(async (fromLocation: Location, toLocation: Location) => {
    if (!fromLocation || !toLocation) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Load buses between locations
      const busData = await apiSearchBuses(fromLocation, toLocation);
      
      // If no direct buses, try connecting routes
      if (busData.length === 0) {
        // Pass only location IDs instead of full location objects
        const connectingData = await apiGetConnectingRoutes(fromLocation.id, toLocation.id);
        setBuses([]);
        setConnectingRoutes(connectingData);
        
        if (connectingData.length === 0) {
          const noRoutesError = new ApiError(
            t('error.noRoutesFound', 'No routes found between these locations.'), 
            404,
            "NO_ROUTES_FOUND"
          );
          setError(noRoutesError);
          return; // Don't throw, just set the error state
        }
      } else {
        setBuses(busData);
        setConnectingRoutes([]);
      }
    } catch (err) {
      console.error('Error during search:', err);
      if (err instanceof ApiError) {
        setError(err);
      } else if (err instanceof Error) {
        // Check if it's an API error from external service that hasn't been properly converted
        const apiErr = err as any;
        if (apiErr.status && apiErr.message) {
          setError(new ApiError(
            apiErr.message, 
            apiErr.status, 
            apiErr.errorCode || "API_ERROR"
          ));
        } else {
          setError(err);
        }
      } else {
        setError(new ApiError(
          t('error.unknown', 'An unknown error occurred'), 
          500, 
          "UNKNOWN_ERROR"
        ));
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  /**
   * Select a bus to view its details
   */
  const selectBus = useCallback(async (busId: number) => {
    console.log(`selectBus called with busId: ${busId}, current selectedBusId: ${selectedBusId}`);
    
    if (selectedBusId === busId) {
      console.log('Deselecting current bus');
      setSelectedBusId(null);
    } else {
      try {
        // Only fetch stops if we haven't already fetched them for this bus
        if (!stopsMap[busId]) {
          console.log(`No stops data for bus ${busId} in cache, fetching from API`);
          setLoading(true);
          // Pass the current language code to the API
          const stopsData = await getStops(busId, i18n.language);
          console.log(`Received stops data for bus ${busId}:`, stopsData);
          setStopsMap(prev => ({
            ...prev,
            [busId]: stopsData
          }));
        } else {
          console.log(`Using cached stops data for bus ${busId}:`, stopsMap[busId]);
        }
        setSelectedBusId(busId);
      } catch (err) {
        console.error('Error fetching bus stops:', err);
        if (err instanceof ApiError) {
          setError(err);
        } else if (err instanceof Error) {
          // Check if it's an API error from external service that hasn't been properly converted
          const apiErr = err as any;
          if (apiErr.status && apiErr.message) {
            setError(new ApiError(
              apiErr.message, 
              apiErr.status, 
              apiErr.errorCode || "API_ERROR"
            ));
          } else {
            setError(err);
          }
        } else {
          setError(new ApiError(
            t('error.stopsNotFound', 'Could not retrieve bus stops'), 
            500, 
            "STOPS_NOT_FOUND"
          ));
        }
      } finally {
        setLoading(false);
      }
    }
  }, [selectedBusId, stopsMap, t, i18n.language]); // Added i18n.language dependency

  /**
   * Refresh stops data for currently selected bus when language changes
   */
  const refreshStopsForLanguage = useCallback(async () => {
    // Only refresh if we have a selected bus
    if (selectedBusId) {
      try {
        console.log(`Refreshing stops for bus ${selectedBusId} with language ${i18n.language}`);
        setLoading(true);
        const stopsData = await getStops(selectedBusId, i18n.language);
        setStopsMap(prev => ({
          ...prev,
          [selectedBusId]: stopsData
        }));
      } catch (err) {
        console.error('Error refreshing bus stops for language change:', err);
      } finally {
        setLoading(false);
      }
    }
  }, [selectedBusId, i18n.language]);

  // Effect to refresh stops when language changes
  useEffect(() => {
    refreshStopsForLanguage();
  }, [i18n.language, refreshStopsForLanguage]);

  /**
   * Reset error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    buses,
    selectedBusId,
    stopsMap,
    loading,
    isLoading: loading, // Add this for consistency with useLocationData
    error,
    connectingRoutes,
    
    // Actions
    searchBuses,
    selectBus,
    resetResults,
    clearError,
    refreshStopsForLanguage
  };
};

// Export the hook as both default and named export for flexibility
export { useBusSearch };
export default useBusSearch;