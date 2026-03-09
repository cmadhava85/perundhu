import React from 'react';
import { useBusSearchEnhanced as useReactQueryBusSearch, useBusStopsEnhanced as useBusStops, useConnectingRoutesEnhanced as useConnectingRoutes } from './queries/useBusSearchEnhanced';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import type { Location, Stop, Bus } from '../types';

/**
 * Enhanced bus search hook that uses React Query under the hood
 * Provides backward compatibility with the existing useBusSearch API
 */
export function useBusSearchEnhanced() {
  const [isSearchPending, startTransition] = React.useTransition();
  const [fromLocation, setFromLocation] = React.useState<Location | null>(null);
  const [toLocation, setToLocation] = React.useState<Location | null>(null);
  const [selectedBusId, setSelectedBusId] = React.useState<number | null>(null);
  const [hasSearched, setHasSearched] = React.useState(false);

  // Use React Query hooks - pass full location objects for proper transformation
  const busSearchQuery = useReactQueryBusSearch({
    fromLocationId: fromLocation?.id ?? null,
    toLocationId: toLocation?.id ?? null,
    pageSize: 20,
    enabled: !!fromLocation && !!toLocation && hasSearched,
  });

  // Flatten all pages of results for infinite query
  const allBuses = React.useMemo(() => {
    if (!busSearchQuery.data?.pages) return [];
    const pickName = (...values: Array<string | undefined | null>) =>
      values.find(value => value && value.trim().length > 0) || '';

    const rawBuses = busSearchQuery.data.pages.flatMap((page: { buses?: Bus[] }) => page.buses || []);
    return rawBuses.map((bus: Bus) => {
      const fromName = pickName(
        bus.from,
        bus.fromLocationNameTranslated,
        bus.fromLocationName,
        bus.fromLocation?.translatedName,
        bus.fromLocation?.name
      );
      const toName = pickName(
        bus.to,
        bus.toLocationNameTranslated,
        bus.toLocationName,
        bus.toLocation?.translatedName,
        bus.toLocation?.name
      );

      return {
        ...bus,
        from: fromName,
        to: toName,
        busName: bus.busName || bus.name || '',
        busNumber: bus.busNumber || bus.number || '',
        fromLocation: bus.fromLocation,
        toLocation: bus.toLocation,
      };
    });
  }, [busSearchQuery.data]); // Only depend on data, not location objects

  // Stable bus IDs for effect dependency
  const busIds = React.useMemo(() => 
    allBuses.map(b => b.id).sort((a, b) => a - b).join(','), 
    [allBuses]
  );

  // Keep allBuses in a ref for stable access in effect
  const allBusesRef = React.useRef<Bus[]>(allBuses);
  allBusesRef.current = allBuses;

  // Get total count from first page
  const totalCount = busSearchQuery.data?.pages?.[0]?.totalCount ?? 0;

  const busStopsQuery = useBusStops(
    selectedBusId,
    fromLocation?.id ?? null,
    toLocation?.id ?? null,
    !!selectedBusId
  );

  // Only fetch connecting routes after search has been performed
  const connectingRoutesQuery = useConnectingRoutes(
    fromLocation?.id ?? null,
    toLocation?.id ?? null,
    !!fromLocation && !!toLocation && hasSearched
  );

  // Fetch stops for all buses in search results  
  const { i18n } = useTranslation();
  const [stopsMap, setStopsMap] = React.useState<Record<number, Stop[]>>({});

  // Define raw stop response interface
  interface RawStopResponse {
    id: number;
    name: string;
    translatedName?: string;
    arrivalTime?: string;
    departureTime?: string;
    sequence?: number;
    platform?: string;
    status?: string;
    locationId?: number;
    latitude?: number;
    longitude?: number;
  }

  // Helper function to transform stop data (reduces nesting)
  const transformStop = (stop: RawStopResponse, busId: number): Stop => ({
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

  // Track which bus IDs we've already fetched stops for (persists across renders)
  const fetchedBusIdsRef = React.useRef<Set<number>>(new Set());
  const currentLangRef = React.useRef<string>(i18n.language);

  React.useEffect(() => {
    // Reset cache if language changes
    if (currentLangRef.current !== i18n.language) {
      fetchedBusIdsRef.current.clear();
      currentLangRef.current = i18n.language;
      setStopsMap({});
    }
    
    const currentBuses = allBusesRef.current;
    if (currentBuses.length === 0) {
      return;
    }

    // Filter to only buses we haven't fetched yet
    const busesToFetch = currentBuses.filter(bus => !fetchedBusIdsRef.current.has(bus.id));
    
    if (busesToFetch.length === 0) {
      return; // All buses already fetched
    }

    let isMounted = true;
    const abortController = new AbortController();

    // Single batch request for all new buses — replaces the N individual /buses/{id}/stops/basic calls
    const fetchAllStops = async () => {
      try {
        const busIdsParam = busesToFetch.map(b => b.id).join(',');
        const response = await api.get('/v1/bus-schedules/stops/basic/batch', {
          params: { busIds: busIdsParam, lang: i18n.language },
          signal: abortController.signal,
        });

        if (!isMounted) return;

        const batchResult = response.data as Record<string, RawStopResponse[]>;
        applyBatchStops(batchResult);
      } catch (error: unknown) {
        const errorObj = error as { name?: string };
        if (errorObj.name === 'AbortError' || errorObj.name === 'CanceledError') {
          return;
        }
        console.warn('Failed to batch fetch bus stops:', error);
      }
    };

    function applyBatchStops(batchResult: Record<string, RawStopResponse[]>) {
      if (!isMounted) return;
      // Pre-compute all entries before calling setStopsMap to reduce nesting depth
      const newEntries: Record<number, Stop[]> = {};
      for (const busIdStr of Object.keys(batchResult)) {
        const busId = Number.parseInt(busIdStr, 10);
        newEntries[busId] = (batchResult[busIdStr] ?? []).map(stop => transformStop(stop, busId));
        fetchedBusIdsRef.current.add(busId);
      }
      setStopsMap(prev => ({ ...prev, ...newEntries }));
    }

    fetchAllStops();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [busIds, i18n.language]); // Use stable busIds string instead of allBuses array

  // Backward compatible search function
  const searchBuses = React.useCallback(
    async (from: Location, to: Location) => {
      const isSame = fromLocation?.id === from.id && toLocation?.id === to.id;

      // Batch all state updates atomically in a single render to avoid
      // triggering the stops-fetch effect multiple times
      startTransition(() => {
        setHasSearched(true);
        setFromLocation(from);
        setToLocation(to);
      });

      // Force refetch if locations are already set (user clicked search again)
      if (isSame) {
        await busSearchQuery.refetch();
      }
    },
    [fromLocation, toLocation, busSearchQuery]
  );

  const resetResults = React.useCallback(() => {
    setFromLocation(null);
    setToLocation(null);
    setSelectedBusId(null);
    setHasSearched(false);
  }, []);

  return {
    // State
    buses: allBuses,
    selectedBusId,
    stopsMap,
    loading: busSearchQuery.isLoading || busStopsQuery.isLoading,
    loadingMore: busSearchQuery.isFetchingNextPage,
    error: busSearchQuery.error || busStopsQuery.error,
    connectingRoutes: connectingRoutesQuery.data ?? [],
    totalCount,
    
    // Pagination
    hasNextPage: busSearchQuery.hasNextPage,
    fetchNextPage: busSearchQuery.fetchNextPage,
    
    // Query states for more granular control
    busSearchQuery,
    busStopsQuery,
    connectingRoutesQuery,
    
    // Actions
    searchBuses,
    setSelectedBusId,
    resetResults,
    isSearchPending,
    
    // Loading component for convenience
    LoadingComponent: () => <LoadingSkeleton count={3} type="bus-card" />,
  };
}

export default useBusSearchEnhanced;
