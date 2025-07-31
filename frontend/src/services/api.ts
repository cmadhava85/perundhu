import axios from 'axios';
import type { AxiosInstance, AxiosResponse, Method } from 'axios';
import type { Bus, Stop, Location, BusLocationReport, BusLocation, RewardPoints, ConnectingRoute, RouteContribution, ImageContribution } from '../types/index';
import { getLocationsOffline } from './offlineService';

/**
 * Generic request function to be used by other services
 * @param method HTTP method
 * @param url API endpoint
 * @param data Optional request body data
 * @param params Optional query parameters
 * @returns Promise with the response
 */
export const apiRequest = async <T>(
  method: Method, 
  url: string, 
  data?: any, 
  params?: any
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await api.request({
      method,
      url,
      data,
      params
    });
    return response.data;
  } catch (error) {
    console.error(`API Request Error (${method} ${url}):`, error);
    throw new ApiError(`Failed to ${method.toLowerCase()} ${url}. Please try again.`);
  }
};

/**
 * Custom error class for API errors with additional properties
 */
export class ApiError extends Error {
  status?: number;
  code?: string;
  
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    
    // This is needed for instanceof to work correctly in TypeScript
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Interface for pagination parameters
 */
export interface PaginationParams {
  page: number;
  size: number;
}

/**
 * Interface for paginated response
 */
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Helper function to safely get environment variables in both Jest and Vite environments
const getEnv = (key: string, defaultValue: string): string => {
  // Jest environment (Node.js)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  // Support for Jest test environment with mocked import.meta
  if (typeof global !== 'undefined' && 
      (global as any).import && 
      (global as any).import.meta && 
      (global as any).import.meta.env && 
      (global as any).import.meta.env[key]) {
    return (global as any).import.meta.env[key];
  }
  
  // Vite environment (browser)
  // Safe access without direct import.meta reference
  try {
    // @ts-ignore - For Vite/browser environment
    if (typeof window !== 'undefined' && window.__VITE_ENV__ && window.__VITE_ENV__[key]) {
      // @ts-ignore - Get from injected object
      return window.__VITE_ENV__[key];
    }
  } catch (e) {
    console.warn(`Error accessing environment variable ${key}, using default value`);
  }
  
  return defaultValue;
};

// Create axios instance with common configuration
export const createApiInstance = (): AxiosInstance => {
  // Use the safe environment variable getter
  const apiUrl = getEnv('VITE_API_URL', getEnv('VITE_API_BASE_URL', 'http://localhost:8080'));
  
  // Log API URL to help with debugging
  console.log(`Creating API instance with baseURL: ${apiUrl}`);
  
  return axios.create({
    baseURL: apiUrl,
    headers: {
      'Content-Type': 'application/json',
    },
    // Disable caching to always get fresh data from the backend
    params: {
      _: new Date().getTime() // Add timestamp to prevent caching
    }
  });
};

// Default API instance
let api = createApiInstance();

// Export api instance for direct use in services
export { api };

// For testing purposes - allows injecting a mock in test environment only
export const setApiInstance = (instance: AxiosInstance): void => {
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
    api = instance;
  } else {
    console.warn('Attempted to set API instance outside of test environment - ignored');
  }
};

// Offline mode state management
let isOfflineMode = false;
let lastOnlineTime: Date | null = null;

/**
 * Set offline mode status
 * @param status True to enable offline mode, false to disable
 */
export const setOfflineMode = (status: boolean): void => {
  isOfflineMode = status;
  if (!status) {
    // If going online, update last online time
    lastOnlineTime = new Date();
  }
  console.log(`Offline mode ${status ? 'enabled' : 'disabled'}`);
};

/**
 * Get current offline mode status
 * @returns Current offline mode status
 */
export const getOfflineMode = (): boolean => {
  return isOfflineMode;
};

/**
 * Get the age of offline data in minutes
 * @returns Age of offline data in minutes, or null if never been online
 */
export const getOfflineDataAge = (): number | null => {
  if (!lastOnlineTime) return null;
  
  const now = new Date();
  const diffMs = now.getTime() - lastOnlineTime.getTime();
  return Math.floor(diffMs / (1000 * 60)); // Convert to minutes
};

/**
 * Check if the application is online by making a lightweight request
 * @returns Promise resolving to true if online, false if offline
 */
