import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { getHistoricalData } from '../services/analyticsService';
import type { Location, Bus } from '../types';

interface HistoricalAnalyticsProps {
  fromLocation?: Location;
  toLocation?: Location;
  bus?: Bus;
}

type TimeRange = 'day' | 'week' | 'month' | 'custom';
type DataType = 'punctuality' | 'crowdLevels' | 'busUtilization';

/**
 * Component to display historical data analysis of bus performance
 */
const HistoricalAnalytics: React.FC<HistoricalAnalyticsProps> = ({ fromLocation, toLocation, bus }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [dataType, setDataType] = useState<DataType>('punctuality');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [hasMoreData, setHasMoreData] = useState<boolean>(false);
  const pageSize = 10; // Number of items per page

  // Define chart colors
  const PUNCTUALITY_COLORS = {
    early: '#82ca9d',
    onTime: '#0088FE',
    delayed: '#FFBB28',
    veryDelayed: '#FF8042'
  };

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
      setHasMoreData(data.length === pageSize);
      
      // Append data for "load more" or replace for new filters
      if (isLoadingMore && analyticsData) {
        setAnalyticsData([...analyticsData, ...data]);
      } else {
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error('Error fetching historical data:', err);
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

  // Format date for display
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Format time for display
  const formatTime = (time: string) => {
    const t = new Date(`1970-01-01T${time}`);
    return t.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="analytics-custom-tooltip">
          <p className="tooltip-label">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`tooltip-${index}`} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render loading state
  if (loading) {
    return (
      <div className="analytics-section">
        <h2>{t('analytics.title', 'Historical Data Analysis')}</h2>
        <div className="analytics-loading">
          <div className="spinner"></div>
          <p>{t('common.loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="analytics-section">
        <h2>{t('analytics.title', 'Historical Data Analysis')}</h2>
        <div className="analytics-error">
          <p>{error}</p>
          <button onClick={() => fetchData(false)}>{t('error.retry', 'Try Again')}</button>
        </div>
      </div>
    );
  }

  // Render no data state
  if (!analyticsData || !analyticsData.data || analyticsData.data.length === 0) {
    return (
      <div className="analytics-section">
        <h2>{t('analytics.title', 'Historical Data Analysis')}</h2>
        <div className="analytics-filter-bar">
          <div className="filter-group">
            <label>{t('analytics.timeRange', 'Time Range')}</label>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            >
              <option value="day">{t('analytics.today', 'Today')}</option>
              <option value="week">{t('analytics.lastWeek', 'Last Week')}</option>
              <option value="month">{t('analytics.lastMonth', 'Last Month')}</option>
              <option value="custom">{t('analytics.customRange', 'Custom Range')}</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>{t('analytics.dataType', 'Data Type')}</label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value as DataType)}
            >
              <option value="punctuality">{t('analytics.punctuality', 'Punctuality')}</option>
              <option value="crowdLevels">{t('analytics.crowdLevels', 'Crowd Levels')}</option>
              <option value="busUtilization">{t('analytics.busUtilization', 'Bus Utilization')}</option>
            </select>
          </div>
        </div>

        {timeRange === 'custom' && (
          <div className="date-range-picker">
            <div className="date-field">
              <label>{t('analytics.startDate', 'Start Date')}</label>
              <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div className="date-field">
              <label>{t('analytics.endDate', 'End Date')}</label>
              <input 
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
        
        <div className="analytics-no-data">
          <p>{t('analytics.noDataAvailable', 'No data available')}</p>
          <p>{t('analytics.tryDifferentFilters', 'Try a different time range or data type')}</p>
        </div>
      </div>
    );
  }

  // Render analytics based on data type
  return (
    <div className="analytics-section">
      <h2>{t('analytics.title', 'Historical Data Analysis')}</h2>
      
      <div className="analytics-filter-bar">
        <div className="filter-group">
          <label>{t('analytics.timeRange', 'Time Range')}</label>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          >
            <option value="day">{t('analytics.today', 'Today')}</option>
            <option value="week">{t('analytics.lastWeek', 'Last Week')}</option>
            <option value="month">{t('analytics.lastMonth', 'Last Month')}</option>
            <option value="custom">{t('analytics.customRange', 'Custom Range')}</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>{t('analytics.dataType', 'Data Type')}</label>
          <select
            value={dataType}
            onChange={(e) => setDataType(e.target.value as DataType)}
          >
            <option value="punctuality">{t('analytics.punctuality', 'Punctuality')}</option>
            <option value="crowdLevels">{t('analytics.crowdLevels', 'Crowd Levels')}</option>
            <option value="busUtilization">{t('analytics.busUtilization', 'Bus Utilization')}</option>
          </select>
        </div>
      </div>

      {timeRange === 'custom' && (
        <div className="date-range-picker">
          <div className="date-field">
            <label>{t('analytics.startDate', 'Start Date')}</label>
            <input 
              type="date" 
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
          </div>
          <div className="date-field">
            <label>{t('analytics.endDate', 'End Date')}</label>
            <input 
              type="date" 
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="analytics-summary">
        <h3>{analyticsData.summary.title}</h3>
        <p>{analyticsData.summary.description}</p>
      </div>

      <div className="analytics-charts">
        {/* Render different charts based on data type */}
        {dataType === 'punctuality' && (
          <div className="chart-container">
            <h4>{t('analytics.onTimePerformance', 'On-Time Performance')}</h4>
            <div className="chart-row">
              <div className="chart-col">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }: {name: string, percent: number}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {analyticsData.pieData.map((_entry: {name: string, value: number}, index: number) => (
                        <Cell key={`cell-${index}`} fill={Object.values(PUNCTUALITY_COLORS)[index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-col">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => formatDate(value)}
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="early" name={t('analytics.early', 'Early')} fill={PUNCTUALITY_COLORS.early} />
                    <Bar dataKey="onTime" name={t('analytics.onTime', 'On Time')} fill={PUNCTUALITY_COLORS.onTime} />
                    <Bar dataKey="delayed" name={t('analytics.delayed', 'Delayed')} fill={PUNCTUALITY_COLORS.delayed} />
                    <Bar dataKey="veryDelayed" name={t('analytics.veryDelayed', 'Very Delayed')} fill={PUNCTUALITY_COLORS.veryDelayed} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="analytics-details">
              <div className="detail-stat">
                <h5>{t('analytics.mostOnTimeDays', 'Most On-Time Days')}</h5>
                <ul>
                  {analyticsData.bestDays.map((day: any, index: number) => (
                    <li key={index}>
                      {formatDate(day.date)}: {day.onTimePercentage}% {t('analytics.onTime', 'On Time')}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="detail-stat">
                <h5>{t('analytics.mostDelayedDays', 'Most Delayed Days')}</h5>
                <ul>
                  {analyticsData.worstDays.map((day: any, index: number) => (
                    <li key={index}>
                      {formatDate(day.date)}: {day.delayedPercentage}% {t('analytics.delayed', 'Delayed')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {dataType === 'crowdLevels' && (
          <div className="chart-container">
            <h4>{t('analytics.crowdLevels', 'Crowd Levels')}</h4>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analyticsData.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tickFormatter={(value) => formatTime(value)}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="crowdLevel" 
                  name={t('analytics.crowdLevel', 'Crowd Level')}
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="capacity" 
                  name={t('analytics.capacity', 'Capacity')}
                  stroke="#82ca9d" 
                  strokeDasharray="5 5" 
                />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="analytics-details">
              <div className="detail-stat">
                <h5>{t('analytics.peakHours', 'Peak Hours')}</h5>
                <ul>
                  {analyticsData.peakHours.map((hour: any, index: number) => (
                    <li key={index}>
                      {formatTime(hour.time)}: {hour.crowdLevel}% {t('analytics.capacity', 'Capacity')}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="detail-stat">
                <h5>{t('analytics.leastCrowdedHours', 'Least Crowded Hours')}</h5>
                <ul>
                  {analyticsData.leastCrowdedHours.map((hour: any, index: number) => (
                    <li key={index}>
                      {formatTime(hour.time)}: {hour.crowdLevel}% {t('analytics.capacity', 'Capacity')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {dataType === 'busUtilization' && (
          <div className="chart-container">
            <h4>{t('analytics.busUtilization', 'Bus Utilization')}</h4>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analyticsData.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatDate(value)}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="tripsCompleted" 
                  name={t('analytics.tripsCompleted', 'Trips Completed')}
                  fill="#8884d8" 
                />
                <Bar 
                  dataKey="passengersServed" 
                  name={t('analytics.passengersServed', 'Passengers Served')}
                  fill="#82ca9d" 
                />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="analytics-details">
              <div className="detail-stat">
                <h5>{t('analytics.busUtilizationSummary', 'Bus Utilization Summary')}</h5>
                <ul>
                  <li>{t('analytics.totalTrips', 'Total Trips')}: {analyticsData.summary.totalTrips}</li>
                  <li>{t('analytics.totalPassengers', 'Total Passengers')}: {analyticsData.summary.totalPassengers}</li>
                  <li>{t('analytics.averagePassengersPerTrip', 'Average Passengers Per Trip')}: {analyticsData.summary.averagePassengersPerTrip}</li>
                  <li>{t('analytics.utilization', 'Utilization')}: {analyticsData.summary.utilization}%</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="export-section">
        <button className="export-btn">
          <i className="export-icon"></i>
          {t('analytics.exportData', 'Export Data')}
        </button>
        <p className="data-points-info">
          {analyticsData.summary.dataPoints} {t('analytics.dataPoints', 'data points')}
        </p>
      </div>

      <ContinueIteration 
        hasMore={hasMoreData}
        isLoading={loading}
        onContinue={handleLoadMore}
        className="historical-analytics__continue"
      />
    </div>
  );
};

interface ContinueIterationProps {
  hasMore: boolean;
  isLoading: boolean;
  onContinue: () => void;
  className?: string;
}

// Simple ContinueIteration component as it was missing
const ContinueIteration: React.FC<ContinueIterationProps> = ({ 
  hasMore, 
  isLoading, 
  onContinue,
  className 
}) => {
  const { t } = useTranslation();
  
  if (!hasMore) return null;
  
  return (
    <div className={`continue-iteration ${className || ''}`}>
      <button 
        onClick={onContinue} 
        disabled={isLoading}
        className="load-more-button"
      >
        {isLoading ? t('common.loading', 'Loading...') : t('common.loadMore', 'Load More')}
      </button>
    </div>
  );
};

export default HistoricalAnalytics;
