export type TimeRange = 'day' | 'week' | 'month' | 'custom';
export type DataType = 'punctuality' | 'crowdLevels' | 'busUtilization';

// Analytics data type interfaces
export interface AnalyticsSummary {
  title: string;
  description: string;
  totalTrips?: number;
  totalPassengers?: number;
  averagePassengersPerTrip?: number;
  utilization?: number;
  averageUtilization?: number;
  dataPoints: number;
  averageCrowdLevel?: number;
  peakHours?: string[];
  quietHours?: string[];
  mostCrowdedBus?: string;
  leastCrowdedBus?: string;
  crowed?: string; // Including with typo for backward compatibility
}

export interface ChartDataPoint {
  [key: string]: string | number;
}

export interface PieChartItem {
  name: string;
  value: number;
}

export interface PunctualityDay {
  date: string;
  onTimePercentage?: number;
  delayedPercentage?: number;
}

export interface CrowdTimePoint {
  time: string;
  crowdLevel: number;
}

export interface AnalyticsData {
  data: ChartDataPoint[];
  pieData?: PieChartItem[];
  summary: AnalyticsSummary;
  bestDays?: PunctualityDay[];
  worstDays?: PunctualityDay[];
  peakHours?: CrowdTimePoint[];
  leastCrowdedHours?: CrowdTimePoint[];
}

export interface ChartProps {
  data: AnalyticsData;
  formatDate: (date: string) => string;
  formatTime: (time: string) => string;
}

export interface TooltipPayloadItem {
  name: string;
  value: number | string;
  color?: string;
  dataKey?: string;
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}