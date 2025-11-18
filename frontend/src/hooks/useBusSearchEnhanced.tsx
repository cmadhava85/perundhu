import React from 'react';
import { useBusSearch as useReactQueryBusSearch, useBusStops, useConnectingRoutes } from './queries/useBusSearch';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
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
  const [stopsMap, setStopsMap] = React.useState<Record<number, Stop[]>>({});

  React.useEffect(() => {
    if (!busSearchQuery.data?.buses || busSearchQuery.data.buses.length === 0) {
      setStopsMap({});
      return;
    }

    // Fetch stops for all buses
    const fetchAllStops = async () => {
      const newStopsMap: Record<number, Stop[]> = {};
      
      for (const bus of busSearchQuery.data.buses) {
        try {
          const response = await api.get(`/api/v1/bus-schedules/buses/${bus.id}/stops/basic`);
          const stops = response.data || [];
          newStopsMap[bus.id] = stops.map((stop: any) => ({
            id: stop.id,
            name: stop.name,
            translatedName: stop.translatedName || stop.name,
            arrivalTime: stop.arrivalTime || '',
            departureTime: stop.departureTime || '',
            order: stop.sequence || 0,
            stopOrder: stop.sequence || 0,
            busId: bus.id,
            platform: stop.platform,
            status: stop.status,
            locationId: stop.locationId,
            latitude: stop.latitude,
            longitude: stop.longitude
          }));
        } catch (error) {
          console.warn(`Failed to fetch stops for bus ${bus.id}:`, error);
          newStopsMap[bus.id] = [];
        }
      }
      
      setStopsMap(newStopsMap);
    };

    fetchAllStops();
  }, [busSearchQuery.data?.buses]);

  // Backward compatible search function
  const searchBuses = React.useCallback(
    async (from: Location, to: Location) => {
      setFromLocation(from);
      setToLocation(to);
      // React Query will automatically fetch when locations change
    },
    []
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
