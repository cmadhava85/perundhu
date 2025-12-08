import { api } from './api';

export interface BusLocationReport {
  busId: number;
  stopId: number | null;
  userId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  deviceInfo: string;
}

export interface BusLocation {
  id?: number; // Add missing id property to match main types  
  busId: number;
  busName: string;
  busNumber: string;
  fromLocation: string;
  toLocation: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
  lastReportedStopName: string; // Make required to match main types
  nextStopName: string; // Make required to match main types
  estimatedArrivalTime: string; // Make required to match main types
  reportCount: number;
  confidenceScore: number;
}

export interface RewardPoints {
  userId: string;
  totalPoints: number;
  currentTripPoints: number;
  lifetimePoints: number;
  userRank: string;
  leaderboardPosition: number;
  lastReportedStopName?: string;
  recentActivities: Array<{
    activityType: string;
    pointsEarned: number;
    timestamp: string;
    description: string;
  }>;
}

/**
 * Report a bus location to the backend
 */
export const reportBusLocation = async (report: BusLocationReport): Promise<RewardPoints> => {
  try {
    const response = await api.post('/api/v1/bus-tracking/report', report);
    return response.data;
  } catch (error) {
    console.error('Error reporting bus location:', error);
    throw error;
  }
};

/**
 * Report bus location with simplified auto-detection (no manual stop selection)
 */
export const reportBusLocationSimple = async (locationReport: {
  busId: number;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  timestamp: string;
  deviceInfo: string;
}): Promise<RewardPoints> => {
  try {
    const response = await api.post('/api/v1/bus-tracking/report-simple', locationReport);
    return response.data;
  } catch (error) {
    console.error('Error reporting bus location (simplified):', error);
    throw error;
  }
};

/**
 * Get current bus locations for live tracking
 */
export const getCurrentBusLocations = async (): Promise<BusLocation[]> => {
  try {
    const response = await api.get('/api/v1/bus-tracking/live');
    // Convert object to array
    const locationsMap = response.data;
    return Object.values(locationsMap);
  } catch (error) {
    console.error('Error getting current bus locations:', error);
    throw error;
  }
};

/**
 * Get bus locations for a specific route
 */
export const getBusLocationsOnRoute = async (fromLocationId: number, toLocationId: number): Promise<BusLocation[]> => {
  try {
    const response = await api.get(`/api/v1/bus-tracking/route/${fromLocationId}/${toLocationId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting bus locations on route:', error);
    throw error;
  }
};

/**
 * Get location history for a specific bus
 */
export const getBusLocationHistory = async (busId: number): Promise<BusLocation[]> => {
  try {
    const response = await api.get(`/api/v1/bus-tracking/history/${busId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting bus location history:', error);
    throw error;
  }
};

/**
 * Get user reward points
 */
export const getUserRewardPoints = async (userId: string): Promise<RewardPoints> => {
  try {
    const response = await api.get(`/api/v1/bus-tracking/rewards/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting user reward points:', error);
    throw error;
  }
};

/**
 * Get estimated arrival time for a bus at a specific stop
 */
export const getEstimatedArrival = async (busId: number, stopId: number): Promise<{
  busId: number;
  stopId: number;
  stopName: string;
  estimatedArrival: string;
  confidence: number;
}> => {
  try {
    const response = await api.get(`/api/v1/bus-tracking/eta/${busId}/${stopId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting estimated arrival:', error);
    throw error;
  }
};

/**
 * Report user disembarkation (when they get off the bus)
 */
export const reportDisembarkation = async (busId: number, userId: string): Promise<void> => {
  try {
    await api.post('/api/v1/bus-tracking/disembark', {
      busId,
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error reporting disembarkation:', error);
    throw error;
  }
};