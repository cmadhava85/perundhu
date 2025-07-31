import axios from 'axios';
import type { AxiosInstance } from 'axios';

// Mock API instance for testing
const mockAxios: jest.Mocked<AxiosInstance> = axios.create() as jest.Mocked<AxiosInstance>;

// Set up common mock response methods
mockAxios.get = jest.fn();
mockAxios.post = jest.fn();
mockAxios.put = jest.fn();
mockAxios.delete = jest.fn();
mockAxios.head = jest.fn();

// Export for use in tests
export default mockAxios;

// Mock API constants
export const API_URL = 'http://test-api-url.com';