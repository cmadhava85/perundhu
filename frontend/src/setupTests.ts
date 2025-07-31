// Jest setup file
import '@testing-library/jest-dom';

// Mock for process.env to be used by modules that read from import.meta.env
process.env.VITE_API_URL = 'http://localhost:8080';
process.env.VITE_API_BASE_URL = 'http://localhost:8080';
process.env.VITE_ANALYTICS_API_URL = 'http://localhost:8081/api/v1';
process.env.NODE_ENV = 'test';
process.env.VITE_FEATURE_TRACKING = 'true';
process.env.VITE_FEATURE_REWARDS = 'true';
process.env.VITE_FEATURE_ANALYTICS = 'true';

// Mock window.matchMedia which is not available in Jest environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver which is not available in Jest environment
globalThis.ResizeObserver = class ResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
};

// Mock Intersection Observer properly with required properties
globalThis.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '0px';
  thresholds = [0];
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn().mockReturnValue([]);
  constructor(_callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    // Store options if needed
    if (options) {
      if (options.rootMargin) this.rootMargin = options.rootMargin;
      if (options.threshold) this.thresholds = Array.isArray(options.threshold) ? options.threshold : [options.threshold];
      // Don't assign root as it causes type issues
    }
  }
};

// Suppress specific console errors during tests
const originalError = console.error;
console.error = (...args) => {
  // Filter out specific React-related warnings that are safe to ignore in tests
  if (
    /Warning.*not wrapped in act/.test(args[0]) ||
    /Warning: An update to .* inside a test was not wrapped in act/.test(args[0]) ||
    /Warning: Can't perform a React state update on an unmounted component/.test(args[0])
  ) {
    return;
  }
  originalError(...args);
};

// Suppress prop type warnings during tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.('Failed prop type:')) {
    return;
  }
  originalWarn(...args);
}

// Set up global mocks for Google Maps
Object.defineProperty(global, 'google', {
  value: {
    maps: {
      Map: jest.fn(),
      Marker: jest.fn(),
      InfoWindow: jest.fn(),
      LatLngBounds: jest.fn(() => ({
        extend: jest.fn(),
      })),
      LatLng: jest.fn((lat, lng) => ({
        lat: () => lat,
        lng: () => lng,
      })),
      event: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
      DirectionsService: jest.fn(() => ({
        route: jest.fn((_, callback) => {
          callback({ 
            status: 'OK', 
            routes: [{ 
              legs: [{}] 
            }] 
          });
        }),
      })),
      DirectionsRenderer: jest.fn(),
      Libraries: ['places', 'geometry', 'drawing', 'visualization'],
    },
  },
  writable: true,
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  // this mock makes sure any components using the translate hook can use it without a warning being shown
  useTranslation: () => {
    return {
      t: (str: string, options?: any) => {
        // Handle interpolation for specific keys
        if (str === 'connectingRoutes.stops' && options?.leg) {
          return `Stops for ${options.leg}`;
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
          'language.english': 'English',
          'language.tamil': 'தமிழ்',
          'footer.copyright': 'Tamil Nadu Bus Scheduler',
          'stopsList.stops': 'Stops'
        };
        
        return translations[str] || str;
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
jest.mock('i18next', () => ({
  use: () => ({
    use: () => ({
      init: () => {},
    }),
  }),
  language: 'en',
  on: () => {},
}));

// Mock the offlineService
jest.mock('./services/offlineService');

// Mock axios for API tests
jest.mock('axios', () => ({
  create: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  })
}));

// Mock apiClient to fix import.meta issues
jest.mock('./services/apiClient', () => ({
  apiClient: {
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  }
}), { virtual: true });

// Mock import.meta.env helper function used in apiClient.ts
jest.mock('./utils/environment', () => ({
  getEnv: (key: string, defaultValue: string = '') => {
    if (process.env[key]) {
      return process.env[key];
    }
    return defaultValue;
  },
  getFeatureFlag: (key: string, defaultValue: boolean = false) => {
    if (process.env[key] === 'true') {
      return true;
    }
    if (process.env[key] === 'false') {
      return false;
    }
    return defaultValue;
  }
}));