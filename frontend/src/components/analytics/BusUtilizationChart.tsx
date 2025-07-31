import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, RadialBarChart, RadialBar 
} from 'recharts';
import CustomTooltip from './CustomTooltip';
import '../../styles/AnalyticsComponents.css';

// Export the data type so it can be used by adapter functions
export interface BusUtilizationData {
  buses: Array<{
    busId: string;
    busName: string;
    utilization: number;
    capacity: number;
    averagePassengers: number;
  }>;
  timeSeries: Array<{
    time: string;
    utilization: number;
    passengers: number;
  }>;
  summary: {
    totalTrips: number;
    averageUtilization: number;
    mostCrowdedBus: string;
    leastCrowdedBus: string;
  };
}

interface BusUtilizationChartProps {
  data: BusUtilizationData;
  formatDate: (date: string) => string;
  formatTime: (time: string) => string;
}

// Color generation helper function to ensure consistency
const generateDeterministicColor = (id: string): string => {
  // Simple hash function to convert string to a number
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to a viable hex color
  const c = (hash & 0x00FFFFFF)
    .toString(16)
    .toUpperCase();
  
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

const BusUtilizationChart: React.FC<BusUtilizationChartProps> = ({ data, formatTime }) => {
  const { t } = useTranslation();
  
  // Default values to prevent undefined errors
  const buses = data?.buses || [];
  const timeSeries = data?.timeSeries || [];
  const summary = data?.summary || {
    totalTrips: 0,
    averageUtilization: 0,
    mostCrowdedBus: '-',
    leastCrowdedBus: '-'
  };
  
  // Process data for the radial chart
  const radialData = buses.map(bus => ({
    name: bus.busName,
    utilization: bus.utilization,
    fill: generateDeterministicColor(bus.busId), // Deterministic color based on busId
  }));
  
  return (
    <div className="chart-container">
      <h4>{t('analytics.busUtilizationTitle')}</h4>
      
      <div className="chart-row">
        <div className="chart-col">
          <h5>{t('analytics.utilizationByBus')}</h5>
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="20%" 
              outerRadius="80%" 
              barSize={10} 
              data={radialData}
            >
              <RadialBar
                label={{ position: 'insideStart', fill: '#333', formatter: (value: number) => `${value}%` }}
                background
                dataKey="utilization"
                data-testid="radial-bar-utilization"
              />
              <Tooltip
                content={<CustomTooltip />}
                formatter={(value) => `${value}%`}
              />
              <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-col">
          <h5>{t('analytics.utilizationOverTime')}</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={timeSeries}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                tickFormatter={formatTime}
              />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip 
                content={<CustomTooltip />}
                formatter={(value, name) => [
                  name === 'utilization' ? `${value}%` : value, 
                  name === 'utilization' ? t('analytics.utilization') : t('analytics.passengers')
                ]}
              />
              <Legend />
              <Bar 
                yAxisId="left" 
                dataKey="utilization" 
                fill="#8884d8" 
                name={t('analytics.utilization')}
              />
              <Bar 
                yAxisId="right" 
                dataKey="passengers" 
                fill="#82ca9d" 
                name={t('analytics.passengers')}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="analytics-details">
        <div className="detail-stat">
          <h5>{t('analytics.overallUtilization')}</h5>
          <p className="utilization-percentage">{summary.averageUtilization}%</p>
        </div>
        
        <div className="detail-stat">
          <h5>{t('analytics.totalTrips')}</h5>
          <p className="trip-count">{summary.totalTrips}</p>
        </div>
        
        <div className="detail-stat">
          <h5>{t('analytics.mostCrowdedBus')}</h5>
          <p>{summary.mostCrowdedBus}</p>
        </div>
        
        <div className="detail-stat">
          <h5>{t('analytics.leastCrowdedBus')}</h5>
          <p>{summary.leastCrowdedBus}</p>
        </div>
      </div>
    </div>
  );
};

export default BusUtilizationChart;