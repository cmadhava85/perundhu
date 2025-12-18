/**
 * Centralized Validation Service
 * Provides comprehensive validation for locations, times, and journey data
 * across search, contribution, and admin pages.
 */

import { calculateDistance } from '../services/geolocation';

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  message?: string;
  messageKey?: string; // i18n key for translation
  severity?: 'error' | 'warning' | 'info';
}

export interface LocationData {
  name: string;
  latitude?: number;
  longitude?: number;
  isVerified?: boolean; // Selected from autocomplete
}

export interface JourneyValidationInput {
  origin: LocationData;
  destination: LocationData;
  departureTime?: string; // HH:mm format
  arrivalTime?: string;   // HH:mm format
}

export interface StopValidationInput {
  name: string;
  arrivalTime?: string;
  departureTime?: string;
  latitude?: number;
  longitude?: number;
  order: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Tamil Nadu approximate bounds
const TAMIL_NADU_BOUNDS = {
  minLat: 8.0,
  maxLat: 14.0,
  minLon: 76.0,
  maxLon: 81.0,
};

// Bus speed assumptions (km/h)
const BUS_SPEED = {
  MIN: 25,   // Slow town bus with many stops
  AVG: 45,   // Average intercity bus
  MAX: 80,   // Express highway bus
};

// Journey duration limits
const JOURNEY_LIMITS = {
  MIN_MINUTES: 5,        // Minimum 5 minutes
  MAX_HOURS: 24,         // Maximum 24 hours
  WARNING_HOURS: 12,     // Warn if > 12 hours
};

// Time format regex: HH:mm (24-hour format)
const TIME_FORMAT_REGEX = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

// ============================================================================
// LOCATION VALIDATIONS
// ============================================================================

/**
 * Validate that a location name is not empty
 */
export function validateLocationRequired(location: string | undefined | null): ValidationResult {
  if (!location || location.trim().length === 0) {
    return {
      valid: false,
      message: 'Location is required',
      messageKey: 'validation.location.required',
      severity: 'error',
    };
  }
  return { valid: true };
}

/**
 * Validate that location was selected from autocomplete (verified)
 */
export function validateLocationVerified(location: LocationData): ValidationResult {
  if (!location.name || location.name.trim().length === 0) {
    return {
      valid: false,
      message: 'Location is required',
      messageKey: 'validation.location.required',
      severity: 'error',
    };
  }
  
  if (!location.isVerified) {
    return {
      valid: false,
      message: 'Please select a location from the suggestions list',
      messageKey: 'validation.location.selectFromList',
      severity: 'error',
    };
  }
  
  return { valid: true };
}

/**
 * Validate location coordinates are within Tamil Nadu bounds
 */
export function validateLocationBounds(lat: number, lon: number): ValidationResult {
  if (
    lat < TAMIL_NADU_BOUNDS.minLat ||
    lat > TAMIL_NADU_BOUNDS.maxLat ||
    lon < TAMIL_NADU_BOUNDS.minLon ||
    lon > TAMIL_NADU_BOUNDS.maxLon
  ) {
    return {
      valid: false,
      message: 'Location appears to be outside the service area',
      messageKey: 'validation.location.outsideBounds',
      severity: 'warning',
    };
  }
  return { valid: true };
}

/**
 * Validate that origin and destination are different
 */
export function validateDifferentLocations(
  origin: LocationData,
  destination: LocationData
): ValidationResult {
  // Check by name (case-insensitive)
  const originName = origin.name?.trim().toLowerCase();
  const destName = destination.name?.trim().toLowerCase();
  
  if (originName && destName && originName === destName) {
    return {
      valid: false,
      message: 'Origin and destination cannot be the same',
      messageKey: 'validation.location.sameOriginDest',
      severity: 'error',
    };
  }
  
  // Also check by coordinates if available (within 0.5km)
  if (
    origin.latitude !== undefined &&
    origin.longitude !== undefined &&
    destination.latitude !== undefined &&
    destination.longitude !== undefined
  ) {
    const distance = calculateDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    );
    
    if (distance < 0.5) {
      return {
        valid: false,
        message: 'Origin and destination are too close (less than 500m apart)',
        messageKey: 'validation.location.tooClose',
        severity: 'error',
      };
    }
  }
  
