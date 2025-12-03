import { getEnv } from '../utils/environment';

export interface FeatureFlags {
  enableMap: boolean;
  enableVoiceContribution: boolean;
  enableImageContribution: boolean;
  enableManualContribution: boolean;
  enablePasteContribution: boolean;
}

export const featureFlags: FeatureFlags = {
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
};

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (featureName: keyof FeatureFlags): boolean => {
  return featureFlags[featureName] ?? false;
};