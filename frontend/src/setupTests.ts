// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { vi, afterEach, afterAll, beforeEach } from 'vitest';

// Restore window.matchMedia implementation before each test.
// mockReset (configured in vitest.config.ts) clears vi.fn() implementations between
// tests, so we use Object.defineProperty to fully replace it each time.
beforeEach(() => {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as MediaQueryList)),
  });
});

// Run GC after each test file completes
afterAll(() => {
  // Final cleanup for the test file
  cleanup();
  
  // Clear all mocks and timers
  vi.clearAllMocks();
  vi.clearAllTimers();
  
  // Clear localStorage
  localStorage.clear();
  
  // Clear document body
  if (document.body) {
    document.body.innerHTML = '';
  }
  
  // Aggressive GC between test files - run twice
  if (global.gc) {
    global.gc();
    global.gc();
  }
});

// Cleanup after each test to prevent memory leaks
afterEach(() => {
  // Unmount React trees and clear DOM
  cleanup();
  
  // Clear all mocks
  vi.clearAllMocks();
  
  // Clear localStorage
  localStorage.clear();
  
  // Clear all timers (prevents timer memory leaks)
  vi.clearAllTimers();
  
  // Remove all event listeners from window
  const listeners = ['resize', 'scroll', 'beforeunload', 'unload', 'storage', 'popstate'];
  listeners.forEach(event => {
    const oldListeners = (window as unknown as Record<string, unknown>)[`_${event}Listeners`] || [];
    oldListeners.forEach((listener: unknown) => {
      window.removeEventListener(event, listener);
    });
  });
  
  // Clear document body to remove any lingering DOM nodes
  if (document.body) {
    document.body.innerHTML = '';
  }
  
  // Force garbage collection if available (requires --expose-gc flag)
  if (global.gc) {
    global.gc();
  }
});

// Mock import.meta.env for Vitest
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_URL: 'http://localhost:8080',
    VITE_API_BASE_URL: 'http://localhost:8080',
    VITE_PREPROD_API_URL: 'http://localhost:8080', // Override preprod URL for tests
    VITE_ANALYTICS_API_URL: 'http://localhost:8081',
    VITE_API_KEY: 'test-key',
    VITE_APP_VERSION: '1.0.0',
    MODE: 'test'
  },
  writable: true
});

// Setup localStorage with a working implementation
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
  },
  writable: true,
});

// window.matchMedia is re-mocked before each test via beforeEach above.