export const checkOnlineStatus = async (): Promise<boolean> => {
  try {
    // Make a HEAD request to Spring Boot's standard health endpoint
    await api.head('/actuator/health');
    
    // If successful, ensure we're in online mode
    if (isOfflineMode) {
      console.log('Connection restored. Switching to online mode.');
    }
    setOfflineMode(false);
    return true;
  } catch (error) {
    console.error('Network connection appears to be offline, or backend server is not available', error);
    
    // Only set offline mode if we're truly offline - we want to keep trying to reach the real backend
    // This ensures we don't fall back to mock/stub data in production
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      setOfflineMode(true);
    } else {
      // In production, we don't want to use mock data, so we don't set offline mode
      console.error('Backend server connection failed in production environment');
    }
    return false;
  }
};

/**
 * Get current bus locations for tracking
 * @returns Promise with the current bus locations
 */
export const getCurrentBusLocations = async (): Promise<BusLocation[]> => {
  try {
    const response = await api.get('/api/v1/bus-tracking/live');
    
    // The backend can return either Map<Long, BusLocationDTO> or BusLocation[]
    // Properly handle both formats to ensure consistent array response
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      // If it's an object map (Map<Long, BusLocationDTO>), convert to array
      return Object.values(response.data).map(location => transformBusLocation(location));
    }
    
    // If it's already an array, ensure all required fields
    return Array.isArray(response.data) ? response.data.map(location => transformBusLocation(location)) : [];
  } catch (error) {
    console.error('Error fetching current bus locations:', error);
    if (isOfflineMode) {
      // Return empty array in offline mode
      return [];
    }
    throw new ApiError('Failed to fetch current bus locations. Please try again.');
  }
};

/**
 * Get all available locations for origin and destination
 * @param language The language code (e.g., 'en', 'ta') for localized location names
 */
