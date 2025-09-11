import { useState, useCallback } from 'react';
import { 
  searchBuses as apiSearchBuses
} from '../services/api';
import { OSMDiscoveryService, type OSMBusStop, type OSMBusRoute } from '../services/osmDiscoveryService';
import type { Bus, Location, Stop, ConnectingRoute } from '../types';

// Error class definition
export class ApiError extends Error {
  message: string;
  status: number;
  errorCode: string;
  
  constructor(message: string, status: number, errorCode: string) {
    super(message);
    this.message = message;
    this.status = status;
    this.errorCode = errorCode;
  }
}

/**
 * Custom hook for managing bus search state and operations
 */
const useBusSearch = () => {
  // Search results state
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [stopsMap, setStopsMap] = useState<Record<number, Stop[]>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | ApiError | null>(null);
  const [connectingRoutes, setConnectingRoutes] = useState<ConnectingRoute[]>([]);
  const [includeIntermediateStops, setIncludeIntermediateStops] = useState<boolean>(true);
  const [includeContinuingBuses, setIncludeContinuingBuses] = useState<boolean>(true);
  const [osmStops, setOsmStops] = useState<OSMBusStop[]>([]);
  const [osmRoutes, setOsmRoutes] = useState<OSMBusRoute[]>([]);
  const [showOSMData, setShowOSMData] = useState<boolean>(false);

  // Search functions
  const searchBuses = useCallback(async (
    fromLocation: Location,
    toLocation: Location,
    includeContinuing: boolean = includeContinuingBuses
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiSearchBuses(fromLocation, toLocation, includeContinuing);
      setBuses(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [includeContinuingBuses]);

  const searchBusesWithOSM = useCallback(async (
    fromLocation: Location,
    toLocation: Location
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Regular search
      const buses = await apiSearchBuses(fromLocation, toLocation, includeContinuingBuses);
      setBuses(buses);

      // OSM discovery if enabled
      if (showOSMData) {
        const [stops, routes] = await Promise.all([
          OSMDiscoveryService.discoverIntermediateStops(fromLocation, toLocation),
          OSMDiscoveryService.discoverOSMRoutes(fromLocation, toLocation)
        ]);
        
        setOsmStops(stops);
        setOsmRoutes(routes);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [includeContinuingBuses, showOSMData]);

  // Toggle functions
  const toggleIncludeIntermediateStops = useCallback(() => {
    setIncludeIntermediateStops(prev => !prev);
  }, []);

  const toggleIncludeContinuingBuses = useCallback(() => {
    setIncludeContinuingBuses(prev => !prev);
  }, []);

  const toggleOSMData = useCallback(() => {
    setShowOSMData(prev => !prev);
  }, []);

  // Reset functions
  const resetResults = useCallback(() => {
    setBuses([]);
    setConnectingRoutes([]);
    setOsmStops([]);
    setOsmRoutes([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    buses,
    selectedBusId,
    stopsMap,
    loading,
    error,
    connectingRoutes,
    includeIntermediateStops,
    includeContinuingBuses,
    osmStops,
    osmRoutes,
    showOSMData,
    
    // Actions
    searchBuses,
    searchBusesWithOSM,
    toggleIncludeIntermediateStops,
    toggleIncludeContinuingBuses,
    toggleOSMData,
    resetResults,
    clearError,
    setSelectedBusId,
    setStopsMap
  };
};

// Export the hook as both default and named export for flexibility
export { useBusSearch };
export default useBusSearch;