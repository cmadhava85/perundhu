// Mock implementation of getHistoricalData function
export const getHistoricalData = jest.fn().mockResolvedValue({
  punctuality: {
    data: [
      { date: '2025-06-01', early: 10, onTime: 80, delayed: 5, veryDelayed: 5 },
      { date: '2025-06-02', early: 15, onTime: 75, delayed: 8, veryDelayed: 2 }
    ],
    pieData: [
      { name: 'Early', value: 10 },
      { name: 'On Time', value: 80 },
      { name: 'Delayed', value: 10 }
    ],
    summary: {
      title: 'On-Time Performance Summary',
      description: 'Analysis of bus punctuality',
      dataPoints: 50,
      averageCrowdLevel: 6.5,
      peakHours: ['08:30', '17:30'],
      quietHours: ['11:00', '14:00'],
      averageUtilization: 67,
      mostCrowdedBus: 'Express 1 (TN-01-1234)',
      leastCrowdedBus: 'Express 2 (TN-02-5678)'
    },
    bestDays: [
      { date: '2025-06-02', onTimePercentage: 85 }
    ],
    worstDays: [
      { date: '2025-06-01', delayedPercentage: 20 }
    ]
  },
  crowdLevels: {
    hourly: [
      { time: '08:00', low: 30, medium: 50, high: 20 },
      { time: '09:00', low: 20, medium: 60, high: 20 }
    ],
    daily: [
      { date: '2025-06-01', low: 30, medium: 50, high: 20, total: 100 },
      { date: '2025-06-02', low: 25, medium: 55, high: 20, total: 100 }
    ],
    summary: {
      averageCrowdLevel: 6.5,
      peakHours: ['08:30', '17:30'],
      quietHours: ['11:00', '14:00'],
      averageUtilization: 67,
      mostCrowdedBus: 'Express 1 (TN-01-1234)',
      leastCrowdedBus: 'Express 2 (TN-02-5678)'
    }
  },
  busUtilization: {
    buses: [
      { busId: 'bus1', busName: 'Express 1', utilization: 75, capacity: 100, averagePassengers: 45 },
      { busId: 'bus2', busName: 'Express 2', utilization: 60, capacity: 100, averagePassengers: 36 }
    ],
    timeSeries: [
      { time: '08:00', utilization: 70, passengers: 42 },
      { time: '09:00', utilization: 80, passengers: 48 }
    ],
    summary: {
      totalTrips: 120,
      averageUtilization: 67,
      mostCrowdedBus: 'Express 1 (TN-01-1234)',
      leastCrowdedBus: 'Express 2 (TN-02-5678)',
      averageCrowdLevel: 6.5,
      peakHours: ['08:30', '17:30'],
      quietHours: ['11:00', '14:00']
    }
  }
});

// Mock version of analyticsService that doesn't depend on the real apiClient
export const getRouteAnalytics = jest.fn().mockResolvedValue({
  busUtilization: [
    { date: '2025-06-01', utilization: 75, busId: 1 },
    { date: '2025-06-02', utilization: 82, busId: 1 },
    { date: '2025-06-03', utilization: 68, busId: 1 }
  ],
  crowdLevels: [
    { time: '06:00', level: 'Low', count: 15 },
    { time: '09:00', level: 'Medium', count: 45 },
    { time: '12:00', level: 'High', count: 80 }
  ],
  punctuality: [
    { routeId: 1, onTime: 85, delayed: 12, veryDelayed: 3 },
    { routeId: 2, onTime: 75, delayed: 20, veryDelayed: 5 }
  ]
});

export const getBusAnalytics = jest.fn().mockResolvedValue({
  utilizationByDay: [
    { day: 'Monday', average: 75 },
    { day: 'Tuesday', average: 70 },
    { day: 'Wednesday', average: 65 },
    { day: 'Thursday', average: 80 },
    { day: 'Friday', average: 90 },
    { day: 'Saturday', average: 95 },
    { day: 'Sunday', average: 60 }
  ],
  delaysByStop: [
    { stopName: 'Chennai', averageDelay: 2 },
    { stopName: 'Vellore', averageDelay: 5 },
    { stopName: 'Salem', averageDelay: 8 },
    { stopName: 'Coimbatore', averageDelay: 12 }
  ]
});

export const getStopAnalytics = jest.fn().mockResolvedValue({
  passengersByHour: [
    { hour: '06:00', boarding: 25, alighting: 5 },
    { hour: '07:00', boarding: 30, alighting: 10 },
    { hour: '08:00', boarding: 45, alighting: 15 },
    { hour: '09:00', boarding: 50, alighting: 30 }
  ],
  busFrequency: [
    { hour: '06:00', count: 5 },
    { hour: '07:00', count: 8 },
    { hour: '08:00', count: 12 },
    { hour: '09:00', count: 10 }
  ]
});

export const getUserActivityStats = jest.fn().mockResolvedValue({
  trackingContributions: 42,
  routeContributions: 7,
  stopContributions: 15,
  totalPoints: 2350,
  rank: 'Silver'
});

export const getSystemStats = jest.fn().mockResolvedValue({
  totalUsers: 1250,
  activeTrackers: 85,
  totalContributions: 4500,
  busesTracked: 28
});

export const fetchAnalyticsData = jest.fn();
export const fetchRoutes = jest.fn();
export const fetchBuses = jest.fn();