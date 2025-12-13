/**
 * Service for finding nearby bus stops and locations based on GPS coordinates
 */

import { api } from './api';
import { getCurrentPosition, getGeolocationSupport, calculateDistance } from './geolocation';
import { logger } from '../utils/logger';
import type { Location as AppLocation } from '../types';

export interface NearbyLocationResult {
  location: AppLocation;
  distance: number; // Distance in km
  source: 'database' | 'nominatim';
}

/**
 * Find the nearest bus stops/locations from the database based on coordinates
 */
export const findNearestLocationsFromDatabase = async (
  latitude: number,
  longitude: number,
  limit: number = 5
): Promise<NearbyLocationResult[]> => {
  try {
    // First, get all locations from the database
    const response = await api.get('/api/v1/bus-schedules/locations');
    const locations: AppLocation[] = response.data || [];

    if (locations.length === 0) {
      logger.warn('No locations in database to search');
      return [];
    }

    // Calculate distance for each location and filter those with valid coordinates
    const locationsWithDistance = locations
      .filter(loc => loc.latitude && loc.longitude && loc.latitude !== 0 && loc.longitude !== 0)
      .map(loc => ({
        location: loc,
        distance: calculateDistance(latitude, longitude, loc.latitude, loc.longitude),
        source: 'database' as const
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    logger.debug(`Found ${locationsWithDistance.length} nearby locations from database`);
    return locationsWithDistance;
  } catch (error) {
    logger.error('Error finding nearest locations from database:', error);
    return [];
  }
};

/**
 * Reverse geocode coordinates to get city/place name from Nominatim
 */
export const reverseGeocodeNominatim = async (
  latitude: number,
  longitude: number
): Promise<NearbyLocationResult | null> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Perundhu-Bus-Tracker/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim reverse geocode failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !data.address) {
      return null;
    }

    // Extract the most relevant place name
    const address = data.address;
    const placeName = 
      address.bus_stop ||
      address.bus_station ||
      address.village ||
      address.town ||
      address.city ||
      address.suburb ||
      address.county ||
      address.state_district ||
      data.display_name?.split(',')[0] ||
      'Unknown Location';

    // Create a location object from the response
    const location: AppLocation = {
      id: -1, // Negative ID indicates it's from Nominatim, not database
      name: placeName,
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lon),
      source: 'nominatim'
    };

    logger.debug(`Reverse geocoded to: ${placeName}`);
    
    return {
      location,
      distance: 0,
      source: 'nominatim'
    };
  } catch (error) {
    logger.error('Error in Nominatim reverse geocoding:', error);
    return null;
  }
};

/**
 * Get user's current location and find the nearest bus stop or city
 * Prioritizes database locations over Nominatim results
 */
export const findNearbyLocationFromGPS = async (): Promise<{
  success: boolean;
  location?: AppLocation;
  error?: string;
  distance?: number;
  source?: 'database' | 'nominatim' | 'gps-city';
}> => {
  // Check if geolocation is supported
  if (!getGeolocationSupport()) {
    return {
      success: false,
      error: 'Geolocation is not supported by your browser'
    };
  }

  try {
    // Get current position
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    
    logger.info(`GPS Position: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

    // Try to find nearest location from database first
    const databaseResults = await findNearestLocationsFromDatabase(latitude, longitude, 3);
    
    if (databaseResults.length > 0) {
      const nearest = databaseResults[0];
      
      // Only use database result if it's within 50km (reasonable bus travel distance)
      if (nearest.distance <= 50) {
        logger.info(`Found nearby location from database: ${nearest.location.name} (${nearest.distance.toFixed(1)}km)`);
        return {
          success: true,
          location: nearest.location,
          distance: nearest.distance,
          source: 'database'
        };
      }
    }

    // Fallback to Nominatim reverse geocoding
    const nominatimResult = await reverseGeocodeNominatim(latitude, longitude);
    
    if (nominatimResult) {
      // Try to match Nominatim result with database location
      const matchingDbLocation = await matchNominatimWithDatabase(nominatimResult.location.name);
      
      if (matchingDbLocation) {
        logger.info(`Matched Nominatim result with database: ${matchingDbLocation.name}`);
        return {
          success: true,
          location: matchingDbLocation,
          distance: calculateDistance(latitude, longitude, matchingDbLocation.latitude, matchingDbLocation.longitude),
          source: 'database'
        };
      }

      // Return Nominatim result if no database match
      logger.info(`Using Nominatim result: ${nominatimResult.location.name}`);
      return {
        success: true,
        location: nominatimResult.location,
        distance: 0,
        source: 'nominatim'
      };
    }

    return {
      success: false,
      error: 'Could not determine your location'
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
    
    // Handle specific geolocation errors
    if (error instanceof GeolocationPositionError) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          return {
            success: false,
            error: 'Location access was denied. Please enable location permissions.'
          };
        case error.POSITION_UNAVAILABLE:
          return {
            success: false,
            error: 'Location information is unavailable.'
          };
        case error.TIMEOUT:
          return {
            success: false,
            error: 'Location request timed out. Please try again.'
          };
      }
    }
    
    logger.error('Error getting location:', error);
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Try to match a place name from Nominatim with a database location
 */
const matchNominatimWithDatabase = async (placeName: string): Promise<AppLocation | null> => {
  try {
    const response = await api.get('/api/v1/bus-schedules/locations/autocomplete', {
      params: { q: placeName.trim() }
    });

    const locations: AppLocation[] = response.data || [];
    
    if (locations.length > 0) {
      // Find exact or close match
      const exactMatch = locations.find(
        loc => loc.name.toLowerCase() === placeName.toLowerCase()
      );
      
      if (exactMatch) {
        return exactMatch;
      }

      // Check if first result contains the place name
      if (locations[0].name.toLowerCase().includes(placeName.toLowerCase()) ||
          placeName.toLowerCase().includes(locations[0].name.toLowerCase())) {
        return locations[0];
      }
    }

    return null;
  } catch (error) {
    logger.error('Error matching with database:', error);
    return null;
  }
};

/**
 * Check if user's location permission is granted
 */
export const checkLocationPermission = async (): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> => {
  if (!getGeolocationSupport()) {
    return 'unknown';
  }

  try {
    if ('permissions' in navigator) {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state as 'granted' | 'denied' | 'prompt';
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
};
