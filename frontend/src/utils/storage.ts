/**
 * Utility functions for handling browser localStorage
 * Provides type safety and error handling
 */

/**
 * Save data to localStorage with error handling
 * 
 * @param key The key to store the data under
 * @param data The data to store
 * @returns true if saved successfully, false otherwise
 */
export const saveToStorage = <T>(key: string, data: T): boolean => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Load data from localStorage with error handling
 * 
 * @param key The key to retrieve data from
 * @param defaultValue Default value to return if the key doesn't exist or on error
 * @returns The stored data or defaultValue
 */
export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) {
      return defaultValue;
    }
    
    return JSON.parse(serialized) as T;
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
    return defaultValue;
  }
};

/**
 * Remove data from localStorage with error handling
 * 
 * @param key The key to remove
 * @returns true if removed successfully, false otherwise
 */
export const removeFromStorage = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Clear all data from localStorage with error handling
 * 
 * @returns true if cleared successfully, false otherwise
 */
export const clearStorage = (): boolean => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};