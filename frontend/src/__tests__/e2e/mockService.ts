import type { Bus, Stop, Location, BusLocationReport, BusLocation, RewardPoints, ConnectingRoute, RewardActivity } from '../../types/index';

// Sample data for testing
export const mockData = {
  locations: [
    { id: 1, name: 'Chennai Central', latitude: 13.0827, longitude: 80.2707 },
    { id: 2, name: 'T Nagar', latitude: 13.0418, longitude: 80.2341 },
    { id: 3, name: 'Tambaram', latitude: 12.9249, longitude: 80.1270 }
  ] as Location[],
  
  buses: [
    { 
      id: 1,
      from: 'Chennai Central',
      to: 'Tambaram',
      busName: 'Chennai Central - Tambaram Express',
      busNumber: '23C',
      departureTime: '06:00:00',
      arrivalTime: '07:00:00'
    },
    { 
      id: 2,
      from: 'T Nagar',
      to: 'Tambaram',
      busName: 'T Nagar - Tambaram Local',
      busNumber: '15B',
      departureTime: '05:30:00',
      arrivalTime: '06:30:00'
    }
  ] as Bus[],
  
  stops: [
    { id: 1, name: 'Chennai Central', order: 1, stopOrder: 1, arrivalTime: '', departureTime: '06:00:00' },
    { id: 2, name: 'Guindy', order: 2, stopOrder: 2, arrivalTime: '06:25:00', departureTime: '06:27:00' },
    { id: 3, name: 'Tambaram', order: 3, stopOrder: 3, arrivalTime: '07:00:00', departureTime: '' }
  ] as Stop[],
  
  busLocations: [
    { 
      busId: 1,
      busName: 'Chennai Central - Tambaram Express',
      busNumber: '23C', 
      fromLocation: 'Chennai Central',
      toLocation: 'Tambaram',
      latitude: 13.0316, 
      longitude: 80.2524,
      speed: 35,
      heading: 180,
      timestamp: new Date().toISOString(),
      lastReportedStopName: 'Chennai Central',
      nextStopName: 'Guindy',
      estimatedArrivalTime: '06:25:00',
      reportCount: 5,
      confidenceScore: 0.85
    }
  ] as BusLocation[],
  
  connectingRoutes: [
    {
      id: 1,
      isDirectRoute: false,
      fromLocation: 'Chennai Central',
      toLocation: 'Tambaram',
      connectionPoint: 'Guindy',
      totalDuration: '01:30:00',
      waitTime: '00:05:00',
      firstLeg: {
        id: 1,
        from: 'Chennai Central',
        to: 'Guindy',
        busName: 'Chennai Central - Guindy Express',
        busNumber: '23C',
        departureTime: '06:00:00',
        arrivalTime: '06:25:00'
      },
      secondLeg: {
        id: 2,
        from: 'Guindy',
        to: 'Tambaram',
        busName: 'Guindy - Tambaram Express',
        busNumber: '15B',
        departureTime: '06:30:00',
        arrivalTime: '07:00:00'
      }
    }
  ] as ConnectingRoute[],
  
  rewardPoints: {
    userId: 'test-user',
    totalPoints: 150,
    currentTripPoints: 15,
    lifetimePoints: 500,
    userRank: 'Gold',
    leaderboardPosition: 5,
    recentActivities: [
      { 
        activityType: 'TRIP_COMPLETED',
        pointsEarned: 10, 
        timestamp: '2025-05-30T10:15:00Z', 
        description: 'Trip completed' 
      },
      { 
        activityType: 'DELAY_REPORTED',
        pointsEarned: 5, 
        timestamp: '2025-05-29T16:30:00Z', 
        description: 'Reported delay' 
      }
    ] as RewardActivity[]
  } as RewardPoints,

  locationReports: [
    {
      latitude: 13.0316,
      longitude: 80.2524,
      speed: 35,
      heading: 180,
      timestamp: new Date().toISOString(),
      accuracy: 10
    },
    {
      latitude: 13.0039,
      longitude: 80.2095,
      speed: 40,
      heading: 175,
      timestamp: new Date().toISOString(),
      accuracy: 15
    }
  ] as BusLocationReport[]
};

// Mock implementation of API functions
export const mockApiService = {
  // Flag to simulate online/offline mode
  isOfflineMode: false,
  
  // Mock functions for API calls
  getLocations: jest.fn().mockImplementation(async () => {
    if (mockApiService.isOfflineMode) {
      return Promise.reject(new Error('Network error'));
    }
    return mockData.locations;
  }),
  
  searchBuses: jest.fn().mockImplementation(async () => {
    if (mockApiService.isOfflineMode) {
      return Promise.reject(new Error('Network error'));
    }
    return mockData.buses;
  }),
  
  getStops: jest.fn().mockImplementation(async (busId: number) => {
    if (mockApiService.isOfflineMode) {
      return Promise.reject(new Error('Network error'));
    }
    if (busId === 999) {
      return Promise.reject(new Error('Failed to fetch bus stops. Please try again.'));
    }
    return mockData.stops;
  }),
  
  getConnectingRoutes: jest.fn().mockImplementation(async () => {
    if (mockApiService.isOfflineMode) {
      return Promise.reject(new Error('Network error'));
    }
    return mockData.connectingRoutes;
  }),
  
  reportBusLocation: jest.fn().mockImplementation(async () => {
    if (mockApiService.isOfflineMode) {
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  }),
  
  disembarkBus: jest.fn().mockImplementation(async () => {
    if (mockApiService.isOfflineMode) {
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  }),
  
  getLiveBusLocations: jest.fn().mockImplementation(async () => {
    if (mockApiService.isOfflineMode) {
      return Promise.reject(new Error('Network error'));
    }
    return mockData.busLocations;
  }),
  
  getUserRewardPoints: jest.fn().mockImplementation(async () => {
    if (mockApiService.isOfflineMode) {
      return Promise.resolve({
        userId: 'offline',
        totalPoints: 0,
        currentTripPoints: 0,
        lifetimePoints: 0,
        userRank: 'Beginner',
        leaderboardPosition: 0,
        recentActivities: []
      });
    }
    return mockData.rewardPoints;
  }),
  
  // Mock utility functions
  resetMocks: () => {
    Object.values(mockApiService).forEach(value => {
      if (typeof value === 'function' && 'mockClear' in value) {
        value.mockClear();
      }
    });
  },
  
  setOfflineMode: (offline: boolean) => {
    mockApiService.isOfflineMode = offline;
  },

  // API check status functions
  checkOnlineStatus: jest.fn().mockImplementation(async () => {
    return !mockApiService.isOfflineMode;
  }),

  getOfflineMode: jest.fn().mockImplementation(() => {
    return mockApiService.isOfflineMode;
  }),

  getOfflineDataAge: jest.fn().mockImplementation(() => {
    return Promise.resolve(1); // Return 1 day as default
  }),

  cleanupOldOfflineData: jest.fn().mockImplementation(() => {
    return Promise.resolve();
  })
};

export default mockApiService;

// Add a simple test to prevent the "empty test suite" error
describe('Mock Service', () => {
  test('has necessary mock data', () => {
    expect(mockData).toBeDefined();
    expect(mockData.locations).toBeDefined();
    expect(mockData.buses).toBeDefined();
    expect(mockData.stops).toBeDefined();
    expect(mockData.busLocations).toBeDefined();
    expect(mockData.connectingRoutes).toBeDefined();
  });
});