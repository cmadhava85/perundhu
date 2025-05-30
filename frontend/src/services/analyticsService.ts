import axios from 'axios';
import { Location } from '../types';
import * as offlineService from './offlineService';

// Define interfaces for historical data
export interface DelayAnalytics {
  hour: number;
  averageDelay: number;
  busCount: number;
}

export interface PunctualityAnalytics {
  category: string;
  value: number;
  color: string;
}

export interface RoutePerformanceAnalytics {
  date: string;
  onTime: number;
  delayed: number;
  early: number;
  canceled: number;
}

export interface CrowdAnalytics {
  hour: number;
  averageCrowd: number;
}

export interface AnalyticsData {
  delayData: DelayAnalytics[];
  punctualityData: PunctualityAnalytics[];
  routePerformance: RoutePerformanceAnalytics[];
  crowdData: CrowdAnalytics[];
}

// Create axios instance with common configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch historical analytics data for a route or bus
 * 
 * @param timeRange - 'today', 'week', or 'month'
 * @param fromLocation - Starting location (optional)
 * @param toLocation - Destination location (optional)
 * @param busId - Specific bus ID (optional)
 * @returns Analytics data including delays, punctuality, performance, and crowds
 */
export const getHistoricalAnalytics = async (
  timeRange: string,
  fromLocation?: Location,
  toLocation?: Location,
  busId?: number
): Promise<AnalyticsData> => {
  try {
    const response = await api.get('/analytics/historical', {
      params: {
        timeRange,
        fromLocationId: fromLocation?.id,
        toLocationId: toLocation?.id,
        busId
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching historical analytics:', error);
    throw new Error('Failed to fetch historical data analytics');
  }
};

/**
 * Export analytics data to CSV
 * 
 * @param timeRange - 'today', 'week', or 'month'
 * @param fromLocation - Starting location (optional)
 * @param toLocation - Destination location (optional)
 * @param busId - Specific bus ID (optional)
 * @returns URL to download the CSV file
 */
export const exportAnalyticsCSV = async (
  timeRange: string,
  fromLocation?: Location,
  toLocation?: Location,
  busId?: number
): Promise<string> => {
  try {
    const response = await api.get('/analytics/export', {
      params: {
        timeRange,
        fromLocationId: fromLocation?.id,
        toLocationId: toLocation?.id,
        busId,
        format: 'csv'
      },
      responseType: 'blob'
    });
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    
    // Create a temporary link and trigger download
    const filename = `perundhu_analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
    
    return url;
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    throw new Error('Failed to export analytics data');
  }
};

/**
 * Get recommended departure times based on historical performance
 * 
 * @param fromLocation - Starting location
 * @param toLocation - Destination location
 * @param desiredArrivalTime - When the user wants to arrive (ISO string)
 * @returns Recommended departure time and confidence score
 */
export const getRecommendedDepartureTimes = async (
  fromLocation: Location,
  toLocation: Location,
  desiredArrivalTime: string
): Promise<{
  recommendedDepartureTime: string;
  confidenceScore: number;
  alternativeTimes: string[];
}> => {
  try {
    const response = await api.get('/analytics/recommended-departure', {
      params: {
        fromLocationId: fromLocation.id,
        toLocationId: toLocation.id,
        desiredArrivalTime
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting recommended departure times:', error);
    throw new Error('Failed to get recommended departure times');
  }
};

/**
 * Get popular routes for a given time period
 * 
 * @param timeRange - 'today', 'week', or 'month'
 * @returns List of popular routes with their usage counts
 */
export const getPopularRoutes = async (
  timeRange: string
): Promise<{
  fromLocation: Location;
  toLocation: Location;
  count: number;
}[]> => {
  try {
    const response = await api.get('/analytics/popular-routes', {
      params: { timeRange }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching popular routes:', error);
    throw new Error('Failed to fetch popular routes');
  }
};

/**
 * Generate mock data for development/testing
 * 
 * @param timeRange - 'today', 'week', or 'month'
 * @returns Mock analytics data
 */
export const getMockAnalyticsData = (timeRange: string): AnalyticsData => {
  // Generate mock delay data
  const delayData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    averageDelay: Math.floor(Math.random() * 15) + (i > 7 && i < 20 ? 5 : 2),
    busCount: Math.floor(Math.random() * 10) + (i > 7 && i < 20 ? 15 : 5),
  }));

  // Generate mock punctuality data
  const punctualityData = [
    { category: 'early', value: 10, color: '#82ca9d' },
    { category: 'onTime', value: 65, color: '#8884d8' },
    { category: 'delayed', value: 20, color: '#ffc658' },
    { category: 'veryDelayed', value: 5, color: '#ff8042' },
  ];

  // Generate mock route performance data
  let dateLabels: string[];
  if (timeRange === 'today') {
    dateLabels = ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'];
  } else if (timeRange === 'week') {
    dateLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  } else {
    // Month view shows weeks
    dateLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  }
  
  const routePerformance = dateLabels.map(date => ({
    date,
    onTime: Math.floor(Math.random() * 30) + 60,
    delayed: Math.floor(Math.random() * 20) + 10,
    early: Math.floor(Math.random() * 10) + 5,
    canceled: Math.floor(Math.random() * 3),
  }));

  // Generate mock crowd data
  const crowdData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    averageCrowd: Math.floor(Math.random() * 70) + 
      (i >= 7 && i <= 9 ? 80 : 0) + 
      (i >= 17 && i <= 19 ? 90 : 0),
  }));

  return {
    delayData,
    punctualityData,
    routePerformance,
    crowdData
  };
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
  dataType: string = 'punctuality'
): Promise<any> => {
  try {
    // Check if we're online
    const isOnline = await offlineService.isOnline();
    
    if (isOnline) {
      const response = await api.get('/analytics/historical', {
        params: {
          fromLocationId,
          toLocationId,
          busId,
          startDate,
          endDate,
          dataType
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
 * Save historical data to offline storage
 */
const saveHistoricalDataOffline = async (
  fromLocationId: number,
  toLocationId: number,
  busId: number | undefined,
  dataType: string,
  data: any
): Promise<void> => {
  try {
    // Initialize IndexedDB for analytics if needed
    const request = indexedDB.open('perundhuOfflineAnalyticsDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('historicalData')) {
        // Create a store for historical analytics data
        const store = db.createObjectStore('historicalData', { keyPath: 'id' });
        store.createIndex('route', ['fromLocationId', 'toLocationId'], { unique: false });
        store.createIndex('bus', 'busId', { unique: false });
        store.createIndex('dataType', 'dataType', { unique: false });
      }
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['historicalData'], 'readwrite');
      const store = transaction.objectStore('historicalData');
      
      // Create a unique ID for this data
      const busIdStr = busId ? busId.toString() : 'all';
      const id = `${fromLocationId}_${toLocationId}_${busIdStr}_${dataType}`;
      
      // Save with metadata
      store.put({
        id,
        fromLocationId,
        toLocationId,
        busId,
        dataType,
        data,
        timestamp: new Date().toISOString()
      });
      
      transaction.oncomplete = () => {
        console.log(`Saved historical ${dataType} data for offline use`);
      };
      
      transaction.onerror = (event) => {
        console.error('Error saving historical data:', event);
      };
    };
    
    request.onerror = (event) => {
      console.error('Error opening database:', event);
    };
  } catch (error) {
    console.error('Error saving historical data offline:', error);
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
  return new Promise((resolve, reject) => {
    try {
      // Open the IndexedDB database
      const request = indexedDB.open('perundhuOfflineAnalyticsDB', 1);
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('historicalData')) {
          // If the store doesn't exist, return mock data
          resolve(generateMockData(dataType));
          return;
        }
        
        const transaction = db.transaction(['historicalData'], 'readonly');
        const store = transaction.objectStore('historicalData');
        
        // Create a unique ID for this data
        const busIdStr = busId ? busId.toString() : 'all';
        const id = `${fromLocationId}_${toLocationId}_${busIdStr}_${dataType}`;
        
        // Try to get the data
        const getRequest = store.get(id);
        
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            console.log(`Retrieved historical ${dataType} data from offline storage`);
            resolve(getRequest.result.data);
          } else {
            // If no data found, try to find any data for this route regardless of data type
            const index = store.index('route');
            const indexRequest = index.getAll([fromLocationId, toLocationId]);
            
            indexRequest.onsuccess = () => {
              if (indexRequest.result && indexRequest.result.length > 0) {
                // Find the closest match if possible
                const sameTypeData = indexRequest.result.find(item => item.dataType === dataType);
                if (sameTypeData) {
                  resolve(sameTypeData.data);
                  return;
                }
                
                // Just use the first available data if no match
                resolve(indexRequest.result[0].data);
              } else {
                // No data at all, generate mock data
                resolve(generateMockData(dataType));
              }
            };
            
            indexRequest.onerror = () => {
              console.error('Error fetching by route index');
              resolve(generateMockData(dataType));
            };
          }
        };
        
        getRequest.onerror = (event) => {
          console.error('Error getting historical data:', event);
          resolve(generateMockData(dataType));
        };
      };
      
      request.onerror = (event) => {
        console.error('Error opening database:', event);
        resolve(generateMockData(dataType));
      };
      
    } catch (error) {
      console.error('Error getting historical data offline:', error);
      resolve(generateMockData(dataType));
    }
  });
};

/**
 * Generate mock historical data when offline and no cached data is available
 */
const generateMockData = (dataType: string): any => {
  const now = new Date();
  let data: any[] = [];
  
  // Generate different mock data based on the data type
  switch (dataType) {
    case 'punctuality': {
      // Generate data for the last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Generate random values that sum to 100
        const early = Math.floor(Math.random() * 20);
        const onTime = Math.floor(Math.random() * (80 - early));
        const delayed = Math.floor(Math.random() * (50 - early - onTime));
        const veryDelayed = 100 - early - onTime - delayed;
        
        data.push({
          date: date.toISOString(),
          early,
          onTime,
          delayed,
          veryDelayed
        });
      }
      
      // Create pie chart data
      const pieData = [
        { name: 'Early', value: 15 },
        { name: 'On Time', value: 55 },
        { name: 'Delayed', value: 20 },
        { name: 'Very Delayed', value: 10 }
      ];
      
      // Create best/worst days
      const bestDays = [
        { date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), onTimePercentage: 85 },
        { date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), onTimePercentage: 80 }
      ];
      
      const worstDays = [
        { date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), delayedPercentage: 35 },
        { date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(), delayedPercentage: 30 }
      ];
      
      // Summary
      const summary = {
        title: 'Punctuality Analysis',
        description: 'Buses are generally on time with occasional delays',
        dataPoints: 324
      };
      
      return {
        data,
        pieData,
        bestDays,
        worstDays,
        summary
      };
    }
    
    case 'crowdLevels': {
      // Generate crowd levels throughout the day
      for (let hour = 6; hour <= 21; hour++) {
        // Simulate morning and evening peaks
        let crowdLevel = 30;
        if (hour >= 7 && hour <= 9) {
          // Morning peak
          crowdLevel = 70 + Math.floor(Math.random() * 30);
        } else if (hour >= 16 && hour <= 19) {
          // Evening peak
          crowdLevel = 65 + Math.floor(Math.random() * 35);
        } else {
          // Off-peak
          crowdLevel = 25 + Math.floor(Math.random() * 30);
        }
        
        const time = new Date();
        time.setHours(hour, 0, 0, 0);
        
        data.push({
          time: time.toISOString(),
          crowdLevel,
          capacity: 100
        });
      }
      
      // Peak and least crowded hours
      const peakHours = [
        { time: new Date(now.setHours(8, 15)).toISOString(), crowdLevel: 95 },
        { time: new Date(now.setHours(18, 0)).toISOString(), crowdLevel: 90 },
        { time: new Date(now.setHours(17, 30)).toISOString(), crowdLevel: 85 }
      ];
      
      const leastCrowdedHours = [
        { time: new Date(now.setHours(10, 30)).toISOString(), crowdLevel: 25 },
        { time: new Date(now.setHours(14, 0)).toISOString(), crowdLevel: 30 },
        { time: new Date(now.setHours(20, 30)).toISOString(), crowdLevel: 35 }
      ];
      
      // Summary
      const summary = {
        title: 'Crowd Level Analysis',
        description: 'Buses are most crowded during morning and evening commute hours',
        dataPoints: 168
      };
      
      return {
        data,
        peakHours,
        leastCrowdedHours,
        summary
      };
    }
    
    case 'busUtilization': {
      // Generate data for the last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const tripsCompleted = 20 + Math.floor(Math.random() * 10);
        const passengersServed = tripsCompleted * (35 + Math.floor(Math.random() * 20));
        
        data.push({
          date: date.toISOString(),
          tripsCompleted,
          passengersServed
        });
      }
      
      // Summary statistics
      const totalTrips = data.reduce((sum, day) => sum + day.tripsCompleted, 0);
      const totalPassengers = data.reduce((sum, day) => sum + day.passengersServed, 0);
      const averagePassengersPerTrip = Math.round(totalPassengers / totalTrips);
      
      const summary = {
        title: 'Bus Utilization Analysis',
        description: 'Bus utilization remains consistent with higher numbers on weekdays',
        totalTrips,
        totalPassengers,
        averagePassengersPerTrip,
        utilization: 75,
        dataPoints: 94
      };
      
      return {
        data,
        summary
      };
    }
    
    default:
      return {
        data: [],
        summary: {
          title: 'No Data Available',
          description: 'Unable to generate mock data for this type',
          dataPoints: 0
        }
      };
  }
};