/**
 * Geolocation service for handling location-based features
 */

type PositionCallback = (position: { latitude: number; longitude: number; accuracy: number }) => void;
type ErrorCallback = (error: { code: number; message: string }) => void;

/**
 * Check whether geolocation is supported in current browser
 */
export const getGeolocationSupport = (): boolean => {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
};

/**
 * Get the current user position (Promise-based version)
 * Returns native GeolocationPosition for compatibility with BusTracker
 */
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!getGeolocationSupport()) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (err) => reject(err),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Get the current user position (callback-based version)
 */
export const getCurrentPositionCallback = (
  success: PositionCallback, 
  error?: ErrorCallback
): void => {
  if (!getGeolocationSupport()) {
    if (error) {
      error({ code: 1, message: 'Geolocation is not supported by this browser' });
    }
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      success({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
    },
    (err) => {
      if (error) {
        error({
          code: err.code,
          message: err.message
        });
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }
  );
};

/**
 * Watch the user position for changes
 */
export const watchPosition = (
  update: PositionCallback, 
  error?: ErrorCallback
): number => {
  if (!getGeolocationSupport()) {
    if (error) {
      error({ code: 1, message: 'Geolocation is not supported by this browser' });
    }
    return -1;
  }
  
  return navigator.geolocation.watchPosition(
    (position) => {
      update({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
    },
    (err) => {
      if (error) {
        error({
          code: err.code,
          message: err.message
        });
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }
  );
};

/**
 * Stop watching position changes
 */
export const clearWatch = (watchId: number): void => {
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    navigator.geolocation.clearWatch(watchId);
  }
};

/**
 * Calculate distance between two sets of coordinates using the Haversine formula
 */
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

/**
 * Convert degrees to radians
 */
const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};