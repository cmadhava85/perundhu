import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

// Types for analytics data
export interface AnalyticsTimeRange {
  value: 'day' | 'week' | 'month' | 'year' | 'custom';
  label: string;
}

export interface AnalyticsDataType {
  value: 'punctuality' | 'crowding' | 'utilization' | 'feedback';
  label: string;
}

export interface AnalyticsFilterOptions {
  timeRange: string;
  dataType: string;
  customStartDate?: string;
  customEndDate?: string;
  routeId?: number;
  busId?: number;
}

export interface AnalyticsDataPoint {
  date: string;
  value: number;
  category?: string;
  label?: string;
}

export interface PunctualityData {
  onTime: number;
  delayed: number;
  early: number;
  veryDelayed: number;
  cancelled: number;
  dataPoints: AnalyticsDataPoint[];
}

export interface CrowdingData {
  empty: number;
  light: number;
  moderate: number;
  crowded: number;
  veryCrowded: number;
  dataPoints: AnalyticsDataPoint[];
}

export interface UtilizationData {
  utilization: number;
  averagePassengers: number;
  dataPoints: AnalyticsDataPoint[];
}

export interface FeedbackData {
  positive: number;
  neutral: number;
  negative: number;
  dataPoints: AnalyticsDataPoint[];
}

export interface AnalyticsData {
  punctuality?: PunctualityData;
  crowding?: CrowdingData;
  utilization?: UtilizationData;
  feedback?: FeedbackData;
}

/**
 * Custom hook for fetching and managing analytics data
 */
export function useAnalyticsData(initialFilters: AnalyticsFilterOptions) {
  const [filters, setFilters] = useState<AnalyticsFilterOptions>(initialFilters);
  const [data, setData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Available time ranges and data types
  const timeRanges: AnalyticsTimeRange[] = [
    { value: 'day', label: 'analytics.timeRanges.day' },
    { value: 'week', label: 'analytics.timeRanges.week' },
    { value: 'month', label: 'analytics.timeRanges.month' },
    { value: 'year', label: 'analytics.timeRanges.year' },
    { value: 'custom', label: 'analytics.timeRanges.custom' }
  ];
  
  const dataTypes: AnalyticsDataType[] = [
    { value: 'punctuality', label: 'analytics.dataTypes.punctuality' },
    { value: 'crowding', label: 'analytics.dataTypes.crowding' },
    { value: 'utilization', label: 'analytics.dataTypes.utilization' },
    { value: 'feedback', label: 'analytics.dataTypes.feedback' }
  ];

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<AnalyticsFilterOptions>) => {
    setFilters(current => ({ ...current, ...newFilters }));
  }, []);
  
  // Update specific filter properties
  const updateTimeRange = useCallback((timeRange: string) => {
    updateFilters({ timeRange });
  }, [updateFilters]);
  
  const updateDataType = useCallback((dataType: string) => {
    updateFilters({ dataType });
  }, [updateFilters]);
  
  const updateStartDate = useCallback((customStartDate: string) => {
    updateFilters({ customStartDate });
  }, [updateFilters]);
  
  const updateEndDate = useCallback((customEndDate: string) => {
    updateFilters({ customEndDate });
  }, [updateFilters]);

  // Function to fetch analytics data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build the query parameters
      const params: Record<string, string> = {
        timeRange: filters.timeRange,
        dataType: filters.dataType,
      };
      
      // Add optional parameters if they exist
      if (filters.timeRange === 'custom' && filters.customStartDate) {
        params.startDate = filters.customStartDate;
      }
      
      if (filters.timeRange === 'custom' && filters.customEndDate) {
        params.endDate = filters.customEndDate;
      }
      
      if (filters.routeId) {
        params.routeId = filters.routeId.toString();
      }
      
      if (filters.busId) {
        params.busId = filters.busId.toString();
      }
      
      // Prepare the query string
      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      
      // Call the API
      const result = await apiService.get<AnalyticsData>(`/analytics?${queryString}`);
      
      // Update the state with the results
      setData(result);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setData({});
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch data whenever filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Public interface
  return {
    // Data
    data,
    loading,
    error,
    
    // Filter options
    filters,
    timeRanges,
    dataTypes,
    
    // Actions
    updateFilters,
    updateTimeRange,
    updateDataType,
    updateStartDate,
    updateEndDate,
    refreshData: fetchData
  };
}

export default useAnalyticsData;