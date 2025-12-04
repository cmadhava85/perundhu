import axios from 'axios';
import type { AxiosInstance, AxiosResponse, Method } from 'axios';
import type { Bus, Stop, Location, BusLocationReport, BusLocation, RewardPoints, ConnectingRoute, RouteContribution, ImageContribution } from '../types/index';
import { getLocationsOffline } from './offlineService';

/**
 * Type for request data and parameters
 */
export interface RequestData {
  [key: string]: unknown;
}

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
  data?: RequestData, 
  params?: RequestData
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
  errorCode?: string;
  
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errorCode = code; // Set errorCode as alias for code
    
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
      return Object.values(response.data).map(location => transformBusLocation(location as RawBusLocation));
    }
    
    // If it's already an array, ensure all required fields
    return Array.isArray(response.data) ? response.data.map(location => transformBusLocation(location as RawBusLocation)) : [];
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

// Backend DTO interface to match the actual API response
interface BusDTO {
  id: number;
  number: string;
  name: string;
  operator: string;
  type: string;
  features?: Record<string, string>;
}

// Generate sample stops for demonstration purposes
const generateSampleStops = (busId: number, fromLocation: Location, toLocation: Location): Stop[] => {
  const sampleStopNames = [
    'Central Station', 'City Mall', 'Airport Junction', 'Tech Park', 'University Campus',
    'Bus Terminal', 'Railway Station', 'Government Hospital', 'Market Square', 'Shopping Complex'
  ];
  
  const numStops = 3 + (busId % 4); // 3-6 stops per bus
  const stops: Stop[] = [];
  
  // Add origin stop
  stops.push({
    id: busId * 100 + 1,
    name: fromLocation.name,
    arrivalTime: '',
    departureTime: '06:00', // Will be updated with actual departure time
    busId: busId,
    order: 1,
    stopOrder: 1,
    latitude: fromLocation.latitude,
    longitude: fromLocation.longitude
  });
  
  // Add intermediate stops
  for (let i = 0; i < numStops - 2; i++) {
    const stopName = sampleStopNames[(busId + i) % sampleStopNames.length];
    const hour = 6 + Math.floor((i + 1) * 2.5); // Spread stops every 2.5 hours
    const minute = (busId * 15 + i * 10) % 60;
    const arrivalTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const departureTime = `${hour.toString().padStart(2, '0')}:${(minute + 5).toString().padStart(2, '0')}`;
    
    stops.push({
      id: busId * 100 + i + 2,
      name: stopName,
      arrivalTime: arrivalTime,
      departureTime: departureTime,
      busId: busId,
      order: i + 2,
      stopOrder: i + 2,
      latitude: fromLocation.latitude + (i + 1) * 0.1,
      longitude: fromLocation.longitude + (i + 1) * 0.1
    });
  }
  
  // Add destination stop
  stops.push({
    id: busId * 100 + numStops,
    name: toLocation.name,
    arrivalTime: '14:00', // Will be updated with actual arrival time
    departureTime: '',
    busId: busId,
    order: numStops,
    stopOrder: numStops,
    latitude: toLocation.latitude,
    longitude: toLocation.longitude
  });
  
  return stops;
};

// Transform backend BusDTO to frontend Bus object
const transformBusDTOToBus = (busDTO: BusDTO, fromLocation: Location, toLocation: Location): Bus => {
  // Generate sample timing data for demonstration purposes
  // TODO: Replace with real backend timing data when available
  const sampleDepartureTimes = ['06:00', '07:30', '09:15', '11:00', '13:45', '16:20', '18:30', '20:15'];
  const departureTime = sampleDepartureTimes[busDTO.id % sampleDepartureTimes.length];
  
  // Calculate arrival time (add 6-10 hours based on bus ID for variety)
  const depHour = parseInt(departureTime.split(':')[0]);
  const depMinute = parseInt(departureTime.split(':')[1]);
  const travelHours = 6 + (busDTO.id % 5); // 6-10 hours travel time
  const arrHour = (depHour + travelHours) % 24;
  const arrivalTime = `${arrHour.toString().padStart(2, '0')}:${depMinute.toString().padStart(2, '0')}`;
  
  return {
    id: busDTO.id,
    busName: busDTO.name || 'Unknown Bus',
    busNumber: busDTO.number || 'N/A',
    from: fromLocation.name,
    to: toLocation.name,
    fromLocationId: fromLocation.id,
    toLocationId: toLocation.id,
    fromLocation: fromLocation,
    toLocation: toLocation,
    departureTime: departureTime,
    arrivalTime: arrivalTime,
    category: busDTO.type || 'Express Service',
    busType: busDTO.type || 'Express Service',
    status: busDTO.id % 3 === 0 ? 'Delayed' : 'On Time',
    duration: `${travelHours}h ${Math.floor(Math.random() * 60)}m`,
    name: busDTO.name,
    routeName: `${fromLocation.name} - ${toLocation.name}`,
    isLive: false,
    availability: 'available' as const,
    capacity: 40 + (busDTO.id % 20) // Sample capacity data
  };
};

/**
 * Search for buses between two locations
 */
