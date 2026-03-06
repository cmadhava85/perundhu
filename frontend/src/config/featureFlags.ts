import { getEnv } from '../utils/environment';

/**
 * Build-time static feature flags read from environment variables.
 *
 * This is a subset of the runtime {@link FeatureFlags} interface defined in
 * `contexts/FeatureFlagsContext.tsx`, which is the canonical source of truth
 * for runtime feature-flag state (including admin-controlled overrides fetched
 * from the backend). Prefer `useFeatureFlags()` / `useIsFeatureEnabled()` from
 * that context in React components.
 *
 * These static flags are useful for tree-shaking and SSR environments where a
 * React context is not available.
 */
export type StaticFeatureFlags = Pick<
  import('../contexts/FeatureFlagsContext').FeatureFlags,
  | 'enableMap'
  | 'enableVoiceContribution'
  | 'enableImageContribution'
  | 'enableManualContribution'
  | 'enablePasteContribution'
  | 'enableRouteVerification'
  | 'enableAddStops'
  | 'enableReportIssue'
>;

export const featureFlags: StaticFeatureFlags = {
  enableMap: getEnv('VITE_ENABLE_MAP') === 'true',
  
  /**
   * Voice Contribution Feature
   * 
   * Enables voice recording and transcription for route contributions.
   * Uses Web Speech API for free, browser-native speech recognition.
   * 
   * Status: BETA (Disabled by default)
   * Dependencies: Web Speech API (Chrome, Edge, Safari)
   * 
   * To enable: Set VITE_ENABLE_VOICE_CONTRIBUTION=true in .env
   */
  enableVoiceContribution: getEnv('VITE_ENABLE_VOICE_CONTRIBUTION') === 'true',
  
  /**
   * Image OCR Contribution Feature
   * 
   * Enables image upload and OCR processing for route contributions.
   * 
   * Status: STABLE (Enabled by default)
   */
  enableImageContribution: getEnv('VITE_ENABLE_IMAGE_CONTRIBUTION') !== 'false',
  
  /**
   * Manual Route Entry Feature
   * 
   * Enables manual form-based route contribution.
   * 
   * Status: STABLE (Enabled by default)
   */
  enableManualContribution: getEnv('VITE_ENABLE_MANUAL_CONTRIBUTION') !== 'false',
  
  /**
   * Paste/Text Contribution Feature
   * 
   * Enables copy-paste route contribution with smart NLP extraction.
   * Users can paste route info from WhatsApp, Facebook, Twitter, etc.
   * 
   * Status: BETA (Disabled by default)
   * Dependencies: RouteTextParser (backend NLP service)
   * 
   * To enable: Set VITE_ENABLE_PASTE_CONTRIBUTION=true in .env
   */
  enablePasteContribution: getEnv('VITE_ENABLE_PASTE_CONTRIBUTION') === 'true',
  
  /**
   * Route Verification Feature
   * 
   * Enables users to verify and validate existing routes.
   * Crowdsourced accuracy improvement for route data.
   * 
   * Status: DISABLED - Not needed on contribution page
   */
  enableRouteVerification: false,
  
  /**
   * Add Stops to Route Feature
   * 
   * Enables users to add intermediate stops to existing routes.
   * Note: This is accessible from search results via "Add Stops" button.
   * 
   * Status: DISABLED - Accessible from search results instead
   */
  enableAddStops: false,
  
  /**
   * Report Issue Feature
   * 
   * Enables users to report issues with routes such as:
   * - Wrong timings
   * - Bus not available / discontinued
   * - Route changes
   * - Service suspended
   * 
   * Status: DISABLED - Accessible from search results via "Report Issue" button
   */
  enableReportIssue: false,
};

/**
 * Check if a static (build-time) feature flag is enabled.
 * For runtime flags controlled by admin settings, use `useIsFeatureEnabled()`
 * from `contexts/FeatureFlagsContext` instead.
 */
export const isFeatureEnabled = (featureName: keyof StaticFeatureFlags): boolean => {
  return featureFlags[featureName] ?? false;
};