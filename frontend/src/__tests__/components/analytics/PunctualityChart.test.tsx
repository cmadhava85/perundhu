import React from 'react';
import { render, screen } from '../../../test-utils';
import { vi, describe, it, expect } from 'vitest';
import PunctualityChart from '../../../components/analytics/PunctualityChart';

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Return the key as-is for testing
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

interface MockContainerProps {
  children: React.ReactNode;
}

interface MockBarProps {
  dataKey: string;
}

// Mock recharts components
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: MockContainerProps) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    PieChart: ({ children }: MockContainerProps) => (
      <div data-testid="pie-chart">{children}</div>
    ),
    Pie: ({ children }: MockContainerProps) => (
      <div data-testid="pie">{children}</div>
    ),
    BarChart: ({ children }: MockContainerProps) => (
      <div data-testid="bar-chart">{children}</div>
    ),
    Bar: (props: MockBarProps) => <div data-testid={`bar-${props.dataKey}`}>{props.dataKey}</div>,
    Cell: () => <div data-testid="cell" />,
    XAxis: () => <div data-testid="xaxis" />,
    YAxis: () => <div data-testid="yaxis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
  };
});

// Mock CustomTooltip component
vi.mock('../../../components/analytics/CustomTooltip', () => ({
  default: () => <div data-testid="custom-tooltip">Custom Tooltip</div>
}));

describe('PunctualityChart Component', () => {
  const mockData = {
    data: [
      { date: '2025-06-01', early: 10, onTime: 80, delayed: 5, veryDelayed: 5 },
      { date: '2025-06-02', early: 15, onTime: 75, delayed: 8, veryDelayed: 2 }
    ],
    pieData: [
      { name: 'Early', value: 10 },
      { name: 'On Time', value: 80 },
      { name: 'Delayed', value: 10 }
    ],
    summary: {
      title: 'On-Time Performance Summary',
      description: 'Analysis of bus punctuality',
      dataPoints: 50
    },
    bestDays: [
      { date: '2025-06-02', onTimePercentage: 85 }
    ],
    worstDays: [
      { date: '2025-06-01', delayedPercentage: 20 }
    ]
  };

  const formatDate = vi.fn((date) => `Formatted: ${date}`);
  const formatTime = vi.fn((time) => `Formatted: ${time}`);

  it('renders the chart components correctly', () => {
    render(<PunctualityChart 
      data={mockData} 
      formatDate={formatDate}
      formatTime={formatTime}
    />);

    // Chart title is displayed (now checking for i18n key)
    expect(screen.getByText('analytics.punctualityTitle')).toBeInTheDocument();
    
    // Chart containers are rendered
    expect(screen.getAllByTestId('responsive-container').length).toBe(2);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    
    // Chart elements are rendered
    expect(screen.getByTestId('pie')).toBeInTheDocument();
    expect(screen.getByTestId('bar-early')).toBeInTheDocument();
    expect(screen.getByTestId('bar-onTime')).toBeInTheDocument();
    expect(screen.getByTestId('bar-delayed')).toBeInTheDocument();
    expect(screen.getByTestId('bar-veryDelayed')).toBeInTheDocument();
  });

  it('renders analytics details correctly', () => {
    render(<PunctualityChart 
      data={mockData} 
      formatDate={formatDate}
      formatTime={formatTime}
    />);

    // Detail sections are displayed (now checking for i18n keys)
    expect(screen.getByText('analytics.bestDays')).toBeInTheDocument();
    expect(screen.getByText('analytics.worstDays')).toBeInTheDocument();
    
    // Best days data is displayed
    expect(screen.getByText(/Formatted: 2025-06-02/)).toBeInTheDocument();
    expect(screen.getByText(/85.*analytics.onTime/)).toBeInTheDocument();
    
    // Worst days data is displayed
    expect(screen.getByText(/Formatted: 2025-06-01/)).toBeInTheDocument();
    expect(screen.getByText(/20.*analytics.delayed/)).toBeInTheDocument();
  });

  it('calls formatDate with the correct parameters', () => {
    render(<PunctualityChart 
      data={mockData} 
      formatDate={formatDate}
      formatTime={formatTime}
    />);
    
    // FormatDate should be called for rendering best days
    expect(formatDate).toHaveBeenCalledWith('2025-06-02');
    
    // FormatDate should be called for rendering worst days
    expect(formatDate).toHaveBeenCalledWith('2025-06-01');
  });
});