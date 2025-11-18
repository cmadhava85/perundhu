import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, test, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';
import '@testing-library/jest-dom';

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Wrapper component for tests
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

// Mock window.matchMedia for theme context
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

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
  getEnv: (key: string, defaultValue: string = '') => {
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
      key === 'VITE_FEATURE_ANALYTICS' ||
      key === 'ANALYTICS_ENABLED'
    ) {
      return true;
    }
    return defaultValue;
  },
}));

// Mock child components to simplify testing
vi.mock('../components/Header', () => ({ 
  default: () => <header data-testid="mock-header">Header</header> 
}));
vi.mock('../components/Footer', () => ({ 
  default: () => <footer data-testid="mock-footer">Footer</footer> 
}));
vi.mock('../components/TransitSearchForm', () => ({
  default: function MockTransitSearchForm({
    onSearch,
    onLocationChange,
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
      if (!isNaN(value) && onLocationChange) {
        const location = locationData.find((loc) => loc.id === value);
        if (location) {
          onLocationChange(location, toLocation);
        }
      }
    };

    const selectTo = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && onLocationChange) {
        const location = locationData.find((loc) => loc.id === value);
        if (location) {
          onLocationChange(fromLocation, location);
        }
      }
    };

    return (
      <div data-testid="transit-search-form">
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

        <button data-testid="search-button" onClick={() => onSearch && onSearch(fromLocation, toLocation, {})}>
          Search
        </button>
      </div>
    );
  }
}));

vi.mock('../components/SearchResults', () => ({
  default: ({ buses, error, connectingRoutes }: any) => (
    <div data-testid="search-results">
      {error ? (
        <div data-testid="error-display">Error: {error.message}</div>
      ) : (
        <>
          <div data-testid="bus-list">Bus List: {buses.length} buses</div>
          <div data-testid="connecting-routes">Connecting Routes: {connectingRoutes.length} routes</div>
        </>
      )}
    </div>
  ),
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
  default: ({ error, message, reset }: { error?: Error | null; message?: string; reset?: () => void; }) => {
    const displayMessage = error?.message || message;
    return displayMessage ? (
      <div data-testid="error-display" onClick={reset}>
        Error: {displayMessage}
        <button data-testid="retry-button">Retry</button>
      </div>
    ) : null;
  },
}));

vi.mock('../components/Loading', () => ({
  default: () => <div data-testid="loading">Loading...</div>
}));

vi.mock('../components/BottomNavigation', () => ({
  default: ({ onTabChange, activeTab }: any) => (
    <nav data-testid="bottom-navigation">
      <button onClick={() => onTabChange('search')} className={activeTab === 'search' ? 'active' : ''}>
        Search
      </button>
    </nav>
  )
}));

// Mock the hooks with realistic behavior
const mockLocationData = {
  locations: [
    { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
    { id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
    { id: 3, name: 'Madurai', latitude: 9.9252, longitude: 78.1198 },
  ],
  destinations: [
    { id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
    { id: 3, name: 'Madurai', latitude: 9.9252, longitude: 78.1198 },
  ],
  loading: false,
  error: null,
  getDestinations: vi.fn().mockResolvedValue([]),
  fromLocation: null,
  toLocation: null,
};

const mockBusSearchData = {
  buses: [] as any[],
  connectingRoutes: [] as any[],
  loading: false,
  error: null as Error | null,
  selectedBusId: null,
  stopsMap: {},
  includeIntermediateStops: false,
  searchBuses: vi.fn().mockResolvedValue([]),
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

vi.mock('../hooks/useBrowserDetection', () => ({
  default: () => ({ browser: 'chrome' })
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock data to default state
    mockLocationData.loading = false;
    mockLocationData.error = null;
    mockLocationData.fromLocation = null;
    mockLocationData.toLocation = null;
    mockLocationData.getDestinations = vi.fn().mockResolvedValue([]);

    mockBusSearchData.buses = [];
    mockBusSearchData.connectingRoutes = [];
    mockBusSearchData.loading = false;
    mockBusSearchData.error = null;
    mockBusSearchData.searchBuses = vi.fn().mockResolvedValue([]);
    mockBusSearchData.resetResults = vi.fn();
    mockBusSearchData.clearError = vi.fn();
  });

  test('renders the application with header and footer', async () => {
    render(<App />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByTestId('mock-header')).toBeInTheDocument();
      expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    });
  });

  test('loads locations and destinations when component mounts', async () => {
    render(<App />, { wrapper });

    // Check that search form is rendered with locations
    await waitFor(() => {
      expect(screen.getByTestId('transit-search-form')).toBeInTheDocument();
      
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

  test.skip('performs search and shows bus list when search button is clicked', async () => {
    // TODO: Fix this test - the search flow has changed and needs updating
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

    mockBusSearchData.searchBuses = vi.fn().mockResolvedValue(mockBuses);

    render(<App />, { wrapper });

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
    render(<App />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    });
  });
});