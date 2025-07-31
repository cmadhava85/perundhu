import { api, handleApiError } from './api';
import { apiClient } from './apiClient';
import { apiRequest } from '../utils/apiUtils';
import { handleApiError as handleErrorUtils } from '../utils/errorUtils';

// Interface for offline data cache storage
interface OfflineCachedData {
  fromLocationId: number;
  toLocationId: number;
  busId?: number;
  dataType: string;
  data: any;
  timestamp: number;
}

// Analytics data types
export interface PunctualityData {
  date: string;
  onTime: number;
  delayed: number;
}

export interface CrowdLevelData {
  time: string;
  low: number;
  medium: number;
  high: number;
}

export interface BusUtilizationData {
  busId: string;
  utilization: number;
  capacity: number;
}

export interface AnalyticsData {
  punctuality: PunctualityData[];
  crowdLevels: CrowdLevelData[];
  busUtilization: BusUtilizationData[];
}

export interface Route {
  id: string;
  name: string;
}

export interface Bus {
  id: string;
  name: string;
  route: string;
}

export interface AnalyticsFilters {
  fromDate?: string;
  toDate?: string;
  busId?: string;
  routeId?: string;
  timeOfDay?: string;
  page?: number;
}

// Types for analytics data
export interface HistoricalDataPoint {
  date: string;
  count: number;
  minutes: number;
  distance?: number;
}

export interface TravelTrend {
  day: string;
  count: number;
}

export interface PopularRoute {
  from: string;
  to: string;
  count: number;
  busIds: number[];
  busNames?: string[];
}

export interface UserAnalytics {
  totalTrips: number;
  totalTravelTime: number; // in minutes
  averageTripDuration: number; // in minutes
  totalDistance: number; // in km
  travelTrends: TravelTrend[];
  popularRoutes: PopularRoute[];
  lastUpdated: string;
}

/**
 * Service to handle offline analytics
 */
const offlineService = {
  isOnline: async (): Promise<boolean> => {
    try {
      await api.head('/api/v1/health/status');
      return true;
    } catch (error) {
      return false;
    }
  },
};

/**
 * Save historical data for offline use
 */
const saveHistoricalDataOffline = async (
  fromLocationId: number,
  toLocationId: number,
  busId: number | undefined,
  dataType: string,
  data: any
): Promise<void> => {
  try {
    const key = `historical-${fromLocationId}-${toLocationId}-${busId || 'all'}-${dataType}`;
    const offlineData: OfflineCachedData = {
      fromLocationId,
      toLocationId,
      busId,
      dataType,
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(offlineData));
  } catch (error) {
    console.warn('Failed to save offline data', error);
  }
};

/**
 * Get historical data from offline storage
 */
const getHistoricalDataOffline = async (
  fromLocationId: number,
  toLocationId: number,
  busId: number | undefined,
  dataType: string
): Promise<any> => {
  try {
    const key = `historical-${fromLocationId}-${toLocationId}-${busId || 'all'}-${dataType}`;
    const cachedData = localStorage.getItem(key);
    
    if (!cachedData) {
      throw new Error('No offline data available');
    }
    
    const offlineData: OfflineCachedData = JSON.parse(cachedData);
    
    // Check if data is older than 24 hours (86400000 ms)
    if (Date.now() - offlineData.timestamp > 86400000) {
      console.warn('Using outdated offline data');
    }
    
    return offlineData.data;
  } catch (error) {
    console.error('Error retrieving offline data:', error);
    throw new Error('No historical data available offline');
  }
};

/**
 * Get historical analytics data for a bus route
 */
export const getHistoricalData = async (
  fromLocationId: number,
  toLocationId: number,
  busId?: number,
  startDate?: string,
  endDate?: string,
  dataType: string = 'punctuality',
  page: number = 1,
  pageSize: number = 10
): Promise<any> => {
  try {
    // Check if we're online
    const isOnline = await offlineService.isOnline();
    
    if (isOnline) {
      const response = await api.get('/api/v1/analytics/historical', {
        params: {
          fromLocationId,
          toLocationId,
          busId,
          startDate,
          endDate,
          dataType,
          page,
          pageSize
        }
      });
      
      // Save the data for offline use
      await saveHistoricalDataOffline(
        fromLocationId,
        toLocationId,
        busId,
        dataType,
        response.data
      );
      
      return response.data;
    } else {
      // Use offline data
      return await getHistoricalDataOffline(
        fromLocationId,
        toLocationId,
        busId,
        dataType
      );
    }
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw new Error('Failed to fetch historical data. Please try again.');
  }
};

