/**
 * Mock environment variables utility for Jest tests
 */

// Define the interface to match the real implementation
interface EnvVars {
  VITE_GOOGLE_MAPS_API_KEY: string;
  VITE_PERUNDHU_MAP_ID: string;
  VITE_ENABLE_MAP: string;
  [key: string]: string; // Add index signature to allow string indexing
}

// Default mock values for test environment
const mockEnvVars: EnvVars = {
  VITE_GOOGLE_MAPS_API_KEY: 'TEST_GOOGLE_MAPS_API_KEY',
  VITE_PERUNDHU_MAP_ID: 'TEST_MAP_ID',
  VITE_ENABLE_MAP: 'false',
};

/**
 * Mock implementation of getEnv that doesn't rely on import.meta.env
 */
export const getEnv = (key: string): string => {
  return mockEnvVars[key] || '';
};