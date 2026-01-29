/**
 * Hook to fetch individual feature flags from public endpoint
 * No authentication required - suitable for public pages (search, contribute, etc.)
 * 
 * Usage:
 *   const { enabled: isShareEnabled } = usePublicFeatureFlag('enableShareRoute');
 *   const { enabled: isContribEnabled } = usePublicFeatureFlag('enableManualContribution');
 */

import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

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
        const response = await api.get('/api/v1/settings/feature-enabled', {
          params: { feature: featureName }
        });
        // Response is { [featureName]: boolean }
        return response.data[featureName] ?? false;
      } catch (err) {
        console.warn(`Failed to fetch feature flag ${featureName}:`, err);
        return false; // Default to disabled if API fails
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 1,
  });

  return {
    enabled: data ?? false,
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Fetch multiple feature flags in parallel
 * Efficient when you need several flags at once
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
    queryKey: ['public-feature-flags', flagNames.sort().join(',')],
    queryFn: async (): Promise<Record<string, boolean>> => {
      try {
        // Fetch all flags in parallel
        const promises = flagNames.map(name =>
          api.get('/api/v1/settings/feature-enabled', {
            params: { feature: name }
          }).then(res => ({ [name]: res.data[name] ?? false }))
        );
        
        const results = await Promise.all(promises);
        return Object.assign({}, ...results);
      } catch (err) {
        console.warn('Failed to fetch feature flags:', err);
        // Return all disabled as default
        return Object.fromEntries(flagNames.map(name => [name, false]));
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  return {
    flags: data ?? Object.fromEntries(flagNames.map(name => [name, false])),
    isLoading,
    error: error as Error | null,
  };
}
