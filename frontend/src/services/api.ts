import axios from 'axios';
import type { AxiosInstance, AxiosResponse, Method, InternalAxiosRequestConfig } from 'axios';
import type { Bus, Stop, Location, BusLocationReport, BusLocation, RewardPoints, ConnectingRoute, RouteContribution, ImageContribution, BusStand, MultiStandSearchResponse, MultiStandCheckResponse } from '../types/index';
import { getLocationsOffline } from './offlineService';
import { setupRetryInterceptor } from './apiRetry';
import { csrfTokenManager } from '../utils/csrfTokenManager';
import { logger } from '../utils/logger';
import { traceContext, TRACE_HEADERS } from '../utils/traceId';

// Error types and utilities now live in ./http/apiError — re-exported here for backward compatibility.
export type { RequestData, PaginationParams, PaginatedResponse, ApiErrorResponse } from './http/apiError';
import { ApiError, handleApiError } from './http/apiError';
export { ApiError, handleApiError }; // re-export for backward compatibility

// Bus search / stop / connecting-route functions now live in ./busService — re-exported here for backward compatibility.
export { searchBuses, searchBusesViaStops, getStops, getConnectingRoutes } from './busService';

/**
 * Generic request function to be used by other services
 */
export const apiRequest = async <T>(
  method: Method,
  url: string,
  data?: RequestData,
  params?: RequestData
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await api.request({ method, url, data, params });
    return response.data;
  } catch (error) {
    logger.error(`API Request Error (${method} ${url}):`, error);
    throw new ApiError(`Failed to ${method.toLowerCase()} ${url}. Please try again.`);
  }
};

// Helper function to safely get environment variables in both Jest and Vite environments
const getEnv = (key: string, defaultValue: string): string => {
  // Vite environment (browser) - check import.meta.env first
  // This is the primary way Vite exposes environment variables
  try {
    if (import.meta?.env?.[key]) {
      return import.meta.env[key];
    }
  } catch {
    // import.meta not available (Node.js/Jest environment)
  }
  
  // Jest environment (Node.js)
  if (process?.env?.[key]) {
    return process.env[key];
  }
  
  // Define type for global mocks in test environment
  interface GlobalWithMeta {
    import: {
      meta: {
        env: Record<string, string>;
      };
    };
  }
  
  // Support for Jest test environment with mocked import.meta
  const g = globalThis as unknown as GlobalWithMeta;
  if (g?.import?.meta?.env?.[key]) {
    return g.import.meta.env[key];
  }
  
  return defaultValue;
};