/**
 * Fetch analytics data based on given filters
 */
export const fetchAnalyticsData = async (filters: AnalyticsFilters): Promise<AnalyticsData> => {
  try {
    // Use apiClient for dedicated analytics endpoints
    const response = await apiClient.get('/analytics', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
};

/**
 * Fetch available routes for analytics filtering
 */
export const fetchRoutes = async (): Promise<Route[]> => {
  try {
    const response = await api.get('/api/v1/analytics/routes');
    return response.data;
  } catch (error) {
    console.error('Error fetching routes:', error);
    throw handleApiError(error);
  }
};

/**
 * Fetch available buses for analytics filtering
 */
export const fetchBuses = async (routeId?: string): Promise<Bus[]> => {
  try {
    const params = routeId ? { routeId } : {};
    const response = await api.get('/api/v1/analytics/buses', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching buses:', error);
    throw handleApiError(error);
  }
};

/**
 * Fetches historical travel data for a user within a specified date range
 * 
 * @param userId - The ID of the user
 * @param startDate - Optional start date in ISO format
 * @param endDate - Optional end date in ISO format
 * @returns Promise with historical data
 */
export const getUserHistoricalData = async (
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<HistoricalDataPoint[]> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (startDate) {
      queryParams.append('startDate', startDate);
    }
    
    if (endDate) {
      queryParams.append('endDate', endDate);
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/api/analytics/history/${userId}${queryString ? `?${queryString}` : ''}`;
    
    return await apiRequest<HistoricalDataPoint[]>(endpoint);
  } catch (error) {
    return handleErrorUtils('Error fetching historical data', error);
  }
};

/**
 * Fetches aggregated analytics for a user
 * 
 * @param userId - The ID of the user
 * @returns Promise with user analytics data
 */
export const getUserAnalytics = async (userId: string): Promise<UserAnalytics> => {
  try {
    return await apiRequest<UserAnalytics>(`/api/analytics/summary/${userId}`);
  } catch (error) {
    return handleErrorUtils('Error fetching user analytics', error);
  }
};

/**
 * Fetches travel pattern data for a user (trips by day of week)
 * 
 * @param userId - The ID of the user
 * @returns Promise with travel trends data
 */
export const getTravelPatterns = async (userId: string): Promise<TravelTrend[]> => {
  try {
    return await apiRequest<TravelTrend[]>(`/api/analytics/patterns/${userId}`);
  } catch (error) {
    return handleErrorUtils('Error fetching travel patterns', error);
  }
};

/**
 * Fetches the user's most frequent routes
 * 
 * @param userId - The ID of the user
 * @param limit - Maximum number of routes to return
 * @returns Promise with popular routes data
 */
export const getPopularRoutes = async (userId: string, limit: number = 5): Promise<PopularRoute[]> => {
  try {
    return await apiRequest<PopularRoute[]>(`/api/analytics/routes/${userId}?limit=${limit}`);
  } catch (error) {
    return handleErrorUtils('Error fetching popular routes', error);
  }
};

/**
 * Exports user analytics data in requested format
 * 
 * @param userId - The ID of the user
 * @param format - The export format ('csv' or 'pdf')
 * @returns Promise with the download URL
 */
export const exportAnalyticsData = async (userId: string, format: 'csv' | 'pdf'): Promise<{ downloadUrl: string }> => {
  try {
    return await apiRequest<{ downloadUrl: string }>(
      `/api/analytics/export/${userId}`,
      {
        method: 'POST',
        body: JSON.stringify({ format }),
      }
    );
  } catch (error) {
    return handleErrorUtils('Error exporting analytics data', error);
  }
};