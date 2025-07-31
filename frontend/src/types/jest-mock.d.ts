// Custom type declarations for Jest mocks
import { AxiosResponse, AxiosRequestConfig } from 'axios';

// Extend Jest's mocking capabilities with proper TypeScript support
declare global {
  namespace jest {
    interface Mock<T = any, Y extends any[] = any[]> {
      mockImplementation(fn: (...args: Y) => T): this;
      mockResolvedValue(value: T): this;
      mockRejectedValue(value: any): this;
      mockResolvedValueOnce(value: T): this;
      mockRejectedValueOnce(value: any): this;
      mockReturnValue(value: T): this;
      mockReturnValueOnce(value: T): this;
    }
  }
}

// Add necessary type extensions for mocked API functions
declare module '*/services/api' {
  export const api: {
    get: jest.Mock<Promise<AxiosResponse>, [string, (AxiosRequestConfig | undefined)?]>;
    post: jest.Mock<Promise<AxiosResponse>, [string, any?, (AxiosRequestConfig | undefined)?]>;
  };
  
  export const apiClient: {
    get: jest.Mock<Promise<AxiosResponse>, [string, (AxiosRequestConfig | undefined)?]>;
    post: jest.Mock<Promise<AxiosResponse>, [string, any?, (AxiosRequestConfig | undefined)?]>;
  };
}

// Add type extensions for offline service
declare module '*/services/offlineService' {
  export const getLocationsOffline: jest.Mock<Promise<any[]>>;
  export const saveLocationsOffline: jest.Mock<Promise<boolean>, [any[]]>;
  export const saveLocationOffline: jest.Mock<Promise<boolean>>;
}