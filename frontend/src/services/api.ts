import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { Bus, Stop, Location, BusLocationReport, BusLocation, RewardPoints, ConnectingRoute, RouteContribution } from '../types/index';
import SecurityService from './securityService';

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
  // Use environment variables with proper fallbacks for different environments
  const getEnvVar = (key: string, defaultValue: string = '') => {
    // In browser environment with Vite
    if (typeof window !== 'undefined' && (window as any).importMeta?.env) {
      return (window as any).importMeta.env[key] || defaultValue;
    }
    // In test environment or Node.js environment
    if (typeof globalThis !== 'undefined' && (globalThis as any).process?.env) {
      return (globalThis as any).process.env[key] || defaultValue;
    }
    // Fallback for any other environment
    return defaultValue;
  };

  const instance = axios.create({
    baseURL: getEnvVar('VITE_API_URL', ''),
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-API-Key': getEnvVar('VITE_API_KEY', ''),
    },
    timeout: 30000, // 30 second timeout
  });

  // Add safety check for interceptors (prevents test errors)
  if (instance && instance.interceptors) {
    // Add request interceptor for security headers
    instance.interceptors.request.use(
      (config) => {
        // Add security headers
        config.headers['X-Request-ID'] = generateRequestId();
        config.headers['X-Client-Version'] = getEnvVar('VITE_APP_VERSION', '1.0.0');
        
        // Add rate limiting check with safety check
        if (SecurityService && SecurityService.isRequestAllowed && !SecurityService.isRequestAllowed(config.url || '')) {
          return Promise.reject(new Error('Rate limit exceeded'));
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for security validation
    instance.interceptors.response.use(
      (response) => {
        // Validate security headers in response
        const rateLimit = response.headers['x-rate-limit-remaining'];
        
        if (rateLimit && parseInt(rateLimit) < 10) {
          console.warn('Rate limit warning: Only', rateLimit, 'requests remaining');
        }

        // Log security level for monitoring
        if (response.headers['x-security-level']) {
          console.debug('Security level:', response.headers['x-security-level']);
        }

        return response;
      },
      (error) => {
        if (error.response?.status === 429) {
          console.error('Rate limit exceeded');
          if (SecurityService && SecurityService.handleSecurityBreach) {
            SecurityService.handleSecurityBreach('Rate limit exceeded');
          }
        }
        return Promise.reject(error);
      }
    );
  }

  return instance;
};

// Generate unique request ID for tracking
function generateRequestId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Default API instance
let api = createApiInstance();

// Export api instance for direct use in services
export { api };

// For testing purposes - allows injecting a mock in test environment only
export const setApiInstance = (instance: AxiosInstance): void => {
  // Check if we're in test environment using safer methods
  const isTestEnv = typeof globalThis !== 'undefined' && 
    ((globalThis as any).process?.env?.NODE_ENV === 'test' || 
     (globalThis as any).vitest !== undefined ||
     typeof (globalThis as any).expect !== 'undefined');
     
  if (isTestEnv) {
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
 * Get current bus locations for live tracking
 */
export const getCurrentBusLocations = async (): Promise<BusLocation[]> => {
  try {
    console.log('Fetching current bus locations from API...');
    const response = await api.get('/api/v1/bus-tracking/live');
    
    // The response structure is Map<Long, BusLocationDTO> from backend
    // Convert from object map to array if needed
    let busLocations: BusLocation[] = [];
    
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      busLocations = Object.values(response.data);
    } else if (Array.isArray(response.data)) {
      busLocations = response.data;
    }
    
    // Validate and log coordinates
    busLocations.forEach(bus => {
      console.log(`Bus ${bus.busNumber}: lat=${bus.latitude}, lng=${bus.longitude}`);
      if (!bus.latitude || !bus.longitude) {
        console.warn(`Bus ${bus.busNumber} missing coordinates:`, bus);
      }
    });
    
    console.log(`Retrieved ${busLocations.length} bus locations`);
    return busLocations;
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
 * Get available destinations for a given location
 * @param fromLocationId The ID of the origin location
 * @param language The language code (e.g., 'en', 'ta') for localized destination names
 */
export const getDestinations = async (fromLocationId?: number, language?: string): Promise<Location[]> => {
  try {
    console.log('getDestinations: Starting destinations fetch');
    const response = await api.get('/api/v1/bus-schedules/destinations', {
      params: {
        fromLocationId,
        lang: language || 'en'
      }
    });
    console.log('getDestinations: Online API response received', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching destinations:', error);
    throw new ApiError('Failed to fetch destinations. Please try again.');
  }
};

/**
 * Get buses between two locations by location IDs
 * @param fromLocationId The ID of the origin location
 * @param toLocationId The ID of the destination location
 */
export const getBuses = async (fromLocationId: number, toLocationId: number): Promise<Bus[]> => {
  try {
    console.log(`getBuses: Fetching buses from ${fromLocationId} to ${toLocationId}`);
    const response = await api.get('/api/v1/bus-schedules/buses', {
      params: {
        fromLocationId,
        toLocationId
      }
    });
    console.log('getBuses: Online API response received', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching buses:', error);
    throw new ApiError('Failed to fetch buses. Please try again.');
  }
};

/**
 * Search for buses between two locations using the enhanced endpoint
 * This automatically includes direct buses, intermediate stops, and continuing buses
 */
export const searchBuses = async (
  fromLocation: Location, 
  toLocation: Location,
  includeContinuing: boolean = true
): Promise<Bus[]> => {
  try {
    const response = await api.get('/api/v1/bus-schedules/search', {
      params: {
        fromLocationId: fromLocation.id,
        toLocationId: toLocation.id,
        includeContinuing: includeContinuing
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching buses:', error);
    throw new ApiError('Failed to search for buses. Please try again.');
  }
};

/**
 * Search for buses that pass through both locations as stops (including intermediate stops)
 * This includes buses where these locations are intermediate stops on a longer route
 * For example: Chennai to Madurai bus via Trichy will appear when searching Chennai to Trichy
 */
export const searchBusesViaStops = async (
  fromLocation: Location, 
  toLocation: Location
): Promise<Bus[]> => {
  try {
    const response = await api.get('/api/v1/bus-schedules/search-via-stops', {
      params: {
        fromLocationId: fromLocation.id,
        toLocationId: toLocation.id
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching buses via stops:', error);
    throw new ApiError('Failed to search for buses via intermediate stops. Please try again.');
  }
};

/**
 * Search for buses that continue beyond the destination city
 * This shows buses that go from origin to destination and then continue to other cities
 * For example: Chennai to Trichy search will show Chennai->Madurai bus (via Trichy)
 */
export const searchBusesContinuingBeyondDestination = async (
  fromLocation: Location, 
  toLocation: Location
): Promise<Bus[]> => {
  try {
    const response = await api.get('/api/v1/bus-schedules/search-continuing-beyond', {
      params: {
        fromLocationId: fromLocation.id,
        toLocationId: toLocation.id
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching buses continuing beyond destination:', error);
    throw new ApiError('Failed to search for buses continuing beyond destination. Please try again.');
  }
};

/**
 * Get stops for a specific bus
 */
export const getStops = async (busId: number, languageCode: string = 'en'): Promise<Stop[]> => {
  try {
    console.log(`Fetching stops for bus ${busId} with language ${languageCode}`);
    // Use the public basic stops endpoint instead of the premium one
    const response = await api.get(`/api/v1/bus-schedules/buses/${busId}/stops/basic`, {
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
    // Format data properly for the backend
    const formattedData = {
      ...data,
      // Ensure these fields are included and properly formatted
      busNumber: data.busNumber || '',
      busName: data.route || data.busName || '',
      fromLocationName: data.origin || data.fromLocationName || '',
      toLocationName: data.destination || data.toLocationName || '',
      // Make sure coordinates are sent as numbers, not strings
      fromLatitude: data.fromLatitude ? Number(data.fromLatitude) : undefined,
      fromLongitude: data.fromLongitude ? Number(data.fromLongitude) : undefined,
      toLatitude: data.toLatitude ? Number(data.toLatitude) : undefined,
      toLongitude: data.toLongitude ? Number(data.toLongitude) : undefined,
      // Convert detailed stops if present
      stops: data.detailedStops ? data.detailedStops.map(stop => ({
        name: stop.name,
        latitude: stop.latitude,
        longitude: stop.longitude,
        arrivalTime: stop.arrivalTime || '',
        departureTime: stop.departureTime || '',
        stopOrder: stop.order || 0
      })) : [],
      submittedBy: data.submittedBy || 'anonymous'
    };

    // Temporary debugging logs
    console.log('Submitting route contribution with data:', JSON.stringify(formattedData, null, 2));
    
    const response = await api.post(`/api/v1/contributions/routes`, formattedData);
    
    console.log('Route contribution submission response:', response.data);
    return response.data;
  } catch (error) {
    // Temporary debugging logs
    console.error('Route contribution submission error details:', error);
    return handleApiError(error);
  }
};

/**
 * Submit an image contribution with enhanced AI/OCR processing
 * 
 * @param formData FormData containing image file and metadata
 * @returns Promise with the submission result
 */
export const submitImageContribution = async (formData: FormData) => {
  try {
    console.log('Submitting image contribution...');
    
    const response = await api.post('/api/v1/contributions/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000 // 60 second timeout for image upload and processing
    });

    console.log('Image contribution submission response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Image contribution submission error:', error);
    if (error.response) {
      throw new ApiError(
        error.response.data?.message || 'Failed to submit image contribution',
        error.response.status,
        error.response.data?.errorCode
      );
    }
    throw new ApiError('Failed to submit image contribution. Please try again.');
  }
};

/**
 * Submit an image contribution with enhanced AI/OCR processing
 * 
 * @param formData FormData containing image file and metadata
 * @returns Promise with the submission result
 */
export const submitImageContributionWithProcessing = async (formData: FormData) => {
  try {
    console.log('Submitting image contribution...');
    
    const response = await api.post('/api/v1/contributions/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000 // 60 second timeout for image upload and processing
    });

    console.log('Image contribution submission response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Image contribution submission error:', error);
    if (error.response) {
      throw new ApiError(
        error.response.data?.message || 'Failed to submit image contribution',
        error.response.status,
        error.response.data?.errorCode
      );
    }
    throw new ApiError('Failed to submit image contribution. Please try again.');
  }
};

/**
 * Get the processing status of an image contribution
 * 
 * @param contributionId The ID of the image contribution
 * @returns Promise with the current processing status
 */
export const getImageProcessingStatus = async (contributionId: string) => {
  try {
    const response = await api.get(`/api/v1/contributions/images/${contributionId}/status`);
    return response.data;
  } catch (error: any) {
    console.error('Error getting image processing status:', error);
    if (error.response) {
      throw new ApiError(
        error.response.data?.message || 'Failed to get processing status',
        error.response.status,
        error.response.data?.errorCode
      );
    }
    throw new ApiError('Failed to get processing status. Please try again.');
  }
};

/**
 * Retry processing for a failed image contribution
 * 
 * @param contributionId The ID of the image contribution to retry
 * @returns Promise with the retry result
 */
export const retryImageProcessing = async (contributionId: string) => {
  try {
    const response = await api.post(`/api/v1/contributions/images/${contributionId}/retry`);
    return response.data;
  } catch (error: any) {
    console.error('Error retrying image processing:', error);
    if (error.response) {
      throw new ApiError(
        error.response.data?.message || 'Failed to retry processing',
        error.response.status,
        error.response.data?.errorCode
      );
    }
    throw new ApiError('Failed to retry processing. Please try again.');
  }
};

/**
 * Get image processing statistics (admin only)
 * 
 * @returns Promise with processing statistics
 */
export const getImageProcessingStatistics = async () => {
  try {
    const response = await api.get('/api/v1/contributions/images/admin/stats');
    return response.data;
  } catch (error: any) {
    console.error('Error getting image processing statistics:', error);
    if (error.response) {
      throw new ApiError(
        error.response.data?.message || 'Failed to get processing statistics',
        error.response.status,
        error.response.data?.errorCode
      );
    }
    throw new ApiError('Failed to get processing statistics. Please try again.');
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
 * Analyze an uploaded image to extract bus schedule information
 * 
 * @param file The image file to analyze
 * @returns Promise with AI analysis results including smart suggestions
 */
export const analyzeScheduleImage = async (file: File): Promise<{
  busNumber?: string;
  route?: string;
  fromLocation?: string;
  toLocation?: string;
  departureTime?: string;
  arrivalTime?: string;
  confidence: number;
  extractedText?: string;
  suggestions?: {
    busNumber?: string;
    route?: string;
  };
}> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/api/v1/contributions/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000 // 30 second timeout for AI processing
    });

    return response.data;
  } catch (error: any) {
    console.error('Error analyzing image:', error);
    if (error.response) {
      throw new ApiError(
        error.response.data?.message || 'Failed to analyze image',
        error.response.status,
        error.response.data?.errorCode
      );
    }
    throw new ApiError('Failed to analyze image. Please try again.');
  }
};

/**
 * Enhanced validation service for contributions
 */
export const validateRouteContribution = async (data: RouteContribution): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> => {
  try {
    const response = await api.post('/api/v1/contributions/validate', data);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Check for potential duplicates before submission
 */
export const checkDuplicateRoute = async (busNumber: string, fromLocation: string, toLocation: string) => {
  try {
    const response = await api.post('/api/v1/contributions/check-duplicate', {
      busNumber,
      fromLocation,
      toLocation
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get location suggestions with validation
 */
export const getLocationSuggestions = async (query: string, type: 'origin' | 'destination') => {
  try {
    const response = await api.get(`/api/v1/locations/suggest`, {
      params: { query, type }
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
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
