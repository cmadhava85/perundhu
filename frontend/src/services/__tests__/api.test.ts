import * as api from '../api';
import * as offlineService from '../offlineService';

// Mock axios module first, using an inline mock implementation
jest.mock('axios', () => {
  // Define the mock instance inside the mock factory
  const mockInstance = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  };
  
  // Return the mock implementation
  return {
    create: jest.fn().mockReturnValue(mockInstance),
    get: jest.fn(),
    post: jest.fn()
  };
});

// Create and export the mockAxiosInstance for tests to use
const mockAxiosInstance = jest.requireMock('axios').create();

// Mock offlineService
jest.mock('../offlineService');

// Get the individual functions we want to test
const {
  getLocations,
  searchBuses,
  getStops,
  getConnectingRoutes,
  checkOnlineStatus
} = api;

describe('API Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock offlineService methods
    (offlineService.isOnline as jest.Mock).mockResolvedValue(true);
    (offlineService.getLocationsOffline as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 }
    ]);
    (offlineService.getBusesOffline as jest.Mock).mockResolvedValue([]);
    (offlineService.getStopsOffline as jest.Mock).mockResolvedValue([]);
    (offlineService.getConnectingRoutesOffline as jest.Mock).mockResolvedValue([]);
    (offlineService.saveLocationsOffline as jest.Mock).mockResolvedValue(undefined);
    (offlineService.saveBusesOffline as jest.Mock).mockResolvedValue(undefined);
    (offlineService.saveStopsOffline as jest.Mock).mockResolvedValue(undefined);
    (offlineService.saveConnectingRoutesOffline as jest.Mock).mockResolvedValue(undefined);
    
    // Reset axios mock behavior
    mockAxiosInstance.get.mockReset();
    mockAxiosInstance.post.mockReset();
  });

  test('getLocations calls the correct endpoint and handles wrapped response', async () => {
    // Setup mock response data
    const mockLocations = [
      { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
      { id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 }
    ];

    // Configure mock to return the test data
    mockAxiosInstance.get.mockResolvedValueOnce({
      data: mockLocations
    });

    // Force the API to go online mode
    await checkOnlineStatus();
    
    // Call the function being tested
    const result = await getLocations();
    
    // Verify API was called with correct endpoint 
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/locations');
    expect(result).toEqual(mockLocations);
  });

  test('searchBuses calls the correct endpoint with fromId and toId parameters', async () => {
    // Setup mock response data
    const mockBuses = [{
      id: 1,
      from: 'Chennai',
      to: 'Coimbatore',
      busName: 'SETC Express',
      busNumber: 'TN-01-1234',
      departureTime: '06:00 AM',
      arrivalTime: '12:30 PM'
    }];

    // Configure mock to return the test data
    mockAxiosInstance.get.mockResolvedValueOnce({
      data: mockBuses
    });

    // Create mock location objects as required by the API
    const fromLocation = { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 };
    const toLocation = { id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 };

    // Force the API to go online mode
    await checkOnlineStatus();
    
    // Call the function being tested
    const result = await searchBuses(fromLocation, toLocation);
    
    // Verify API was called with correct endpoint and params
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/buses', {
      params: {
        from: fromLocation.id,
        to: toLocation.id
      }
    });
    expect(result).toEqual(mockBuses);
  });

  test('getStops calls the correct endpoint with busId parameter', async () => {
    // Setup mock response data
    const mockStops = [
      { id: 1, name: 'Chennai', arrivalTime: '06:00 AM', departureTime: '06:00 AM', order: 1 },
      { id: 2, name: 'Vellore', arrivalTime: '07:30 AM', departureTime: '07:35 AM', order: 2 }
    ];

    // Configure mock to return the test data
    mockAxiosInstance.get.mockResolvedValueOnce({
      data: mockStops
    });

    // Force the API to go online mode
    await checkOnlineStatus();
    
    // Call the function being tested
    const result = await getStops(1);
    
    // Verify API was called with correct endpoint
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/buses/1/stops');
    expect(result).toEqual(mockStops);
  });

  test('getConnectingRoutes calls the correct endpoint with fromId and toId parameters', async () => {
    // Setup mock response data
    const mockConnectingRoutes = [{
      id: 1,
      isDirectRoute: false,
      firstLeg: { id: 1, from: 'Chennai', to: 'Trichy' },
      connectionPoint: 'Trichy',
      secondLeg: { id: 2, from: 'Trichy', to: 'Madurai' },
      waitTime: '00:30',
      totalDuration: '05:00'
    }];

    // Configure mock to return the test data
    mockAxiosInstance.get.mockResolvedValueOnce({
      data: mockConnectingRoutes
    });

    // Create mock location objects as required by the API
    const fromLocation = { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 };
    const toLocation = { id: 3, name: 'Madurai', latitude: 9.9252, longitude: 78.1198 };
    
    // Force the API to go online mode
    await checkOnlineStatus();
    
    // Call the function being tested
    const result = await getConnectingRoutes(fromLocation, toLocation);
    
    // Verify API was called with correct endpoint and params
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/connecting-routes', {
      params: {
        from: fromLocation.id,
        to: toLocation.id
      }
    });
    expect(result).toEqual(mockConnectingRoutes);
  });

  test('handles API error responses properly', async () => {
    // Configure mock to reject with error
    mockAxiosInstance.get.mockRejectedValueOnce({
      response: {
        status: 404,
        data: {
          success: false,
          message: 'Resource not found', 
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'The requested resource was not found',
            details: ['No bus found with the specified ID']
          }
        }
      }
    });

    // Force the API to go online mode
    await checkOnlineStatus();
    
    // Call the function and expect it to throw
    await expect(getStops(999)).rejects.toThrow('Failed to fetch bus stops. Please try again.');
  });

  test('handles network errors properly', async () => {
    // Configure online check to return false (offline mode)
    (offlineService.isOnline as jest.Mock).mockResolvedValue(false);

    // Set up mock offline data
    const mockOfflineData = [
      { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 }
    ];
    (offlineService.getLocationsOffline as jest.Mock).mockResolvedValue(mockOfflineData);
    
    // Force offline mode by calling checkOnlineStatus
    await checkOnlineStatus();
    
    // Call the function being tested
    const result = await getLocations();
    
    // Should get data from offline storage without calling the API
    expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    expect(result).toEqual(mockOfflineData);
  });
});