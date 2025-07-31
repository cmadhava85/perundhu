import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';
import CustomTooltip from './CustomTooltip';
import '../../styles/AnalyticsComponents.css';

interface PunctualityChartProps {
  data: {
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
  };
  formatDate: (date: string) => string;
  formatTime: (time: string) => string; // Kept for API consistency with other chart components
}

const COLORS = ['#4CAF50', '#2196F3', '#FFC107', '#F44336'];

const PunctualityChart: React.FC<PunctualityChartProps> = ({ data, formatDate }) => {
  const { t } = useTranslation();
  
  // Default empty arrays to prevent undefined errors
  const pieData = data?.pieData || [];
  const chartData = data?.data || [];
  const bestDays = data?.bestDays || [];
  const worstDays = data?.worstDays || [];
  
  return (
    <div className="chart-container">
      <h4>{t('analytics.punctualityTitle')}</h4>
      
      <div className="chart-row">
        <div className="chart-col">
          <h5>{t('analytics.statusDistribution')}</h5>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-col">
          <h5>{t('analytics.dailyPunctuality')}</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              stackOffset="expand"
              barSize={20}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
              />
              <YAxis tickFormatter={(value) => `${Math.round(value * 100)}%`} />
              <Tooltip 
                content={<CustomTooltip />}
                formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`}
              />
              <Legend />
              <Bar 
                dataKey="early" 
                stackId="a" 
                fill={COLORS[0]} 
                name={t('analytics.early')}
              />
              <Bar 
                dataKey="onTime" 
                stackId="a" 
                fill={COLORS[1]} 
                name={t('analytics.onTime')}
              />
              <Bar 
                dataKey="delayed" 
                stackId="a" 
                fill={COLORS[2]} 
                name={t('analytics.delayed')}
              />
              <Bar 
                dataKey="veryDelayed" 
                stackId="a" 
                fill={COLORS[3]} 
                name={t('analytics.veryDelayed')}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="analytics-details">
        <div className="detail-stat">
          <h5>{t('analytics.bestDays')}</h5>
          <ul>
            {bestDays.map((day, index) => (
              <li key={`best-day-${index}`}>
                {formatDate(day.date)} - {(day.onTimePercentage * 100).toFixed(1)}% {t('analytics.onTime')}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="detail-stat">
          <h5>{t('analytics.worstDays')}</h5>
          <ul>
            {worstDays.map((day, index) => (
              <li key={`worst-day-${index}`}>
                {formatDate(day.date)} - {(day.delayedPercentage * 100).toFixed(1)}% {t('analytics.delayed')}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PunctualityChart;