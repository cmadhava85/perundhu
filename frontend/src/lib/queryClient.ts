import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized React Query client configuration
 * Provides default options for all queries and mutations
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Cache data for 30 minutes
      gcTime: 30 * 60 * 1000, // Previously called cacheTime
      
      // Smart retry - only retry on network/transient errors, not validation failures
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        const axiosError = error as { response?: { status?: number } };
        const status = axiosError?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        // Only retry once for server errors (may be cold start)
        if (status && status >= 500) return failureCount < 1;
        // Retry up to 2 times for network errors
        return failureCount < 2;
      },
      
      // Retry delay with exponential backoff (capped at 5 seconds)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      
      // Disable refetch on window focus - prevents unnecessary API calls when switching tabs
      refetchOnWindowFocus: false,
      
      // Don't refetch on mount if data is still fresh
      refetchOnMount: false,
      
      // Refetch on reconnect to get latest data
      refetchOnReconnect: true,
      
      // Enable network mode handling for offline scenarios
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      
      // Network mode for mutations
      networkMode: 'online',
    },
  },
});

/**
 * Query keys for type-safe query management
 * Centralized to avoid key conflicts and enable easy invalidation
 */
export const queryKeys = {
  // Location queries
  locations: ['locations'] as const,
  locationById: (id: number) => ['locations', id] as const,
  destinations: (fromId: number) => ['destinations', fromId] as const,
  
  // Bus queries
  buses: ['buses'] as const,
  busSearch: (fromId: number, toId: number) => ['buses', 'search', fromId, toId] as const,
  busById: (id: number) => ['buses', id] as const,
  
  // Stop queries
  stops: ['stops'] as const,
  stopsByBus: (busId: number) => ['stops', 'bus', busId] as const,
  stopsBetween: (busId: number, fromId: number, toId: number) => 
    ['stops', 'between', busId, fromId, toId] as const,
  
  // Connecting routes
  connectingRoutes: (fromId: number, toId: number) => 
    ['connecting-routes', fromId, toId] as const,
  
  // Analytics queries
  analytics: ['analytics'] as const,
  analyticsDelay: (params: unknown) => ['analytics', 'delay', params] as const,
  analyticsPunctuality: (params: unknown) => ['analytics', 'punctuality', params] as const,
  analyticsPerformance: (params: unknown) => ['analytics', 'performance', params] as const,
  analyticsCrowding: (params: unknown) => ['analytics', 'crowding', params] as const,
  
  // User data
  userRewards: (userId: string) => ['user', 'rewards', userId] as const,
  userHistory: (userId: string) => ['user', 'history', userId] as const,
  
  // Contributions
  contributions: ['contributions'] as const,
  routeContributions: ['contributions', 'routes'] as const,
  imageContributions: ['contributions', 'images'] as const,
  
  // Live tracking
  liveTracking: ['live-tracking'] as const,
  liveLocation: (busId: number) => ['live-tracking', busId] as const,
} as const;
