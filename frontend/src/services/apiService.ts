import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type {
  Bus, Stop, Location, BusLocationReport, BusLocation,
  RewardPoints, ConnectingRoute, RouteContribution, ImageContribution
} from '../types/apiTypes';

/**
 * Centralized API configuration and instance manager
 * This consolidates our previous scattered API implementations
 */
export class ApiService {
  private static instance: ApiService;
  // Change from private to protected to allow access in exported wrapper
  protected api: AxiosInstance;
  private isOfflineMode = false;
  private lastOnlineTime: Date | null = null;
  private offlineErrorHandlers: Array<() => void> = [];

  private constructor() {
    this.api = this.createApiInstance();
    this.setupInterceptors();
  }

  /**
   * Get singleton instance of ApiService
   */
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Creates a configured axios instance
   */
  private createApiInstance(): AxiosInstance {
    const baseUrl = this.getEnv('VITE_API_URL', 'http://localhost:8080');
    const apiUrl = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
    
    console.log(`Creating API instance with baseURL: ${apiUrl}`);
    
    return axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000
    });
  }

  /**
   * Helper to safely get environment variables in different environments
   */
  private getEnv(key: string, defaultValue: string): string {
    // Jest environment (Node.js)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
    
    // Vite environment (browser)
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key] as string;
    }
    
    return defaultValue;
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add timestamp to prevent caching
        config.params = {
          ...config.params,
          _: new Date().getTime()
        };
        
        // Add authorization header if available
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
          config.headers.Authorization = `Bearer ${authToken}`;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle network errors and trigger offline mode
        if (!error.response) {
          this.handleNetworkError();
          return Promise.reject(new Error('Network error - check your connection'));
        }
        
        // Handle API errors based on status code
        switch (error.response.status) {
          case 401:
            // Handle authentication error
            this.handleAuthError();
            break;
          case 403:
            // Handle authorization error
            break;
          case 429:
            // Handle rate limiting
            break;
          case 500:
            // Handle server error
            break;
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle network errors and switch to offline mode if needed
   */
  private handleNetworkError(): void {
    if (!this.isOfflineMode) {
      this.isOfflineMode = true;
      this.lastOnlineTime = new Date();
      
      // Notify all registered offline error handlers
      this.offlineErrorHandlers.forEach(handler => handler());
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(): void {
    // Clear auth token
    localStorage.removeItem('authToken');
    
    // Redirect to login page if needed
    // window.location.href = '/login';
  }

  /**
   * Register a handler for offline mode
   */
  public registerOfflineHandler(handler: () => void): void {
    this.offlineErrorHandlers.push(handler);
  }

  /**
   * Set offline mode status
   */
  public setOfflineMode(status: boolean): void {
    this.isOfflineMode = status;
    if (!status) {
      // Reconnected - clear last online time
      this.lastOnlineTime = null;
    } else if (!this.lastOnlineTime) {
      // Just went offline - record time
      this.lastOnlineTime = new Date();
    }
  }

  /**
   * Check if system is in offline mode
   */
  public isOffline(): boolean {
    return this.isOfflineMode;
  }

  /**
   * Get time since last online in minutes
   */
  public getMinutesSinceLastOnline(): number | null {
    if (!this.lastOnlineTime) return null;
    
    const diffMs = Date.now() - this.lastOnlineTime.getTime();
    return Math.floor(diffMs / 60000);
  }

  /**
   * Generic GET request method with type safety
   */
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.get(url, config);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Generic POST request method with type safety
   */
  public async post<T, D = unknown>(url: string, data: D, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Generic PUT request method with type safety
   */
  public async put<T, D = unknown>(url: string, data: D, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.put(url, data, config);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Generic DELETE request method with type safety
   */
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.delete(url, config);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Format error for better debugging
   */
  private formatError(error: unknown): Error {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response: { status: number; data?: { message?: string } } };
      // Server responded with error status
      const status = axiosError.response.status;
      const message = axiosError.response.data?.message || 'Unknown error';
      return new Error(`API Error ${status}: ${message}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      // Request was made but no response
      return new Error('Network error - no response from server');
    } else {
      // Error in request configuration
      return new Error(`Request error: ${(error as Error).message}`);
    }
  }

  // Type-safe API methods for different endpoints
  
  /**
   * Get all available locations
   */
  public async getLocations(): Promise<Location[]> {
    return this.get<Location[]>('/locations');
  }

  /**
   * Get destinations from a location
   */
  public async getDestinations(fromLocationId: number): Promise<Location[]> {
    return this.get<Location[]>(`/destinations?fromId=${fromLocationId}`);
  }

  /**
   * Get buses between locations
   */
  public async getBuses(fromId: number, toId: number, date?: string): Promise<Bus[]> {
    const dateParam = date ? `&date=${date}` : '';
    return this.get<Bus[]>(`/buses?fromId=${fromId}&toId=${toId}${dateParam}`);
  }

  /**
   * Get stops for a bus route
   */
  public async getStops(busId: number, fromId: number, toId: number): Promise<Stop[]> {
    return this.get<Stop[]>(`/stops?busId=${busId}&fromId=${fromId}&toId=${toId}`);
  }

  /**
   * Get current bus locations
   */
  public async getCurrentBusLocations(busIds?: number[]): Promise<BusLocation[]> {
    const queryParam = busIds?.length ? `?busIds=${busIds.join(',')}` : '';
    return this.get<BusLocation[]>(`/buses/locations${queryParam}`);
  }

  /**
   * Report a bus location
   */
  public async reportBusLocation(report: BusLocationReport): Promise<void> {
    return this.post<void>('/buses/location-report', report);
  }

  /**
   * Get connecting routes between locations
   */
  public async getConnectingRoutes(fromId: number, toId: number, date?: string): Promise<ConnectingRoute[]> {
    const dateParam = date ? `&date=${date}` : '';
    return this.get<ConnectingRoute[]>(`/connecting-routes?fromId=${fromId}&toId=${toId}${dateParam}`);
  }

  /**
   * Get user reward points
   */
  public async getUserRewardPoints(userId: string): Promise<RewardPoints> {
    return this.get<RewardPoints>(`/users/${userId}/rewards`);
  }

  /**
   * Submit a route contribution
   */
  public async submitRouteContribution(contribution: RouteContribution): Promise<void> {
    return this.post<void>('/contributions/route', contribution);
  }

  /**
   * Submit an image contribution
   */
  public async submitImageContribution(contribution: ImageContribution): Promise<void> {
    return this.post<void>('/contributions/image', contribution);
  }

  /**
   * Get the API instance (added for legacy compatibility)
   */
  public getApiInstance(): AxiosInstance {
    return this.api;
  }
}

// Export a singleton instance
export const apiService = ApiService.getInstance();
// Use the public getter method instead of direct property access
export const api = apiService.getApiInstance();