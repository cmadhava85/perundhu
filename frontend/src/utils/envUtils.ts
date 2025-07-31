/**
 * Environment utility functions for safely accessing environment variables
 * across different environments (browser, Node.js/Jest)
 */

/**
 * Safely get an environment variable with fallback
 * Works in both Vite/browser and Jest/Node environments
 * 
 * @param key - The environment variable key to retrieve
 * @param defaultValue - Default value if not found
 * @returns The environment variable value or default
 */
export function getEnv(key: string): string | undefined;
export function getEnv(key: string, defaultValue: string): string;
export function getEnv(key: string, defaultValue?: string): string | undefined {
  // Check browser/Vite environment variables
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  
  // Check Node.js/Jest environment
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  // Return default value or undefined
  return defaultValue;
}

/**
 * Check if the current environment is development
 * 
 * @returns True if in development mode
 */
export function isDevelopment(): boolean {
  return getEnv('NODE_ENV', 'development') === 'development' || 
         getEnv('MODE', 'development') === 'development';
}

/**
 * Check if the current environment is production
 * 
 * @returns True if in production mode
 */
export function isProduction(): boolean {
  return getEnv('NODE_ENV') === 'production' || 
         getEnv('MODE') === 'production';
}

/**
 * Check if a feature flag is enabled
 * 
 * @param featureName - Name of the feature flag (without the VITE_FEATURE_ prefix)
 * @param defaultValue - Default value if flag is not found
 * @returns Boolean indicating if feature is enabled
 */
export function isFeatureEnabled(featureName: string, defaultValue: boolean = false): boolean {
  const envKey = `VITE_FEATURE_${featureName.toUpperCase()}`;
  const value = getEnv(envKey);
  
  if (value === undefined) {
    return defaultValue;
  }
  
  return value === 'true' || value === '1';
}