  return { valid: true };
}

// ============================================================================
// TIME VALIDATIONS
// ============================================================================

/**
 * Validate time format (HH:mm)
 */
export function validateTimeFormat(time: string | undefined | null): ValidationResult {
  if (!time || time.trim().length === 0) {
    return { valid: true }; // Empty is valid (might be optional)
  }
  
  if (!TIME_FORMAT_REGEX.test(time)) {
    return {
      valid: false,
      message: 'Invalid time format. Please use HH:mm (e.g., 09:30, 14:45)',
      messageKey: 'validation.time.invalidFormat',
      severity: 'error',
    };
  }
  
  return { valid: true };
}

/**
 * Validate required time field
 */
export function validateTimeRequired(time: string | undefined | null): ValidationResult {
  if (!time || time.trim().length === 0) {
    return {
      valid: false,
      message: 'Time is required',
      messageKey: 'validation.time.required',
      severity: 'error',
    };
  }
  
  return validateTimeFormat(time);
}

/**
 * Parse time string to minutes since midnight
 */
export function parseTimeToMinutes(time: string): number {
  const match = time.match(TIME_FORMAT_REGEX);
  if (!match) return -1;
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours * 60 + minutes;
}

/**
 * Calculate duration in minutes, handling overnight journeys
 */
export function calculateDurationMinutes(
  departureTime: string,
  arrivalTime: string
): number {
  const depMinutes = parseTimeToMinutes(departureTime);
  const arrMinutes = parseTimeToMinutes(arrivalTime);
  
  if (depMinutes < 0 || arrMinutes < 0) return -1;
  
  // Handle overnight journey (e.g., 23:00 → 02:00)
  if (arrMinutes < depMinutes) {
    return (24 * 60 - depMinutes) + arrMinutes;
  }
  
  return arrMinutes - depMinutes;
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 0) return 'Invalid';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

/**
 * Validate arrival time is after departure time
 * Handles overnight journeys correctly
 */
export function validateArrivalAfterDeparture(
  departureTime: string,
  arrivalTime: string
): ValidationResult {
  const formatDep = validateTimeFormat(departureTime);
  if (!formatDep.valid) return formatDep;
  
  const formatArr = validateTimeFormat(arrivalTime);
  if (!formatArr.valid) return formatArr;
  
  const duration = calculateDurationMinutes(departureTime, arrivalTime);
  
  if (duration < JOURNEY_LIMITS.MIN_MINUTES) {
    return {
      valid: false,
      message: `Journey duration must be at least ${JOURNEY_LIMITS.MIN_MINUTES} minutes`,
      messageKey: 'validation.time.tooShort',
      severity: 'error',
    };
  }
  
  if (duration > JOURNEY_LIMITS.MAX_HOURS * 60) {
    return {
      valid: false,
      message: `Journey duration cannot exceed ${JOURNEY_LIMITS.MAX_HOURS} hours`,
      messageKey: 'validation.time.tooLong',
      severity: 'error',
    };
  }
  
  if (duration > JOURNEY_LIMITS.WARNING_HOURS * 60) {
    return {
      valid: true,
      message: `Journey duration is ${formatDuration(duration)}. This seems unusually long.`,
      messageKey: 'validation.time.unusuallyLong',
      severity: 'warning',
    };
  }
  
  return { valid: true };
}

// ============================================================================
// DISTANCE-BASED TIME VALIDATION
// ============================================================================

/**
 * Calculate expected journey duration range based on distance
 */
export function getExpectedDurationRange(distanceKm: number): {
  minMinutes: number;
  maxMinutes: number;
  avgMinutes: number;
} {
  return {
    minMinutes: Math.ceil((distanceKm / BUS_SPEED.MAX) * 60),
    maxMinutes: Math.ceil((distanceKm / BUS_SPEED.MIN) * 60),
    avgMinutes: Math.ceil((distanceKm / BUS_SPEED.AVG) * 60),
  };
}

