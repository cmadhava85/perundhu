import * as apiService from '../api';
import * as offlineService from '../offlineService';
import { Location } from '../../types'; 

// Define mock data for tests
const mockLocations = [
  { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
  { id: 2, name: 'Madurai', latitude: 9.9252, longitude: 78.1198 }
] as Location[];

// Mock the modules needed for testing
jest.mock('../offlineService', () => ({
  isOnline: jest.fn(),
  getLocationsOffline: jest.fn(),
  saveLocationsOffline: jest.fn(),
  getBusesOffline: jest.fn(),
  saveBusesOffline: jest.fn(),
  getStopsOffline: jest.fn(),
  saveStopsOffline: jest.fn(),
  getBusLocationsOffline: jest.fn(),
  saveBusLocationsOffline: jest.fn()
}));

// Mock axios module at a higher level
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  create: jest.fn().mockReturnValue({
    get: jest.fn(),
    post: jest.fn()
  })
}));

describe('API Service', () => {
  // Test the existence of API functions
  test('API service exports expected functions', () => {
    // Check that all expected functions exist in the API service
    expect(typeof apiService.getLocations).toBe('function');
    expect(typeof apiService.searchBuses).toBe('function'); 
    expect(typeof apiService.getStops).toBe('function');
    expect(typeof apiService.getCurrentBusLocations).toBe('function');
  });

  // Test offline data access paths
  test('API service can access offline data', async () => {
    // Mock the offline service to return offline mode and data
    (offlineService.isOnline as jest.Mock).mockResolvedValue(false);
    (offlineService.getLocationsOffline as jest.Mock).mockResolvedValue(mockLocations);
    
    // This should use the offline data path
    try {
      const locations = await apiService.getLocations();
      
      // Verify that we got the mock data back
      expect(Array.isArray(locations)).toBe(true);
      expect(offlineService.getLocationsOffline).toHaveBeenCalled();
    } catch (error) {
      // If we get an error, the test should fail
      fail('Should not have thrown an error: ' + error);
    }
  });
});