// Set up global mocks for Google Maps
Object.defineProperty(window, 'google', {
  value: {
    maps: {
      Map: vi.fn(),
      Marker: vi.fn(),
      InfoWindow: vi.fn(),
      LatLngBounds: vi.fn(() => ({
        extend: vi.fn(),
      })),
      LatLng: vi.fn((lat, lng) => ({
        lat: () => lat,
        lng: () => lng,
      })),
      event: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
      DirectionsService: vi.fn(() => ({
        route: vi.fn((_, callback) => {
          // Simulate successful directions response
          const result = {
            routes: [{
              legs: [{
                start_address: 'Start Location',
                end_address: 'End Location',
                distance: { text: '100 km', value: 100000 },
                duration: { text: '2 hours', value: 7200 }
              }]
            }]
          };
          callback(result, 'OK');
        }),
      })),
      DirectionsRenderer: vi.fn(() => ({
        setDirections: vi.fn(),
        setMap: vi.fn(),
      })),
      DirectionsStatus: {
        OK: 'OK',
        NOT_FOUND: 'NOT_FOUND',
        ZERO_RESULTS: 'ZERO_RESULTS',
        MAX_WAYPOINTS_EXCEEDED: 'MAX_WAYPOINTS_EXCEEDED',
        INVALID_REQUEST: 'INVALID_REQUEST',
        OVER_QUERY_LIMIT: 'OVER_QUERY_LIMIT',
        REQUEST_DENIED: 'REQUEST_DENIED',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR'
      },
      Libraries: ['places', 'geometry', 'drawing', 'visualization'],
      SymbolPath: {
        CIRCLE: 0,
        FORWARD_CLOSED_ARROW: 1,
        FORWARD_OPEN_ARROW: 2,
        BACKWARD_CLOSED_ARROW: 3,
        BACKWARD_OPEN_ARROW: 4
      },
      TravelMode: {
        DRIVING: 'DRIVING',
        WALKING: 'WALKING',
        TRANSIT: 'TRANSIT',
        BICYCLING: 'BICYCLING'
      }
    },
  },
  writable: true,
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  // this mock makes sure any components using the translate hook can use it without a warning being shown
  useTranslation: () => {
    return {
      t: (str: string, fallbackOrOptions?: string | { leg?: string }) => {
        // Handle interpolation for specific keys
        if (str === 'connectingRoutes.stops' && typeof fallbackOrOptions === 'object' && fallbackOrOptions?.leg) {
          return `Stops for ${fallbackOrOptions.leg}`;
        }
        
        // Common translations used in tests
        const translations: Record<string, string> = {
          'header.title': 'Tamil Nadu Bus Schedule',
          'header.home': 'Home',
          'header.schedule': 'Schedule',
          'header.routes': 'Routes',
          'header.about': 'About Us',
          'header.contact': 'Contact',
          'search.title': 'Find Buses',
          'search.from': 'From:',
          'search.to': 'To:',
          'search.searchButton': 'Search Buses',
          'search.selectDeparture': 'Select departure',
          'search.selectDestination': 'Select destination',
          'busList.title': 'Available Buses',
          'busList.noBuses': 'No buses available for the selected route',
          'busList.busName': 'Bus Name',
          'busList.busNumber': 'Bus Number',
          'busList.departure': 'Departure',
          'busList.arrival': 'Arrival',
          'busList.stops': 'Stops',
          'busList.viewDetails': 'View Details',
          'busList.hideDetails': 'Hide Details',
          'connectingRoutes.title': 'Connecting Routes',
          'connectingRoutes.subtitle': 'No direct buses available. Here are routes with one connection',
          'map.title': 'Route Map',
          'common.loading': 'Loading...',
          'common.error': 'No routes found for this selection. Please try different locations.',
          'common.bothLocationsRequired': 'Both locations are required',
          'common.whereLeavingFrom': 'Where are you leaving from?',
          'common.whereGoingTo': 'Where are you going to?',
          'language.english': 'English',
          'language.tamil': 'தமிழ்',
          'footer.copyright': 'Tamil Nadu Bus Scheduler',
          'stopsList.stops': 'Stops',
          // Live tracker translations
          'liveTracker.lastUpdated': 'Last updated',
          'liveTracker.speed': 'Speed',
          'liveTracker.nextStop': 'Next stop',
          'liveTracker.etaNextStop': 'ETA',
          'liveTracker.trackers': 'Active trackers',
          'liveTracker.confidence': 'Confidence'
        };
        
        // If translation exists, return it
        if (translations[str]) {
          return translations[str];
        }
        
        // If a fallback string is provided (t('key', 'fallback')), use it
        if (typeof fallbackOrOptions === 'string') {
          return fallbackOrOptions;
        }
        
        // Otherwise return the key itself
        return str;
      },
      i18n: {
        changeLanguage: () => new Promise(() => {}),
        language: 'en',
        on: () => {},
        off: () => {},
      },
    };
  },
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  }
}));

// Mock i18next
vi.mock('i18next', () => ({
  use: () => ({
    use: () => ({
      init: () => {},
    }),
  }),
  language: 'en',
  on: () => {},
}));

// Mock the offlineService
vi.mock('./services/offlineService');

// Mock heavy hooks that might cause memory issues
vi.mock('./hooks/queries/useTerminalResolution', () => ({
  useTerminalResolution: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn()
  })),
  useChennaiTerminals: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null
  }))
}));

vi.mock('./hooks/useGoogleAds', () => ({
  default: vi.fn(() => ({
    adsEnabled: false,
    config: { enabled: false, placements: {} },
    isAdEnabled: vi.fn(() => false),
    getAdConfig: vi.fn(() => ({}))
  })),
  useGoogleAds: vi.fn(() => ({
    adsEnabled: false,
    config: { enabled: false, placements: {} },
    isAdEnabled: vi.fn(() => false),
    getAdConfig: vi.fn(() => ({}))
  }))
}));

vi.mock('./hooks/queries/useBusSearch', () => ({
  useBusSearch: vi.fn(() => ({
    data: { buses: [], stops: [] },
    isLoading: false,
    error: null
  }))
}));

vi.mock('./hooks/queries/useBusSearchEnhanced', () => ({
  useBusSearchEnhanced: vi.fn(() => ({
    data: { buses: [], stops: [] },
    isLoading: false,
    error: null,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isFetchingNextPage: false
  }))
}));

