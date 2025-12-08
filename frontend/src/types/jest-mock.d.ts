// Custom type declarations for Jest mocks
import { AxiosResponse, AxiosRequestConfig } from 'axios';

// Extend Jest's mocking capabilities with proper TypeScript support
declare global {
  namespace jest {
    interface Mock<T = unknown, Y extends unknown[] = unknown[]> {
      mockImplementation(fn: (...args: Y) => T): this;
      mockResolvedValue(value: T): this;
      mockRejectedValue(value: unknown): this;
      mockResolvedValueOnce(value: T): this;
      mockRejectedValueOnce(value: unknown): this;
      mockReturnValue(value: T): this;
      mockReturnValueOnce(value: T): this;
    }
  }
}

// Add necessary type extensions for mocked API functions
declare module '*/services/api' {
  export const api: {
    get: jest.Mock<Promise<AxiosResponse>, [string, (AxiosRequestConfig | undefined)?]>;
    post: jest.Mock<Promise<AxiosResponse>, [string, unknown?, (AxiosRequestConfig | undefined)?]>;
  };
  
  export const apiClient: {
    get: jest.Mock<Promise<AxiosResponse>, [string, (AxiosRequestConfig | undefined)?]>;
    post: jest.Mock<Promise<AxiosResponse>, [string, unknown?, (AxiosRequestConfig | undefined)?]>;
  };
}

// Add type extensions for offline service
declare module '*/services/offlineService' {
  export const getLocationsOffline: jest.Mock<Promise<unknown[]>>;
  export const saveLocationsOffline: jest.Mock<Promise<boolean>, [unknown[]]>;
  export const saveLocationOffline: jest.Mock<Promise<boolean>>;
}