// Create axios instance with common configuration
export const createApiInstance = (): AxiosInstance => {
  // Use the safe environment variable getter
  // If VITE_API_URL is empty string, use empty string (for Vite proxy in dev)
  // Otherwise fall back to VITE_API_BASE_URL or localhost:8080
  const envUrl = getEnv('VITE_API_URL', '');
  const apiUrl = envUrl !== '' ? envUrl : getEnv('VITE_API_BASE_URL', '');
  
  // Log API URL to help with debugging
  logger.debug(`Creating API instance with baseURL: ${apiUrl || '(using relative paths/proxy)'}`);
  
  const instance = axios.create({
    baseURL: apiUrl,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
    // NOTE: Removed cache-busting timestamp (_ parameter)
    // React Query handles caching via staleTime/gcTime
    // Axios cache buster was preventing response caching and causing N+1 requests
  });

  // Add request interceptor to attach traceId and CSRF token to all requests
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // Generate a new traceId for each request
      const traceId = traceContext.newTraceId();
      const sessionId = traceContext.getSessionId();
      
      // Add trace headers
      config.headers.set(TRACE_HEADERS.TRACE_ID, traceId);
      config.headers.set(TRACE_HEADERS.SESSION_ID, sessionId);
      
      // Add CSRF token for state-changing requests (POST, PUT, DELETE, PATCH)
      // But not for GET, OPTIONS, HEAD, or read-only validation endpoints
      const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase() || '');
      const isAnalyticsRequest = config.url?.includes('/v1/analytics/');
      const isImageAnalysis = config.url?.includes('/v1/contributions/analyze-image');
      const isVoiceTranscribe = config.url?.includes('/v1/contributions/voice/transcribe');
      
      if (isStateChanging && !isAnalyticsRequest && !isImageAnalysis && !isVoiceTranscribe) {
        try {
          // Wait for CSRF token before returning config
          // This ensures token is attached before request is sent
          const tokenInfo = await csrfTokenManager.getToken();
          config.headers.set(tokenInfo.headerName, tokenInfo.token);
        } catch (error) {
            logger.warn('Failed to add CSRF token to request:', { error });
          // Continue without CSRF token - server will reject if required
        }
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor to log responses with traceId
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Setup retry interceptor for resilience
  // Only retry on gateway/proxy errors - NOT 500 (React Query handles those)
  setupRetryInterceptor(instance, {
    maxRetries: 2,
    retryDelay: 1000,
    backoffMultiplier: 2,
    maxDelay: 5000,
    retryableStatusCodes: [408, 429, 502, 503, 504], // Removed 500 - let React Query handle it
    retryableErrorCodes: ['ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH', 'ERR_NETWORK'],
  });

  return instance;
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
    logger.warn('Attempted to set API instance outside of test environment - ignored');
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
  logger.debug(`Offline mode ${status ? 'enabled' : 'disabled'}`);
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
      logger.debug('Connection restored. Switching to online mode.');
    }
    setOfflineMode(false);
    return true;
  } catch (error) {
    logger.error('Network connection appears to be offline, or backend server is not available', error);
    
    // Only set offline mode if we're truly offline - we want to keep trying to reach the real backend
    // This ensures we don't fall back to mock/stub data in production
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      setOfflineMode(true);
    } else {
      // In production, we don't want to use mock data, so we don't set offline mode
      logger.error('Backend server connection failed in production environment');
    }
    return false;
  }
};

/**
 * Get current bus locations for tracking
 * @returns Promise with the current bus locations
 */
export const getCurrentBusLocations = async (signal?: AbortSignal): Promise<BusLocation[]> => {
  try {
    const response = await api.get('/v1/bus-tracking/live', { signal });
    
    // The backend can return either Map<Long, BusLocationDTO> or BusLocation[]
    // Properly handle both formats to ensure consistent array response
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      // If it's an object map (Map<Long, BusLocationDTO>), convert to array
      return Object.values(response.data).map(location => transformBusLocation(location as RawBusLocation));
    }
    
    // If it's already an array, ensure all required fields
    return Array.isArray(response.data) ? response.data.map(location => transformBusLocation(location as RawBusLocation)) : [];
  } catch (error) {
    logger.error('Error fetching current bus locations:', error);
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
    logger.debug('getLocations: Starting location fetch');
    const response = await api.get('/v1/bus-schedules/locations', {
      params: {
        lang: language || 'en' // Default to English if language not provided
      }
    });
    logger.debug('getLocations: Online API response received', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error fetching locations:', error);
    throw new ApiError('Failed to fetch locations. Please try again.');
  }
};

// BusDTO and transformBusDTOToBus are kept here for searchBusesMultiStand — other bus
// search functions have moved to ./busService and are re-exported above.

interface BusDTO {
  id: number;
  number: string;
  name: string;
  operator: string;
  type: string;
  departureTime?: string;
  arrivalTime?: string;
  rating?: number;
  features?: Record<string, string>;
  fromLocationId?: number;
  fromLocationName?: string;
  fromLocationNameTranslated?: string;
  toLocationId?: number;
  toLocationName?: string;
  toLocationNameTranslated?: string;
}

const FALLBACK_DEPARTURE_TIMES = ['06:00', '07:30', '09:15', '11:00', '13:45', '16:20', '18:30', '20:15'];

