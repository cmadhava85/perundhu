/**
 * Mock version of environment.ts for tests
 */

/**
 * Mock implementation of getFeatureFlag that always returns true
 */
export const getFeatureFlag = (_defaultValue: boolean): boolean => {
  return true;
};