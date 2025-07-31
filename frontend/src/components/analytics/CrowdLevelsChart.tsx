import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ResponsiveContainer, AreaChart, Area, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import CustomTooltip from './CustomTooltip';
import '../../styles/AnalyticsComponents.css';

// Export the data type for use in adapter functions
export interface CrowdLevelsData {
  hourly: Array<{
    time: string;
    low: number;
    medium: number;
    high: number;
  }>;
  daily: Array<{
    date: string;
    low: number;
    medium: number;
    high: number;
    total: number;
  }>;
  summary: {
    averageCrowdLevel: number;
    peakHours: string[];
    quietHours: string[];
  };
}

interface CrowdLevelsChartProps {
  data: CrowdLevelsData;
  formatDate: (date: string) => string;
  formatTime: (time: string) => string;
}

const CrowdLevelsChart: React.FC<CrowdLevelsChartProps> = ({ data, formatDate, formatTime }) => {
  const { t } = useTranslation();
  
  return (
    <div className="chart-container">
      <h4>{t('analytics.crowdLevelsTitle')}</h4>
      
      <div className="chart-row">
        <div className="chart-col">
          <h5>{t('analytics.hourlyDistribution')}</h5>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={data.hourly}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                tickFormatter={formatTime}
              />
              <YAxis />
              <Tooltip 
                content={<CustomTooltip />}
                formatter={(value) => `${value}%`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="low" 
                stackId="1"
                stroke="#82ca9d" 
                fill="#82ca9d"
                name={t('analytics.lowCrowd')} 
              />
              <Area 
                type="monotone" 
                dataKey="medium" 
                stackId="1"
                stroke="#ffc658" 
                fill="#ffc658" 
                name={t('analytics.mediumCrowd')}
              />
              <Area 
                type="monotone" 
                dataKey="high" 
                stackId="1"
                stroke="#ff8042" 
                fill="#ff8042" 
                name={t('analytics.highCrowd')}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-col">
          <h5>{t('analytics.dailyDistribution')}</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data.daily}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
              />
              <YAxis />
              <Tooltip 
                content={<CustomTooltip />}
                formatter={(value) => `${value}`}
              />
              <Legend />
              <Bar 
                dataKey="total" 
                fill="#8884d8" 
                name={t('analytics.totalPassengers')}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="analytics-details">
        <div className="detail-stat">
          <h5>{t('analytics.peakHours')}</h5>
          <ul>
            {data.summary.peakHours.map((hour, index) => (
              <li key={`peak-hour-${index}`}>{formatTime(hour)}</li>
            ))}
          </ul>
        </div>
        
        <div className="detail-stat">
          <h5>{t('analytics.quietHours')}</h5>
          <ul>
            {data.summary.quietHours.map((hour, index) => (
              <li key={`quiet-hour-${index}`}>{formatTime(hour)}</li>
            ))}
          </ul>
        </div>
        
        <div className="detail-stat">
          <h5>{t('analytics.averageCrowdLevel')}</h5>
          <p>
            <span className="stat-value">{data.summary.averageCrowdLevel.toFixed(1)}</span>
            <span className="stat-label"> / 10</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CrowdLevelsChart;