const transformBusDTOToBus = (busDTO: BusDTO, fromLocation: Location, toLocation: Location): Bus => {
  let departureTime = busDTO.departureTime;
  const arrivalTime = busDTO.arrivalTime;
  if (!departureTime) {
    departureTime = FALLBACK_DEPARTURE_TIMES[busDTO.id % FALLBACK_DEPARTURE_TIMES.length];
  }
  let duration = '';
  if (departureTime && arrivalTime) {
    const [depH, depM] = departureTime.split(':').map(Number);
    const [arrH, arrM] = arrivalTime.split(':').map(Number);
    let hours = arrH - depH;
    let minutes = arrM - depM;
    if (hours < 0) hours += 24;
    if (minutes < 0) { hours -= 1; minutes += 60; }
    duration = `${hours}h ${minutes}m`;
  }
  const fromName = busDTO.fromLocationNameTranslated || busDTO.fromLocationName || fromLocation.name;
  const toName = busDTO.toLocationNameTranslated || busDTO.toLocationName || toLocation.name;
  const corporation = (busDTO.operator || '').trim() || (busDTO.type || '').trim();
  return {
    id: busDTO.id,
    busName: busDTO.name || corporation || 'Unknown Bus',
    busNumber: busDTO.number || 'N/A',
    from: fromName,
    to: toName,
    fromLocationId: busDTO.fromLocationId || fromLocation.id,
    toLocationId: busDTO.toLocationId || toLocation.id,
    fromLocation: fromLocation,
    toLocation: toLocation,
    departureTime: departureTime || '',
    arrivalTime: arrivalTime || '',
    category: busDTO.type || 'Express Service',
    busType: busDTO.type || 'Express Service',
    corporation: corporation || undefined,
    status: busDTO.id % 3 === 0 ? 'Delayed' : 'On Time',
    duration: duration,
    name: busDTO.name,
    routeName: `${fromName} - ${toName}`,
    isLive: false,
    availability: 'available' as const,
    capacity: 40 + (busDTO.id % 20),
    rating: busDTO.rating,
  };
};

/**
 * Report bus location during tracking
 */
