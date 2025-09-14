import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import analyticsService from '../services/analyticsService';
import type { 
  AnalyticsData,
  RouteAnalytics,
  UserBehaviorAnalytics,
  PerformanceMetrics
} from '../services/analyticsService';
import './UserAnalyticsDashboard.css';

interface UserAnalyticsDashboardProps {
  userId: string;
}

interface UserAnalytics {
  totalJourneys: number;
  averageRating: number;
  carbonSaved: number;
  totalDistance: number;
  totalTrips: number;
  totalTravelTime: number;
  averageTripDuration: number;
  lastUpdated: string;
}

interface TravelTrend {
  date: string;
  journeys: number;
  day: string;
  count: number;
}

interface PopularRoute {
  from: string;
  to: string;
  count: number;
  busNames?: string;
  busIds: string[];
}

const UserAnalyticsDashboard: React.FC<UserAnalyticsDashboardProps> = ({ userId }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [travelPatterns, setTravelPatterns] = useState<TravelTrend[]>([]);
  const [popularRoutes, setPopularRoutes] = useState<PopularRoute[]>([]);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'patterns' | 'routes'>('summary');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all data using the analytics service methods
        const [analyticsData, journeyTrends, routesData] = await Promise.all([
          analyticsService.getUserAnalytics(),
          analyticsService.getJourneyTrends(),
          analyticsService.getPopularRoutes(5)
        ]);
        
        // Transform journey trends to match expected format
        const transformedPatterns: TravelTrend[] = journeyTrends.map(trend => ({
          ...trend,
          day: new Date(trend.date).toLocaleDateString('en', { weekday: 'short' }),
          count: trend.journeys
        }));
        
        // Transform route analytics to match expected format
        const transformedRoutes: PopularRoute[] = routesData.map(route => ({
          from: route.routeName.split(' - ')[0] || 'Unknown',
          to: route.routeName.split(' - ')[1] || 'Unknown',
          count: route.totalSearches,
          busNames: route.routeName,
          busIds: [route.routeId]
        }));
        
        // Create complete analytics object
        const completeAnalytics: UserAnalytics = {
          ...analyticsData,
          totalTrips: analyticsData.totalJourneys,
          totalTravelTime: analyticsData.totalDistance * 60, // Estimate time from distance
          averageTripDuration: analyticsData.totalDistance > 0 ? (analyticsData.totalDistance * 60) / analyticsData.totalJourneys : 0,
          lastUpdated: new Date().toISOString()
        };
        
        setAnalytics(completeAnalytics);
        setTravelPatterns(transformedPatterns);
        setPopularRoutes(transformedRoutes);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError(t('analytics.fetchError', 'Failed to load analytics data. Please try again later.'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [userId, t]);

  const handleExport = async () => {
    try {
      setExportLoading(true);
      
      // Create mock export functionality since the service doesn't have this method
      const data = {
        analytics,
        travelPatterns,
        popularRoutes
      };
      
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `travel-analytics-${userId}.${exportFormat === 'csv' ? 'json' : 'json'}`;
      anchor.click();
      
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError(t('analytics.exportError', 'Failed to export analytics data. Please try again.'));
    } finally {
      setExportLoading(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hours === 0) {
      return t('analytics.minutesOnly', '{{minutes}} min', { minutes: mins });
    }
    
    return t('analytics.hoursAndMinutes', '{{hours}}h {{minutes}}m', { hours, minutes: mins });
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="analytics-spinner"></div>
        <p>{t('analytics.loading', 'Loading your travel analytics...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          {t('analytics.retry', 'Retry')}
        </button>
      </div>
    );
  }

  // Find the most active day once to avoid recalculation
  const mostActiveDay = travelPatterns.length > 0 
    ? travelPatterns.reduce((max, current) => current.count > max.count ? current : max, travelPatterns[0]).day
    : '';

  return (
    <div className="analytics-dashboard">
      {/* Analytics tabs */}
      <div className="analytics-tabs-nav">
        <button 
          className={`analytics-tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          {t('analytics.tabs.summary', 'Summary')}
        </button>
        <button 
          className={`analytics-tab ${activeTab === 'patterns' ? 'active' : ''}`}
          onClick={() => setActiveTab('patterns')}
        >
          {t('analytics.tabs.patterns', 'Travel Patterns')}
        </button>
        <button 
          className={`analytics-tab ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          {t('analytics.tabs.routes', 'Popular Routes')}
        </button>
      </div>
      
      {/* Summary Tab Content */}
      {activeTab === 'summary' && analytics && (
        <div className="analytics-content">
          <div className="analytics-stats-grid">
            <div className="analytics-stat-card">
              <div className="stat-icon">🚌</div>
              <div className="stat-value">{analytics.totalTrips}</div>
              <div className="stat-label">{t('analytics.totalTrips', 'Total Trips')}</div>
            </div>
            
            <div className="analytics-stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-value">{formatDuration(analytics.totalTravelTime)}</div>
              <div className="stat-label">{t('analytics.totalTime', 'Total Travel Time')}</div>
            </div>
            
            <div className="analytics-stat-card">
              <div className="stat-icon">⌛</div>
              <div className="stat-value">{formatDuration(analytics.averageTripDuration)}</div>
              <div className="stat-label">{t('analytics.avgDuration', 'Avg Trip Duration')}</div>
            </div>
            
            <div className="analytics-stat-card">
              <div className="stat-icon">📏</div>
              <div className="stat-value">{analytics.totalDistance.toFixed(1)} km</div>
              <div className="stat-label">{t('analytics.totalDistance', 'Total Distance')}</div>
            </div>
          </div>
          
          <div className="analytics-last-updated">
            <small>
              {t('analytics.lastUpdated', 'Last updated: {{date}}', {
                date: new Date(analytics.lastUpdated).toLocaleString()
              })}
            </small>
          </div>
        </div>
      )}
      
      {/* Patterns Tab Content */}
      {activeTab === 'patterns' && travelPatterns.length > 0 && (
        <div className="analytics-content">
          <div className="analytics-section-title">
            {t('analytics.weeklyPattern', 'Weekly Travel Pattern')}
          </div>
          
          <div className="analytics-chart">
            <div className="bar-chart">
              {travelPatterns.map((pattern) => {
                const maxCount = Math.max(...travelPatterns.map(p => p.count));
                const percentage = Math.round((pattern.count / maxCount) * 100);
                return (
                  <div className="chart-item" key={pattern.day}>
                    <div className="chart-bar-container">
                      <div 
                        className="chart-bar" 
                        style={{ height: `${percentage}%` }}
                        data-count={pattern.count}
                      ></div>
                    </div>
                    <div className="chart-label">{pattern.day}</div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="analytics-insight">
            <div className="insight-icon">💡</div>
            <p>
              {t('analytics.insight.mostActive', 'You travel most frequently on {{day}}', {
                day: mostActiveDay
              })}
            </p>
          </div>
        </div>
      )}
      
      {/* Routes Tab Content */}
      {activeTab === 'routes' && popularRoutes.length > 0 && (
        <div className="analytics-content">
          <div className="analytics-section-title">
            {t('analytics.popularRoutes', 'Your Most Frequented Routes')}
          </div>
          
          <div className="popular-routes-list">
            {popularRoutes.map((route, index) => (
              <div className="popular-route-item" key={`${route.from}-${route.to}`}>
                <div className="route-rank">{index + 1}</div>
                <div className="route-details">
                  <div className="route-path">
                    <span className="route-from">{route.from}</span>
                    <span className="route-arrow">→</span>
                    <span className="route-to">{route.to}</span>
                  </div>
                  <div className="route-frequency">
                    {t('analytics.tripCount', '{{count}} trips', { count: route.count })}
                  </div>
                  <div className="route-buses">
                    {t('analytics.busesUsed', 'Buses used:')} 
                    {route.busNames || route.busIds.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Export functionality */}
      <div className="analytics-export-section">
        <div className="export-controls">
          <label className="export-label">
            {t('analytics.export.format', 'Export format:')}
          </label>
          <select 
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
            className="export-select"
            disabled={exportLoading}
          >
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
          <button 
            className="export-button"
            onClick={handleExport}
            disabled={exportLoading}
          >
            {exportLoading 
              ? t('analytics.export.exporting', 'Exporting...') 
              : t('analytics.export.exportData', 'Export Data')}
          </button>
        </div>
        <div className="export-hint">
          <small>
            {t('analytics.export.hint', 'Export your travel data to analyze in other applications')}
          </small>
        </div>
      </div>
    </div>
  );
};

export default UserAnalyticsDashboard;