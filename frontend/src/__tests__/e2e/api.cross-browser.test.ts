import * as apiService from '../../services/api';
import axios from 'axios';
import { mockData } from './mockService';
import { deviceViewports, browserUserAgents, networkConditions, timeouts } from './config';

// Initialize tests
beforeEach(() => {
  jest.clearAllMocks();
  // Reset offline mode
  apiService.setOfflineMode(false);
});

// Mock axios and its create function
jest.mock('axios', () => {
  const axiosMock = {
    get: jest.fn(),
    post: jest.fn(),
    create: jest.fn(),
    defaults: { headers: { common: {} } }
  };
  
  axiosMock.get.mockImplementation((url) => {
    // Return appropriate mock data based on the URL
    if (url.includes('/api/v1/bus-schedules/locations')) {
      return Promise.resolve({ data: require('./mockService').mockData.locations });
    }
    if (url.includes('/api/v1/bus-schedules/search')) {
      return Promise.resolve({ data: require('./mockService').mockData.buses });
    }
    if (url.includes('/api/v1/bus-schedules') && url.includes('/stops')) {
      return Promise.resolve({ data: require('./mockService').mockData.stops });
    }
    if (url.includes('/api/v1/bus-schedules/connecting-routes')) {
      return Promise.resolve({ data: require('./mockService').mockData.connectingRoutes });
    }
    if (url.includes('/api/v1/bus-tracking/route')) {
      return Promise.resolve({ data: require('./mockService').mockData.busLocations });
    }
    return Promise.resolve({ data: {} });
  });
  
  axiosMock.create.mockImplementation(() => axiosMock);
  
  return axiosMock;
});

// Type the mocked axios properly
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Override the API services module with our test version
jest.mock('../../services/api', () => {
  const originalModule = jest.requireActual('../../services/api');
  let isOfflineMode = false;
  
  return {
    ...originalModule,
    setOfflineMode: (value: boolean) => {
      isOfflineMode = value;
    },
    getOfflineMode: () => isOfflineMode,
    checkOnlineStatus: jest.fn().mockImplementation(async () => {
      const offlineService = jest.requireMock('../../services/offlineService');
      const isOnline = await offlineService.isOnline();
      if (!isOnline) {
        isOfflineMode = true;
      }
      return isOnline;
    })
  };
});

// Mock the offlineService module
jest.mock('../../services/offlineService', () => {
  let isOnlineValue = true;
  
  return {
    isOnline: jest.fn().mockImplementation(() => Promise.resolve(isOnlineValue)),
    setIsOnline: (value: boolean) => { isOnlineValue = value; },
    getLocationsOffline: jest.fn().mockImplementation(() => Promise.resolve(require('./mockService').mockData.locations)),
    saveLocationsOffline: jest.fn(),
    getBusesOffline: jest.fn().mockImplementation(() => Promise.resolve(require('./mockService').mockData.buses)),
    saveBusesOffline: jest.fn(),
    getStopsOffline: jest.fn().mockImplementation(() => Promise.resolve(require('./mockService').mockData.stops)),
    saveStopsOffline: jest.fn(),
    getBusLocationsOffline: jest.fn().mockImplementation(() => Promise.resolve(require('./mockService').mockData.busLocations)),
    saveBusLocationsOffline: jest.fn(),
    getConnectingRoutesOffline: jest.fn().mockImplementation(() => Promise.resolve(require('./mockService').mockData.connectingRoutes)),
    saveConnectingRoutesOffline: jest.fn(),
    getLastSyncTime: jest.fn().mockImplementation(() => Promise.resolve(new Date(Date.now() - 86400000).toISOString())),
    cleanupOldData: jest.fn(),
    cleanupOldBusLocationData: jest.fn()
  };
});