export const reportBusLocation = async (
  busId: number,
  report: BusLocationReport
): Promise<boolean> => {
  try {
    await api.post(`/v1/bus-tracking/report`, {
      busId,
      ...report,
      timestamp: report.timestamp || new Date().toISOString()
    });
    return true;
  } catch (error) {
    logger.error('Error reporting bus location:', error);
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
    await api.post(`/v1/bus-tracking/disembark/${busId}`, {
      stopId,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    logger.error('Error logging disembarking:', error);
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
    const response = await api.get(`/v1/bus-tracking/route/${fromLocation.id}/${toLocation.id}`);
    return response.data;
  } catch (error) {
    logger.error('Error fetching live bus locations:', error);
    throw new ApiError('Failed to fetch live bus locations. Please try again.');
  }
};

/**
 * Get user reward points
 */
export const getUserRewardPoints = async (userId: string): Promise<RewardPoints> => {
  try {
    const response = await api.get(`/v1/bus-tracking/rewards/${userId}`);
    return response.data;
  } catch (error: unknown) {
    logger.error('Error fetching reward points:', error);
    // Using our ApiError class for better error handling
    const axiosError = error as { response?: { status: number; data?: { errorCode?: string } } };
    if (axiosError.response) {
      throw new ApiError(
        'Failed to fetch reward points',
        axiosError.response.status,
        axiosError.response.data?.errorCode
      );
    }
    throw new ApiError('Failed to fetch reward points. Please try again.');
  }
};

/**
 * Submit a user-contributed bus route
 * 
 * @param data Route contribution data
 * @param recaptchaToken Optional reCAPTCHA Enterprise token for security
 * @returns Promise with the submission result
 */
export const submitRouteContribution = async (data: RouteContribution, recaptchaToken?: string | null) => {
  try {
    const headers: Record<string, string> = {};
    if (recaptchaToken) {
      headers['X-reCAPTCHA-Token'] = recaptchaToken;
    }
    const response = await api.post(`/v1/contributions/routes`, data, { headers });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Submit stops to be added to an existing bus route
 * 
 * @param busId The ID of the bus to add stops to
 * @param stops Array of stop entries with location, times, and order
 * @param busDetails Optional bus details for context
 * @returns Promise with the submission result
 */
export interface StopEntrySubmission {
  locationName: string;
  locationId?: number;
  latitude?: number;
  longitude?: number;
  arrivalTime: string;
  departureTime: string;
  order: number;
}

export interface AddStopsSubmission {
  busId: number;
  busNumber?: string;
  busName?: string;
  fromLocationName?: string;
  toLocationName?: string;
  departureTime?: string;
  arrivalTime?: string;
  stops: StopEntrySubmission[];
  additionalNotes?: string;
}

export const submitStopsContribution = async (data: AddStopsSubmission) => {
  try {
    const response = await api.post(`/v1/contributions/routes/stops`, data);
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
 * @param recaptchaToken Optional reCAPTCHA Enterprise token for security
 * @returns Promise with the submission result
 */
export const submitImageContribution = async (data: ImageContribution, file: File, recaptchaToken?: string | null) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    // Append metadata as individual form fields instead of JSON
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    }

    // Calculate timeout based on file size: ~2MB per second upload speed expected
    // Minimum 30s, maximum 5 minutes
    const fileSizeInMB = file.size / (1024 * 1024);
    const estimatedTimeSeconds = Math.max(30, Math.min(300, fileSizeInMB * 2));
    const timeoutMs = estimatedTimeSeconds * 1000;

    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data'
    };
    if (recaptchaToken) {
      headers['X-reCAPTCHA-Token'] = recaptchaToken;
    }

    const response = await api.post(
      `/v1/contributions/images`,
      formData,
      {
        headers,
        timeout: timeoutMs // Dynamic timeout based on file size
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
    const response = await api.get(`/v1/contributions/user/${userId}`);
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
    const response = await api.get(`/v1/contributions/status`);
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
    // Search in database only - no external API calls
    logger.debug(`searchLocations: Searching for "${query}" in database`);
    const response = await api.get('/v1/locations/search', {
      params: { 
        query,
        limit
      }
    });
    
    const dbResults = response.data;
    logger.debug(`searchLocations: Found ${dbResults.length} database results for "${query}"`);
    
    return dbResults;
  } catch (error) {
    logger.error('Error searching locations:', error);
    
    // Try offline data as fallback
    if (isOfflineMode) {
      try {
        const offlineLocations = (await getLocationsOffline()) as Location[];
        logger.debug(`searchLocations: Using offline data for "${query}"`);
        // Filter locations based on query
        return offlineLocations.filter(location => 
          location.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, limit);
      } catch (offlineError) {
        logger.error('Error getting offline locations:', offlineError);
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
        const response = await this.axios.get<PaginatedResponse<Bus>>(url);
        return response.data;
      } else {
        // Original implementation without pagination
        const response = await this.axios.get<Bus[]>(url);
        return response.data;
      }
    } catch (error) {
      logger.error('Error fetching bus schedules:', error);
      return handleApiError(error);
    }
  }
}

/**
 * Interface for raw bus location data from API
 */
interface RawBusLocation {
  busId?: number;
  busName?: string;
  busNumber?: string;
  fromLocation?: string;
  toLocation?: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  timestamp?: string;
  lastReportedStopName?: string;
  nextStopName?: string;
  estimatedArrivalTime?: string;
  reportCount?: number;
  confidenceScore?: number;
  [key: string]: unknown; // Allow other properties
}

/**
 * Transform bus location data to BusLocation type
 * @param location The raw location data
 * @returns Transformed BusLocation object
 */
export const transformBusLocation = (location: RawBusLocation): BusLocation => {
  if (!location) {
    throw new Error('Cannot transform undefined or null bus location');
  }
  
  return {
    busId: location.busId || 0,
    busName: location.busName || "",
    busNumber: location.busNumber || "",
    fromLocation: location.fromLocation || "",
    toLocation: location.toLocation || "",
    latitude: location.latitude || 0,
    longitude: location.longitude || 0,
    speed: location.speed || 0,
    heading: location.heading || 0,
    timestamp: location.timestamp || new Date().toISOString(),
    lastReportedStopName: location.lastReportedStopName || "",
    nextStopName: location.nextStopName || "",
    estimatedArrivalTime: location.estimatedArrivalTime || "",
    reportCount: location.reportCount || 0,
    confidenceScore: location.confidenceScore || 0,
  };
};

/**
 * Get image processing statistics
 */
export const getImageProcessingStatistics = async () => {
  try {
    const response = await api.get('/v1/admin/image-processing/statistics');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get image processing status for a contribution
 */
export const getImageProcessingStatus = async (contributionId: string) => {
  try {
    const response = await api.get(`/v1/contributions/images/${contributionId}/status`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Retry image processing for a contribution
 */
export const retryImageProcessing = async (contributionId: string) => {
  try {
    const response = await api.post(`/v1/contributions/images/${contributionId}/retry`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// ==================== MULTI-BUS-STAND SEARCH API ====================

// Backend MultiStandSearchResponse DTO interface
interface MultiStandSearchResponseDTO {
  fromCity: string;
  toCity: string;
  searchType: 'CITY_ONLY' | 'BUS_STAND_SPECIFIC' | 'WITH_DETAILS';
  fromBusStands: BusStand[];
  toBusStands: BusStand[];
  buses: BusDTO[];
  totalBuses: number;
  busStandCombinations: number;
}

/**
 * Search for buses across all bus stands when user enters a city name.
 * For example, searching "Aruppukottai" returns buses from both 
 * "Aruppukottai New Bus Stand" and "Aruppukottai Old Bus Stand".
 * 
 * @param fromLocation Source city or bus stand name
 * @param toLocation Destination city or bus stand name
 * @param languageCode Language code for translations (default: 'en')
 * @returns MultiStandSearchResponse with buses from all relevant bus stands
 */
export const searchBusesMultiStand = async (
  fromLocation: string,
  toLocation: string,
  languageCode: string = 'en'
): Promise<MultiStandSearchResponse> => {
  try {
    logger.info(`Multi-stand search: from='${fromLocation}' to='${toLocation}'`);
    
    const response = await api.get('/v1/bus-schedules/search/multi-stand', {
      params: {
        from: fromLocation,
        to: toLocation,
        lang: languageCode
      }
    });
    
    const rawResult: MultiStandSearchResponseDTO = response.data;
    
    // Create Location objects from the city names for transformation
    const fromLoc: Location = { 
      id: 0, 
      name: rawResult.fromCity, 
      latitude: 0, 
      longitude: 0 
    };
    const toLoc: Location = { 
      id: 0, 
      name: rawResult.toCity, 
      latitude: 0, 
      longitude: 0 
    };
    
    // Transform BusDTO objects to Bus objects
    const transformedBuses: Bus[] = rawResult.buses.map(busDTO => 
      transformBusDTOToBus(busDTO, fromLoc, toLoc)
    );
    
    // Enhance with segment-based timing using stops
    const computeDuration = (dep: string, arr: string): string => {
      if (!dep || !arr) return '';
      const [depH, depM] = dep.split(':').map(Number);
      const [arrH, arrM] = arr.split(':').map(Number);
      let hours = arrH - depH;
      let minutes = arrM - depM;
      if (hours < 0) hours += 24;
      if (minutes < 0) { hours -= 1; minutes += 60; }
      return `${hours}h ${minutes}m`;
    };

    const cityMatch = (s: Stop, city: string): boolean => {
      const name = (s.name || '').toLowerCase();
      const trans = (s.translatedName || '').toLowerCase();
      const cityLc = (city || '').toLowerCase();
      return name === cityLc || name.includes(cityLc) || trans.includes(cityLc);
    };

    for (const bus of transformedBuses) {
      try {
        const stops = await getStops(bus.id, languageCode);
        if (stops.length > 0) {
          const fromStop = stops.find(s => cityMatch(s, rawResult.fromCity));
          const toStop = stops.find(s => cityMatch(s, rawResult.toCity));
          const newDeparture = fromStop?.departureTime || stops[0].departureTime || bus.departureTime;
          const newArrival = toStop?.arrivalTime || stops[stops.length - 1].arrivalTime || bus.arrivalTime;
          bus.departureTime = newDeparture || bus.departureTime;
          bus.arrivalTime = newArrival || bus.arrivalTime;
          bus.duration = computeDuration(bus.departureTime, bus.arrivalTime);
        }
      } catch (err) {
        logger.warn(`Stops fetch failed for bus ${bus.id} (multi-stand): ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const result: MultiStandSearchResponse = {
      ...rawResult,
      buses: transformedBuses
    };
    
    logger.info(`Multi-stand search returned ${result.totalBuses} buses from ${result.fromBusStands.length} source stands`);
    
    return result;
  } catch (error) {
    logger.error('Error in multi-stand bus search:', error);
    throw new ApiError('Failed to search buses across bus stands. Please try again.');
  }
};

/**
 * Get all bus stands for a specific city
 * 
 * @param cityName Name of the city
 * @returns List of bus stands in that city
 */
export const getBusStandsForCity = async (cityName: string): Promise<BusStand[]> => {
  try {
    const response = await api.get('/v1/bus-schedules/bus-stands', {
      params: { city: cityName }
    });
    return response.data;
  } catch (error) {
    logger.error(`Error fetching bus stands for ${cityName}:`, error);
    throw new ApiError(`Failed to get bus stands for ${cityName}`);
  }
};

/**
 * Check if a location is a city with multiple bus stands
 * 
 * @param location Location/city name to check
 * @returns Information about whether the city has multiple bus stands
 */
export const checkMultiStandCity = async (location: string): Promise<MultiStandCheckResponse> => {
  try {
    const response = await api.get('/v1/bus-schedules/check-multi-stand', {
      params: { location }
    });
    return response.data;
  } catch (error) {
    logger.error(`Error checking multi-stand for ${location}:`, error);
    // Return default response indicating no multi-stand
    return {
      location,
      hasMultipleStands: false,
      busStandCount: 0,
      busStands: []
    };
  }
};

/**
 * Enhanced bus search that automatically uses multi-stand search when appropriate.
 * Detects if the search locations are cities with multiple bus stands and
 * uses the appropriate search method.
 * 
 * @param fromLocation Source location (can be city or bus stand)
 * @param toLocation Destination location (can be city or bus stand)
 * @param languageCode Language for translations
 * @returns Buses from all relevant bus stands
 */
export const searchBusesSmart = async (
  fromLocation: Location | string,
  toLocation: Location | string,
  languageCode: string = 'en'
): Promise<{ buses: Bus[]; multiStandInfo?: MultiStandSearchResponse }> => {
  // Extract names
  const fromName = typeof fromLocation === 'string' ? fromLocation : fromLocation.name;
  const toName = typeof toLocation === 'string' ? toLocation : toLocation.name;
  
  // Check if either location is a city with multiple stands
  const [fromCheck, toCheck] = await Promise.all([
    checkMultiStandCity(fromName),
    checkMultiStandCity(toName)
  ]);
  
  if (fromCheck.hasMultipleStands || toCheck.hasMultipleStands) {
    // Use multi-stand search
    logger.info(`Using multi-stand search: from has ${fromCheck.busStandCount} stands, to has ${toCheck.busStandCount} stands`);
    const multiResult = await searchBusesMultiStand(fromName, toName, languageCode);
    return {
      buses: multiResult.buses,
      multiStandInfo: multiResult
    };
  }
  
  // Fall back to regular search if no multi-stand detected
  if (typeof fromLocation === 'object' && typeof toLocation === 'object') {
    const buses = await searchBuses(fromLocation, toLocation, true, languageCode);
    return { buses };
  }
  
  // If we only have names, try multi-stand search anyway
  const multiResult = await searchBusesMultiStand(fromName, toName, languageCode);
  return {
    buses: multiResult.buses,
    multiStandInfo: multiResult
  };
};
