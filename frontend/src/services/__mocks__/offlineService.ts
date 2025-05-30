/**
 * Mock implementation of offline service for testing
 */

// Basic mock data
const mockLocations = [
  { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
  { id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
  { id: 3, name: 'Madurai', latitude: 9.9252, longitude: 78.1198 }
];

const mockBuses = [
  {
    id: 1,
    from: 'Chennai',
    to: 'Coimbatore',
    busName: 'SETC Express',
    busNumber: 'TN-01-1234',
    departureTime: '06:00 AM',
    arrivalTime: '12:30 PM'
  }
];

const mockStops = [
  { id: 1, name: 'Chennai', arrivalTime: '06:00 AM', departureTime: '06:00 AM', order: 1 },
  { id: 2, name: 'Vellore', arrivalTime: '07:30 AM', departureTime: '07:35 AM', order: 2 },
  { id: 3, name: 'Coimbatore', arrivalTime: '12:30 PM', departureTime: '12:30 PM', order: 3 }
];

const mockConnectingRoutes = [
  {
    id: 1,
    isDirectRoute: false,
    firstLeg: { id: 1, from: 'Chennai', to: 'Trichy' },
    connectionPoint: 'Trichy',
    secondLeg: { id: 2, from: 'Trichy', to: 'Madurai' },
    waitTime: '00:30',
    totalDuration: '05:00'
  }
];

// Mock implementations of all methods used in api.ts
export const isOnline = jest.fn().mockResolvedValue(true);
export const saveLocationsOffline = jest.fn().mockResolvedValue(undefined);
export const getLocationsOffline = jest.fn().mockResolvedValue(mockLocations);
export const saveBusesOffline = jest.fn().mockResolvedValue(undefined);
export const getBusesOffline = jest.fn().mockResolvedValue(mockBuses);
export const saveStopsOffline = jest.fn().mockResolvedValue(undefined);
export const getStopsOffline = jest.fn().mockResolvedValue(mockStops);
export const saveConnectingRoutesOffline = jest.fn().mockResolvedValue(undefined);
export const getConnectingRoutesOffline = jest.fn().mockResolvedValue(mockConnectingRoutes);
export const saveBusLocationsOffline = jest.fn().mockResolvedValue(undefined);
export const getBusLocationsOffline = jest.fn().mockResolvedValue([]);
export const getDataAgeDays = jest.fn().mockResolvedValue(1);
export const cleanupOldBusLocationData = jest.fn().mockResolvedValue(undefined);

// Default export for compatibility
const offlineService = {
  isOnline,
  saveLocationsOffline,
  getLocationsOffline,
  saveBusesOffline,
  getBusesOffline,
  saveStopsOffline,
  getStopsOffline,
  saveConnectingRoutesOffline,
  getConnectingRoutesOffline,
  saveBusLocationsOffline,
  getBusLocationsOffline,
  getDataAgeDays,
  cleanupOldBusLocationData
};

export default offlineService;