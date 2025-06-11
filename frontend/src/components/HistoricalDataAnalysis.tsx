import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import axios from 'axios';
import { Box, Card, CardContent, Typography, Grid, Button, MenuItem, 
  Select, FormControl, InputLabel, CircularProgress, Tabs, Tab, Paper } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import { format, subDays, subWeeks, subMonths } from 'date-fns';

// Types
interface ArrivalData {
  date: string;
  predictedTime: string;
  actualTime: string;
  delayMinutes: number;
  busId: number;
  routeId: number;
  stopId: number;
}

interface PunctualityStat {
  category: string;
  value: number;
  color: string;
}

interface HistoricalBusData {
  arrivalData: ArrivalData[];
  punctualityStats: {
    early: number;
    onTime: number;
    delayed: number;
    veryDelayed: number;
  };
  busUtilization: {
    date: string;
    utilization: number;
  }[];
  crowdLevels: {
    hour: number;
    averageCrowd: number;
  }[];
}

interface TimeRangeOption {
  value: string;
  label: string;
}

interface RoutePerformance {
  routeId: number;
  routeName: string;
  onTimePercentage: number;
  averageDelay: number;
  totalTrips: number;
}

// Main component
const HistoricalDataAnalysis: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalBusData | null>(null);
  const [timeRange, setTimeRange] = useState<string>('week');
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [selectedView, setSelectedView] = useState<number>(0);
  const [routePerformance, setRoutePerformance] = useState<RoutePerformance[]>([]);
  const routeId = 'all'; 
  const [dataType, setDataType] = useState<string>('punctuality');

  // Time range options
  const timeRangeOptions: TimeRangeOption[] = [
    { value: 'day', label: t('analytics.day') },
    { value: 'week', label: t('analytics.week') },
    { value: 'month', label: t('analytics.month') },
    { value: 'custom', label: t('analytics.customRange') },
  ];

  // Data type options
  const dataTypeOptions = [
    { value: 'punctuality', label: t('analytics.punctuality') },
    { value: 'crowdLevels', label: t('analytics.crowdLevels') },
    { value: 'busUtilization', label: t('analytics.busUtilization') }
  ];

  // Effect for loading data
  useEffect(() => {
    fetchHistoricalData();
  }, [timeRange, i18n.language]);

  // Function to fetch historical data
  const fetchHistoricalData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate dates based on time range
      let start = startDate;
      let end = endDate;
      
      if (timeRange !== 'custom') {
        end = new Date();
        if (timeRange === 'day') {
          start = subDays(end, 1);
        } else if (timeRange === 'week') {
          start = subWeeks(end, 1);
        } else if (timeRange === 'month') {
          start = subMonths(end, 1);
        }
      }
      
      // Format for API
      const startStr = start ? format(start, 'yyyy-MM-dd') : '';
      const endStr = end ? format(end, 'yyyy-MM-dd') : '';
      
      // Fetch data from real backend API
      const response = await axios.get('/api/v1/analytics/historical-data', {
        params: {
          routeId: routeId === 'all' ? undefined : routeId,
          startDate: startStr,
          endDate: endStr
        }
      });
      
      setHistoricalData(response.data);
      
      // Fetch route performance
      const routeResponse = await axios.get('/api/v1/analytics/route-performance', {
        params: {
          startDate: startStr,
          endDate: endStr
        }
      });
      
      setRoutePerformance(routeResponse.data);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setError(t('error.serverError'));
    } finally {
      setLoading(false);
    }
  };

  // Function to export data
  const exportData = () => {
    if (!historicalData) return;
    
    // Convert to CSV
    const headers = 'Date,PredictedTime,ActualTime,DelayMinutes,BusId,RouteId,StopId\n';
    const csvData = historicalData.arrivalData.map(record => 
      `${record.date},${record.predictedTime},${record.actualTime},${record.delayMinutes},${record.busId},${record.routeId},${record.stopId}`
    ).join('\n');
    
    const csvContent = headers + csvData;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bus_data_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tab change handler
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedView(newValue);
  };

  // Prepare punctuality data for pie chart
  const preparePunctualityData = (): PunctualityStat[] => {
    if (!historicalData) return [];
    
    const { punctualityStats } = historicalData;
    
    return [
      { category: t('analytics.early'), value: punctualityStats.early, color: '#82ca9d' },
      { category: t('analytics.onTime'), value: punctualityStats.onTime, color: '#8884d8' },
      { category: t('analytics.delayed'), value: punctualityStats.delayed, color: '#ffc658' },
      { category: t('analytics.veryDelayed'), value: punctualityStats.veryDelayed, color: '#ff8042' }
    ];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          {t('loading.message')}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          {error}
        </Typography>
        <Button variant="contained" onClick={fetchHistoricalData} sx={{ mt: 2 }}>
          {t('error.retry')}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('analytics.title')}
      </Typography>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel id="time-range-label">
                {t('analytics.timeRange')}
              </InputLabel>
              <Select
                labelId="time-range-label"
                value={timeRange}
                label={t('analytics.timeRange')}
                onChange={(e) => setTimeRange(e.target.value as string)}
              >
                {timeRangeOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {timeRange === 'custom' && (
            <>
              <Grid item xs={12} sm={4} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label={t('analytics.startDate')}
                    value={startDate}
                    onChange={(date) => setStartDate(date)}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={4} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label={t('analytics.endDate')}
                    value={endDate}
                    onChange={(date) => setEndDate(date)}
                  />
                </LocalizationProvider>
              </Grid>
            </>
          )}
          
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel id="data-type-label">
                {t('analytics.dataType')}
              </InputLabel>
              <Select
                labelId="data-type-label"
                value={dataType}
                label={t('analytics.dataType')}
                onChange={(e) => setDataType(e.target.value as string)}
              >
                {dataTypeOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4} md={2}>
            <Button 
              variant="contained" 
              fullWidth
              startIcon={<FilterListIcon />}
              onClick={fetchHistoricalData}
            >
              {t('common.apply')}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={selectedView} 
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab icon={<ShowChartIcon />} label={t('analytics.historicalView')} />
          <Tab icon={<TableChartIcon />} label={t('analytics.routePerformance')} />
        </Tabs>
      </Box>
      
      {/* Main content based on selected tab */}
      {selectedView === 0 ? (
        // Historical View
        <Grid container spacing={3}>
          {/* Punctuality Pie Chart */}
          {dataType === 'punctuality' && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('analytics.onTimePerformance')}
                  </Typography>
                  
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={preparePunctualityData()}
                        dataKey="value"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.category}: ${entry.value}%`}
                      >
                        {preparePunctualityData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {/* Arrival Time Chart */}
          {dataType === 'punctuality' && historicalData?.arrivalData && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('analytics.delayStatistics')}
                  </Typography>
                  
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={historicalData.arrivalData}
                      margin={{
                        top: 5, right: 30, left: 20, bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis 
                        label={{ 
                          value: t('analytics.delayStatistics') + ' (min)', 
                          angle: -90, 
                          position: 'insideLeft' 
                        }} 
                      />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="delayMinutes" 
                        stroke="#8884d8" 
                        name={t('analytics.delayed')}
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {/* Crowd Levels Chart */}
          {dataType === 'crowdLevels' && historicalData?.crowdLevels && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('analytics.crowdLevels')}
                  </Typography>
                  
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={historicalData.crowdLevels}
                      margin={{
                        top: 5, right: 30, left: 20, bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="hour"
                        tickFormatter={(hour) => `${hour}:00`}
                        label={{ value: t('analytics.time'), position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        label={{ 
                          value: t('analytics.crowdLevel') + ' (%)', 
                          angle: -90, 
                          position: 'insideLeft' 
                        }} 
                      />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                      <Bar 
                        dataKey="averageCrowd" 
                        name={t('analytics.crowdLevel')}
                        fill="#82ca9d" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {/* Bus Utilization Chart */}
          {dataType === 'busUtilization' && historicalData?.busUtilization && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('analytics.busUtilization')}
                  </Typography>
                  
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={historicalData.busUtilization}
                      margin={{
                        top: 5, right: 30, left: 20, bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis 
                        label={{ 
                          value: t('analytics.utilization') + ' (%)', 
                          angle: -90, 
                          position: 'insideLeft' 
                        }}
                      />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="utilization" 
                        name={t('analytics.utilization')}
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {/* Export Data Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />}
                onClick={exportData}
              >
                {t('analytics.exportData')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      ) : (
        // Route Performance View
        <Box>
          <Typography variant="h6" gutterBottom>
            {t('analytics.routePerformance')}
          </Typography>
          
          <Paper>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>{t('routes.busNumber')}</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>{t('routes.routeName')}</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>{t('analytics.onTimePerformance')}</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>{t('analytics.delay')} (min)</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>{t('analytics.totalTrips')}</th>
                  </tr>
                </thead>
                <tbody>
                  {routePerformance.map((route) => (
                    <tr key={route.routeId} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>{route.routeId}</td>
                      <td style={{ padding: '12px' }}>{route.routeName}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{route.onTimePercentage}%</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{route.averageDelay}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{route.totalTrips}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default HistoricalDataAnalysis;
