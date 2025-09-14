import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer 
} from 'recharts';
import type { Location } from '../types';
import { api } from '../services/api'; // Import the API instance

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

  // Load historical data when component mounts or when user selects a different time range
  useEffect(() => {
    // Don't fetch data if analytics are disabled
    if (!analyticsEnabled) {
      return;
    }
    
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch real analytics data from the backend Java 17 API
        const params: Record<string, unknown> = { timeRange };
        
        // Add optional filter parameters if provided
        if (fromLocation) params.fromLocationId = fromLocation.id;
        if (toLocation) params.toLocationId = toLocation.id;
        if (busId) params.busId = busId;
        
        // Make API calls to fetch the different analytics datasets
        const [delayResponse, punctualityResponse, performanceResponse, crowdResponse] = await Promise.all([
          api.get('/api/v1/analytics/delay', { params }),
          api.get('/api/v1/analytics/punctuality', { params }),
          api.get('/api/v1/analytics/performance', { params }),
          api.get('/api/v1/analytics/crowding', { params })
        ]);

        // Set the data from API responses
        setDelayData(delayResponse.data);
        setPunctualityData(punctualityResponse.data);
        setRoutePerformance(performanceResponse.data);
        setCrowdData(crowdResponse.data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError(t('error.networkError'));
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeRange, fromLocation, toLocation, busId, t, analyticsEnabled]);

  // Return early if analytics are disabled
  if (!analyticsEnabled) {
    return null;
  }

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