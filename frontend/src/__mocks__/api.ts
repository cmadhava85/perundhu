// Mock API implementation for tests
interface MockApiError extends Error {
  status: number;
  errorCode?: string;
  details?: string[];
  path?: string;
  timestamp?: string;
}

export const ApiError = jest.fn().mockImplementation(function(this: MockApiError, message: string, status: number, errorData?: any) {
  Error.call(this, message);
  this.name = 'ApiError';
  this.status = status;
  if (errorData) {
    this.errorCode = errorData.code;
    this.details = errorData.details;
    this.path = errorData.path;
    this.timestamp = errorData.timestamp;
  }
  Object.setPrototypeOf(this, ApiError.prototype);
});

export const getLocations = jest.fn().mockResolvedValue([
  { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
  { id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 }
]);

export const getDestinations = jest.fn().mockResolvedValue([
  { id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
  { id: 3, name: 'Madurai', latitude: 9.9252, longitude: 78.1198 }
]);

export const getBuses = jest.fn().mockResolvedValue([{
  id: 1,
  from: 'Chennai',
  to: 'Coimbatore',
  busName: 'SETC Express',
  busNumber: 'TN-01-1234',
  departureTime: '06:00 AM',
  arrivalTime: '12:30 PM'
}]);

export const getBusStops = jest.fn().mockResolvedValue([
  { id: 1, name: 'Chennai', arrivalTime: '06:00 AM', departureTime: '06:00 AM', order: 1 },
  { id: 2, name: 'Vellore', arrivalTime: '07:30 AM', departureTime: '07:35 AM', order: 2 }
]);

export const getConnectingRoutes = jest.fn().mockResolvedValue([{
  id: 1,
  isDirectRoute: false,
  firstLeg: { id: 1, from: 'Chennai', to: 'Trichy' },
  connectionPoint: 'Trichy',
  secondLeg: { id: 2, from: 'Trichy', to: 'Madurai' },
  waitTime: '00:30',
  totalDuration: '05:00'
}]);