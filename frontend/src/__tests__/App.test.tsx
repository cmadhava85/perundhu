import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import type { Location, Bus } from '../types';

// Mock the environment module 
jest.mock('../utils/environment', () => ({
  getFeatureFlag: (_key: string, defaultValue: boolean) => defaultValue
}));

// Define local ApiError class for testing since it's not exported from API service
class ApiError extends Error {
  public status: number;
  public errorCode?: string;
  public details?: string[];
  public path?: string;
  public timestamp?: string;

  constructor(message: string, status: number, errorData?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    
    if (errorData) {
      this.errorCode = errorData.code;
      this.details = errorData.details;
      this.path = errorData.path;
      this.timestamp = errorData.timestamp;
    }
    
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Mock API service - define mocks inside the jest.mock call
jest.mock('../services/api', () => {
  // Create mock functions
  const mockGetLocations = jest.fn();
  const mockGetDestinations = jest.fn();
  const mockGetBuses = jest.fn();
  const mockSearchBuses = jest.fn();
  const mockGetConnectingRoutes = jest.fn();
  const mockGetStops = jest.fn();
  const mockGetCurrentBusLocations = jest.fn();

  // Create a local ApiError class for testing
  class MockApiError extends Error {
    public status: number;
    public errorCode?: string;
    public details?: string[];
    public path?: string;
    public timestamp?: string;

    constructor(message: string, status: number, errorData?: any) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      
      if (errorData) {
        this.errorCode = errorData.code;
        this.details = errorData.details;
        this.path = errorData.path;
        this.timestamp = errorData.timestamp;
      }
      
      Object.setPrototypeOf(this, MockApiError.prototype);
    }
  }
  
  return {
    ApiError: MockApiError,
    getLocations: mockGetLocations,
    getDestinations: mockGetDestinations,
    getBuses: mockGetBuses,
    getStops: mockGetStops,
    getConnectingRoutes: mockGetConnectingRoutes,
    getCurrentBusLocations: mockGetCurrentBusLocations,
    searchBuses: mockSearchBuses
  };
});

// Mock child components to simplify testing
jest.mock('../components/Header', () => () => <header data-testid="mock-header">Header</header>);
jest.mock('../components/Footer', () => () => <footer data-testid="mock-footer">Footer</footer>);
jest.mock('../components/RouteMap', () => ({ fromLocation, toLocation }: { 
  fromLocation: Location | null; 
  toLocation: Location | null;
  selectedStops?: any[];
}) => (
  <div data-testid="mock-route-map">
    Route Map: {fromLocation?.name} to {toLocation?.name}
  </div>
));
jest.mock('../components/BusList', () => ({ buses }: { buses: Bus[] }) => (
  <div data-testid="bus-list">Bus List: {buses.length} buses</div>
));
jest.mock('../components/ConnectingRoutes', () => ({ connectingRoutes }: { connectingRoutes: any[] }) => (
  <div data-testid="connecting-routes">Connecting Routes: {connectingRoutes.length} routes</div>
));
jest.mock('../components/ErrorDisplay', () => ({ error, reset }: { 
  error: Error | null; 
  reset?: () => void;
}) => {
  return error ? (
    <div data-testid="error-display" onClick={reset}>
      Error: {error.message}
      {error instanceof ApiError && error.details && (
        <div data-testid="error-details">
          {error.details.map((detail, i) => (
            <div key={i}>{detail}</div>
          ))}
        </div>
      )}
      <button data-testid="retry-button">Retry</button>
    </div>
  ) : null;
});
jest.mock('../components/Loading', () => () => (
  <div data-testid="loading">Loading...</div>
));
jest.mock('../components/UserRewards', () => () => <div data-testid="user-rewards">UserRewards</div>);
jest.mock('../components/UserSessionHistory', () => () => <div data-testid="user-session-history">UserSessionHistory</div>);
jest.mock('../components/LiveBusTracker', () => () => <div data-testid="live-bus-tracker">Live Bus Tracker</div>);

// Mock SearchForm component to directly call the onSearch prop
jest.mock('../components/SearchForm', () => {
  return function MockSearchForm({ 
    onSearch, 
    setFromLocation, 
    setToLocation,
    fromLocation,
    toLocation,
  }: { 
    onSearch: () => void;
    setFromLocation?: (location: any) => void;
    setToLocation?: (location: any) => void;
    fromLocation?: any;
    toLocation?: any;
    [key: string]: any;
  }) {
    // Mock location data for testing
    const locationData = [
      { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
      { id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
      { id: 3, name: 'Madurai', latitude: 9.9252, longitude: 78.1198 }
    ];
    
    // Store selected values to pass to onSearch
    const selectFrom = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && setFromLocation) {
        // Find the full location object to pass to setFromLocation
        const location = locationData.find(loc => loc.id === value);
        if (location) {
          setFromLocation(location);
        }
      }
    };
    
    const selectTo = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && setToLocation) {
        // Find the full location object to pass to setToLocation
        const location = locationData.find(loc => loc.id === value);
        if (location) {
          setToLocation(location);
        }
      }
    };
    
    return (
      <div data-testid="search-form">
        <select
          data-testid="from-select"
          aria-label="From"
          onChange={selectFrom}
          value={fromLocation?.id || ""}
        >
          <option value="">Select From</option>
          <option value="1">Chennai</option>
          <option value="2">Coimbatore</option>
          <option value="3">Madurai</option>
        </select>
        
        <select
          data-testid="to-select"
          aria-label="To"
          onChange={selectTo}
          value={toLocation?.id || ""}
        >
          <option value="">Select To</option>
          <option value="2">Coimbatore</option>
          <option value="3">Madurai</option>
        </select>
        
        <button 
          data-testid="search-button" 
          onClick={onSearch}
        >
          Search
        </button>
      </div>
    );
  };
});

