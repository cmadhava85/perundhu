import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import BusUtilizationChart, { type BusUtilizationData } from '../../../components/analytics/BusUtilizationChart';

// Mock the recharts components
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
    Line: () => <div data-testid="line" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
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

  it('renders the chart components correctly', () => {
    render(<BusUtilizationChart 
      data={mockData} 
      formatDate={formatters.formatDate}
      formatTime={formatters.formatTime}
    />);
    
    // Chart containers are rendered
    expect(screen.getAllByTestId('responsive-container')[0]).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    
    // Chart elements are rendered
    expect(screen.getByTestId('line')).toBeInTheDocument();
    
    // Check for axis and grid elements
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
  });

  it('displays summary statistics correctly', () => {
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

  it('formats time correctly using the provided formatter', () => {
    const mockFormatter = vi.fn((time) => `Formatted: ${time}`);
    
    render(<BusUtilizationChart 
      data={mockData} 
      formatDate={formatters.formatDate}
      formatTime={mockFormatter}
    />);
    
    // Formatter should be used at least once
    expect(mockFormatter).toHaveBeenCalled();
  });

  it('handles empty data gracefully', () => {
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
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    
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