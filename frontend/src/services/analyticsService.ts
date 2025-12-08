import { api } from './api';

// Interface for offline data cache storage
interface OfflineCachedData {
  fromLocationId: number;
  toLocationId: number;
  busId?: number;
  dataType: string;
  data: unknown;
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
    } catch {
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
  data: unknown
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
): Promise<unknown> => {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export interface AnalyticsData {
  id: string;
  eventType: 'SEARCH' | 'BOOKING' | 'ROUTE_VIEW' | 'USER_ACTION';
  timestamp: string;
  userId?: string;
  sessionId: string;
  data: Record<string, unknown>;
}

export interface RouteAnalytics {
  routeId: string;
  routeName: string;
  totalSearches: number;
  totalBookings: number;
  popularTimes: Array<{
    hour: number;
    searches: number;
    bookings: number;
  }>;
  conversionRate: number;
}

export interface UserBehaviorAnalytics {
  totalUsers: number;
  activeUsers: number;
  averageSessionDuration: number;
  topRoutes: RouteAnalytics[];
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
}

export interface PerformanceMetrics {
  averageLoadTime: number;
  apiResponseTime: number;
  errorRate: number;
  uptime: number;
}

class AnalyticsService {
  private baseURL = '/api/analytics';

  // New methods expected by tests
  async getUserAnalytics(): Promise<{
    totalJourneys: number;
    averageRating: number;
    carbonSaved: number;
    totalDistance: number;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/user`);
      if (!response.ok) throw new Error('Failed to fetch user analytics');
      return await response.json();
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      return {
        totalJourneys: 0,
        averageRating: 0,
        carbonSaved: 0,
        totalDistance: 0,
      };
    }
  }

  async getJourneyTrends(): Promise<Array<{ date: string; journeys: number }>> {
    try {
      const response = await fetch(`${this.baseURL}/journey-trends`);
      if (!response.ok) throw new Error('Failed to fetch journey trends');
      return await response.json();
    } catch (error) {
      console.error('Error fetching journey trends:', error);
      return [];
    }
  }

  async getTimeDistribution(): Promise<Array<{ time: string; percentage: number }>> {
    try {
      const response = await fetch(`${this.baseURL}/time-distribution`);
      if (!response.ok) throw new Error('Failed to fetch time distribution');
      return await response.json();
    } catch (error) {
      console.error('Error fetching time distribution:', error);
      return [];
    }
  }

  async trackEvent(eventType: string, data: Record<string, unknown>): Promise<void> {
    try {
      const payload = {
        eventType,
        timestamp: new Date().toISOString(),
        sessionId: this.getSessionId(),
        data
      };

      await fetch(`${this.baseURL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  async getUserBehaviorAnalytics(dateRange?: { start: string; end: string }): Promise<UserBehaviorAnalytics> {
    try {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append('start', dateRange.start);
        params.append('end', dateRange.end);
      }

      const response = await fetch(`${this.baseURL}/user-behavior?${params}`);
      if (!response.ok) throw new Error('Failed to fetch user behavior analytics');
      return await response.json();
    } catch (error) {
      console.error('Error fetching user behavior analytics:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        averageSessionDuration: 0,
        topRoutes: [],
        deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 }
      };
    }
  }

  async getRouteAnalytics(routeId?: string): Promise<RouteAnalytics[]> {
    try {
      const url = routeId 
        ? `${this.baseURL}/routes/${routeId}`
        : `${this.baseURL}/routes`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch route analytics');
      const data = await response.json();
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      console.error('Error fetching route analytics:', error);
      return [];
    }
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const response = await fetch(`${this.baseURL}/performance`);
      if (!response.ok) throw new Error('Failed to fetch performance metrics');
      return await response.json();
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return {
        averageLoadTime: 0,
        apiResponseTime: 0,
        errorRate: 0,
        uptime: 0
      };
    }
  }

  async getPopularRoutes(limit: number = 10): Promise<RouteAnalytics[]> {
    try {
      const response = await fetch(`${this.baseURL}/popular-routes?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch popular routes');
      return await response.json();
    } catch (error) {
      console.error('Error fetching popular routes:', error);
      return [];
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  // Track specific events
  trackSearch(from: string, to: string, results: number): void {
    this.trackEvent('SEARCH', {
      from,
      to,
      resultsCount: results,
      timestamp: new Date().toISOString()
    });
  }

  trackRouteView(routeId: string, routeName: string): void {
    this.trackEvent('ROUTE_VIEW', {
      routeId,
      routeName,
      timestamp: new Date().toISOString()
    });
  }

  trackUserAction(action: string, details?: Record<string, unknown>): void {
    this.trackEvent('USER_ACTION', {
      action,
      ...details,
      timestamp: new Date().toISOString()
    });
  }
}

export default new AnalyticsService();