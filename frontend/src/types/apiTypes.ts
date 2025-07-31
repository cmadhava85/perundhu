/**
 * Type definitions for API models
 */

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  timestamp?: string;
}

export interface Bus {
  id: number;
  name: string;
  busNumber: string;
  departureTime: string;
  arrivalTime: string;
  capacity: number;
  category: string;
  fromLocationId: number;
  toLocationId: number;
  fromLocation?: Location;
  toLocation?: Location;
}

export interface Stop {
  id: number;
  name: string;
  busId: number;
  locationId: number;
  arrivalTime: string;
  departureTime: string;
  stopOrder: number;
  location?: Location;
}

export interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusLocationReport {
  busId: number;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: string;
  userId?: string;
  confidenceScore?: number;
}

export interface BusLocation {
  busId: number;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
  confidenceScore: number;
  reportCount: number;
  busName?: string;
  busNumber?: string;
}

export interface RewardPoints {
  userId: string;
  totalPoints: number;
  recentActivities: RewardActivity[];
}

export interface RewardActivity {
  id: number;
  userId: string;
  activity: string;
  points: number;
  timestamp: string;
}

export interface ConnectingRoute {
  id: string;
  fromLocationId: number;
  toLocationId: number;
  fromLocation: Location;
  toLocation: Location;
  legs: ConnectingRouteLeg[];
  totalDuration: number;
  totalDistance?: number;
  transfers: number;
}

export interface ConnectingRouteLeg {
  busId: number;
  busName: string;
  busNumber: string;
  fromStopId: number;
  toStopId: number;
  fromStop: Stop;
  toStop: Stop;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  distance?: number;
}

export interface RouteContribution {
  userId: string;
  routeType: string;
  fromLocationId: number;
  toLocationId: number;
  description: string;
}

export interface ImageContribution {
  userId: string;
  imageUrl: string;
  imageType: string;
  description: string;
  relatedEntityId: number;
  relatedEntityType: string;
}