/**
 * Validate journey duration is reasonable for the distance
 */
export function validateDurationForDistance(
  departureTime: string,
  arrivalTime: string,
  distanceKm: number
): ValidationResult {
  // First validate basic time rules
  const basicValidation = validateArrivalAfterDeparture(departureTime, arrivalTime);
  if (!basicValidation.valid) return basicValidation;
  
  const actualMinutes = calculateDurationMinutes(departureTime, arrivalTime);
  const expected = getExpectedDurationRange(distanceKm);
  
  // Too fast (faster than express bus on highway)
  if (actualMinutes < expected.minMinutes * 0.8) {
    const minExpected = formatDuration(expected.minMinutes);
    const actual = formatDuration(actualMinutes);
    return {
      valid: false,
      message: `Journey time (${actual}) is too short for ${Math.round(distanceKm)}km. Minimum expected: ${minExpected}`,
      messageKey: 'validation.journey.tooFast',
      severity: 'error',
    };
  }
  
  // Too slow (slower than town bus with many stops)
  if (actualMinutes > expected.maxMinutes * 1.5) {
    const maxExpected = formatDuration(expected.maxMinutes);
    const actual = formatDuration(actualMinutes);
    return {
      valid: false,
      message: `Journey time (${actual}) is too long for ${Math.round(distanceKm)}km. Maximum expected: ${maxExpected}`,
      messageKey: 'validation.journey.tooSlow',
      severity: 'error',
    };
  }
  
  // Warning: on the fast side
  if (actualMinutes < expected.minMinutes) {
    return {
      valid: true,
      message: `Journey time seems fast for this distance. Is this an express bus?`,
      messageKey: 'validation.journey.seemsFast',
      severity: 'warning',
    };
  }
  
  // Warning: on the slow side
  if (actualMinutes > expected.maxMinutes) {
    return {
      valid: true,
      message: `Journey time seems slow for this distance. Does this bus have many stops?`,
      messageKey: 'validation.journey.seemsSlow',
      severity: 'warning',
    };
  }
  
  return { valid: true };
}

/**
 * Validate complete journey with distance-based time check
 */
export function validateJourney(journey: JourneyValidationInput): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Validate origin
  const originResult = validateLocationVerified(journey.origin);
  if (!originResult.valid) {
    results.push({ ...originResult, message: `Origin: ${originResult.message}` });
  }
  
  // Validate destination
  const destResult = validateLocationVerified(journey.destination);
  if (!destResult.valid) {
    results.push({ ...destResult, message: `Destination: ${destResult.message}` });
  }
  
  // Validate different locations
  if (journey.origin.name && journey.destination.name) {
    const diffResult = validateDifferentLocations(journey.origin, journey.destination);
    if (!diffResult.valid) {
      results.push(diffResult);
    }
  }
  
  // Validate times if both provided
  if (journey.departureTime && journey.arrivalTime) {
    // If we have coordinates, do distance-based validation
    if (
      journey.origin.latitude !== undefined &&
      journey.origin.longitude !== undefined &&
      journey.destination.latitude !== undefined &&
      journey.destination.longitude !== undefined
    ) {
      const distance = calculateDistance(
        journey.origin.latitude,
        journey.origin.longitude,
        journey.destination.latitude,
        journey.destination.longitude
      );
      
      const durationResult = validateDurationForDistance(
        journey.departureTime,
        journey.arrivalTime,
        distance
      );
      
      if (!durationResult.valid || durationResult.severity === 'warning') {
        results.push(durationResult);
      }
    } else {
      // No coordinates, just validate basic time logic
      const timeResult = validateArrivalAfterDeparture(
        journey.departureTime,
        journey.arrivalTime
      );
      if (!timeResult.valid || timeResult.severity === 'warning') {
        results.push(timeResult);
      }
    }
  }
  
  return results;
}

// ============================================================================
// STOP VALIDATIONS
// ============================================================================

/**
 * Validate that stop times are in sequential order
 */
