import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { queryKeys } from '../../lib/queryClient';
import type { Location } from '../../types';

/**
 * React Query hook for fetching all locations with caching
 */
export function useLocationsEnhanced() {
  return useQuery({
    queryKey: queryKeys.locations,
    
    queryFn: async (): Promise<Location[]> => {
      const response = await api.get('/api/v1/bus-schedules/locations');
      return response.data;
    },
    
    // Locations rarely change, cache for longer
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    
    retry: 2,
  });
}

/**
 * Hook for location autocomplete with debouncing
 */
export function useLocationAutocomplete(query: string, enabled = true) {
  return useQuery({
    queryKey: ['locations', 'autocomplete', query],
    
    queryFn: async (): Promise<Location[]> => {
      if (!query || query.length < 2) {
        return [];
      }
      
      const response = await api.get('/api/v1/bus-schedules/locations/autocomplete', {
        params: { q: query },
      });
      
      return response.data;
    },
    
    enabled: enabled && query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching destinations based on from location
 */
export function useDestinationsEnhanced(fromLocationId: number | null, enabled = true) {
  return useQuery({
    queryKey: fromLocationId 
      ? queryKeys.destinations(fromLocationId)
      : ['destinations'],
    
    queryFn: async (): Promise<Location[]> => {
      if (!fromLocationId) {
        throw new Error('From location ID is required');
      }
      
      const response = await api.get('/api/v1/bus-schedules/destinations', {
        params: { fromLocationId },
      });
      
      return response.data;
    },
    
    enabled: enabled && !!fromLocationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
