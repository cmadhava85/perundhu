import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer 
} from 'recharts';
import type { Location } from '../types';
import { getHistoricalData } from '../services/analyticsService';

// Define analytics data interfaces
interface DelayData {
  hour: number;
  averageDelay: number;
  busCount: number;
}

interface PunctualityData {
  category: string;
  value: number;
  color: string;
}

interface RoutePerformanceData {
  date: string;
  onTime: number;
  delayed: number;
  early: number;
  canceled: number;
}

interface CrowdData {
  hour: number;
  averageCrowd: number;
}

interface AnalyticsProps {
  fromLocation?: Location;
  toLocation?: Location;
  busId?: number;
}

// Analytics component for historical data visualization
const Analytics: React.FC<AnalyticsProps> = ({ fromLocation, toLocation, busId }) => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<string>('week');
  const [delayData, setDelayData] = useState<DelayData[]>([]);
  const [punctualityData, setPunctualityData] = useState<PunctualityData[]>([]);
  const [routePerformance, setRoutePerformance] = useState<RoutePerformanceData[]>([]);
  const [crowdData, setCrowdData] = useState<CrowdData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsEnabled] = useState<boolean>(
    localStorage.getItem('perundhu-analytics-enabled') === 'true'
  );

  // Don't fetch data or render anything if analytics are disabled
  if (!analyticsEnabled) {
    return null;
  }

  // Load historical data when component mounts or when user selects a different time range
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Calculate date range based on timeRange selection
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(endDate.getMonth() - 1);
            break;
          default:
            startDate.setDate(endDate.getDate() - 7);
        }

        // Fetch real analytics data from the backend
        const analyticsData = await getHistoricalData(
          fromLocation?.id || 0,
          toLocation?.id || 0,
          busId,
          startDate.toISOString(),
          endDate.toISOString(),
          'punctuality'
        );

        // Transform the backend data to match our component interfaces
        const transformedDelayData = transformToDelayData(analyticsData);
        const transformedPunctualityData = transformToPunctualityData(analyticsData);
        const transformedRoutePerformance = transformToRoutePerformance(analyticsData);
        const transformedCrowdData = transformToCrowdData(analyticsData);
        
        setDelayData(transformedDelayData);
        setPunctualityData(transformedPunctualityData);
        setRoutePerformance(transformedRoutePerformance);
        setCrowdData(transformedCrowdData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError(t('error.networkError'));
        // Fall back to mock data on error
        setDelayData(generateMockDelayData());
        setPunctualityData(generateMockPunctualityData());
        setRoutePerformance(generateMockRoutePerformance());
        setCrowdData(generateMockCrowdData());
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeRange, fromLocation, toLocation, busId, t]);

  // Transform backend analytics data to delay data format
  const transformToDelayData = (data: any): DelayData[] => {
    if (!data.hourlyStats) return generateMockDelayData();
    
    return data.hourlyStats.map((stat: any) => ({
      hour: stat.hour,
      averageDelay: stat.averageDelay || 0,
      busCount: stat.busCount || 0
    }));
  };

  // Transform backend analytics data to punctuality data format
  const transformToPunctualityData = (data: any): PunctualityData[] => {
    if (!data.punctualityStats) return generateMockPunctualityData();
    
    const stats = data.punctualityStats;
    return [
      { category: 'early', value: stats.earlyPercentage || 10, color: '#82ca9d' },
      { category: 'onTime', value: stats.onTimePercentage || 65, color: '#8884d8' },
      { category: 'delayed', value: stats.delayedPercentage || 20, color: '#ffc658' },
      { category: 'veryDelayed', value: stats.veryDelayedPercentage || 5, color: '#ff8042' },
    ];
  };

  // Transform backend analytics data to route performance format
  const transformToRoutePerformance = (data: any): RoutePerformanceData[] => {
    if (!data.dailyStats) return generateMockRoutePerformance();
    
    return data.dailyStats.map((stat: any) => ({
      date: new Date(stat.date).toLocaleDateString('en', { weekday: 'short' }),
      onTime: stat.onTimePercentage || 0,
      delayed: stat.delayedPercentage || 0,
      early: stat.earlyPercentage || 0,
      canceled: stat.canceledPercentage || 0,
    }));
  };

  // Transform backend analytics data to crowd data format
  const transformToCrowdData = (data: any): CrowdData[] => {
    if (!data.hourlyStats) return generateMockCrowdData();
    
    return data.hourlyStats.map((stat: any) => ({
      hour: stat.hour,
      averageCrowd: stat.averageCrowdLevel || 0
    }));
  };

  // Generate mock data functions for demonstration
  const generateMockDelayData = (): DelayData[] => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      averageDelay: Math.floor(Math.random() * 15) + (i > 7 && i < 20 ? 5 : 2),
      busCount: Math.floor(Math.random() * 10) + (i > 7 && i < 20 ? 15 : 5),
    }));
  };

  const generateMockPunctualityData = (): PunctualityData[] => {
    return [
      { category: 'early', value: 10, color: '#82ca9d' },
      { category: 'onTime', value: 65, color: '#8884d8' },
      { category: 'delayed', value: 20, color: '#ffc658' },
      { category: 'veryDelayed', value: 5, color: '#ff8042' },
    ];
  };

  const generateMockRoutePerformance = (): RoutePerformanceData[] => {
    const dates = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return dates.map(date => ({
      date,
      onTime: Math.floor(Math.random() * 30) + 60,
      delayed: Math.floor(Math.random() * 20) + 10,
      early: Math.floor(Math.random() * 10) + 5,
      canceled: Math.floor(Math.random() * 3),
    }));
  };

  const generateMockCrowdData = (): CrowdData[] => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      averageCrowd: Math.floor(Math.random() * 70) + 
        (i >= 7 && i <= 9 ? 80 : 0) + 
        (i >= 17 && i <= 19 ? 90 : 0),
    }));
  };

  if (isLoading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>{t('loading.message')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error">
        <h3>{t('error.title')}</h3>
        <p>{error}</p>
        <button onClick={() => setTimeRange(timeRange)}>{t('error.retry')}</button>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <h2>{t('analytics.title')}</h2>
      
      {/* Time Range Selector */}
      <div className="time-range-selector">
        <label>{t('analytics.timeRange')}</label>
        <div className="time-range-buttons">
          <button 
            className={timeRange === 'today' ? 'active' : ''} 
            onClick={() => setTimeRange('today')}
          >
            {t('analytics.today')}
          </button>
          <button 
            className={timeRange === 'week' ? 'active' : ''} 
            onClick={() => setTimeRange('week')}
          >
            {t('analytics.lastWeek')}
          </button>
          <button 
            className={timeRange === 'month' ? 'active' : ''} 
            onClick={() => setTimeRange('month')}
          >
            {t('analytics.lastMonth')}
          </button>
        </div>
      </div>
      
      {/* On-Time Performance */}
      <div className="analytics-card">
        <h3>{t('analytics.punctuality')}</h3>
        <div className="analytics-chart">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={punctualityData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="category"
                label={({ category }) => t(`analytics.${category}`)}
              >
                {punctualityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend formatter={(value) => t(`analytics.${value}`)} />
              <Tooltip 
                formatter={(value, name) => [value + '%', t(`analytics.${name}`)]} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Delay Statistics */}
      <div className="analytics-card">
        <h3>{t('analytics.delayStatistics')}</h3>
        <div className="analytics-chart">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={delayData}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <Line type="monotone" dataKey="averageDelay" stroke="#ff7300" name={t('analytics.delayStatistics')} />
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis dataKey="hour" label={{ value: t('common.hours'), position: 'insideBottomRight', offset: 0 }} />
              <YAxis label={{ value: t('common.minutes'), angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value) => [`${value} ${t('common.minutes')}`, t('analytics.delayStatistics')]}
                labelFormatter={(label) => `${label}:00 ${t('common.hours')}`} 
              />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Route Performance */}
      <div className="analytics-card">
        <h3>{t('analytics.routePerformance')}</h3>
        <div className="analytics-chart">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={routePerformance}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, '']} />
              <Legend formatter={(value) => t(`analytics.${value}`)} />
              <Bar dataKey="onTime" stackId="a" fill="#8884d8" name="onTime" />
              <Bar dataKey="early" stackId="a" fill="#82ca9d" name="early" />
              <Bar dataKey="delayed" stackId="a" fill="#ffc658" name="delayed" />
              <Bar dataKey="canceled" stackId="a" fill="#ff8042" name="canceled" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Crowd Levels */}
      <div className="analytics-card">
        <h3>{t('analytics.crowdLevels')}</h3>
        <div className="analytics-chart">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={crowdData}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <Line type="monotone" dataKey="averageCrowd" stroke="#82ca9d" name={t('analytics.busUtilization')} />
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis dataKey="hour" label={{ value: t('common.hours'), position: 'insideBottomRight', offset: 0 }} />
              <YAxis label={{ value: "%", angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value) => [`${value}%`, t('analytics.busUtilization')]}
                labelFormatter={(label) => `${label}:00 ${t('common.hours')}`} 
              />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="analytics-export">
        <button className="export-data-button">
          {t('analytics.exportData')}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Analytics;