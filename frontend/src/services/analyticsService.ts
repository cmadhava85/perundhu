import { api } from './api';

// Interface for offline data cache storage
interface OfflineCachedData {
  fromLocationId: number;
  toLocationId: number;
  busId?: number;
  dataType: string;
  data: any;
  timestamp: number;
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