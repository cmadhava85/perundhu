/**
 * Google AdSense Configuration with Feature Flags
 * Controlled via admin settings
 */

export interface AdPlacementConfig {
  enabled: boolean;
  adSlot: string;
  adFormat: 'horizontal' | 'vertical' | 'square';
  width?: number;
  height?: number;
  description: string;
}

export interface GoogleAdsConfig {
  enabled: boolean; // Master toggle
  clientId: string; // Google Publisher ID (from env)
  placements: {
    betweenSearchResults: AdPlacementConfig;
    sidebarRight: AdPlacementConfig;
    footerSection: AdPlacementConfig;
    aboveSearchForm: AdPlacementConfig;
  };
}

/**
 * Default ad configuration
 * Can be overridden by admin settings
 */
export const DEFAULT_ADS_CONFIG: GoogleAdsConfig = {
  enabled: true,
  clientId: import.meta.env.VITE_GOOGLE_AD_CLIENT || 'ca-pub-xxxxxxxxxxxxxxxx',
  placements: {
    // Between search results (every 3-4 buses)
    betweenSearchResults: {
      enabled: true,
      adSlot: import.meta.env.VITE_AD_SLOT_RESULTS || 'ca-pub-xxxxxxxxxxxxxxxx/xxxxxxxx1',
      adFormat: 'square', // 300x250 medium rectangle
      description: 'Between search results',
      width: 300,
      height: 250
    },

    // Right sidebar (sticky)
    sidebarRight: {
      enabled: true,
      adSlot: import.meta.env.VITE_AD_SLOT_SIDEBAR || 'ca-pub-xxxxxxxxxxxxxxxx/xxxxxxxx2',
      adFormat: 'vertical', // 300x600
      description: 'Right sidebar (sticky)',
      width: 300,
      height: 600
    },

    // Footer section
    footerSection: {
      enabled: true,
      adSlot: import.meta.env.VITE_AD_SLOT_FOOTER || 'ca-pub-xxxxxxxxxxxxxxxx/xxxxxxxx3',
      adFormat: 'horizontal', // 728x90 leaderboard
      description: 'Footer section',
      width: 728,
      height: 90
    },

    // Above search form (premium position)
    aboveSearchForm: {
      enabled: false, // Disabled by default (less intrusive)
      adSlot: import.meta.env.VITE_AD_SLOT_ABOVE || 'ca-pub-xxxxxxxxxxxxxxxx/xxxxxxxx4',
      adFormat: 'horizontal',
      description: 'Above search form',
      width: 728,
      height: 90
    }
  }
};

/**
 * Get current ad configuration
 * Merges default config with admin overrides
 */
export const getAdConfig = (adminOverrides?: Partial<GoogleAdsConfig>): GoogleAdsConfig => {
  if (!adminOverrides) return DEFAULT_ADS_CONFIG;

  return {
    ...DEFAULT_ADS_CONFIG,
    ...adminOverrides,
    placements: {
      ...DEFAULT_ADS_CONFIG.placements,
      ...(adminOverrides.placements || {})
    }
  };
};

/**
 * Check if a specific ad placement is enabled
 */
export const isAdPlacementEnabled = (
  placement: keyof GoogleAdsConfig['placements'],
  config?: GoogleAdsConfig
): boolean => {
  const adConfig = config || DEFAULT_ADS_CONFIG;
  if (!adConfig.enabled) return false;

  const placementConfig = adConfig.placements[placement];
  return placementConfig?.enabled ?? false;
};
