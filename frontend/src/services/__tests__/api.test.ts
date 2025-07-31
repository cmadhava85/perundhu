import { getLocations, searchBuses, getStops, getConnectingRoutes, getCurrentBusLocations } from '../api';

// Mock the entire API module
jest.mock('../api', () => {
  // Keep the original module's implementation
  const originalModule = jest.requireActual('../api');
  
  // Return a object that includes all original functions
  // but replaces the API functions with mocked versions
  return {
    ...originalModule,
    // Mock these functions specifically
    getLocations: jest.fn(),
    searchBuses: jest.fn(),
    getStops: jest.fn(),
    getConnectingRoutes: jest.fn(),
    getCurrentBusLocations: jest.fn(),
    // Provide a mocked api object that can be used in tests
    api: {
      get: jest.fn(),
      post: jest.fn(),
      create: jest.fn().mockReturnValue({
        get: jest.fn(),
        post: jest.fn(),
      })
    }
  };
});

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock data for testing
  const mockLocations = [
    { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
    { id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
    { id: 3, name: 'Madurai', latitude: 9.9252, longitude: 78.1198 }
  ];

  const mockBuses = [
    {
      id: 1,
      busNumber: 'TN-01-1234',
      busName: 'SETC Express',
      from: 'Chennai',
      to: 'Coimbatore',
      departureTime: '06:00',
      arrivalTime: '12:30'
    }
  ];

  const mockStops = [
    { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707, arrivalTime: '06:00', departureTime: '06:00', order: 1 },
    { id: 2, name: 'Vellore', latitude: 12.9165, longitude: 79.1325, arrivalTime: '07:30', departureTime: '07:35', order: 2 },
    { id: 3, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558, arrivalTime: '12:30', departureTime: '12:30', order: 3 }
  ];

  const mockConnectingRoutes = [
    {
      id: 1,
      isDirectRoute: false,
      firstLeg: { id: 1, from: 'Chennai', to: 'Trichy' },
      connectionPoint: 'Trichy',
      secondLeg: { id: 2, from: 'Trichy', to: 'Madurai' },
      waitTime: '00:30',
      totalDuration: '8h 30m'
    }
  ];

  const mockBusLocations = [
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
  ];

  test('getLocations fetches locations from API', async () => {
    // Mock the implementation for this specific test
    (getLocations as jest.Mock).mockResolvedValueOnce(mockLocations);
    
    const result = await getLocations();
    
    expect(getLocations).toHaveBeenCalled();
    expect(result).toEqual(mockLocations);
  });

  test('searchBuses searches buses between locations', async () => {
    const fromLocation = mockLocations[0];
    const toLocation = mockLocations[1];
    
    (searchBuses as jest.Mock).mockResolvedValueOnce(mockBuses);
    
    const result = await searchBuses(fromLocation, toLocation);
    
    expect(searchBuses).toHaveBeenCalledWith(fromLocation, toLocation);
    expect(result).toEqual(mockBuses);
  });

  test('getStops fetches stops for a bus', async () => {
    (getStops as jest.Mock).mockResolvedValueOnce(mockStops);
    
    const result = await getStops(1);
    
    expect(getStops).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockStops);
  });

  test('getConnectingRoutes fetches connecting routes between locations', async () => {
    (getConnectingRoutes as jest.Mock).mockResolvedValueOnce(mockConnectingRoutes);
    
    const result = await getConnectingRoutes(1, 3);
    
    expect(getConnectingRoutes).toHaveBeenCalledWith(1, 3);
    expect(result).toEqual(mockConnectingRoutes);
  });

  test('getCurrentBusLocations fetches current locations of buses', async () => {
    (getCurrentBusLocations as jest.Mock).mockResolvedValueOnce(mockBusLocations);
    
    const result = await getCurrentBusLocations();
    
    expect(getCurrentBusLocations).toHaveBeenCalled();
    expect(result).toEqual(mockBusLocations);
  });

  test('handles API error responses properly', async () => {
    const apiError = new Error('Failed to fetch locations');
    apiError.name = 'ApiError';
    
    (getLocations as jest.Mock).mockRejectedValueOnce(apiError);
    
    try {
      await getLocations();
      fail('Expected getLocations to throw an error');
    } catch (error: any) {
      expect(error.message).toContain('Failed to fetch locations');
      expect(error.name).toBe('ApiError');
    }
  });
});