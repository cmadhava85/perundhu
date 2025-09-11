/**
 * Utility functions for geolocation and distance calculations
 */

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point (in degrees)
 * @param lon1 Longitude of first point (in degrees)
 * @param lat2 Latitude of second point (in degrees)
 * @param lon2 Longitude of second point (in degrees)
 * @returns Distance in kilometers
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  // Earth's radius in kilometers
  const R = 6371;
  
  // Convert degrees to radians
  const latDistance = toRadians(lat2 - lat1);
  const lonDistance = toRadians(lon2 - lon1);
  
  // Haversine formula
  const a = 
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Distance in kilometers
  return R * c;
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Get user's current position using the Geolocation API
 * @returns Promise that resolves to a GeolocationPosition object
 */
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  });
};

/**
 * Check if geolocation is supported by the browser
 * @returns boolean indicating if geolocation is supported
 */
export const getGeolocationSupport = (): boolean => {
  return 'geolocation' in navigator;
};

/**
 * Watch position changes using the Geolocation API
 * @param callback Function to call when position changes
 * @returns Watch ID that can be used to clear the watch
 */
export const watchPosition = (callback: (position: GeolocationPosition) => void): number => {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser');
  }
  
  return navigator.geolocation.watchPosition(callback, (error) => {
    console.error('Geolocation error:', error);
  }, {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 60000 // Cache position for 1 minute
  });
};

/**
 * Clear a position watch
 * @param watchId The watch ID returned by watchPosition
 */
export const clearWatch = (watchId: number): void => {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};