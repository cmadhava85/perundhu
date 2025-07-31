import { ApiError } from '../services/api';
import type { PaginatedResponse, PaginationParams } from '../services/api';
import type { Bus, Location, Stop, BusLocation } from '../types';
import mockAxios from './apiMock';

// Re-export the ApiError class for test usage
export { ApiError };

// Export mockAxios as the api instance
export const api = mockAxios;

// Helper to set up common mock responses
export const setupMockResponses = () => {
  // Mock successful responses
  mockAxios.get.mockImplementation((url) => {
    if (url.includes('/locations')) {
      return Promise.resolve({ data: mockLocations });
    }
    if (url.includes('/search')) {
      return Promise.resolve({ data: mockBuses });
    }
    if (url.includes('/stops')) {
      return Promise.resolve({ data: mockStops });
    }
    if (url.includes('/live') || url.includes('/bus-tracking')) {
      return Promise.resolve({ data: mockBusLocations });
    }
    
    // Default response
    return Promise.resolve({ data: [] });
  });
  
  mockAxios.post.mockImplementation(() => {
    return Promise.resolve({ data: { success: true } });
  });
  
  mockAxios.head.mockImplementation(() => {
    return Promise.resolve({ status: 200 });
  });
};

// Mock data for testing
export const mockLocations: Location[] = [
  { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
  { id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 }
];

export const mockBuses: Bus[] = [
  {
    id: 1,
    busNumber: 'TN-01-1234',
    from: 'Chennai',
    to: 'Coimbatore',
    busName: 'SETC Express',
    departureTime: '06:00',
    arrivalTime: '14:00'
  }
];

export const mockStops: Stop[] = [
  { 
    id: 1, 
    name: 'Chennai', 
    latitude: 13.0827, 
    longitude: 80.2707, 
    arrivalTime: '06:00', 
    departureTime: '06:00', 
    order: 1 
  },
  { 
    id: 2, 
    name: 'Vellore', 
    latitude: 12.9165, 
    longitude: 79.1325, 
    arrivalTime: '07:30', 
    departureTime: '07:35', 
    order: 2 
  }
];

export const mockBusLocations: BusLocation[] = [
  {
    busId: 1,
    busName: 'SETC Express',
    busNumber: 'TN-01-1234',
    fromLocation: 'Chennai',
    toLocation: 'Coimbatore',
    latitude: 12.5,
    longitude: 78.5,
    speed: 65,
    heading: 45,
    timestamp: new Date().toISOString(),
    lastReportedStopName: 'Vellore',
    nextStopName: 'Salem',
    estimatedArrivalTime: '10:30',
    reportCount: 5,
    confidenceScore: 85
  }
];

// Mock functions that match the API service
export const getCurrentBusLocations = jest.fn().mockResolvedValue(mockBusLocations);
export const getLocations = jest.fn().mockResolvedValue(mockLocations);
export const searchBuses = jest.fn().mockResolvedValue(mockBuses);
export const getStops = jest.fn().mockResolvedValue(mockStops);
export const reportBusLocation = jest.fn().mockResolvedValue(true);
export const getLiveBusLocations = jest.fn().mockResolvedValue(mockBusLocations);
export const setOfflineMode = jest.fn();
export const getOfflineMode = jest.fn().mockReturnValue(false);
export const checkOnlineStatus = jest.fn().mockResolvedValue(true);
export const createApiInstance = jest.fn().mockReturnValue(mockAxios);
export const setApiInstance = jest.fn();

// Mock API Service class
export class APIService {
  constructor() {}
  
  async getBusSchedules(paginationParams?: PaginationParams): Promise<PaginatedResponse<Bus> | Bus[]> {
    return paginationParams ? {
      content: mockBuses,
      totalElements: mockBuses.length,
      totalPages: 1,
      size: paginationParams.size,
      number: paginationParams.page,
      hasNext: false,
      hasPrevious: false
    } : mockBuses;
  }
}