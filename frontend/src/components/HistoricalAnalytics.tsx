import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getHistoricalData } from '../services/analyticsService';
import type { Location, Bus } from '../types';
import '../styles/HistoricalAnalytics.css';

// Import our new components
import AnalyticsFilterControls from './analytics/AnalyticsFilterControls';
import PunctualityChart from './analytics/PunctualityChart';
import CrowdLevelsChart, { type CrowdLevelsData } from './analytics/CrowdLevelsChart';
import BusUtilizationChart, { type BusUtilizationData } from './analytics/BusUtilizationChart';
import ContinueIteration from './analytics/ContinueIteration';
import NoDataDisplay from './analytics/NoDataDisplay';
import AnalyticsLoading from './analytics/AnalyticsLoading';
import AnalyticsError from './analytics/AnalyticsError';
import ExportSection from './analytics/ExportSection';

// Import types and utilities with type-only imports
import type { TimeRange, DataType, AnalyticsData } from './analytics/types';
import { formatDate, formatTime } from './analytics/formatters';

interface PunctualityChartData {
  data: Array<{
    date: string;
    early: number;
    onTime: number;
    delayed: number;
    veryDelayed: number;
  }>;
  pieData: Array<{
    name: string;
    value: number;
  }>;
  summary: {
    title: string;
    description: string;
    dataPoints: number;
  };
  bestDays: Array<{
    date: string;
    onTimePercentage: number;
  }>;
  worstDays: Array<{
    date: string;
    delayedPercentage: number;
  }>;
}

// Adapter functions to transform data for specific chart components
const adaptDataForPunctualityChart = (data: AnalyticsData): PunctualityChartData => {
  return {
    data: data.data.map(item => ({
      date: String(item.date || ''),
      early: Number(item.early || 0),
      onTime: Number(item.onTime || 0),
      delayed: Number(item.delayed || 0),
      veryDelayed: Number(item.veryDelayed || 0)
    })) || [],
    pieData: (data.pieData || []).map(item => ({
      name: String(item.name || ''),
      value: Number(item.value || 0)
    })),
    summary: {
      title: data.summary.title,
      description: data.summary.description,
      dataPoints: data.summary.dataPoints
    },
    bestDays: Array.isArray(data.bestDays) ? data.bestDays.map(d => ({
      date: d.date,
      onTimePercentage: d.onTimePercentage ?? 0
    })) : [],
    worstDays: Array.isArray(data.worstDays) ? data.worstDays.map(d => ({
      date: d.date,
      delayedPercentage: d.delayedPercentage ?? 0
    })) : []
  };
};

const adaptDataForCrowdLevelsChart = (data: AnalyticsData): CrowdLevelsData => {
  return {
    hourly: data.data.map(item => ({
      time: String(item.time || item.date || ''),
      low: Number(item.lowCrowd || 0),
      medium: Number(item.mediumCrowd || 0),
      high: Number(item.highCrowd || 0)
    })) || [],
    daily: data.data.map(item => ({
      date: String(item.date || ''),
      low: Number(item.lowCrowd || 0),
      medium: Number(item.mediumCrowd || 0),
      high: Number(item.highCrowd || 0),
      total: Number(item.totalPassengers || 0)
    })) || [],
    summary: {
      averageCrowdLevel: Number(data.summary.averageCrowdLevel || 0),
      peakHours: Array.isArray(data.summary.peakHours) ? data.summary.peakHours.map(String) : [],
      quietHours: Array.isArray(data.summary.quietHours) ? data.summary.quietHours.map(String) : []
    }
  };
};

const adaptDataForBusUtilizationChart = (data: AnalyticsData): BusUtilizationData => {
  return {
    buses: data.data.map(item => ({
      busId: String(item.busId || ''),
      busName: String(item.busName || ''),
      utilization: Number(item.utilization || 0),
      capacity: Number(item.capacity || 0),
      averagePassengers: Number(item.avgPassengers || 0)
    })) || [],
    timeSeries: data.data.map(item => ({
      time: String(item.time || item.date || ''),
      utilization: Number(item.utilization || 0),
      passengers: Number(item.passengers || 0)
    })) || [],
    summary: {
      totalTrips: Number(data.summary.totalTrips || 0),
      averageUtilization: Number(data.summary.averageUtilization || 0),
      mostCrowdedBus: String(data.summary.mostCrowdedBus || '-'),
      leastCrowdedBus: String(data.summary.leastCrowdedBus || '-')
    }
  };
};

interface HistoricalAnalyticsProps {
  fromLocation?: Location;
  toLocation?: Location;
  bus?: Bus;
}

/**
 * Component to display historical data analysis of bus performance
 * Refactored to use smaller, more maintainable components
 */
