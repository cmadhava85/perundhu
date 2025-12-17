/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  timestamp?: string;
}

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
      [key: string]: unknown;
    };
  };
  translatedNames?: {
    [key: string]: string;
  };
  source?: 'database' | 'map' | 'local' | 'offline' | 'nominatim' | 'google' | 'user-input'; // Added user-input for manual entries
  state?: string; // Added state property
}

export interface SearchFilters {
  from?: string | Location;
  to?: string | Location;
  departureDate?: string;
  date?: string;
  departureTime?: string;
  busType?: string;
  maxTransfers?: number;
  accessibilityFriendly?: boolean;
  realTimeOnly?: boolean;
  sortBy?: 'price' | 'duration' | 'rating' | 'departure' | 'departure-time' | 'price-low' | 'price-high';
}

export interface Bus {
  id: number;
  from: string;
  to: string;
  busName: string;
  busNumber: string;
  departureTime: string;
  arrivalTime: string;
  // Adding missing properties referenced in BusItem component
  status?: string;
  category?: string;
  capacity?: number;
  // Add properties to match apiTypes.ts structure
  name?: string;
  number?: string; // Alias for busNumber
  fromLocationId?: number;
  toLocationId?: number;
  fromLocation?: Location;
  toLocation?: Location;
  // Adding missing properties referenced in other components
  routeName?: string;
  estimatedArrival?: string;
  fare?: number;
  isLive?: boolean;
  availability?: 'available' | 'filling-fast' | 'full';
  busType?: string;
  duration?: string;
  rating?: number;
  features?: Record<string, string>; // Bus features like AC, WiFi, etc.
}

export interface Stop {
  id: number; // Make id required to match apiTypes.ts
  name: string;
  translatedName?: string;
  arrivalTime: string;
  departureTime: string;
  order?: number;     // Keep for backward compatibility
  stopOrder?: number; // Added to match the API response
  busId: number;      // Make busId required to match apiTypes.ts
  platform?: string;  // Adding missing platform property
  status?: string;    // Adding missing status property
  taName?: string;    // Tamil name specifically
  translations?: {
    [key: string]: {
      name: string;
      [key: string]: unknown;
    };
  };
  translatedNames?: {
    [key: string]: string;
  };
  // Added properties for test compatibility
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  stopLat?: number; // For tests
  stopLng?: number; // For tests
  location?: {
    latitude: number;
    longitude: number;
  };
  locationId?: number; // Adding missing locationId property
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

// Updated ConnectingRoute to match API response format
export interface ConnectingRouteStop {
  id: number;
  name: string;
  locationId: number;
  arrivalTime: string | null;
  departureTime: string | null;
  sequence: number;
  latitude: number | null;
  longitude: number | null;
  features?: Record<string, unknown>;
}

export interface ConnectingRouteLeg {
  busId: number;
  busName: string;
  busNumber: string;
  fromStopId: number;
  toStopId: number;
  fromStop: ConnectingRouteStop;
  toStop: ConnectingRouteStop;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  distance: number | null;
}

export interface ConnectingRouteLocation {
  id: number;
  name: string;
  translatedName?: string;
  latitude: number | null;
  longitude: number | null;
  displayName?: string;
}

export interface ConnectingRoute {
  id: string;
  fromLocationId: number;
  toLocationId: number;
  fromLocation: ConnectingRouteLocation;
  toLocation: ConnectingRouteLocation;
  legs: ConnectingRouteLeg[];
  totalDuration: number;
  totalDistance: number | null;
  transfers: number;
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
  direction?: string; // Added for test compatibility
  timestamp: string;
  lastUpdated?: string; // Added for test compatibility
  lastReportedStopName: string;
  nextStopName: string;
  estimatedArrivalTime: string;
  reportCount: number;
  confidenceScore: number;
  routeId?: number; // Added for test compatibility
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
  lastReportedStopName?: string;
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
  
  // Primary language fields (as entered by user)
  fromLocationName: string;
  toLocationName: string;
  
  // Secondary language fields (translated)
  busName_secondary?: string;
  fromLocationName_secondary?: string;
  toLocationName_secondary?: string;
  
  // Language tracking
  sourceLanguage?: string; // 'en' for English, 'ta' for Tamil
  
  fromLatitude?: number;
  fromLongitude?: number;
  toLatitude?: number;
  toLongitude?: number;
  departureTime: string;
  arrivalTime: string;
  submissionDate?: string;
  status?: string;
  validationMessage?: string;
  processedDate?: string;
  stops: StopContribution[];
  // Anti-spam fields
  website?: string; // Honeypot for bot detection
  captchaToken?: string | null;
}

/**
 * User-contributed bus stop information
 */
export interface StopContribution {
  id?: number;
  name: string;
  name_secondary?: string; // Secondary language name (translated)
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
  busName: string;
  busNumber: string;
  fromLocationName: string;
  toLocationName: string;
  notes: string;
  imageUrl?: string;
  description?: string;
  submissionDate?: string;
  status?: string;
  validationMessage?: string;
  processedDate?: string;
  extractedData?: string;
  // Add missing field needed by tests
  imageData?: string;
  // Anti-spam fields
  website?: string; // Honeypot for bot detection
  captchaToken?: string | null;
}

/**
 * Bus Stand information for multi-stand search
 */
export interface BusStand {
  id: number;
  busStandName: string;
  cityId: number;
  cityName: string;
  latitude?: number;
  longitude?: number;
  busStandType: 'MAIN' | 'PRIVATE' | 'TNSTC' | 'SETC';
  facilities: string[];
  address?: string;
  busCount: number;
}

/**
 * Multi-stand search response
 * Used when user searches by city name (e.g., "Aruppukottai")
 * Returns buses from ALL bus stands in that city
 */
export interface MultiStandSearchResponse {
  fromCity: string;
  toCity: string;
  searchType: 'CITY_ONLY' | 'BUS_STAND_SPECIFIC' | 'WITH_DETAILS';
  fromBusStands: BusStand[];
  toBusStands: BusStand[];
  buses: Bus[];
  totalBuses: number;
  busStandCombinations: number;
}

/**
 * Check if a location is a city with multiple bus stands
 */
export interface MultiStandCheckResponse {
  location: string;
  hasMultipleStands: boolean;
  busStandCount: number;
  busStands: BusStand[];
}

