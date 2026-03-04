/**
 * Hook to fetch individual feature flags from public endpoint
 * No authentication required - suitable for public pages (search, contribute, etc.)
 * 
 * Usage:
 *   const { enabled: isShareEnabled } = usePublicFeatureFlag('enableShareRoute');
 *   const { enabled: isContribEnabled } = usePublicFeatureFlag('enableManualContribution');
 */

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';

interface UsePublicFeatureFlagResult {
  enabled: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetch a single feature flag from public endpoint
 * @param featureName The feature flag name (e.g., 'enableShareRoute')
 * @returns { enabled, isLoading, error }
 */
export function usePublicFeatureFlag(featureName: string): UsePublicFeatureFlagResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-feature-flag', featureName],
    queryFn: async (): Promise<boolean> => {
      try {
        const response = await apiRequest<Record<string, boolean>>('GET', '/v1/settings/feature-enabled', undefined, { feature: featureName });
        // Response is { [featureName]: boolean }
        return response[featureName] ?? false;
      } catch (err) {
        console.warn(`Failed to fetch feature flag ${featureName}:`, err);
        return false; // Default to disabled if API fails
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — feature flags only change on deployment
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  return {
    enabled: data ?? false,
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Fetch multiple feature flags efficiently
 * Uses bulk endpoint to fetch all flags in ONE request instead of N requests
 * 
 * Usage:
 *   const result = usePublicFeatureFlags(['enableShareRoute', 'enableManualContribution']);
 *   // result.flags = { enableShareRoute: true, enableManualContribution: true }
 */
export function usePublicFeatureFlags(flagNames: string[]): {
  flags: Record<string, boolean>;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery({
    // Use the same cache key as FeatureFlagsContext.syncWithBackend so both share one HTTP request
    queryKey: ['public-feature-flags', 'all'],
    queryFn: async (): Promise<Record<string, boolean>> => {
      try {
        // Fetch ALL flags in ONE request using bulk endpoint (much more efficient!)
        // This prevents N+1 API calls problem and rate limiting issues
        return await apiRequest<Record<string, boolean>>('GET', '/v1/settings/feature-flags');
      } catch (err) {
        console.warn('Failed to fetch feature flags:', err);
        return {};
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — feature flags only change on deployment
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  // Filter down to only the requested flag names
  const filteredData: Record<string, boolean> = {};
  flagNames.forEach(name => {
    filteredData[name] = (data ?? {})[name] ?? false;
  });

  return {
    flags: filteredData,
    isLoading,
    error: error as Error | null,
  };
}