const HistoricalAnalytics: React.FC<HistoricalAnalyticsProps> = ({ fromLocation, toLocation, bus }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [dataType, setDataType] = useState<DataType>('punctuality');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [hasMoreData, setHasMoreData] = useState<boolean>(false);
  const pageSize = 10; // Number of items per page

  // Generate dates for custom range
  useEffect(() => {
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    
    setCustomStartDate(oneWeekAgo.toISOString().split('T')[0]);
    setCustomEndDate(now.toISOString().split('T')[0]);
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [timeRange, dataType, fromLocation, toLocation, bus, customStartDate, customEndDate]);

  // Fetch historical data
  const fetchData = useCallback(async (isLoadingMore = false) => {
    if (!fromLocation || !toLocation) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Determine date range based on selected time range
      let startDate: Date;
      let endDate = new Date();
      
      switch (timeRange) {
        case 'day':
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'custom':
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          break;
        default:
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
      }

      // Call API to get historical data with pagination
      const data = await getHistoricalData(
        fromLocation.id,
        toLocation.id,
        bus?.id,
        startDate.toISOString(),
        endDate.toISOString(),
        dataType,
        page,
        pageSize
      );
      
      // Check if there might be more data
      setHasMoreData(data.data?.length === pageSize);
      
      // Append data for "load more" or replace for new filters
      if (isLoadingMore && analyticsData) {
        // Properly merge the data arrays while keeping the rest of the structure
        const mergedData = {
          ...data,
          data: [...analyticsData.data, ...data.data]
        };
        setAnalyticsData(mergedData);
      } else {
        setAnalyticsData(data);
      }
    } catch (_err) {
      setError(t('analytics.error', 'Failed to load historical data'));
    } finally {
      setLoading(false);
    }
  }, [fromLocation, toLocation, bus, timeRange, dataType, customStartDate, customEndDate, page, analyticsData, t]);

  // Load more data
  const handleLoadMore = useCallback(() => {
    setPage(prevPage => prevPage + 1);
    fetchData(true);
  }, [fetchData]);

  // Fetch data when inputs change
  useEffect(() => {
    if (fromLocation && toLocation) {
      fetchData();
    }
  }, [fromLocation, toLocation, bus, timeRange, dataType, customStartDate, customEndDate, page, fetchData]);

  // Handle exporting data
  const handleExport = useCallback(() => {
    if (!analyticsData) return;
    
    // Implement export logic here (e.g., CSV download)
    const data = JSON.stringify(analyticsData);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dataType}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [analyticsData, dataType]);

  // Render loading state
  if (loading && !analyticsData) {
    return (
      <div className="analytics-section">
        <h2>{t('analytics.title', 'Historical Data Analysis')}</h2>
        <AnalyticsLoading />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="analytics-section">
        <h2>{t('analytics.title', 'Historical Data Analysis')}</h2>
        <AnalyticsError error={error} onRetry={() => fetchData(false)} />
      </div>
    );
  }

  // Render no data state
  if (!analyticsData || !analyticsData.data || analyticsData.data.length === 0) {
    return (
      <div className="analytics-section">
        <h2>{t('analytics.title', 'Historical Data Analysis')}</h2>
        <NoDataDisplay
          timeRange={timeRange}
          dataType={dataType}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onTimeRangeChange={setTimeRange}
          onDataTypeChange={setDataType}
          onStartDateChange={setCustomStartDate}
          onEndDateChange={setCustomEndDate}
        />
      </div>
    );
  }

  // Render analytics based on data type
  return (
    <div className="analytics-section">
      <h2>{t('analytics.title', 'Historical Data Analysis')}</h2>
      
      <AnalyticsFilterControls
        timeRange={timeRange}
        dataType={dataType}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onTimeRangeChange={setTimeRange}
        onDataTypeChange={setDataType}
        onStartDateChange={setCustomStartDate}
        onEndDateChange={setCustomEndDate}
      />

      <div className="analytics-summary">
        <h3>{analyticsData.summary.title}</h3>
        <p>{analyticsData.summary.description}</p>
      </div>

      <div className="analytics-charts">
        {/* Render appropriate chart based on data type */}
        {dataType === 'punctuality' && (
          <PunctualityChart 
            data={adaptDataForPunctualityChart(analyticsData)} 
            formatDate={formatDate}
            formatTime={formatTime}
          />
        )}

        {dataType === 'crowdLevels' && (
          <CrowdLevelsChart 
            data={adaptDataForCrowdLevelsChart(analyticsData)} 
            formatDate={formatDate}
            formatTime={formatTime}
          />
        )}

        {dataType === 'busUtilization' && (
          <BusUtilizationChart 
            data={adaptDataForBusUtilizationChart(analyticsData)} 
            formatDate={formatDate}
            formatTime={formatTime}
          />
        )}
      </div>

      <ExportSection 
        dataPoints={analyticsData.summary.dataPoints} 
        onExport={handleExport}
      />

      <ContinueIteration 
        hasMore={hasMoreData}
        isLoading={loading}
        onContinue={handleLoadMore}
        className="historical-analytics__continue"
      />
    </div>
  );
};

export default HistoricalAnalytics;
