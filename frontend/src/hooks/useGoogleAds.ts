import { useMemo } from 'react';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext';
import { DEFAULT_ADS_CONFIG, isAdPlacementEnabled } from '../config/adConfiguration';

/**
 * Hook to check if ads are enabled and get ad configuration
 * Respects admin feature flags
 */
export const useGoogleAds = () => {
  const { flags } = useFeatureFlags();

  const config = useMemo(() => {
    return {
      ...DEFAULT_ADS_CONFIG,
      enabled: flags?.enableAds ?? DEFAULT_ADS_CONFIG.enabled
    };
  }, [flags?.enableAds]);

  const isAdEnabled = (placement: keyof typeof DEFAULT_ADS_CONFIG.placements): boolean => {
    if (!config.enabled) return false;

    // Check individual placement flag
    const placementKey = `enableAd${placement.charAt(0).toUpperCase() + placement.slice(1)}` as keyof typeof flags;
    const placementEnabled = flags?.[placementKey];

    if (placementEnabled !== undefined) {
      return placementEnabled as boolean;
    }

    // Fall back to config default
    return isAdPlacementEnabled(placement, config);
  };

  const getAdConfig = (placement: keyof typeof DEFAULT_ADS_CONFIG.placements) => {
    return config.placements[placement];
  };

  return {
    adsEnabled: config.enabled,
    config,
    isAdEnabled,
    getAdConfig
  };
};

export default useGoogleAds;
