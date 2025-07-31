import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HistoricalAnalytics from '../../components/HistoricalAnalytics';
import { getHistoricalData } from '../../services/analyticsService';

// Mock the analytics service
jest.mock('../../services/analyticsService', () => ({
  getHistoricalData: jest.fn()
}));

// Mock the child components to simplify testing
jest.mock('../../components/analytics/AnalyticsFilterControls', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="filter-controls">
      <button 
        data-testid="time-range-selector" 
        onClick={() => props.onTimeRangeChange('week')}
      >
        Change Time Range
      </button>
      <button 
        data-testid="data-type-selector" 
        onClick={() => props.onDataTypeChange('punctuality')}
      >
        Change Data Type
      </button>
    </div>
  )
}));

jest.mock('../../components/analytics/PunctualityChart', () => ({
  __esModule: true,
  default: () => <div data-testid="punctuality-chart">Punctuality Chart</div>
}));

jest.mock('../../components/analytics/CrowdLevelsChart', () => ({
  __esModule: true,
  default: () => <div data-testid="crowd-levels-chart">Crowd Levels Chart</div>
}));

jest.mock('../../components/analytics/BusUtilizationChart', () => ({
  __esModule: true,
  default: () => <div data-testid="bus-utilization-chart">Bus Utilization Chart</div>
}));

jest.mock('../../components/analytics/ContinueIteration', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="continue-iteration">
      <button 
        data-testid="load-more" 
        onClick={props.onContinue}
        disabled={props.isLoading}
      >
        Load More
      </button>
    </div>
  )
}));

jest.mock('../../components/analytics/ExportSection', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="export-section">
      <button 
        data-testid="export-button" 
        onClick={props.onExport}
      >
        Export
      </button>
    </div>
  )
}));

jest.mock('../../components/analytics/AnalyticsLoading', () => ({
  __esModule: true,
  default: () => <div data-testid="analytics-loading">Loading...</div>
}));

jest.mock('../../components/analytics/AnalyticsError', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="analytics-error">
      <p>Error: {props.error}</p>
      <button data-testid="retry-button" onClick={props.onRetry}>Retry</button>
    </div>
  )
}));

// Sample data for tests
const mockLocation = {
  id: 123, // Changed from string to number to match Location interface
  name: 'Test Location',
  latitude: 10.0,
  longitude: 12.0
};

const mockAnalyticsData = {
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
    totalTrips: 100,
    totalPassengers: 1500,
    averagePassengersPerTrip: 15,
    utilization: 75,
    dataPoints: 50
  },
  bestDays: [
    { date: '2025-06-02', onTimePercentage: 85 }
  ],
  worstDays: [
    { date: '2025-06-01', delayedPercentage: 20 }
  ]
};

describe('HistoricalAnalytics Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock a successful API response
    (getHistoricalData as jest.Mock).mockResolvedValue(mockAnalyticsData);
  });

  it('should show loading state initially', async () => {
    render(<HistoricalAnalytics 
      fromLocation={mockLocation}
      toLocation={mockLocation}
    />);

    expect(screen.getByTestId('analytics-loading')).toBeInTheDocument();

    // Wait for data to load and component to update
    await waitFor(() => {
      expect(screen.queryByTestId('analytics-loading')).not.toBeInTheDocument();
    });
  });

  it('should render the punctuality chart when data type is punctuality', async () => {
    render(<HistoricalAnalytics 
      fromLocation={mockLocation}
      toLocation={mockLocation}
    />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('punctuality-chart')).toBeInTheDocument();
    });
  });

  it.skip('should render the crowd levels chart when data type is crowdLevels', async () => {
    // Mock API to return data with different data type
    (getHistoricalData as jest.Mock).mockResolvedValue({
      ...mockAnalyticsData
    });

    const { rerender } = render(<HistoricalAnalytics 
      fromLocation={mockLocation}
      toLocation={mockLocation}
    />);

    // Wait for initial render to complete
    await waitFor(() => {
      expect(screen.queryByTestId('analytics-loading')).not.toBeInTheDocument();
    });

    // Update data type from the filter control mock
    fireEvent.click(screen.getByTestId('data-type-selector'));
    
    rerender(<HistoricalAnalytics 
      fromLocation={mockLocation}
      toLocation={mockLocation}
    />);

    await waitFor(() => {
      expect(getHistoricalData).toHaveBeenCalledTimes(2);
    });
  });

  it.skip('should handle loading more data when load more is clicked', async () => {
    render(<HistoricalAnalytics 
      fromLocation={mockLocation}
      toLocation={mockLocation}
    />);

    // Wait for initial render to complete
    await waitFor(() => {
      expect(screen.queryByTestId('analytics-loading')).not.toBeInTheDocument();
    });

    // Click load more
    fireEvent.click(screen.getByTestId('load-more'));

    await waitFor(() => {
      // It should call the API again with a different page
      expect(getHistoricalData).toHaveBeenCalledTimes(2);
    });
  });

  it.skip('should show error state when API call fails', async () => {
    // Mock API failure
    (getHistoricalData as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<HistoricalAnalytics 
      fromLocation={mockLocation}
      toLocation={mockLocation}
    />);

    // Wait for error to show
    await waitFor(() => {
      expect(screen.getByTestId('analytics-error')).toBeInTheDocument();
    });

    // Click retry
    fireEvent.click(screen.getByTestId('retry-button'));

    // It should try to load data again
    expect(getHistoricalData).toHaveBeenCalledTimes(2);
  });
});