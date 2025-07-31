// This file adds type definitions needed for tests to pass without modifying component code

// Add missing BusUtilizationData type
export interface BusUtilizationData {
  buses: {
    busId: string;
    busName: string;
    utilization: number;
    capacity: number;
    averagePassengers: number;
  }[];
  timeSeries: {
    time: string;
    utilization: number;
    passengers: number;
  }[];
  summary: {
    totalTrips: number;
    averageUtilization: number;
    mostCrowdedBus: string;
    leastCrowdedBus: string;
  };
}

// Extend AnalyticsSummary with additional properties used in the component
declare module '../services/analyticsService' {
  interface AnalyticsSummary {
    averageCrowdLevel?: number;
    peakHours?: string[];
    quietHours?: string[];
    averageUtilization?: number;
    mostCrowdedBus?: string;
    leastCrowdedBus?: string;
  }
}