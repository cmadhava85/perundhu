/**
 * Device ID utility for anonymous tracking
 * Generates and stores a unique device identifier for audit trail
 */

const DEVICE_ID_KEY = 'perundhu_device_id';

/**
 * Gets or creates a unique device ID for this browser/device
 * Used for tracking anonymous contributions and audit trails
 * 
 * @returns A unique device identifier in format: device_timestamp_random
 */
export const getOrCreateDeviceId = (): string => {
  // Try to retrieve existing device ID
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    // Generate new unique device ID if not found
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 11);
    deviceId = `device_${timestamp}_${random}`;
    
    // Store it for future use
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
};

/**
 * Clears the device ID (e.g., on logout or reset)
 */
export const clearDeviceId = (): void => {
  localStorage.removeItem(DEVICE_ID_KEY);
};

/**
 * Gets the current device ID without creating a new one
 * Returns null if no device ID exists yet
 */
export const getDeviceId = (): string | null => {
  return localStorage.getItem(DEVICE_ID_KEY);
};
