import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { queryKeys } from '../../lib/queryClient';
import type { Bus } from '../../types';

interface UseBusSearchParams {
  fromLocationId: number | null;
  toLocationId: number | null;
  enabled?: boolean;
}

interface BusSearchResponse {
  buses: Bus[];
  totalCount: number;
  hasConnectingRoutes: boolean;
}

/**
 * Parse a time string (HH:MM or HH:MM:SS) to minutes since midnight
 */
function parseTimeToMinutes(timeStr: string | undefined | null): number | null {
  if (!timeStr) return null;
  
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  
  const hours = Number.parseInt(parts[0], 10);
  const minutes = Number.parseInt(parts[1], 10);
  
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  
  return hours * 60 + minutes;
}

/**
 * Get current time as minutes since midnight
 */
function getCurrentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Sort buses so that current/upcoming buses appear first, followed by past buses.
 * This provides users with the most relevant departures at the top.
 * 
 * Sorting logic:
 * - Buses departing now or in the future are shown first (sorted by departure time ascending)
 * - Buses that have already departed today are shown after (sorted by departure time ascending)
 * - Buses without departure time are shown at the end
 */
function sortBusesByCurrentTime(buses: Bus[]): Bus[] {
  if (!buses || buses.length === 0) return buses;
  
  const currentTimeMinutes = getCurrentTimeMinutes();
  
  return [...buses].sort((bus1, bus2) => {
    const time1 = parseTimeToMinutes(bus1.departureTime);
    const time2 = parseTimeToMinutes(bus2.departureTime);
    
    // Handle null departure times - put them at the end
    if (time1 === null && time2 === null) return 0;
    if (time1 === null) return 1;
    if (time2 === null) return -1;
    
    const isUpcoming1 = time1 >= currentTimeMinutes;
    const isUpcoming2 = time2 >= currentTimeMinutes;
    
    // If both are upcoming or both are past, sort by time ascending
    if (isUpcoming1 === isUpcoming2) {
      return time1 - time2;
    }
    
    // Upcoming buses come before past buses
    return isUpcoming1 ? -1 : 1;
  });
}

/**
 * React Query hook for bus search
 * Provides automatic caching, background refetching, and loading states
 */
export function useBusSearch({ 
  fromLocationId, 
  toLocationId,
  enabled = true 
}: UseBusSearchParams) {
  
  return useQuery({
    queryKey: fromLocationId && toLocationId 
      ? queryKeys.busSearch(fromLocationId, toLocationId)
      : ['buses', 'search'],
    
    queryFn: async (): Promise<BusSearchResponse> => {
      if (!fromLocationId || !toLocationId) {
        throw new Error('Both from and to locations are required');
      }
      
      const response = await api.get('/api/v1/bus-schedules/search', {
        params: {
          fromLocationId,
          toLocationId,
        },
      });
      
      // Sort buses by current time - upcoming buses first
      const sortedBuses = sortBusesByCurrentTime(response.data?.items || []);
      
      return {
        buses: sortedBuses,
        totalCount: response.data?.totalItems || 0,
        hasConnectingRoutes: false, // Will be updated with connecting routes logic
      };
    },
    
    enabled: enabled && !!fromLocationId && !!toLocationId,
    
    // Custom options for bus search
    staleTime: 2 * 60 * 1000, // 2 minutes - bus schedules don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    
    // Error handling
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * Hook for fetching stops between two locations for a specific bus
 */
export function useBusStops(
  busId: number | null,
  fromLocationId: number | null,
  toLocationId: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: busId && fromLocationId && toLocationId
      ? queryKeys.stopsBetween(busId, fromLocationId, toLocationId)
      : ['stops'],
    
    queryFn: async () => {
      if (!busId || !fromLocationId || !toLocationId) {
        throw new Error('Bus ID and locations are required');
      }
      
      const response = await api.get(`/api/v1/bus-schedules/buses/${busId}/stops`, {
        params: {
          fromLocationId,
          toLocationId,
        },
      });
      
      return response.data;
    },
    
    enabled: enabled && !!busId && !!fromLocationId && !!toLocationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching connecting routes
 */
export function useConnectingRoutes(
  fromLocationId: number | null,
  toLocationId: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: fromLocationId && toLocationId
      ? queryKeys.connectingRoutes(fromLocationId, toLocationId)
      : ['connecting-routes'],
    
    queryFn: async () => {
      if (!fromLocationId || !toLocationId) {
        throw new Error('Both locations are required');
      }
      
      const response = await api.get('/api/v1/bus-schedules/connecting-routes', {
        params: {
          fromLocationId,
          toLocationId,
        },
      });
      
      return response.data;
    },
    
    enabled: enabled && !!fromLocationId && !!toLocationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
