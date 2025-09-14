/**
 * Mock implementation of the environment utilities for e2e tests
 */

export const getEnv = (key: string): string => {
  switch (key) {
    case 'VITE_API_URL':
      return 'http://localhost:8080';
    case 'VITE_GOOGLE_MAPS_API_KEY':
      return 'test-api-key';
    case 'VITE_FEATURE_TRACKING':
      return 'true';
    case 'VITE_FEATURE_REWARDS':
      return 'true';
    case 'VITE_FEATURE_ANALYTICS':
      return 'true';
    default:
      return '';
  }
};

export const getFeatureFlag = (key: string, defaultValue: boolean = false): boolean => {
  const value = getEnv(key);
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
};

// Add a simple test to satisfy Jest's requirement
describe('Environment Mock', () => {
  it('should return correct environment values', () => {
    expect(getEnv('VITE_API_URL')).toBe('http://localhost:8080');
    expect(getEnv('VITE_GOOGLE_MAPS_API_KEY')).toBe('test-api-key');
    expect(getEnv('nonexistent')).toBe('');
  });

  it('should return correct feature flags', () => {
    expect(getFeatureFlag('VITE_FEATURE_TRACKING')).toBe(true);
    expect(getFeatureFlag('VITE_FEATURE_REWARDS')).toBe(true);
    expect(getFeatureFlag('nonexistent')).toBe(false);
    expect(getFeatureFlag('nonexistent', true)).toBe(true);
  });
});