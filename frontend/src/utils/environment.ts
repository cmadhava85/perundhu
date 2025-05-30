/**
 * Environment variables utility
 * Safely retrieves environment variables in both browser and test environments
 */

// Define the type for our environment variables
interface EnvVars {
  VITE_GOOGLE_MAPS_API_KEY: string;
  VITE_PERUNDHU_MAP_ID: string;
  VITE_ENABLE_MAP: string;
  [key: string]: string;
}

// Default mock values for test environment (Jest)
const mockEnvVars: EnvVars = {
  VITE_GOOGLE_MAPS_API_KEY: 'TEST_GOOGLE_MAPS_API_KEY',
  VITE_PERUNDHU_MAP_ID: 'TEST_MAP_ID',
  VITE_ENABLE_MAP: 'false',
};

/**
 * Get environment variable safely
 * Works in both browser (Vite) and test (Jest) environments
 */
export const getEnv = (key: string): string => {
  // In browser environment, access Vite's import.meta.env directly
  if (typeof window !== 'undefined') {
    // @ts-ignore - Vite's import.meta.env is not typed
    const env = import.meta.env;
    if (env && typeof env[key] !== 'undefined') {
      return env[key];
    }
  }
  
  // For test environment, use Node's process.env
  if (typeof process !== 'undefined' && process.env && typeof process.env[key] !== 'undefined') {
    return process.env[key] || '';
  }
  
  // Finally fall back to mocks (should only happen in tests)
  return mockEnvVars[key] || '';
};

/**
 * Get a feature flag value from environment variables
 * @param key - The environment variable key to check
 * @param defaultValue - Default value if the environment variable is not set
 * @returns The boolean value of the feature flag
 */
export const getFeatureFlag = (key: string, defaultValue: boolean): boolean => {
  const value = getEnv(key);
  // Only return false if the value is explicitly set to 'false'
  if (value === 'false') return false;
  // If there's a value of 'true', return true
  if (value === 'true') return true;
  // For empty or any other values, use the provided default
  return defaultValue;
};