// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock import.meta.env for Vitest
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_URL: 'http://localhost:8080',
    VITE_API_KEY: 'test-key',
    VITE_APP_VERSION: '1.0.0'
  },
  writable: true
});

// Mock localStorage and other browser APIs
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  },
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
      t: (str: string, options?: { leg?: string }) => {
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
          'common.bothLocationsRequired': 'Both locations are required',
          'common.whereLeavingFrom': 'Where are you leaving from?',
          'common.whereGoingTo': 'Where are you going to?',
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

// Mock axios for API tests
vi.mock('axios', () => ({
  default: {
    create: vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue({ data: [] }),
      post: vi.fn().mockResolvedValue({ data: {} }),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() }
      }
    })
  }
}));