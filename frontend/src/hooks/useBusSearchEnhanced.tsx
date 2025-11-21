import React from 'react';
import { useBusSearch as useReactQueryBusSearch, useBusStops, useConnectingRoutes } from './queries/useBusSearch';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import type { Location, Stop } from '../types';

/**
 * Enhanced bus search hook that uses React Query under the hood
 * Provides backward compatibility with the existing useBusSearch API
 */
export function useBusSearchEnhanced() {
  const [fromLocation, setFromLocation] = React.useState<Location | null>(null);
  const [toLocation, setToLocation] = React.useState<Location | null>(null);
  const [selectedBusId, setSelectedBusId] = React.useState<number | null>(null);

  // Use React Query hooks
  const busSearchQuery = useReactQueryBusSearch({
    fromLocationId: fromLocation?.id ?? null,
    toLocationId: toLocation?.id ?? null,
    enabled: !!fromLocation && !!toLocation,
  });

  const busStopsQuery = useBusStops(
    selectedBusId,
    fromLocation?.id ?? null,
    toLocation?.id ?? null,
    !!selectedBusId
  );

  const connectingRoutesQuery = useConnectingRoutes(
    fromLocation?.id ?? null,
    toLocation?.id ?? null,
    !!fromLocation && !!toLocation
  );

  // Fetch stops for all buses in search results
  const { i18n } = useTranslation();
  const [isLoadingStops, setIsLoadingStops] = React.useState(false);
  const [stopsMap, setStopsMap] = React.useState<Record<number, Stop[]>>({});

  // Helper function to transform stop data (reduces nesting)
  const transformStop = (stop: any, busId: number): Stop => ({
    id: stop.id,
    name: stop.name,
    translatedName: stop.translatedName || stop.name,
    arrivalTime: stop.arrivalTime || '',
    departureTime: stop.departureTime || '',
    order: stop.sequence || 0,
    stopOrder: stop.sequence || 0,
    busId,
    platform: stop.platform,
    status: stop.status,
    locationId: stop.locationId,
    latitude: stop.latitude,
    longitude: stop.longitude
  });

  // Helper function to fetch stops for a single bus (reduces nesting)
  const fetchBusStops = async (
    bus: any, 
    signal: AbortSignal
  ): Promise<{ busId: number; stops: Stop[] } | null> => {
    try {
      const response = await api.get(
        `/api/v1/bus-schedules/buses/${bus.id}/stops/basic`,
        { 
          signal,
          params: { lang: i18n.language }
        }
      );
      const stops = response.data || [];
      return {
        busId: bus.id,
        stops: stops.map((stop: any) => transformStop(stop, bus.id))
      };
    } catch (error: any) {
      // Ignore aborted requests
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        return null;
      }
      console.warn(`Failed to fetch stops for bus ${bus.id}:`, error);
      return { busId: bus.id, stops: [] };
    }
  };

  React.useEffect(() => {
    if (!busSearchQuery.data?.buses || busSearchQuery.data.buses.length === 0) {
      setStopsMap({});
      return;
    }

    let isMounted = true;
    const abortController = new AbortController();

    // Fetch stops for all buses in parallel
    const fetchAllStops = async () => {
      const newStopsMap: Record<number, Stop[]> = {};
      
      // Parallelize API calls for better performance
      const promises = busSearchQuery.data.buses.map((bus) => 
        fetchBusStops(bus, abortController.signal)
      );

      const results = await Promise.all(promises);
      
      // Only update state if component is still mounted
      if (isMounted) {
        for (const result of results) {
          if (result) {
            newStopsMap[result.busId] = result.stops;
          }
        }
        setStopsMap(newStopsMap);
      }
    };

    fetchAllStops();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [busSearchQuery.data?.buses]);

  // Backward compatible search function
  const searchBuses = React.useCallback(
    async (from: Location, to: Location) => {
      console.log(`🔍 Search triggered for: ${from.name} → ${to.name}`);
      
      // Use functional updates to avoid stale closure
      let shouldRefetch = false;
      setFromLocation(prevFrom => {
        setToLocation(prevTo => {
          // Check if locations unchanged - need to refetch
          if (prevFrom?.id === from.id && prevTo?.id === to.id) {
            shouldRefetch = true;
          }
          return to;
        });
        return from;
      });
      
      // Force refetch if locations are already set (user clicked search again)
      if (shouldRefetch) {
        console.log('🔄 Locations unchanged, forcing refetch...');
        await busSearchQuery.refetch();
      }
    },
    [busSearchQuery]
  );

  const resetResults = React.useCallback(() => {
    setFromLocation(null);
    setToLocation(null);
    setSelectedBusId(null);
  }, []);

  return {
    // State
    buses: busSearchQuery.data?.buses ?? [],
    selectedBusId,
    stopsMap,
    loading: busSearchQuery.isLoading || busStopsQuery.isLoading,
    error: busSearchQuery.error || busStopsQuery.error,
    connectingRoutes: connectingRoutesQuery.data ?? [],
    
    // Query states for more granular control
    busSearchQuery,
    busStopsQuery,
    connectingRoutesQuery,
    
    // Actions
    searchBuses,
    setSelectedBusId,
    resetResults,
    
    // Loading component for convenience
    LoadingComponent: () => <LoadingSkeleton count={3} type="bus-card" />,
  };
}

export default useBusSearchEnhanced;
