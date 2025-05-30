// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
import '@testing-library/jest-dom';

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