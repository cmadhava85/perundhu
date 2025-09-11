import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface PunctualityStat {
  category: string;
  value: number;
  color: string;
}

interface PunctualityChartProps {
  data: {
    early: number;
    onTime: number;
    delayed: number;
    veryDelayed: number;
  };
}

const PunctualityChart: React.FC<PunctualityChartProps> = ({ data }) => {
  const { t } = useTranslation();

  const chartData: PunctualityStat[] = [
    { category: t('analytics.early'), value: data.early, color: '#4CAF50' },
    { category: t('analytics.onTime'), value: data.onTime, color: '#2196F3' },
    { category: t('analytics.delayed'), value: data.delayed, color: '#FF9800' },
    { category: t('analytics.veryDelayed'), value: data.veryDelayed, color: '#F44336' }
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {t('analytics.punctualityStats')}
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PunctualityChart;