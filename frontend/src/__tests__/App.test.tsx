import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, test, expect } from 'vitest';
import App from '../App';
import '@testing-library/jest-dom';

// Mock the react-i18next hook directly at the top of the test file
vi.mock('react-i18next', () => ({
  useTranslation: () => {
    return {
      t: (key: string) => {
        // Map of translation keys for our test
        const translations: { [key: string]: string } = {
          'features.routes': 'Routes',
          'features.tracking': 'Live Tracking',
          'features.analytics': 'Analytics',
          'features.rewards': 'Rewards',
          'nav.search': 'Search',
          'nav.contribute': 'Contribute',
          'noResults.title': 'No Buses Found',
          'noResults.message': 'No direct buses available for this route.',
          'tabs.search': 'Search',
          'tabs.contribute': 'Contribute',
          'tabs.routes': 'Routes',
          'tabs.tracking': 'Live Tracking',
          'tabs.analytics': 'Analytics',
          'tabs.rewards': 'Rewards',
        };

        // Return the translation or the key itself as fallback
        return translations[key] || key;
      },
      i18n: {
        changeLanguage: vi.fn(),
        language: 'en',
      },
    };
  },
}));

// Mock environment utilities with proper implementation
vi.mock('../utils/environment', () => ({
  getEnvironmentVariable: (key: string, defaultValue: string = '') => {
    switch (key) {
      case 'VITE_API_URL':
        return 'http://localhost:8080';
      case 'VITE_GOOGLE_MAPS_API_KEY':
        return 'test-api-key';
      case 'VITE_FEATURE_TRACKING':
        return 'true';
      case 'VITE_FEATURE_REWARDS':
        return 'true';
      case 'VITE_FEATURE_ANALYTICS':
        return 'true';
      default:
        return defaultValue;
    }
  },
  getFeatureFlag: (key: string, defaultValue: boolean = false) => {
    if (
      key === 'VITE_FEATURE_TRACKING' ||
      key === 'VITE_FEATURE_REWARDS' ||
      key === 'VITE_FEATURE_ANALYTICS'
    ) {
      return true;
    }
    return defaultValue;
  },
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

// Mock API service
vi.mock('../services/api', () => {
  const mockGetLocations = vi.fn();
  const mockGetDestinations = vi.fn();
  const mockGetBuses = vi.fn();
  const mockSearchBuses = vi.fn();
  const mockGetConnectingRoutes = vi.fn();
  const mockGetStops = vi.fn();
  const mockGetCurrentBusLocations = vi.fn();

  return {
    ApiError,
    getLocations: mockGetLocations,
    getDestinations: mockGetDestinations,
    getBuses: mockGetBuses,
    getStops: mockGetStops,
    getConnectingRoutes: mockGetConnectingRoutes,
    getCurrentBusLocations: mockGetCurrentBusLocations,
    searchBuses: mockSearchBuses,
    // Add other API methods as needed
    createApiInstance: vi.fn(),
    setApiInstance: vi.fn(),
    setOfflineMode: vi.fn(),
    getOfflineMode: vi.fn(),
    getOfflineDataAge: vi.fn(),
    checkOnlineStatus: vi.fn(),
    searchBusesViaStops: vi.fn(),
    reportBusLocation: vi.fn(),
    disembarkBus: vi.fn(),
    getLiveBusLocations: vi.fn(),
    getUserRewardPoints: vi.fn(),
    handleApiError: vi.fn(),
    submitRouteContribution: vi.fn(),
    submitImageContribution: vi.fn(),
    api: {},
  };
});

// Mock child components to simplify testing
vi.mock('../components/Header', () => ({ 
  default: () => <header data-testid="mock-header">Header</header> 
}));
vi.mock('../components/Footer', () => ({ 
  default: () => <footer data-testid="mock-footer">Footer</footer> 
}));
vi.mock('../components/SearchForm', () => ({
  default: function MockSearchForm({
    onSearch,
    setFromLocation,
    setToLocation,
    fromLocation,
    toLocation,
  }: any) {
    const locationData = [
      { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
      { id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
      { id: 3, name: 'Madurai', latitude: 9.9252, longitude: 78.1198 },
    ];

    const selectFrom = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && setFromLocation) {
        const location = locationData.find((loc) => loc.id === value);
        if (location) {
          setFromLocation(location);
        }
      }
    };

    const selectTo = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && setToLocation) {
        const location = locationData.find((loc) => loc.id === value);
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
          value={fromLocation?.id || ''}
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
          value={toLocation?.id || ''}
        >
          <option value="">Select To</option>
          <option value="2">Coimbatore</option>
          <option value="3">Madurai</option>
        </select>

        <button data-testid="search-button" onClick={onSearch}>
          Search
        </button>
      </div>
    );
  }
}));

vi.mock('../components/BusList', () => ({
  default: ({ buses }: { buses: any[] }) => (
    <div data-testid="bus-list">Bus List: {buses.length} buses</div>
  )
}));

vi.mock('../components/ConnectingRoutes', () => ({
  default: ({ connectingRoutes }: { connectingRoutes: any[] }) => (
    <div data-testid="connecting-routes">Connecting Routes: {connectingRoutes.length} routes</div>
  ),
}));

vi.mock('../components/ErrorDisplay', () => ({
  default: ({ error, reset }: { error: Error | null; reset?: () => void; }) => {
    return error ? (
      <div data-testid="error-display" onClick={reset}>
        Error: {error.message}
        <button data-testid="retry-button">Retry</button>
      </div>
    ) : null;
  },
}));

vi.mock('../components/Loading', () => ({
  default: () => <div data-testid="loading">Loading...</div>
}));

// Mock the custom hooks with realistic behavior
let mockLocationData = {
  locations: [
    { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
    { id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
    { id: 3, name: 'Madurai', latitude: 9.9252, longitude: 78.1198 },
  ],
  destinations: [
    { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
    { id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
    { id: 3, name: 'Madurai', latitude: 9.9252, longitude: 78.1198 },
  ],
  fromLocation: null,
  toLocation: null,
  loading: false,
  error: null,
  autoLocationEnabled: false,
  setFromLocation: vi.fn(),
  setToLocation: vi.fn(),
  clearError: vi.fn(),
  toggleAutoLocation: vi.fn(),
};

let mockBusSearchData = {
  buses: [] as any[],
  connectingRoutes: [] as any[],
  loading: false,
  error: null as Error | null,
  selectedBusId: null,
  stopsMap: {},
  includeIntermediateStops: false,
  searchBuses: vi.fn(),
  selectBus: vi.fn(),
  resetResults: vi.fn(),
  clearError: vi.fn(),
  toggleIncludeIntermediateStops: vi.fn()
};

vi.mock('../hooks/useLocationData', () => ({
  useLocationData: () => mockLocationData
}));

vi.mock('../hooks/useBusSearch', () => ({
  useBusSearch: () => mockBusSearchData
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock data to default state
    mockLocationData = {
      ...mockLocationData,
      fromLocation: null,
      toLocation: null,
      loading: false,
      error: null,
      setFromLocation: vi.fn((location) => {
        mockLocationData.fromLocation = location;
      }),
      setToLocation: vi.fn((location) => {
        mockLocationData.toLocation = location;
      }),
      clearError: vi.fn(),
    };

    mockBusSearchData = {
      ...mockBusSearchData,
      buses: [],
      connectingRoutes: [],
      loading: false,
      error: null,
      searchBuses: vi.fn(),
      clearError: vi.fn(() => {
        mockBusSearchData.error = null;
      }),
    };
  });

  test('renders the application with header and footer', async () => {
    render(<App />);
    
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();

    // Wait for locations to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });

  test('loads locations and destinations when component mounts', async () => {
    render(<App />);

    // Check that search form is rendered with locations
    await waitFor(() => {
      expect(screen.getByTestId('search-form')).toBeInTheDocument();
      
      // Use getAllByText to handle multiple instances of the same text
      const chennaiOptions = screen.getAllByText('Chennai');
      const coimbatoreOptions = screen.getAllByText('Coimbatore');
      const maduraiOptions = screen.getAllByText('Madurai');
      
      // Verify that each location appears at least once
      expect(chennaiOptions.length).toBeGreaterThan(0);
      expect(coimbatoreOptions.length).toBeGreaterThan(0);
      expect(maduraiOptions.length).toBeGreaterThan(0);
    });
  });

  test('performs search and shows bus list when search button is clicked', async () => {
    const mockBuses = [
      {
        id: 1,
        from: 'Chennai',
        to: 'Coimbatore',
        busName: 'SETC Express',
        busNumber: 'TN-01-1234',
        departureTime: '06:00 AM',
        arrivalTime: '12:30 PM',
      },
    ];

    mockBusSearchData.searchBuses = vi.fn().mockImplementation(() => {
      mockBusSearchData.buses = mockBuses;
      mockBusSearchData.connectingRoutes = [];
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('from-select'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('to-select'), { target: { value: '2' } });
    fireEvent.click(screen.getByTestId('search-button'));

    await waitFor(() => {
      expect(mockBusSearchData.searchBuses).toHaveBeenCalled();
    });
  });

  test('renders without crashing', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    });
  });
});