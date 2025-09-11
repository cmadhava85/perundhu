export interface Location {
  id: number;
  name: string;
  latitude: number;  // No longer optional
  longitude: number; // No longer optional
  state?: string; // Add state property for test compatibility
  translatedName?: string; // Simple translated name for the current language
  taName?: string; // Tamil name specifically
  source?: 'database' | 'nominatim' | 'map' | 'api' | 'offline' | 'local' | 'google'; // Added 'google' to fix geocoding service
  translations?: {
    [key: string]: {
      name: string;
      [key: string]: any;
    };
  };
  translatedNames?: {
    [key: string]: string;
  };
  coordinates?: { // Add coordinates property for backward compatibility
    lat: number;
    lng: number;
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
  // Add missing properties that are expected by components
  name?: string;
  status?: 'active' | 'inactive';
  routeName?: string;
  estimatedArrival?: string;
  capacity?: string;
  active?: boolean;
  category?: string;
  // Add properties used in EnhancedBusList
  isLive?: boolean;
  seatsAvailable?: number;
  totalSeats?: number;
  busType?: string;
  availability?: 'available' | 'filling-fast' | 'full';
  operatorName?: string;
  rating?: number;
  route?: string[];
  duration?: string;
  fare?: number;
  amenities?: string[];
}

export interface Stop {
  id?: number;
  name: string;
  translatedName?: string;
  arrivalTime: string;
  departureTime: string;
  order?: number;     // Keep for backward compatibility
  stopOrder?: number; // Added to match the API response
  // Add location coordinates for map markers
  latitude?: number;
  longitude?: number;
  // Alternative coordinate properties that might come from API
  stopLat?: number;
  stopLng?: number;
  lat?: number;
  lng?: number;
  // Location object alternative
  location?: {
    latitude: number;
    longitude: number;
  };
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
  id: number; // Add missing id property
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
  lastReportedStopName?: string; // Make optional to match service
  nextStopName?: string;
  estimatedArrivalTime?: string;
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
  busName?: string;
  busNumber: string;
  fromLocationName: string;
  fromLatitude?: number;
  fromLongitude?: number;
  toLocationName: string;
  toLatitude?: number;
  toLongitude?: number;
  departureTime?: string;
  arrivalTime?: string;
  scheduleInfo?: string;
  submissionDate?: string;
  status?: string;
  validationMessage?: string;
  processedDate?: string;
  additionalNotes?: string;
  submittedBy?: string;
  stops?: StopContribution[];
  // Legacy fields kept for backward compatibility with frontend forms
  route?: string;
  origin?: string;
  destination?: string;
  detailedStops?: Array<{
    id?: string;
    name: string;
    latitude?: number;
    longitude?: number;
    arrivalTime?: string;
    departureTime?: string;
    order?: number;
  }>;
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

/**
 * Search filters interface for enhanced search functionality
 */
export interface SearchFilters {
  from: string | Location | null;
  to: string | Location | null;
  date: string;
  busType: string;
  sortBy: string;
  includeIntermediateStops?: boolean;
  includeContinuingBuses?: boolean;
  showOSMData?: boolean;
}

