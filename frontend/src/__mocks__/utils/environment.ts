/**
 * Mock implementation of environment utilities for testing
 */

/**
 * Mock implementation that always returns the default value
 */
export const getFeatureFlag = (_key: string, defaultValue: boolean): boolean => {
  return defaultValue;
};