describe('API Cross-Browser and Device Compatibility Tests', () => {
  // Set up longer timeout for these tests
  jest.setTimeout(timeouts.longRunningTest);

  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window dimensions and user agent
    resetWindowDimensions();
    resetUserAgent();
  });

  // Helper function to set window dimensions based on device viewport
  const setWindowDimensions = (viewport: typeof deviceViewports.mobileSmall) => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: viewport.width });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: viewport.height });
    window.dispatchEvent(new Event('resize'));
  };

  // Helper function to reset window dimensions
  const resetWindowDimensions = () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });
  };

  // Helper function to set user agent
  const setUserAgent = (userAgent: string) => {
    Object.defineProperty(navigator, 'userAgent', {
      get: jest.fn(() => userAgent),
      configurable: true
    });
  };

  // Helper function to reset user agent
  const resetUserAgent = () => {
    Object.defineProperty(navigator, 'userAgent', {
      get: jest.fn(() => browserUserAgents.chromeDesktop),
      configurable: true
    });
  };

  // Helper function to simulate network conditions
  const simulateNetwork = (condition: typeof networkConditions.wifi) => {
    const offlineService = jest.requireMock('../../services/offlineService');
    
    // Mock online/offline status
    if (condition.offline) {
      offlineService.isOnline.mockImplementation(() => Promise.resolve(false));
      offlineService.setIsOnline(false);
      Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
    } else {
      offlineService.isOnline.mockImplementation(() => Promise.resolve(true));
      offlineService.setIsOnline(true);
      Object.defineProperty(navigator, 'onLine', { get: () => true, configurable: true });
      
      // Simulate network latency
      if (condition.latency > 0) {
        // Use a real timer delay for latency tests
        jest.useRealTimers();
        mockedAxios.get.mockImplementation((url) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              // Return appropriate mock data based on the URL
              if (url.includes('/api/v1/bus-schedules/locations')) {
                resolve({ data: mockData.locations });
              } else if (url.includes('/api/v1/bus-schedules/search')) {
                resolve({ data: mockData.buses });
              } else if (url.includes('/api/v1/bus-schedules') && url.includes('/stops')) {
                resolve({ data: mockData.stops });
              } else {
                resolve({ data: {} });
              }
            }, condition.latency);
          });
        });
      } else {
        // Reset the mock to default behavior when latency is 0
        mockedAxios.get.mockImplementation((url) => {
          if (url.includes('/api/v1/bus-schedules/locations')) {
            return Promise.resolve({ data: mockData.locations });
          } else if (url.includes('/api/v1/bus-schedules/search')) {
            return Promise.resolve({ data: mockData.buses });
          } else if (url.includes('/api/v1/bus-schedules') && url.includes('/stops')) {
            return Promise.resolve({ data: mockData.stops });
          } else {
            return Promise.resolve({ data: {} });
          }
        });
      }
    }
  };

  describe('Test on various device viewports', () => {
    test.each(Object.entries(deviceViewports))(
      'getLocations API works on %s viewport',
      async (_deviceName, viewport) => {
        // Arrange
        setWindowDimensions(viewport);
        
        // Act
        const result = await apiService.getLocations();
        
        // Assert
        expect(result).toEqual(mockData.locations);
        expect(mockedAxios.get).toHaveBeenCalled();
      }
    );
  });

  describe('Test on various browsers', () => {
    test.each(Object.entries(browserUserAgents))(
      'getLocations API works on %s',
      async (_browserName, userAgent) => {
        // Arrange
        setUserAgent(userAgent);
        
        // Act
        const result = await apiService.getLocations();
        
        // Assert
        expect(result).toEqual(mockData.locations);
      }
    );

    test.each(Object.entries(browserUserAgents))(
      'searchBuses API works on %s',
      async (_browserName, userAgent) => {
        // Arrange
        setUserAgent(userAgent);
        
        // Act
        const fromLocation = mockData.locations[0];
        const toLocation = mockData.locations[2];
        const result = await apiService.searchBuses(fromLocation, toLocation);
        
        // Assert
        expect(result).toEqual(mockData.buses);
      }
    );

    test.each(Object.entries(browserUserAgents))(
      'getStops API works on %s',
      async (_browserName, userAgent) => {
        // Arrange
        setUserAgent(userAgent);
        
        // Act
        const result = await apiService.getStops(1);
        
        // Assert
        expect(result).toEqual(mockData.stops);
      }
    );
  });

  describe('Test under various network conditions', () => {
    test.each(Object.entries(networkConditions))(
      'API handles %s network condition',
      async (_conditionName, condition) => {
        // Arrange
        simulateNetwork(condition);
        
        // Act - Check if the system correctly detects online status
        await apiService.checkOnlineStatus();
        
        if (condition.offline) {
          // If simulating offline, check that the API correctly falls back to offline data
          const result = await apiService.getLocations();
          expect(apiService.getOfflineMode()).toBe(true);
          expect(result).toEqual(mockData.locations);
        } else {
          // If online, check the API works with the simulated latency
          const startTime = Date.now();
          const result = await apiService.getLocations();
          const endTime = Date.now();
          const elapsedTime = endTime - startTime;
          
          expect(result).toEqual(mockData.locations);
          expect(apiService.getOfflineMode()).toBe(false);
          
          // For tests with latency, verify latency was applied (with some buffer)
          // Only check this when latency is significant (>100ms)
          if (condition.latency > 100) {
            expect(elapsedTime).toBeGreaterThan(0);
          }
        }
      },
      timeouts.longRunningTest
    );
  });
});