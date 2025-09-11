/**
 * Environment utilities for Vite/browser environment
 * Provides fallbacks for Node.js dependencies
 */

// Browser-compatible environment variable access
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // In Vite, environment variables are available through import.meta.env
  if (typeof window !== 'undefined' && import.meta && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  
  // Fallback for test environments or other scenarios
  if (typeof window !== 'undefined' && (window as any).__ENV__) {
    return (window as any).__ENV__[key] || defaultValue;
  }
  
  return defaultValue;
};

// Alias for compatibility
export const getEnv = getEnvVar;

export const getEnvironmentVariable = (key: string, defaultValue?: string): string => {
  try {
    let value = getEnvVar(key, defaultValue || '');
    
    // For production builds, use compile-time environment variables
    if (!value && typeof defaultValue === 'string') {
      value = defaultValue;
    }
    
    return value;
  } catch (error) {
    console.warn(`Failed to get environment variable ${key}:`, error);
    return defaultValue || '';
  }
};

export const getApiUrl = (key: string = 'VITE_API_URL', defaultValue?: string): string => {
  try {
    return getEnvVar(key, defaultValue || '');
  } catch (error) {
    console.warn(`Failed to get API URL from ${key}:`, error);
    return defaultValue || '';
  }
};

export const isDevelopment = (): boolean => {
  try {
    return getEnvVar('MODE') === 'development' || getEnvVar('DEV') === 'true';
  } catch (error) {
    console.warn('Failed to determine development mode:', error);
    return false;
  }
};

export const isProduction = (): boolean => {
  try {
    return getEnvVar('MODE') === 'production' || getEnvVar('PROD') === 'true';
  } catch (error) {
    console.warn('Failed to determine production mode:', error);
    return false;
  }
};

export const getFeatureFlag = (key: string, defaultValue: boolean = false): boolean => {
  try {
    const value = getEnvVar(`VITE_FEATURE_${key.toUpperCase()}`, String(defaultValue));
    return value === 'true' || value === '1';
  } catch (error) {
    console.warn(`Failed to get feature flag ${key}:`, error);
    return defaultValue;
  }
};