export const getLocations = async (language?: string): Promise<Location[]> => {
  try {
    console.log('getLocations: Starting location fetch');
    const response = await api.get('/api/v1/bus-schedules/locations', {
      params: {
        lang: language || 'en' // Default to English if language not provided
      }
    });
    console.log('getLocations: Online API response received', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw new ApiError('Failed to fetch locations. Please try again.');
  }
};

/**
 * Search for buses between two locations
 */
export const searchBuses = async (
  fromLocation: Location, 
  toLocation: Location
): Promise<Bus[]> => {
  try {
    const response = await api.get('/api/v1/bus-schedules/search', {
      params: {
        fromLocationId: fromLocation.id,
        toLocationId: toLocation.id
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching buses:', error);
    throw new ApiError('Failed to search for buses. Please try again.');
  }
};

/**
 * Search for buses that pass through specific locations (even as intermediate stops)
 * This finds buses that have both locations as stops in their route, in the correct order
 */
export const searchBusesViaStops = async (
  fromLocation: Location | number, 
  toLocation: Location | number
): Promise<Bus[]> => {
  try {
    // Extract location IDs based on what was passed
    const fromId = typeof fromLocation === 'number' ? fromLocation : fromLocation.id;
    const toId = typeof toLocation === 'number' ? toLocation : toLocation.id;
    
    const response = await api.get('/api/v1/bus-schedules/search/via-stops', {
      params: {
        fromLocationId: fromId,
        toLocationId: toId
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching buses via stops:', error);
    throw new ApiError('Failed to search for buses via stops. Please try again.');
  }
};

/**
 * Get stops for a specific bus
 */
export const getStops = async (busId: number, languageCode: string = 'en'): Promise<Stop[]> => {
  try {
    console.log(`Fetching stops for bus ${busId} with language ${languageCode}`);
    const response = await api.get(`/api/v1/bus-schedules/${busId}/stops`, {
      params: { lang: languageCode }
    });
    console.log('Stops API response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching stops for bus ${busId}:`, error);
    throw new ApiError(`Failed to fetch bus stops for bus ID ${busId}. Please try again.`);
  }
};

/**
 * Get connecting routes between two locations
 * @param fromLocation Location object or location ID
 * @param toLocation Location object or location ID
 */
export const getConnectingRoutes = async (
  fromLocation: Location | number, 
  toLocation: Location | number
): Promise<ConnectingRoute[]> => {
  try {
    // Extract location IDs based on what was passed
    const fromId = typeof fromLocation === 'number' ? fromLocation : fromLocation.id;
    const toId = typeof toLocation === 'number' ? toLocation : toLocation.id;
    
    const response = await api.get('/api/v1/bus-schedules/connecting-routes', {
      params: {
        fromLocationId: fromId,
        toLocationId: toId
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching connecting routes:', error);
    throw new ApiError('Failed to fetch connecting routes. Please try again.');
  }
};

/**
 * Report bus location during tracking
 */
export const reportBusLocation = async (
  busId: number,
  report: BusLocationReport
): Promise<boolean> => {
  try {
    await api.post(`/api/v1/bus-tracking/report`, {
      busId,
      ...report,
      timestamp: report.timestamp || new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error reporting bus location:', error);
    throw new ApiError('Failed to report bus location. Please try again.');
  }
};

/**
 * Log that user disembarked from bus
 */
export const disembarkBus = async (
  busId: number,
  stopId: number
): Promise<boolean> => {
  try {
    await api.post(`/api/v1/bus-tracking/disembark/${busId}`, {
      stopId,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error logging disembarking:', error);
    throw new ApiError('Failed to log disembarking. Please try again.');
  }
};

/**
 * Get live bus locations for a route
 */
export const getLiveBusLocations = async (
  fromLocation: Location,
  toLocation: Location
): Promise<BusLocation[]> => {
  try {
    const response = await api.get(`/api/v1/bus-tracking/route/${fromLocation.id}/${toLocation.id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching live bus locations:', error);
    throw new ApiError('Failed to fetch live bus locations. Please try again.');
  }
};

/**
 * Get user reward points
 */
export const getUserRewardPoints = async (userId: string): Promise<RewardPoints> => {
  try {
    const response = await api.get(`/api/v1/bus-tracking/rewards/${userId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching reward points:', error);
    // Using our ApiError class for better error handling
    if (error.response) {
      throw new ApiError(
        'Failed to fetch reward points',
        error.response.status,
        error.response.data?.errorCode
      );
    }
    throw new ApiError('Failed to fetch reward points. Please try again.');
  }
};

// Error handler utility for consistent error responses
export const handleApiError = (error: any): never => {
  console.error('API error:', error);
  if (error.response) {
    throw new ApiError(
      error.response.data?.message || 'An error occurred with the API request',
      error.response.status,
      error.response.data?.errorCode
    );
  }
  throw new ApiError('Failed to connect to the server. Please check your internet connection.');
};

/**
 * Submit a user-contributed bus route
 * 
 * @param data Route contribution data
 * @returns Promise with the submission result
 */
export const submitRouteContribution = async (data: RouteContribution) => {
  try {
    const response = await api.post(`/api/v1/contributions/routes`, data);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Submit an image of a bus schedule
 * 
 * @param data Metadata about the image
 * @param file The image file to upload
 * @returns Promise with the submission result
 */
export const submitImageContribution = async (data: ImageContribution, file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data', JSON.stringify(data));

    const response = await api.post(
      `/api/v1/contributions/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get all contributions for the current user
 *
 * @param userId The ID of the user
 * @returns Promise with an array of contribution objects
 */
export const getUserContributions = async (userId: string) => {
  try {
    const response = await api.get(`/api/v1/contributions/user/${userId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get all contributions (for admin users)
 *
 * @returns Promise with an array of all contributions
 */
export const getAllContributions = async () => {
  try {
    const response = await api.get(`/api/admin/contributions/all`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get pending route contributions (for admin review)
 *
 * @returns Promise with array of pending route contributions
 */
export const getPendingRouteContributions = async () => {
  try {
    const response = await api.get(`/api/admin/contributions/routes/pending`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get pending image contributions (for admin review)
 *
 * @returns Promise with array of pending image contributions
 */
export const getPendingImageContributions = async () => {
  try {
    const response = await api.get(`/api/admin/contributions/images/pending`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Approve a route contribution
 *
 * @param id The ID of the contribution to approve
 * @returns Promise with the updated contribution
 */
export const approveRouteContribution = async (id: string) => {
  try {
    const response = await api.post(`/api/admin/contributions/routes/${id}/approve`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Reject a route contribution
 *
 * @param id The ID of the contribution to reject
 * @param reason The reason for rejection
 * @returns Promise with the updated contribution
 */
export const rejectRouteContribution = async (id: string, reason: string) => {
  try {
    const response = await api.post(`/api/admin/contributions/routes/${id}/reject`, { reason });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Approve an image contribution
 *
 * @param id The ID of the contribution to approve
 * @returns Promise with the updated contribution
 */
export const approveImageContribution = async (id: string) => {
  try {
    const response = await api.post(`/api/admin/contributions/images/${id}/approve`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Reject an image contribution
 *
 * @param id The ID of the contribution to reject
 * @param reason The reason for rejection
 * @returns Promise with the updated contribution
 */
export const rejectImageContribution = async (id: string, reason: string) => {
  try {
    const response = await api.post(`/api/admin/contributions/images/${id}/reject`, { reason });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get the status of a user's contributions
 * 
 * @returns Promise with an array of contribution status objects
 */
export const getContributionStatus = async () => {
  try {
    const response = await api.get(`/api/v1/contributions/status`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Search for locations by name
 * This API will first check the database for matching locations
 * If not found or insufficient results, it will use the map API as fallback
 * 
 * @param query The search query
 * @param limit Maximum number of results to return (default 10)
 * @returns Promise with matching locations
 */
export const searchLocations = async (query: string, limit = 10): Promise<Location[]> => {
  if (!query || query.length < 2) {
    return [];
  }
  
  try {
    // First search in database
    console.log(`searchLocations: Searching for "${query}" in database`);
    const response = await api.get('/api/v1/locations/search', {
      params: { 
        query,
        limit,
        source: 'database' // Explicitly request database search first
      }
    });
    
    const dbResults = response.data;
    console.log(`searchLocations: Found ${dbResults.length} database results for "${query}"`);
    
    // If we have enough results from DB, return them
    if (dbResults.length >= limit) {
      return dbResults;
    }
    
    // If database has no results or insufficient results, check map API
    try {
      console.log(`searchLocations: Not enough database results, trying map API for "${query}"`);
      const mapResponse = await api.get('/api/v1/locations/search', {
        params: { 
          query,
          limit: limit - dbResults.length, // Only get what we still need
          source: 'map' // Explicitly request map API search
        }
      });
      
      const mapResults = mapResponse.data;
      console.log(`searchLocations: Found ${mapResults.length} map API results for "${query}"`);
      
      // Combine results, prioritizing database results
      const combinedResults = [...dbResults, ...mapResults].slice(0, limit);
      return combinedResults;
    } catch (mapError) {
      console.warn('Map API search failed, returning database results only:', mapError);
      return dbResults;
    }
  } catch (error) {
    console.error('Error searching locations:', error);
    
    // Try offline data as last resort
    if (isOfflineMode) {
      try {
        const offlineLocations = await getLocationsOffline();
        console.log(`searchLocations: Using offline data for "${query}"`);
        // Filter locations based on query
        return offlineLocations.filter(location => 
          location.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, limit);
      } catch (offlineError) {
        console.error('Error getting offline locations:', offlineError);
      }
    }
    
    throw new ApiError('Failed to search locations. Please try again.');
  }
};

/**
 * API Service class for managing API calls
 */
export class APIService {
  private axios: AxiosInstance;

  constructor() {
    this.axios = createApiInstance();
  }

  /**
   * Gets bus schedules with optional pagination support
   * @param paginationParams Optional pagination parameters
   * @returns Promise with bus schedules, potentially paginated
   */
  async getBusSchedules(paginationParams?: PaginationParams): Promise<PaginatedResponse<Bus> | Bus[]> {
    try {
      let url = '/api/bus/schedules';
      
      // Add pagination parameters if provided
      if (paginationParams) {
        url += `?page=${paginationParams.page}&size=${paginationParams.size}`;
        const response = await this.axios.get(url);
        return response.data;
      } else {
        // Original implementation without pagination
        const response = await this.axios.get(url);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching bus schedules:', error);
      throw error;
    }
  }
}

/**
 * Transform bus location data to BusLocation type
 * @param location The raw location data
 * @returns Transformed BusLocation object
 */
export const transformBusLocation = (location: any): BusLocation => {
  if (!location) {
    throw new Error('Cannot transform undefined or null bus location');
  }

  const typedLocation = location as Record<string, any>;
  
  return {
    busId: typedLocation.busId || 0,
    busName: typedLocation.busName || "",
    busNumber: typedLocation.busNumber || "",
    fromLocation: typedLocation.fromLocation || "",
    toLocation: typedLocation.toLocation || "",
    latitude: typedLocation.latitude || 0,
    longitude: typedLocation.longitude || 0,
    speed: typedLocation.speed || 0,
    heading: typedLocation.heading || 0,
    timestamp: typedLocation.timestamp || new Date().toISOString(),
    lastReportedStopName: typedLocation.lastReportedStopName || "",
    nextStopName: typedLocation.nextStopName || "",
    estimatedArrivalTime: typedLocation.estimatedArrivalTime || "",
    reportCount: typedLocation.reportCount || 0,
    confidenceScore: typedLocation.confidenceScore || 0,
  };
};
