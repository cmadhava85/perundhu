import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { Bus, Stop, Location, BusLocationReport, BusLocation, RewardPoints, ConnectingRoute, RouteContribution, ImageContribution } from '../types/index';

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

// Create axios instance with common configuration
export const createApiInstance = (): AxiosInstance => {
  return axios.create({
    baseURL: import.meta.env.VITE_API_URL || '', // Use environment variable or empty string
    headers: {
      'Content-Type': 'application/json',
    },
   
  });
};

// Default API instance
let api = createApiInstance();

// Export api instance for direct use in services
export { api };

// For testing purposes - allows injecting a mock in test environment only
export const setApiInstance = (instance: AxiosInstance): void => {
  if (process.env.NODE_ENV === 'test') {
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
    // Make a HEAD request to a reliable endpoint to check connectivity
    await api.head('/api/v1/health/status');
    setOfflineMode(false);
    return true;
  } catch (error) {
    setOfflineMode(true);
    console.warn('Network connection appears to be offline', error);
    return false;
  }
};

/**
 * Get current bus locations for tracking
 * @returns Promise with the current bus locations
 */
export const getCurrentBusLocations = async (): Promise<BusLocation[]> => {
  try {
    // Changed from '/api/v1/bus-tracking/current' to '/api/v1/bus-tracking/live'
    const response = await api.get('/api/v1/bus-tracking/live');
    
    // The response structure might be different (Map<Long, BusLocationDTO> vs BusLocation[])
    // Convert from object map to array if needed
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return Object.values(response.data);
    }
    return response.data;
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
  const response = await axios.get(`/api/v1/contributions/status`);
  return response.data;
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
