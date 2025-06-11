/**
 * Mock implementation of the environment utilities for e2e tests
 */

export const getEnv = (key: string): string => {
  switch (key) {
    case 'VITE_API_URL':
      return 'http://localhost:8080';
    case 'VITE_GOOGLE_MAPS_API_KEY':
      return 'test-api-key';
    case 'VITE_FEATURE_TRACKING':
      return 'true';
    case 'VITE_FEATURE_REWARDS':
      return 'true';
    case 'VITE_FEATURE_ANALYTICS':
      return 'true';
    default:
      return '';
  }
};

export const getFeatureFlag = (key: string, defaultValue: boolean = false): boolean => {
  const value = getEnv(key);
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
};