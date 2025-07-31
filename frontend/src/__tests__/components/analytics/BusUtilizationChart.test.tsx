import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BusUtilizationChart, { type BusUtilizationData } from '../../../components/analytics/BusUtilizationChart';

// Mock the recharts components
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="bar-chart">{children}</div>
    ),
    RadialBarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="radial-bar-chart">{children}</div>
    ),
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    XAxis: ({ tickFormatter }: any) => {
      // Call the formatter at least once if provided
      if (tickFormatter && typeof tickFormatter === 'function') {
        tickFormatter('06:00');
      }
      return <div data-testid="xaxis" />;
    },
    YAxis: () => <div data-testid="yaxis" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
    Bar: ({ dataKey }: { dataKey: string }) => (
      <div data-testid={`bar-${dataKey}`}>{dataKey}</div>
    ),
    RadialBar: (props: any) => {
      // Extract props to determine what to render
      const { dataKey, 'data-testid': testId } = props;
      return <div data-testid={testId || `radial-bar-${dataKey}`}>{dataKey}</div>;
    },
  };
});

// Mock the i18n hook
jest.mock('react-i18next', () => ({
  useTranslation: () => {
    return {
      t: (key: string) => key, // Return the key as translation
      i18n: {
        changeLanguage: jest.fn()
      }
    };
  }
}));

describe('BusUtilizationChart Component', () => {
  // Sample test data
  const mockData: BusUtilizationData = {
    buses: [
      {
        busId: '1',
        busName: 'Chennai Express',
        utilization: 85,
        capacity: 50,
        averagePassengers: 42
      },
      {
        busId: '2',
        busName: 'Coimbatore Flyer',
        utilization: 92,
        capacity: 45,
        averagePassengers: 41
      },
      {
        busId: '3',
        busName: 'Madurai Traveller',
        utilization: 65,
        capacity: 55,
        averagePassengers: 36
      }
    ],
    timeSeries: [
      { time: '06:00', utilization: 80, passengers: 40 },
      { time: '09:00', utilization: 95, passengers: 47 },
      { time: '12:00', utilization: 75, passengers: 38 },
      { time: '15:00', utilization: 60, passengers: 30 },
      { time: '18:00', utilization: 90, passengers: 45 }
    ],
    summary: {
      totalTrips: 100,
      averageUtilization: 75,
      mostCrowdedBus: 'Coimbatore Flyer',
      leastCrowdedBus: 'Madurai Traveller'
    }
  };

  const formatters = {
    formatDate: (date: string) => date,
    formatTime: (time: string) => time
  };

  test('renders the chart components correctly', () => {
    render(<BusUtilizationChart 
      data={mockData} 
      formatDate={formatters.formatDate}
      formatTime={formatters.formatTime}
    />);
    
    // Chart containers are rendered
    expect(screen.getAllByTestId('responsive-container')[0]).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('radial-bar-chart')).toBeInTheDocument();
    
    // Chart elements are rendered
    expect(screen.getByTestId('radial-bar-utilization')).toBeInTheDocument();
    
    // Check for axis and grid elements
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('xaxis')).toBeInTheDocument();
    expect(screen.getAllByTestId('yaxis').length).toBe(2);
    
    // Check for bars
    expect(screen.getByTestId('bar-utilization')).toBeInTheDocument();
    expect(screen.getByTestId('bar-passengers')).toBeInTheDocument();
  });

  test('displays summary statistics correctly', () => {
    render(<BusUtilizationChart 
      data={mockData} 
      formatDate={formatters.formatDate}
      formatTime={formatters.formatTime}
    />);
    
    // Summary statistics are displayed
    expect(screen.getByText('analytics.overallUtilization')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('analytics.totalTrips')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('analytics.mostCrowdedBus')).toBeInTheDocument();
    expect(screen.getByText('Coimbatore Flyer')).toBeInTheDocument();
    expect(screen.getByText('analytics.leastCrowdedBus')).toBeInTheDocument();
    expect(screen.getByText('Madurai Traveller')).toBeInTheDocument();
  });

  test('formats time correctly using the provided formatter', () => {
    const mockFormatter = jest.fn((time) => `Formatted: ${time}`);
    
    render(<BusUtilizationChart 
      data={mockData} 
      formatDate={formatters.formatDate}
      formatTime={mockFormatter}
    />);
    
    // Formatter should be used at least once
    expect(mockFormatter).toHaveBeenCalled();
  });

  test('handles empty data gracefully', () => {
    const emptyData: BusUtilizationData = {
      buses: [],
      timeSeries: [],
      summary: {
        totalTrips: 0,
        averageUtilization: 0,
        mostCrowdedBus: '-',
        leastCrowdedBus: '-'
      }
    };
    
    render(<BusUtilizationChart 
      data={emptyData} 
      formatDate={formatters.formatDate}
      formatTime={formatters.formatTime}
    />);
    
    // Charts should still render without errors
    expect(screen.getAllByTestId('responsive-container')[0]).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('radial-bar-chart')).toBeInTheDocument();
    
    // Summary statistics display defaults
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    
    // Check for the mostCrowdedBus and leastCrowdedBus values more specifically
    const mostCrowdedBusSection = screen.getByText('analytics.mostCrowdedBus').parentElement;
    const leastCrowdedBusSection = screen.getByText('analytics.leastCrowdedBus').parentElement;
    
    expect(mostCrowdedBusSection).toHaveTextContent('-');
    expect(leastCrowdedBusSection).toHaveTextContent('-');
  });
});