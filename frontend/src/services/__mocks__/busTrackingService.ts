import { vi } from 'vitest';
import type { BusLocation } from '../../types';

// Mock data for testing
const mockBusLocations: BusLocation[] = [
  {
    busId: 1,
    busName: 'Express 101',
    busNumber: 'TN-01-1234',
    fromLocation: 'Chennai',
    toLocation: 'Coimbatore',
    latitude: 13.0827,
    longitude: 80.2707,
    speed: 45,
    heading: 180,
    timestamp: new Date().toISOString(),
    lastReportedStopName: 'Chennai Central',
    nextStopName: 'Vellore',
    estimatedArrivalTime: '07:30 AM',
    reportCount: 5,
    confidenceScore: 0.85
  }
];

// Mock implementations using Vitest syntax
export const getCurrentBusLocations = vi.fn().mockResolvedValue(mockBusLocations);
export const reportBusLocation = vi.fn().mockResolvedValue({ success: true, pointsEarned: 10 });
export const getBusLocationHistory = vi.fn().mockResolvedValue(mockBusLocations);
export const getBusRoute = vi.fn().mockResolvedValue([]);
export const subscribeToUpdates = vi.fn().mockResolvedValue(undefined);
export const unsubscribeFromUpdates = vi.fn().mockResolvedValue(undefined);

// Default export for compatibility
const busTrackingService = {
  getCurrentBusLocations,
  reportBusLocation,
  getBusLocationHistory,
  getBusRoute,
  subscribeToUpdates,
  unsubscribeFromUpdates
};

export default busTrackingService;