export const searchBuses = async (
  fromLocation: Location, 
  toLocation: Location,
  includeContinuing: boolean = false,
  languageCode: string = 'en'
): Promise<Bus[]> => {
  try {
    // Check if locations are from OpenStreetMap (negative IDs)
    const isFromOSM = fromLocation.id < 0;
    const isToOSM = toLocation.id < 0;
    
    // If either location is from OpenStreetMap, we need to find nearby locations in the database
    if (isFromOSM || isToOSM) {
      console.log('🌍 OpenStreetMap location detected, searching by coordinates');
      
      // For now, return empty array with a helpful message
      // TODO: Implement coordinate-based search or find nearest database locations
      console.warn('⚠️ OpenStreetMap locations not yet supported for bus search');
      console.warn(`From: ${fromLocation.name} (${fromLocation.latitude}, ${fromLocation.longitude})`);
      console.warn(`To: ${toLocation.name} (${toLocation.latitude}, ${toLocation.longitude})`);
      
      throw new ApiError(
        `Currently, we can only search between locations in our database. "${isFromOSM ? fromLocation.name : toLocation.name}" is not in our system yet. Please try selecting a nearby city that appears with a 🚍 icon.`,
        400,
        'OSM_LOCATION_NOT_SUPPORTED'
      );
    }
    
    const response = await api.get('/api/v1/bus-schedules/search', {
      params: {
        fromLocationId: fromLocation.id,
        toLocationId: toLocation.id,
        includeContinuing
      }
    });
    
    // Transform backend BusDTO objects to frontend Bus objects
    const busDTOs: BusDTO[] = response.data;
    const buses: Bus[] = busDTOs.map(busDTO => 
      transformBusDTOToBus(busDTO, fromLocation, toLocation)
    );
    
    // Fetch real stops data for each bus
    for (const bus of buses) {
      try {
        const stops = await getStops(bus.id, languageCode);
        if (stops.length > 0) {
          // Update bus timing with actual stop times
          bus.departureTime = stops[0].departureTime;
          bus.arrivalTime = stops[stops.length - 1].arrivalTime;
        }
      } catch (error) {
        console.warn(`Failed to fetch stops for bus ${bus.id}:`, error);
        // Continue without stops for this bus
      }
    }
    
    console.log('Transformed buses with real stops:', buses);
    return buses;
  } catch (error) {
    console.error('Error searching buses:', error);
    
    // If it's our custom OSM error, throw it as-is
    if (error instanceof ApiError && error.errorCode === 'OSM_LOCATION_NOT_SUPPORTED') {
      throw error;
    }
    
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
    // Extract location IDs and objects based on what was passed
    const fromId = typeof fromLocation === 'number' ? fromLocation : fromLocation.id;
    const toId = typeof toLocation === 'number' ? toLocation : toLocation.id;
    
    // Get full location objects if needed
    const fromLoc = typeof fromLocation === 'object' ? fromLocation : { id: fromId, name: 'Unknown' } as Location;
    const toLoc = typeof toLocation === 'object' ? toLocation : { id: toId, name: 'Unknown' } as Location;
    
    const response = await api.get('/api/v1/bus-schedules/search-via-stops', {
      params: {
        fromLocationId: fromId,
        toLocationId: toId
      }
    });
    
    // Transform backend BusDTO objects to frontend Bus objects
    const busDTOs: BusDTO[] = response.data;
    const buses: Bus[] = busDTOs.map(busDTO => 
      transformBusDTOToBus(busDTO, fromLoc, toLoc)
    );
    
    return buses;
  } catch (error) {
    console.error('Error searching buses via stops:', error);
    throw new ApiError('Failed to search for buses via stops. Please try again.');
  }
};

/**
 * Transform backend StopDTO to frontend Stop object
 */
const transformStopDTOToStop = (stopDTO: any, busId: number): Stop => {
  return {
    id: stopDTO.id,
    name: stopDTO.name,
    translatedName: stopDTO.translatedName || stopDTO.name,
    arrivalTime: stopDTO.arrivalTime || '',
    departureTime: stopDTO.departureTime || '',
    order: stopDTO.sequence || 0,
    stopOrder: stopDTO.sequence || 0,
    busId: busId,
    platform: stopDTO.platform,
    status: stopDTO.status,
    locationId: stopDTO.locationId,
    latitude: stopDTO.latitude,
    longitude: stopDTO.longitude
  };
};

/**
 * Get stops for a specific bus
 */
export const getStops = async (busId: number, languageCode: string = 'en'): Promise<Stop[]> => {
  try {
    console.log(`Fetching stops for bus ${busId} with language ${languageCode}`);
    const response = await api.get(`/api/v1/bus-schedules/buses/${busId}/stops/basic`, {
      params: { lang: languageCode }
    });
    console.log('Stops API response:', response.data);
    
    // Transform the backend response to frontend Stop objects
    const stopDTOs: any[] = response.data;
    const stops: Stop[] = stopDTOs.map(stopDTO => 
      transformStopDTOToStop(stopDTO, busId)
    );
    
    console.log('Transformed stops:', stops);
    return stops;
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

/**
 * Interface for API error response structure
 */
export interface ApiErrorResponse {
  status?: number;
  data?: {
    message?: string;
    errorCode?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Error handler utility for consistent error responses
export const handleApiError = (error: unknown): never => {
  console.error('API error:', error);
  
  // Check if it's an axios error with response property
  const axiosError = error as { response?: ApiErrorResponse };
  
  if (axiosError.response) {
    throw new ApiError(
      axiosError.response.data?.message || 'An error occurred with the API request',
      axiosError.response.status,
      axiosError.response.data?.errorCode
    );
  }
  
  // For network errors or other types of errors
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
    formData.append('image', file);
    
    // Append metadata as individual form fields instead of JSON
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    }

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
        const response = await this.axios.get<PaginatedResponse<Bus>>(url);
        return response.data;
      } else {
        // Original implementation without pagination
        const response = await this.axios.get<Bus[]>(url);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching bus schedules:', error);
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
    const response = await api.get('/api/v1/admin/image-processing/statistics');
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
    const response = await api.get(`/api/v1/contributions/images/${contributionId}/status`);
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
    const response = await api.post(`/api/v1/contributions/images/${contributionId}/retry`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};
