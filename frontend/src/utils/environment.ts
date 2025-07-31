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
  VITE_ENABLE_MAP: 'true', // Changed from 'false' to 'true' to ensure map is enabled
};

/**
 * Get environment variable safely
 * Works in both browser (Vite) and test (Jest) environments
 */
export const getEnv = (key: string, defaultValue: string = ''): string => {
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
    return process.env[key] || defaultValue;
  }
  
  // Finally fall back to mocks (should only happen in tests)
  return mockEnvVars[key] || defaultValue;
};

/**
 * Environment and feature flag utility functions
 */

/**
 * Get the value of a feature flag from environment variables
 * 
 * @param flag - Feature flag name
 * @param defaultValue - Default value if flag is not defined
 * @returns Boolean indicating if feature is enabled
 */
export function getFeatureFlag(flag: string, defaultValue: boolean = false): boolean {
  const value = getEnv(`VITE_${flag}`);
  
  if (value === undefined) {
    return defaultValue;
  }
  
  return value === 'true' || value === '1';
}

/**
 * Check if the application is running in development mode
 */
export function isDevelopment(): boolean {
  return getEnv('NODE_ENV', 'development') === 'development';
}

/**
 * Check if the application is running in production mode
 */
export function isProduction(): boolean {
  return getEnv('NODE_ENV') === 'production';
}

/**
 * Get the API base URL from environment
 */
export function getApiBaseUrl(): string {
  return getEnv('VITE_API_BASE_URL', 'http://localhost:8080');
}

/**
 * Get the analytics API URL from environment
 */
export function getAnalyticsApiUrl(): string {
  return getEnv('VITE_ANALYTICS_API_URL', 'http://localhost:8081/api/v1');
}

/**
 * Get the current version of the application
 */
export function getAppVersion(): string {
  return getEnv('VITE_APP_VERSION', '0.0.0');
}