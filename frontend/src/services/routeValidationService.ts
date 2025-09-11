import { GeocodingService } from './geocodingService';

/**
 * Comprehensive validation service for route contributions
 */
export class RouteValidationService {
  
  /**
   * Validate a complete route contribution
   */
  static async validateRouteContribution(data: any): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Bus identification validation (either bus number OR route name required)
    const busIdentificationResult = this.validateBusIdentification(data);
    if (!busIdentificationResult.isValid) {
      errors.push(...busIdentificationResult.errors);
    }

    // 2. Origin and destination validation (mandatory)
    const locationResult = this.validateOriginDestination(data);
    if (!locationResult.isValid) {
      errors.push(...locationResult.errors);
    }

    // 3. Timing validation (either departure OR arrival time required)
    const timingResult = this.validateTiming(data);
    if (!timingResult.isValid) {
      errors.push(...timingResult.errors);
    }
    warnings.push(...timingResult.warnings || []);

    // 4. Stop validation with route checking
    if (data.detailedStops && data.detailedStops.length > 0) {
      const stopsResult = await this.validateStops(data);
      if (!stopsResult.isValid) {
        errors.push(...stopsResult.errors);
      }
      warnings.push(...stopsResult.warnings || []);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate bus identification (either bus number OR route name required)
   */
  private static validateBusIdentification(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const busNumber = data.busNumber?.trim();
    const routeName = data.route?.trim() || data.busName?.trim();

    if (!busNumber && !routeName) {
      errors.push('Either Bus Number or Route Name must be provided');
      return { isValid: false, errors };
    }

    // Validate bus number format if provided
    if (busNumber) {
      if (busNumber.length < 2) {
        errors.push('Bus Number must be at least 2 characters long');
      }
      if (!/^[A-Z0-9\-\s]+$/i.test(busNumber)) {
        errors.push('Bus Number contains invalid characters. Use only letters, numbers, hyphens, and spaces');
      }
    }

    // Validate route name if provided
    if (routeName) {
      if (routeName.length < 3) {
        errors.push('Route Name must be at least 3 characters long');
      }
      if (routeName.length > 100) {
        errors.push('Route Name must be less than 100 characters');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate origin and destination (mandatory)
   */
  private static validateOriginDestination(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const origin = data.origin?.trim() || data.fromLocationName?.trim();
    const destination = data.destination?.trim() || data.toLocationName?.trim();

    if (!origin) {
      errors.push('Origin location is mandatory');
    } else if (origin.length < 2) {
      errors.push('Origin location must be at least 2 characters long');
    }

    if (!destination) {
      errors.push('Destination location is mandatory');
    } else if (destination.length < 2) {
      errors.push('Destination location must be at least 2 characters long');
    }

    // Check if origin and destination are the same
    if (origin && destination && origin.toLowerCase() === destination.toLowerCase()) {
      errors.push('Origin and destination cannot be the same');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate timing (either departure OR arrival time required)
   */
  private static validateTiming(data: any): {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const departureTime = data.departureTime?.trim();
    const arrivalTime = data.arrivalTime?.trim();

    // At least one time must be provided
    if (!departureTime && !arrivalTime) {
      errors.push('Either Departure Time or Arrival Time must be provided');
      return { isValid: false, errors };
    }

    // Validate time format if provided
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (departureTime && !timeRegex.test(departureTime)) {
      errors.push('Departure Time must be in HH:MM format (24-hour)');
    }

    if (arrivalTime && !timeRegex.test(arrivalTime)) {
      errors.push('Arrival Time must be in HH:MM format (24-hour)');
    }

    // If both times are provided, validate logical sequence
    if (departureTime && arrivalTime && timeRegex.test(departureTime) && timeRegex.test(arrivalTime)) {
      const depMinutes = this.timeToMinutes(departureTime);
      const arrMinutes = this.timeToMinutes(arrivalTime);
      
      if (depMinutes >= arrMinutes) {
        // Could be overnight journey
        warnings.push('Arrival time is before departure time. Please verify if this is an overnight journey.');
      }

      // Calculate journey duration
      let duration = arrMinutes - depMinutes;
      if (duration < 0) duration += 24 * 60; // Handle overnight

      if (duration < 15) {
        warnings.push('Journey duration is very short (less than 15 minutes). Please verify timing.');
      } else if (duration > 24 * 60) {
        errors.push('Journey duration cannot exceed 24 hours');
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate stops are in logical route order using OpenStreetMap API
   */
  private static async validateStops(data: any): Promise<{
    isValid: boolean;
    errors: string[];
    warnings?: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const stops = data.detailedStops || [];
    const origin = data.origin?.trim() || data.fromLocationName?.trim();
    const destination = data.destination?.trim() || data.toLocationName?.trim();

    if (!origin || !destination) {
      return { isValid: true, errors }; // Skip stop validation if origin/destination not set
    }

    try {
      // Get coordinates for origin and destination
      const originResults = await GeocodingService.searchLocations(origin, 1);
      const destResults = await GeocodingService.searchLocations(destination, 1);

      if (originResults.length === 0) {
        warnings.push(`Could not find coordinates for origin: ${origin}`);
        return { isValid: true, errors, warnings };
      }

      if (destResults.length === 0) {
        warnings.push(`Could not find coordinates for destination: ${destination}`);
        return { isValid: true, errors, warnings };
      }

      const originCoords = { lat: originResults[0].latitude, lng: originResults[0].longitude };
      const destCoords = { lat: destResults[0].latitude, lng: destResults[0].longitude };

      // Validate each stop
      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];
        const stopName = stop.name?.trim();

        if (!stopName) {
          errors.push(`Stop ${i + 1}: Stop name is required`);
          continue;
        }

        // Get coordinates for the stop
        const stopResults = await GeocodingService.searchLocations(stopName, 1);
        
        if (stopResults.length === 0) {
          warnings.push(`Stop ${i + 1}: Could not find coordinates for "${stopName}"`);
          continue;
        }

        const stopCoords = { lat: stopResults[0].latitude, lng: stopResults[0].longitude };

        // Check if stop is roughly on the route
        const routeValidation = this.validateStopOnRoute(originCoords, destCoords, stopCoords, stopName);
        if (!routeValidation.isValid) {
          warnings.push(`Stop ${i + 1}: ${routeValidation.message}`);
        }

        // Validate stop timing if provided
        if (stop.arrivalTime || stop.departureTime) {
          const timingValidation = this.validateStopTiming(stop, i + 1);
          if (!timingValidation.isValid) {
            errors.push(...timingValidation.errors);
          }
        }
      }

      // Validate stop sequence timing
      const sequenceValidation = this.validateStopSequence(stops, data.departureTime, data.arrivalTime);
      if (!sequenceValidation.isValid) {
        errors.push(...sequenceValidation.errors);
      }
      warnings.push(...sequenceValidation.warnings || []);

    } catch (error) {
      console.error('Stop validation error:', error);
      warnings.push('Could not validate stop locations due to geocoding service issues');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Check if a stop is reasonably on the route between origin and destination
   */
  private static validateStopOnRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    stop: { lat: number; lng: number },
    stopName: string
  ): { isValid: boolean; message: string } {
    
    // Calculate distances
    const originToStop = this.calculateDistance(origin.lat, origin.lng, stop.lat, stop.lng);
    const stopToDestination = this.calculateDistance(stop.lat, stop.lng, destination.lat, destination.lng);
    const directDistance = this.calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);

    // Check if stop creates a reasonable detour
    const totalViaStop = originToStop + stopToDestination;
    const detourRatio = totalViaStop / directDistance;

    // Allow up to 50% detour for reasonable stops
    if (detourRatio > 1.5) {
      return {
        isValid: false,
        message: `"${stopName}" appears to be significantly off the direct route (${Math.round((detourRatio - 1) * 100)}% detour)`
      };
    }

    // Check if stop is too close to origin or destination
    if (originToStop < 5) {
      return {
        isValid: false,
        message: `"${stopName}" is very close to the origin (${Math.round(originToStop)}km)`
      };
    }

    if (stopToDestination < 5) {
      return {
        isValid: false,
        message: `"${stopName}" is very close to the destination (${Math.round(stopToDestination)}km)`
      };
    }

    return { isValid: true, message: 'Stop location is valid' };
  }

  /**
   * Validate individual stop timing
   */
  private static validateStopTiming(stop: any, stopNumber: number): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (stop.arrivalTime && !timeRegex.test(stop.arrivalTime)) {
      errors.push(`Stop ${stopNumber}: Arrival time must be in HH:MM format`);
    }

    if (stop.departureTime && !timeRegex.test(stop.departureTime)) {
      errors.push(`Stop ${stopNumber}: Departure time must be in HH:MM format`);
    }

    // If both times provided, departure should be after arrival
    if (stop.arrivalTime && stop.departureTime && 
        timeRegex.test(stop.arrivalTime) && timeRegex.test(stop.departureTime)) {
      
      const arrMinutes = this.timeToMinutes(stop.arrivalTime);
      const depMinutes = this.timeToMinutes(stop.departureTime);

      if (depMinutes < arrMinutes) {
        errors.push(`Stop ${stopNumber}: Departure time cannot be before arrival time`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate stop sequence timing
   */
  private static validateStopSequence(stops: any[], routeDepartureTime?: string, routeArrivalTime?: string): {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (stops.length === 0) return { isValid: true, errors };

    // Check timing sequence between consecutive stops
    for (let i = 0; i < stops.length - 1; i++) {
      const currentStop = stops[i];
      const nextStop = stops[i + 1];

      if (currentStop.departureTime && nextStop.arrivalTime) {
        const currentDepMinutes = this.timeToMinutes(currentStop.departureTime);
        const nextArrMinutes = this.timeToMinutes(nextStop.arrivalTime);

        if (nextArrMinutes <= currentDepMinutes) {
          errors.push(`Stop sequence error: Stop ${i + 2} arrival time must be after Stop ${i + 1} departure time`);
        }
      }
    }

    // Check first stop against route departure time
    if (routeDepartureTime && stops[0]?.arrivalTime) {
      const routeDepMinutes = this.timeToMinutes(routeDepartureTime);
      const firstStopArrMinutes = this.timeToMinutes(stops[0].arrivalTime);

      if (firstStopArrMinutes <= routeDepMinutes) {
        errors.push('First stop arrival time must be after route departure time');
      }
    }

    // Check last stop against route arrival time
    if (routeArrivalTime && stops[stops.length - 1]?.departureTime) {
      const routeArrMinutes = this.timeToMinutes(routeArrivalTime);
      const lastStopDepMinutes = this.timeToMinutes(stops[stops.length - 1].departureTime);

      if (lastStopDepMinutes >= routeArrMinutes) {
        errors.push('Last stop departure time must be before route arrival time');
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Convert time string to minutes since midnight
   */
  private static timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
}