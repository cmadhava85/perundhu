import axios from 'axios';
import { getLocations, searchBuses, getStops, getConnectingRoutes, getCurrentBusLocations, api } from '../api';

// Mock axios directly instead of using axios-mock-adapter
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the api instance to avoid import.meta.env usage in tests
jest.mock('../api', () => {
  const originalModule = jest.requireActual('../api');
  
  // Create a mock axios instance
  const mockAxios = {
    get: jest.fn(),
    post: jest.fn(),
    head: jest.fn(),
    create: jest.fn().mockReturnValue({
      get: jest.fn(),
      post: jest.fn(),
      head: jest.fn()
    })
  };

  // Replace api with our mock
  return {
    ...originalModule,
    api: mockAxios,
    createApiInstance: jest.fn().mockReturnValue(mockAxios),
  };
});

// Mock environment utilities
jest.mock('../../utils/environment', () => ({
  getEnv: (key: string) => {
    if (key === 'VITE_API_URL') {
      return 'http://localhost:8080';
    }
    return '';
  }
}));

describe('API Service', () => {
  afterEach(() => {
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
    api.get.mockResolvedValueOnce({ data: mockLocations });
    
    const result = await getLocations();
    
    expect(api.get).toHaveBeenCalledWith('/api/v1/bus-schedules/locations', {
      params: { lang: 'en' }
    });
    expect(result).toEqual(mockLocations);
  });

  test('searchBuses searches buses between locations', async () => {
    const fromLocation = mockLocations[0];
    const toLocation = mockLocations[1];
    
    api.get.mockResolvedValueOnce({ data: mockBuses });
    
    const result = await searchBuses(fromLocation, toLocation);
    
    expect(api.get).toHaveBeenCalledWith(
      '/api/v1/bus-schedules/search',
      { params: { fromLocationId: 1, toLocationId: 2 } }
    );
    expect(result).toEqual(mockBuses);
  });

  test('getStops fetches stops for a bus', async () => {
    api.get.mockResolvedValueOnce({ data: mockStops });
    
    const result = await getStops(1);
    
    expect(api.get).toHaveBeenCalledWith(
      '/api/v1/bus-schedules/1/stops',
      { params: { lang: 'en' } }
    );
    expect(result).toEqual(mockStops);
  });

  test('getConnectingRoutes fetches connecting routes between locations', async () => {
    api.get.mockResolvedValueOnce({ data: mockConnectingRoutes });
    
    const result = await getConnectingRoutes(1, 3);
    
    expect(api.get).toHaveBeenCalledWith(
      '/api/v1/bus-schedules/connecting-routes',
      { params: { fromLocationId: 1, toLocationId: 3 } }
    );
    expect(result).toEqual(mockConnectingRoutes);
  });

  test('getCurrentBusLocations fetches current locations of buses', async () => {
    api.get.mockResolvedValueOnce({ data: mockBusLocations });
    
    const result = await getCurrentBusLocations();
    
    expect(api.get).toHaveBeenCalledWith(
      '/api/v1/bus-tracking/live'
    );
    expect(result).toEqual(mockBusLocations);
  });

  test('handles API error responses properly', async () => {
    const errorResponse = {
      response: {
        status: 404,
        data: {
          message: 'Resource not found',
          code: 'NOT_FOUND',
          details: ['The requested resource could not be found']
        }
      }
    };
    
    api.get.mockRejectedValueOnce(errorResponse);
    
    try {
      await getLocations();
      // Should not reach this line
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain('Failed to fetch locations');
      expect(error.name).toBe('ApiError');
    }
  });
});