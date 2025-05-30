/**
 * Mock version of environment.ts for tests
 */

/**
 * Mock implementation of getFeatureFlag that always returns the default value
 */
export const getFeatureFlag = (key: string, defaultValue: boolean): boolean => {
  return defaultValue;
};