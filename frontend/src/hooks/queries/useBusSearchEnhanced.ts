import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { queryKeys } from '../../lib/queryClient';
import type { Bus, Stop } from '../../types';

interface UseBusSearchEnhancedParams {
  fromLocationId: number | null;
  toLocationId: number | null;
  includeContinuing?: boolean;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

interface BusSearchResponse {
  buses: Bus[];
  totalCount: number;
  hasConnectingRoutes: boolean;
  page?: number;
  totalPages?: number;
}

/**
 * Enhanced React Query hook for bus search with pagination
 */
export function useBusSearchEnhanced({ 
  fromLocationId, 
  toLocationId,
  includeContinuing = true,
  page = 0,
  pageSize = 20,
  enabled = true 
}: UseBusSearchEnhancedParams) {
  
  return useQuery({
    queryKey: fromLocationId && toLocationId 
      ? [...queryKeys.busSearch(fromLocationId, toLocationId), page, pageSize, includeContinuing]
      : ['buses', 'search'],
    
    queryFn: async (): Promise<BusSearchResponse> => {
      if (!fromLocationId || !toLocationId) {
        throw new Error('Both from and to locations are required');
      }
      
      const response = await api.get('/api/v1/bus-schedules/search', {
        params: {
          fromLocationId,
          toLocationId,
          includeContinuing,
          page,
          size: pageSize,
        },
      });
      
      // Handle both paginated and non-paginated responses
      if (response.data.items) {
        return {
          buses: response.data.items,
          totalCount: response.data.totalItems,
          page: response.data.page,
          totalPages: response.data.totalPages,
          hasConnectingRoutes: false,
        };
      }
      
      return {
        buses: response.data || [],
        totalCount: response.data?.length || 0,
        hasConnectingRoutes: false,
      };
    },
    
    enabled: enabled && !!fromLocationId && !!toLocationId,
    
    // Custom options
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * Hook for fetching stops for a specific bus
 */
export function useBusStopsEnhanced(
  busId: number | null,
  fromLocationId: number | null,
  toLocationId: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: busId && fromLocationId && toLocationId
      ? queryKeys.stopsBetween(busId, fromLocationId, toLocationId)
      : ['stops'],
    
    queryFn: async (): Promise<Stop[]> => {
      if (!busId) {
        throw new Error('Bus ID is required');
      }
      
      const response = await api.get(`/api/v1/bus-schedules/buses/${busId}/stops`, {
        params: fromLocationId && toLocationId ? {
          fromLocationId,
          toLocationId,
        } : {},
      });
      
      return response.data;
    },
    
    enabled: enabled && !!busId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching connecting routes
 */
export function useConnectingRoutesEnhanced(
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