// Mock API services to prevent real initialization or network calls
vi.mock('./services/api', () => {
  const createMockApiInstance = () => ({
    get: vi.fn().mockResolvedValue({ data: [], headers: {} }),
    post: vi.fn().mockResolvedValue({ data: {}, headers: {} }),
    put: vi.fn().mockResolvedValue({ data: {}, headers: {} }),
    delete: vi.fn().mockResolvedValue({ data: {}, headers: {} }),
    patch: vi.fn().mockResolvedValue({ data: {}, headers: {} }),
    request: vi.fn().mockResolvedValue({ data: {}, headers: {} }),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    },
    defaults: { headers: { common: {}, get: {}, post: {}, put: {}, delete: {}, patch: {} } }
  });

  const apiInstance = createMockApiInstance();

  const resolved = <T>(data: T) => Promise.resolve(data);

  class ApiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ApiError';
    }
  }

  return {
    api: apiInstance,
    apiRequest: vi.fn(() => resolved({})),
    createApiInstance: vi.fn(() => createMockApiInstance()),
    setApiInstance: vi.fn(),
    setOfflineMode: vi.fn(),
    getOfflineMode: vi.fn(() => false),
    getOfflineDataAge: vi.fn(() => null),
    checkOnlineStatus: vi.fn(() => resolved(true)),
    getCurrentBusLocations: vi.fn(() => resolved([])),
    getLocations: vi.fn(() => resolved([])),
    searchBuses: vi.fn(() => resolved([])),
    searchBusesViaStops: vi.fn(() => resolved({ buses: [], stops: [] })),
    getStops: vi.fn(() => resolved([])),
    getConnectingRoutes: vi.fn(() => resolved([])),
    reportBusLocation: vi.fn(() => resolved(undefined)),
    disembarkBus: vi.fn(() => resolved(undefined)),
    getLiveBusLocations: vi.fn(() => resolved([])),
    getUserRewardPoints: vi.fn(() => resolved({ points: 0 })),
    handleApiError: vi.fn((err) => { throw err instanceof Error ? err : new Error('API error'); }),
    submitRouteContribution: vi.fn(() => resolved(undefined)),
    submitStopsContribution: vi.fn(() => resolved(undefined)),
    submitImageContribution: vi.fn(() => resolved(undefined)),
    ApiError
  };
});

vi.mock('./services/apiService', () => {
  const mockService = {
    getBuses: vi.fn().mockResolvedValue([]),
    getLocations: vi.fn().mockResolvedValue([]),
    getStops: vi.fn().mockResolvedValue([]),
    getConnectingRoutes: vi.fn().mockResolvedValue([]),
    submitRouteContribution: vi.fn().mockResolvedValue(undefined),
    submitImageContribution: vi.fn().mockResolvedValue(undefined),
    getUserRewardPoints: vi.fn().mockResolvedValue({ points: 0 })
  };

  return {
    ApiService: {
      getInstance: vi.fn(() => mockService)
    },
    apiService: mockService,
    api: {}
  };
});

// Mock reviewService to prevent network calls
vi.mock('./services/reviewService', () => ({
  getReviewsForBus: vi.fn().mockResolvedValue({ data: [] }),
  getRatingSummary: vi.fn().mockResolvedValue({ data: { averageRating: 0, totalReviews: 0 } }),
  submitReview: vi.fn().mockResolvedValue({ data: {} }),
  getUserReviews: vi.fn().mockResolvedValue({ data: [] }),
  deleteReview: vi.fn().mockResolvedValue({ data: {} }),
  reportReview: vi.fn().mockResolvedValue({ data: {} }),
}));

// Mock axios for API tests
vi.mock('axios', () => {
  // Create a complete mock axios instance
  const createMockAxiosInstance = () => ({
    get: vi.fn().mockResolvedValue({ data: {}, headers: {} }),
    post: vi.fn().mockResolvedValue({ data: {}, headers: {} }),
    put: vi.fn().mockResolvedValue({ data: {}, headers: {} }),
    delete: vi.fn().mockResolvedValue({ data: {}, headers: {} }),
    patch: vi.fn().mockResolvedValue({ data: {}, headers: {} }),
    request: vi.fn().mockResolvedValue({ data: {}, headers: {} }),
    interceptors: {
      request: { 
        use: vi.fn((_fulfilled, _rejected) => {
          // Store interceptors but don't execute them
          return 0;
        }), 
        eject: vi.fn() 
      },
      response: { 
        use: vi.fn((_fulfilled, _rejected) => {
          // Store interceptors but don't execute them
          return 0;
        }), 
        eject: vi.fn() 
      }
    },
    defaults: {
      headers: {
        common: {},
        get: {},
        post: {},
        put: {},
        delete: {},
        patch: {}
      }
    }
  });

  const mockAxios = createMockAxiosInstance();
  
  // axios.create() should return a new mock instance
  mockAxios.create = vi.fn(() => createMockAxiosInstance());
  
  return {
    default: mockAxios
  };
});