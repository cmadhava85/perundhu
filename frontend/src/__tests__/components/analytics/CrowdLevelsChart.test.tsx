import { render, screen } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import CrowdLevelsChart, { type CrowdLevelsData } from '../../../components/analytics/CrowdLevelsChart';

// Mock the recharts components
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
    Area: (props: any) => <div data-testid={`area-${props.dataKey}`} />,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    Bar: (props: any) => <div data-testid={`bar-${props.dataKey}`} />,
    XAxis: () => <div data-testid="xaxis" />,
    YAxis: () => <div data-testid="yaxis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />
  };
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' }
  })
}));

describe('CrowdLevelsChart Component', () => {
  // Sample test data matching the CrowdLevelsData interface
  const mockData: CrowdLevelsData = {
    hourly: [
      { time: '06:00', low: 20, medium: 30, high: 10 },
      { time: '09:00', low: 15, medium: 40, high: 25 },
      { time: '12:00', low: 25, medium: 35, high: 15 },
      { time: '15:00', low: 30, medium: 30, high: 10 },
      { time: '18:00', low: 10, medium: 45, high: 30 }
    ],
    daily: [
      { date: '2025-06-10', low: 100, medium: 150, high: 50, total: 300 },
      { date: '2025-06-11', low: 90, medium: 140, high: 70, total: 300 },
      { date: '2025-06-12', low: 110, medium: 130, high: 60, total: 300 },
      { date: '2025-06-13', low: 120, medium: 120, high: 60, total: 300 },
      { date: '2025-06-14', low: 80, medium: 160, high: 60, total: 300 }
    ],
    summary: {
      averageCrowdLevel: 6.8,
      peakHours: ['09:00', '18:00'],
      quietHours: ['06:00', '15:00']
    }
  };

  const formatters = {
    formatDate: (date: string) => `Formatted Date: ${date}`,
    formatTime: (time: string) => `Formatted Time: ${time}`
  };

  it('renders the chart components correctly', () => {
    render(<CrowdLevelsChart 
      data={mockData} 
      formatDate={formatters.formatDate}
      formatTime={formatters.formatTime}
    />);
    
    // Chart containers are rendered
    expect(screen.getAllByTestId('responsive-container')[0]).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    
    // Chart elements are rendered
    expect(screen.getByTestId('area-low')).toBeInTheDocument();
    expect(screen.getByTestId('area-medium')).toBeInTheDocument();
    expect(screen.getByTestId('area-high')).toBeInTheDocument();
    expect(screen.getByTestId('bar-total')).toBeInTheDocument();
    
    // Check for axis and grid elements
    expect(screen.getAllByTestId('cartesian-grid').length).toBe(2);
    expect(screen.getAllByTestId('xaxis').length).toBe(2);
    expect(screen.getAllByTestId('yaxis').length).toBe(2);
  });

  it('displays summary statistics correctly', () => {
    render(<CrowdLevelsChart 
      data={mockData} 
      formatDate={formatters.formatDate}
      formatTime={formatters.formatTime}
    />);
    
    // Summary statistics are displayed
    expect(screen.getByText('analytics.peakHours')).toBeInTheDocument();
    expect(screen.getByText('analytics.quietHours')).toBeInTheDocument();
    expect(screen.getByText('analytics.averageCrowdLevel')).toBeInTheDocument();
    expect(screen.getByText('6.8')).toBeInTheDocument();
    
    // Check for formatted times in the peak and quiet hours
    mockData.summary.peakHours.forEach(hour => {
      expect(screen.getByText(formatters.formatTime(hour))).toBeInTheDocument();
    });
    
    mockData.summary.quietHours.forEach(hour => {
      expect(screen.getByText(formatters.formatTime(hour))).toBeInTheDocument();
    });
  });

  it.skip('applies formatters correctly', () => {
    const mockTimeFormatter = vi.fn(time => `Time: ${time}`);
    const mockDateFormatter = vi.fn(date => `Date: ${date}`);
    
    render(<CrowdLevelsChart 
      data={mockData} 
      formatDate={mockDateFormatter}
      formatTime={mockTimeFormatter}
    />);
    
    // Formatters should be called
    expect(mockTimeFormatter).toHaveBeenCalled();
    expect(mockDateFormatter).toHaveBeenCalled();
  });

  it('handles empty data gracefully', () => {
    const emptyData: CrowdLevelsData = {
      hourly: [],
      daily: [],
      summary: {
        averageCrowdLevel: 0,
        peakHours: [],
        quietHours: []
      }
    };
    
    render(<CrowdLevelsChart 
      data={emptyData} 
      formatDate={formatters.formatDate}
      formatTime={formatters.formatTime}
    />);
    
    // Charts should still render without errors
    expect(screen.getAllByTestId('responsive-container')[0]).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    
    // Summary statistics should show default values
    expect(screen.getByText('0.0')).toBeInTheDocument();
  });
});