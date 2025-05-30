/**
 * This is a global mock for axios used in tests
 */

const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() }
  }
};

// Mock the default export
const axios = {
  create: jest.fn().mockReturnValue(mockAxiosInstance),
  get: jest.fn(),
  post: jest.fn(),
  defaults: { baseURL: '' },
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() }
  }
};

export default axios;

// Export the instance for test to access
export { mockAxiosInstance };