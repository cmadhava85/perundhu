export interface Location {
  id: number;
  name: string;
  latitude: number;  // No longer optional
  longitude: number; // No longer optional
  translatedName?: string; // Simple translated name for the current language
  taName?: string; // Tamil name specifically
  translations?: {
    [key: string]: {
      name: string;
      [key: string]: any;
    };
  };
  translatedNames?: {
    [key: string]: string;
  };
}

export interface Bus {
  id: number;
  from: string;
  to: string;
  busName: string;
  busNumber: string;
  departureTime: string;
  arrivalTime: string;
}

export interface Stop {
  id?: number;
  name: string;
  translatedName?: string;
  arrivalTime: string;
  departureTime: string;
  order?: number;     // Keep for backward compatibility
  stopOrder?: number; // Added to match the API response
  taName?: string; // Tamil name specifically
  translations?: {
    [key: string]: {
      name: string;
      [key: string]: any;
    };
  };
  translatedNames?: {
    [key: string]: string;
  };
}

export interface BusLeg extends Bus {
  id: number;
  from: string;
  to: string;
  busName: string;
  busNumber: string;
  departureTime: string;
  arrivalTime: string;
}

export interface ConnectingRoute {
  id: number;
  isDirectRoute: boolean;
  fromLocation: string;
  toLocation: string;
  connectionPoint: string;
  totalDuration: string;
  waitTime: string;
  firstLeg: BusLeg;
  secondLeg: BusLeg;
}

export interface Translation {
  entityType: string;
  entityId: number;
  languageCode: string;
  fieldName: string;
  translatedValue: string;
}

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  error: {
    code: string;
    message: string;
    details?: string[];
  };
  path?: string;
  timestamp?: string;
}

/**
 * Real-time bus location interface from crowd-sourced tracking
 */
export interface BusLocation {
  busId: number;
  busName: string;
  busNumber: string;
  fromLocation: string;
  toLocation: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
  lastReportedStopName: string;
  nextStopName: string;
  estimatedArrivalTime: string;
  reportCount: number;
  confidenceScore: number;
}

/**
 * Bus location report submitted by users
 */
export interface BusLocationReport {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
  accuracy: number;
  stopId?: number;
}

/**
 * Reward points from contributing to bus tracking
 */
export interface RewardPoints {
  userId: string;
  totalPoints: number;
  currentTripPoints: number;
  lifetimePoints: number;
  userRank: string;
  leaderboardPosition: number;
  recentActivities: RewardActivity[];
}

/**
 * Activity that earned reward points
 */
export interface RewardActivity {
  activityType: string;
  pointsEarned: number;
  timestamp: string;
  description: string;
}

/**
 * User-contributed bus route information
 */
export interface RouteContribution {
  id?: number;
  userId?: string;
  busName: string;
  busNumber: string;
  fromLocationName: string;
  fromLatitude?: number;
  fromLongitude?: number;
  toLocationName: string;
  toLatitude?: number;
  toLongitude?: number;
  departureTime: string;
  arrivalTime: string;
  submissionDate?: string;
  status?: string;
  validationMessage?: string;
  processedDate?: string;
  stops: StopContribution[];
}

/**
 * User-contributed bus stop information
 */
export interface StopContribution {
  id?: number;
  name: string;
  latitude?: number;
  longitude?: number;
  arrivalTime: string;
  departureTime: string;
  stopOrder: number;
}

/**
 * User-contributed bus schedule image
 */
export interface ImageContribution {
  id?: number;
  userId?: string;
  imageUrl?: string;
  description?: string;
  submissionDate?: string;
  status?: string;
  validationMessage?: string;
  processedDate?: string;
  extractedData?: string;
}