export function validateStopSequence(stops: StopValidationInput[]): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  if (stops.length < 2) return results;
  
  // Sort by order
  const sortedStops = [...stops].sort((a, b) => a.order - b.order);
  
  for (let i = 1; i < sortedStops.length; i++) {
    const prevStop = sortedStops[i - 1];
    const currStop = sortedStops[i];
    
    // Check departure of previous against arrival of current
    const prevTime = prevStop.departureTime || prevStop.arrivalTime;
    const currTime = currStop.arrivalTime || currStop.departureTime;
    
    if (prevTime && currTime) {
      const prevMinutes = parseTimeToMinutes(prevTime);
      const currMinutes = parseTimeToMinutes(currTime);
      
      // Handle overnight (simple check - if current is much smaller, it's overnight)
      const isOvernight = currMinutes < prevMinutes - 120; // Allow 2hr buffer for overnight
      
      if (!isOvernight && currMinutes <= prevMinutes) {
        results.push({
          valid: false,
          message: `Stop ${currStop.order} (${currStop.name}) time must be after stop ${prevStop.order} (${prevStop.name})`,
          messageKey: 'validation.stop.outOfOrder',
          severity: 'error',
        });
      }
    }
  }
  
  return results;
}

/**
 * Validate no duplicate stop names
 */
export function validateUniqueStops(stops: StopValidationInput[]): ValidationResult[] {
  const results: ValidationResult[] = [];
  const seen = new Map<string, number>();
  
  for (const stop of stops) {
    const normalizedName = stop.name.trim().toLowerCase();
    if (seen.has(normalizedName)) {
      results.push({
        valid: false,
        message: `Duplicate stop: "${stop.name}" appears at positions ${seen.get(normalizedName)} and ${stop.order}`,
        messageKey: 'validation.stop.duplicate',
        severity: 'warning',
      });
    } else {
      seen.set(normalizedName, stop.order);
    }
  }
  
  return results;
}

// ============================================================================
// BUS NUMBER VALIDATION
// ============================================================================

/**
 * Validate bus number format
 * Common patterns: 27D, 127, 5A, M40, etc.
 */
export function validateBusNumber(busNumber: string | undefined | null): ValidationResult {
  if (!busNumber || busNumber.trim().length === 0) {
    return { valid: true }; // Optional in some contexts
  }
  
  const normalized = busNumber.trim();
  
  // Length check
  if (normalized.length > 10) {
    return {
      valid: false,
      message: 'Bus number is too long',
      messageKey: 'validation.bus.tooLong',
      severity: 'error',
    };
  }
  
  // Pattern check: Allow letters, numbers, spaces, hyphens
  if (!/^[A-Za-z0-9\s-]+$/.test(normalized)) {
    return {
      valid: false,
      message: 'Bus number contains invalid characters',
      messageKey: 'validation.bus.invalidChars',
      severity: 'error',
    };
  }
  
  return { valid: true };
}

// ============================================================================
// AGGREGATE VALIDATION HELPERS
// ============================================================================

/**
 * Check if any validation result has errors
 */
export function hasErrors(results: ValidationResult[]): boolean {
  return results.some(r => !r.valid && r.severity === 'error');
}

/**
 * Check if any validation result has warnings
 */
export function hasWarnings(results: ValidationResult[]): boolean {
  return results.some(r => r.severity === 'warning');
}

/**
 * Get all error messages
 */
export function getErrorMessages(results: ValidationResult[]): string[] {
  return results
    .filter(r => !r.valid && r.severity === 'error')
    .map(r => r.message || 'Unknown error');
}

/**
 * Get all warning messages
 */
export function getWarningMessages(results: ValidationResult[]): string[] {
  return results
    .filter(r => r.severity === 'warning')
    .map(r => r.message || 'Unknown warning');
}

// ============================================================================
// VALIDATION RESULT COMPONENT HELPER
// ============================================================================

/**
 * Combine multiple validation results
 */
export function combineValidations(...results: (ValidationResult | ValidationResult[])[]): ValidationResult[] {
  const combined: ValidationResult[] = [];
  
  for (const result of results) {
    if (Array.isArray(result)) {
      combined.push(...result);
    } else if (!result.valid || result.severity === 'warning') {
      combined.push(result);
    }
  }
  
  return combined;
}
