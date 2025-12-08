import { apiClient } from '../services/apiClient';

/**
 * Generic API request function with error handling
 * 
 * @param endpoint - API endpoint
 * @param options - Request options like method, body, etc.
 * @returns Promise with response data
 */
export async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await apiClient.request({
      url: endpoint,
      method: options.method || 'GET',
      data: options.body ? JSON.parse(options.body as string) : undefined,
      headers: headers as Record<string, string>,
    });

    return response.data as T;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Check if the application is currently online
 * 
 * @returns Promise<boolean> indicating online status
 */
export async function isOnline(): Promise<boolean> {
  try {
    // Make a lightweight request to check connectivity
    await apiClient.head('/health/status');
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper to handle offline fallback for API requests
 * 
 * @param key - Cache key for local storage
 * @param fetchFn - Function to fetch data when online
 * @param maxAge - Maximum age of cached data in milliseconds (default: 24 hours)
 * @returns Promise with response data (either fresh or cached)
 */
export async function withOfflineFallback<T>(
  key: string,
  fetchFn: () => Promise<T>,
  maxAge: number = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
): Promise<T> {
  try {
    // Check if we're online
    if (await isOnline()) {
      // If online, fetch fresh data
      const data = await fetchFn();
      
      // Cache the fresh data
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      
      return data;
    } else {
      // If offline, try to use cached data
      const cached = localStorage.getItem(key);
      
      if (!cached) {
        throw new Error('No cached data available and you are offline');
      }
      
      const { data, timestamp } = JSON.parse(cached);
      
      // Check if cached data is still valid
      if (Date.now() - timestamp > maxAge) {
        console.warn('Using outdated cached data');
      }
      
      return data as T;
    }
  } catch (error) {
    console.error('Failed to fetch data with offline fallback:', error);
    throw error;
  }
}