/**
 * API Key Service
 * Manages API key inclusion for requests to protected endpoints
 */

import { getEnv } from '../utils/environment';

// API Key configuration
const API_KEY = getEnv('VITE_PUBLIC_API_KEY', '');
const API_KEY_HEADER = 'X-API-Key';

/**
 * Check if API key is enabled
 */
export const isApiKeyEnabled = (): boolean => {
  return getEnv('VITE_API_KEY_ENABLED', 'false') === 'true' && API_KEY !== '';
};

/**
 * Get the API key header object for axios/fetch requests
 */
export const getApiKeyHeader = (): Record<string, string> => {
  if (!isApiKeyEnabled()) {
    return {};
  }

  return {
    [API_KEY_HEADER]: API_KEY,
  };
};

/**
 * Get the API key value
 */
export const getApiKey = (): string | null => {
  if (!isApiKeyEnabled()) {
    return null;
  }
  return API_KEY;
};

/**
 * Append API key to URL as query parameter (alternative to header)
 */
export const appendApiKeyToUrl = (url: string): string => {
  if (!isApiKeyEnabled()) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}api_key=${encodeURIComponent(API_KEY)}`;
};

export default {
  isApiKeyEnabled,
  getApiKeyHeader,
  getApiKey,
  appendApiKeyToUrl,
  API_KEY_HEADER,
};