// react-i18next is automatically mocked via jest.config.ts

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Grab the API mocks for testing
    const apiService = require('../services/api');
    
    // Setup default mock implementations before each test
    apiService.getLocations.mockResolvedValue([
      { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
      { id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
      { id: 3, name: 'Madurai', latitude: 9.9252, longitude: 78.1198 }
    ]);
    
    apiService.getDestinations.mockResolvedValue([
      { id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
      { id: 3, name: 'Madurai', latitude: 9.9252, longitude: 78.1198 }
    ]);
    
    apiService.getBuses.mockImplementation((fromId: number, toId: number) => {
      // Ensure the mock records the correct parameters
      return Promise.resolve([
        {
          id: 1,
          from: fromId === 1 ? 'Chennai' : fromId === 2 ? 'Coimbatore' : 'Madurai',
          to: toId === 2 ? 'Coimbatore' : 'Madurai',
          busName: 'SETC Express',
          busNumber: 'TN-01-1234',
          departureTime: '06:00 AM',
          arrivalTime: '12:30 PM'
        }
      ]);
    });
    
    apiService.searchBuses.mockImplementation((from: any, to: any) => {
      // Convert location objects to IDs for consistency
      const fromId = typeof from === 'object' ? from.id : from;
      const toId = typeof to === 'object' ? to.id : to;
      
      // Call getBuses to keep the tests consistent
      return apiService.getBuses(fromId, toId);
    });
    
    apiService.getConnectingRoutes.mockImplementation((from: any, to: any) => {
      // Convert location objects to IDs for consistency
      const fromId = typeof from === 'object' ? from.id : from;
      const toId = typeof to === 'object' ? to.id : to;
      
      // Verify we're using the correct IDs (1 and 3 as expected by the test)
      if (fromId === 1 && toId === 3) {
        return Promise.resolve([
          {
            id: 1,
            isDirectRoute: false,
            firstLeg: { id: 1, from: 'Chennai', to: 'Trichy' },
            connectionPoint: 'Trichy',
            secondLeg: { id: 2, from: 'Trichy', to: 'Madurai' },
            waitTime: '00:30',
            totalDuration: '8h 30m'
          }
        ]);
      }
      return Promise.resolve([]);
    });
    
    apiService.getStops.mockResolvedValue([
      { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707, arrivalTime: '06:00 AM', departureTime: '06:00 AM', order: 1 },
      { id: 2, name: 'Vellore', latitude: 12.9165, longitude: 79.1325, arrivalTime: '07:30 AM', departureTime: '07:35 AM', order: 2 },
      { id: 3, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558, arrivalTime: '12:30 PM', departureTime: '12:30 PM', order: 3 }
    ]);
    
    apiService.getCurrentBusLocations.mockResolvedValue([
      { 
        id: 1, 
        busNumber: 'TN-01-1234', 
        latitude: 12.5, 
        longitude: 78.5, 
        speed: 65, 
        direction: 'N',
        lastUpdated: new Date().toISOString(),
        routeId: 1
      }
    ]);
  });

  test('renders header, search form, and footer on initial load', async () => {
    render(<App />);
    
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    
    // Wait for locations to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });

  test('loads locations and destinations when component mounts', async () => {
    const { getLocations } = require('../services/api');
    
    render(<App />);
    
    await waitFor(() => {
      expect(getLocations).toHaveBeenCalled();
    });
    
    // Check that search form is rendered
    expect(screen.getByTestId('search-form')).toBeInTheDocument();
  });

  test('performs search and shows bus list when search button is clicked', async () => {
    const apiService = require('../services/api');
    
    render(<App />);
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
    
    // Select from location
    fireEvent.change(screen.getByTestId('from-select'), { target: { value: '1' } });
    
    // Select to location
    fireEvent.change(screen.getByTestId('to-select'), { target: { value: '2' } });
    
    // Click search button
    fireEvent.click(screen.getByTestId('search-button'));
    
    // Wait for the API to be called
    await waitFor(() => {
      expect(apiService.getBuses).toHaveBeenCalledWith(1, 2);
    });
    
    // Verify bus list is shown
    await waitFor(() => {
      expect(screen.getByTestId('bus-list')).toBeInTheDocument();
    });
  });

  test('shows connecting routes when no direct buses are found', async () => {
    const apiService = require('../services/api');
    
    // Mock getBuses to return an empty array for this specific test
    apiService.getBuses.mockResolvedValueOnce([]);
    
    render(<App />);
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
    
    // Select from location
    fireEvent.change(screen.getByTestId('from-select'), { target: { value: '1' } });
    
    // Select to location
    fireEvent.change(screen.getByTestId('to-select'), { target: { value: '3' } });
    
    // Click search button
    fireEvent.click(screen.getByTestId('search-button'));
    
    // Wait for API calls to complete
    await waitFor(() => {
      expect(apiService.getBuses).toHaveBeenCalledWith(1, 3);
      expect(apiService.getConnectingRoutes).toHaveBeenCalledWith(1, 3);
    });
    
    // Verify connecting routes are shown
    await waitFor(() => {
      expect(screen.getByTestId('connecting-routes')).toBeInTheDocument();
    });
  });

  test('shows error message when API call fails', async () => {
    const apiService = require('../services/api');
    
    // Mock getBuses to throw an error for this test
    const errorData = { 
      code: 'NO_ROUTES_FOUND', 
      details: ['No direct or connecting routes available', 'Try selecting different locations']
    };
    
    apiService.getBuses.mockImplementationOnce(() => {
      throw new ApiError(
        'No routes found between these locations', 
        404, 
        errorData
      );
    });
    
    render(<App />);
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
    
    // Select from location
    fireEvent.change(screen.getByTestId('from-select'), { target: { value: '1' } });
    
    // Select to location
    fireEvent.change(screen.getByTestId('to-select'), { target: { value: '3' } });
    
    // Click search button
    fireEvent.click(screen.getByTestId('search-button'));
    
    // Verify error message is shown
    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByTestId('error-display')).toHaveTextContent('Error:');
    });
  });
  
  test('error can be dismissed by clicking the retry button', async () => {
    const apiService = require('../services/api');
    
    // Mock getBuses to throw an error for this test
    apiService.getBuses.mockImplementationOnce(() => {
      throw new Error('Test error');
    });
    
    render(<App />);
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
    
    // Select from location
    fireEvent.change(screen.getByTestId('from-select'), { target: { value: '1' } });
    
    // Select to location
    fireEvent.change(screen.getByTestId('to-select'), { target: { value: '3' } });
    
    // Click search button
    fireEvent.click(screen.getByTestId('search-button'));
    
    // Wait for error to be displayed
    await waitFor(() => {
      const errorDisplay = screen.getByTestId('error-display');
      expect(errorDisplay).toBeInTheDocument();
      
      // Click on error to dismiss it
      fireEvent.click(errorDisplay);
    });
    
    // Check that error is no longer displayed
    await waitFor(() => {
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
    });
  });
  
  test.skip('handles network errors gracefully', async () => {
    const apiService = require('../services/api');
    
    // Mock getBuses to throw a network error
    apiService.getBuses.mockImplementationOnce(() => {
      throw new ApiError('Network error: Failed to fetch', 0);
    });
    
    render(<App />);
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
    
    // Select from location
    fireEvent.change(screen.getByTestId('from-select'), { target: { value: '1' } });
    
    // Select to location
    fireEvent.change(screen.getByTestId('to-select'), { target: { value: '2' } });
    
    // Click search button
    fireEvent.click(screen.getByTestId('search-button'));
    
    // Check for error display
    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByTestId('error-display')).toHaveTextContent('Error:');
    });
  });

  test('shows loading state during API calls', async () => {
    const apiService = require('../services/api');
    
    // Create a manually controlled promise
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    // Mock getBuses to use our controlled promise
    apiService.getBuses.mockImplementationOnce(() => promise);
    
    render(<App />);
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
    
    // Select from location
    fireEvent.change(screen.getByTestId('from-select'), { target: { value: '1' } });
    
    // Select to location
    fireEvent.change(screen.getByTestId('to-select'), { target: { value: '2' } });
    
    // Click search button
    fireEvent.click(screen.getByTestId('search-button'));
    
    // Check that loading indicator is shown
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
    
    // Resolve the promise
    resolvePromise!([{
      id: 1,
      from: 'Chennai',
      to: 'Coimbatore',
      busName: 'SETC Express',
      busNumber: 'TN-01-1234',
      departureTime: '06:00 AM',
      arrivalTime: '12:30 PM'
    }]);
    
    // Loading indicator should disappear
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  }, 10000);  // Increase timeout for this test

  test('toggles tracking, rewards, and analytics features', async () => {
    const apiService = require('../services/api');
    
    render(<App />);
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
    
    // Select locations and search
    fireEvent.change(screen.getByTestId('from-select'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('to-select'), { target: { value: '2' } });
    
    fireEvent.click(screen.getByTestId('search-button'));
    
    // Wait for bus list to appear
    await waitFor(() => {
      expect(apiService.getBuses).toHaveBeenCalledWith(1, 2);
      expect(screen.getByTestId('bus-list')).toBeInTheDocument();
    });
    
    // Check toggles are present
    const trackingToggle = screen.getByLabelText(/tracking/i);
    const rewardsToggle = screen.getByLabelText(/rewards/i);
    const analyticsToggle = screen.getByLabelText(/analytics/i);
    expect(trackingToggle).toBeInTheDocument();
    expect(rewardsToggle).toBeInTheDocument();
    expect(analyticsToggle).toBeInTheDocument();
    
    // All features should be visible by default
    expect(screen.getByTestId('user-rewards')).toBeInTheDocument();
    expect(screen.getByTestId('user-session-history')).toBeInTheDocument();
    
    // Toggle off tracking (BusTracker is not mocked, so just check toggle works)
    fireEvent.click(trackingToggle);
    
    // Toggle off rewards
    fireEvent.click(rewardsToggle);
    expect(screen.queryByTestId('user-rewards')).not.toBeInTheDocument();
    
    // Toggle off analytics
    fireEvent.click(analyticsToggle);
    expect(screen.queryByTestId('user-session-history')).not.toBeInTheDocument();
    
    // Toggle rewards and analytics back on
    fireEvent.click(rewardsToggle);
    fireEvent.click(analyticsToggle);
    expect(screen.getByTestId('user-rewards')).toBeInTheDocument();
    expect(screen.getByTestId('user-session-history')).toBeInTheDocument();
  });
});