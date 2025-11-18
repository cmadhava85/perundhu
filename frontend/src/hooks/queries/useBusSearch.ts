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
      
      return {
        buses: response.data?.items || [],
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
