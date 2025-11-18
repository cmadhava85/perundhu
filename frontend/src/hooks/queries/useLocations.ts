import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { queryKeys } from '../../lib/queryClient';
import type { Location } from '../../types';

/**
 * React Query hook for fetching all locations
 * Locations are cached for longer since they rarely change
 */
export function useLocations() {
  return useQuery({
    queryKey: queryKeys.locations,
    
    queryFn: async (): Promise<Location[]> => {
      const response = await api.get('/api/v1/locations');
      return response.data;
    },
    
    // Locations rarely change, so cache for longer
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    
    // Retry with backoff
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

/**
 * Hook for fetching destination locations based on a starting location
 */
export function useDestinations(fromLocationId: number | null, enabled = true) {
  return useQuery({
    queryKey: fromLocationId 
      ? queryKeys.destinations(fromLocationId)
      : ['destinations'],
    
    queryFn: async (): Promise<Location[]> => {
      if (!fromLocationId) {
        throw new Error('From location ID is required');
      }
      
      const response = await api.get('/api/v1/locations/destinations', {
        params: { fromLocationId },
      });
      
      return response.data;
    },
    
    enabled: enabled && !!fromLocationId,
    
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook for fetching a specific location by ID
 */
export function useLocation(locationId: number | null, enabled = true) {
  return useQuery({
    queryKey: locationId 
      ? queryKeys.locationById(locationId)
      : ['location'],
    
    queryFn: async (): Promise<Location> => {
      if (!locationId) {
        throw new Error('Location ID is required');
      }
      
      const response = await api.get(`/api/v1/locations/${locationId}`);
      return response.data;
    },
    
    enabled: enabled && !!locationId,
    
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}
