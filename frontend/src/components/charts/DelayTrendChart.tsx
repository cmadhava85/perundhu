import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface DelayTrendData {
  time: string;
  averageDelay: number;
  routeId?: string;
}

interface DelayTrendChartProps {
  data: DelayTrendData[];
  title: string;
}

const DelayTrendChart: React.FC<DelayTrendChartProps> = ({ data, title }) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              label={{ value: t('analytics.delayMinutes'), angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number) => [`${value} ${t('analytics.minutes')}`, t('analytics.averageDelay')]}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="averageDelay" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DelayTrendChart;