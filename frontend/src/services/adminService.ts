import { logger } from '../utils/logger';
import axios from 'axios';
import type { RouteContribution, ImageContribution } from '../types/contributionTypes';
import AuthService from './authService';

// API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Preprod API URL for syncing settings to preprod environment
const PREPROD_API_URL = import.meta.env.VITE_PREPROD_API_URL || 'https://perundhu-backend-preprod-1032721240281.asia-south1.run.app';

// Session storage keys for admin auth
const ADMIN_AUTH_KEY = 'admin_auth_credentials';

// Integration result types
export interface IntegrationResult {
  manualIntegrationRequired?: boolean;
  message?: string;
  instructions?: string[];
  sqlExample?: string;
  recommendedAction?: string;
  error?: string;
  successCount?: number;
}

/**
 * Service to handle admin operations with HTTP Basic authentication
 */
const AdminService = {
  // Helper method to get admin authorization header
  getAuthHeader: (): string => {
    // First, check for Basic Auth credentials in session storage
    const basicAuthCredentials = sessionStorage.getItem(ADMIN_AUTH_KEY);
    if (basicAuthCredentials) {
      return `Basic ${basicAuthCredentials}`;
    }
    
    // Fallback to JWT token for backward compatibility
    const existingToken = AuthService.getToken();
    if (existingToken) {
      return `Bearer ${existingToken}`;
    }
    
    // Return development admin token as last resort
    return 'Bearer dev-admin-token';
  },

  // Route contribution methods
  getRouteContributions: async (): Promise<RouteContribution[]> => {
    const authHeader = AdminService.getAuthHeader();
    const response = await axios.get(`${API_URL}/api/admin/contributions/routes`, {
      headers: { Authorization: authHeader }
    });
    return response.data;
  },

  getPendingRouteContributions: async (): Promise<RouteContribution[]> => {
    const authHeader = AdminService.getAuthHeader();
    const response = await axios.get(`${API_URL}/api/admin/contributions/routes/pending`, {
      headers: { Authorization: authHeader }
    });
    return response.data;
  },

  approveRouteContribution: async (id: number): Promise<RouteContribution> => {
    const authHeader = AdminService.getAuthHeader();
    const response = await axios.post(
      `${API_URL}/api/admin/contributions/routes/${id}/approve`,
      {},
      { headers: { Authorization: authHeader } }
    );
    return response.data;
  },

  rejectRouteContribution: async (id: number, reason: string): Promise<RouteContribution> => {
    const authHeader = AdminService.getAuthHeader();
    const response = await axios.post(
      `${API_URL}/api/admin/contributions/routes/${id}/reject`, 
      { reason },
      { headers: { Authorization: authHeader } }
    );
    return response.data;
  },

  deleteRouteContribution: async (id: number): Promise<void> => {
    const authHeader = AdminService.getAuthHeader();
    await axios.delete(`${API_URL}/api/admin/contributions/routes/${id}`, {
      headers: { Authorization: authHeader }
    });
  },

  // Integration methods - for syncing approved contributions to main database
  integrateApprovedRoutes: async (): Promise<IntegrationResult> => {
    const authHeader = AdminService.getAuthHeader();
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/integration/approved-routes`,
        {},
        { headers: { Authorization: authHeader } }
      );
      return response.data;
    } catch {
      logger.error('Integration endpoint not available - using manual integration guidance');
      
      // Since the backend integration endpoint isn't available yet,
      // provide manual integration instructions
      return {
        manualIntegrationRequired: true,
        message: 'Backend integration endpoint not available. Manual integration required.',
        instructions: [
          '1. Check if routes have status "INTEGRATION_FAILED" due to missing data',
          '2. Routes need departure_time, arrival_time, and coordinates for integration',
          '3. Run the complete integration SQL script to fix data and integrate',
          '4. Use QUICK_INTEGRATION_FIX.md for the complete solution'
        ],
        sqlExample: `
-- Complete integration fix:
UPDATE route_contributions SET 
  departure_time = '08:00', arrival_time = '09:30',
  from_latitude = 9.4484, from_longitude = 77.8072,
  to_latitude = 9.5089, to_longitude = 78.0931,
  status = 'APPROVED'
WHERE id = 'c500a4dc-844f-4757-9f42-871663d2901f';

-- Then create bus route and mark as integrated...
        `,
        recommendedAction: 'Run complete_integration.sql script for instant fix'
      };
    }
  },

  integrateSpecificRoute: async (id: number): Promise<IntegrationResult> => {
    const authHeader = AdminService.getAuthHeader();
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/integration/route/${id}`,
        {},
        { headers: { Authorization: authHeader } }
      );
      return response.data;
    } catch {
      logger.error('Integration endpoint not available for specific route');
      throw new Error('Integration service not available for this route.');
    }
  },

  // Retry integration for a failed contribution
  retryIntegration: async (id: number): Promise<IntegrationResult> => {
    const authHeader = AdminService.getAuthHeader();
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/integration/integrate/${id}`,
        {},
        { headers: { Authorization: authHeader } }
      );
      return response.data;
    } catch (error) {
      logger.error(`Failed to retry integration for contribution ${id}:`, error);
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to retry integration. Please check the validation errors and try again.');
    }
  },

  getIntegrationStatus: async (): Promise<unknown> => {
    const authHeader = AdminService.getAuthHeader();
    try {
      const response = await axios.get(`${API_URL}/api/admin/integration/status`, {
        headers: { Authorization: authHeader }
      });
      return response.data;
    } catch {
      logger.error('Integration status endpoint not available');
      return { error: 'Integration status not available' };
    }
  },

  // Image contribution methods
  getImageContributions: async (): Promise<ImageContribution[]> => {
    const authHeader = AdminService.getAuthHeader();
    const response = await axios.get(`${API_URL}/api/admin/contributions/images`, {
      headers: { Authorization: authHeader }
    });
    return response.data;
  },

  getPendingImageContributions: async (): Promise<ImageContribution[]> => {
    const authHeader = AdminService.getAuthHeader();
    const response = await axios.get(`${API_URL}/api/admin/contributions/images/pending`, {
      headers: { Authorization: authHeader }
    });
    return response.data;
  },

  approveImageContribution: async (id: number): Promise<ImageContribution> => {
    const authHeader = AdminService.getAuthHeader();
    const response = await axios.post(
      `${API_URL}/api/admin/contributions/images/${id}/approve`,
      {},
      { headers: { Authorization: authHeader } }
    );
    return response.data;
  },

  rejectImageContribution: async (id: number, reason: string): Promise<ImageContribution> => {
    const authHeader = AdminService.getAuthHeader();
    const response = await axios.post(
      `${API_URL}/api/admin/contributions/images/${id}/reject`,
      { reason },
      { headers: { Authorization: authHeader }
    });
    return response.data;
  },

  deleteImageContribution: async (id: number): Promise<void> => {
    const authHeader = AdminService.getAuthHeader();
    await axios.delete(`${API_URL}/api/admin/contributions/images/${id}`, {
      headers: { Authorization: authHeader }
    });
  },

  // Get bus details by ID (for showing existing route info in stop contributions)
  getBusDetails: async (busId: number): Promise<{
    id: number;
    busNumber: string;
    busName?: string;
    fromLocation: string;
    toLocation: string;
    departureTime?: string;
    arrivalTime?: string;
    stops?: Array<{
      name: string;
      arrivalTime?: string;
      departureTime?: string;
      stopOrder: number;
    }>;
  } | null> => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/bus-schedules/buses/${busId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      // Also fetch stops for this bus
      let stops: Array<{name: string; arrivalTime?: string; departureTime?: string; stopOrder: number}> = [];
      try {
        const stopsResponse = await axios.get(`${API_URL}/api/v1/bus-schedules/buses/${busId}/stops/basic`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        stops = stopsResponse.data || [];
      } catch {
        logger.warn(`Could not fetch stops for bus ${busId}`);
      }
      
      const bus = response.data;
      return {
        id: bus.id,
        busNumber: bus.busNumber,
        busName: bus.busName,
        fromLocation: bus.fromLocation?.name || bus.fromLocationName,
        toLocation: bus.toLocation?.name || bus.toLocationName,
        departureTime: bus.departureTime,
        arrivalTime: bus.arrivalTime,
        stops: stops
      };
    } catch (error) {
      logger.error(`Failed to fetch bus details for ID ${busId}:`, error);
      return null;
    }
  },

  // System settings methods
  getFeatureFlags: async (): Promise<Record<string, boolean>> => {
    const authHeader = AdminService.getAuthHeader();
    try {
      const response = await axios.get(`${API_URL}/api/admin/settings/feature-flags`, {
        headers: { Authorization: authHeader }
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch feature flags from backend', error);
      throw error;
    }
  },

  updateFeatureFlags: async (flags: Record<string, boolean>): Promise<{
    success: boolean;
    flags: Record<string, boolean>;
    timestamp: string;
  }> => {
    const authHeader = AdminService.getAuthHeader();
    try {
      const response = await axios.put(
        `${API_URL}/api/admin/settings/feature-flags`,
        flags,
        { headers: { Authorization: authHeader } }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to update feature flags', error);
      throw error;
    }
  },

  resetFeatureFlags: async (): Promise<{
    success: boolean;
    flags: Record<string, boolean>;
    timestamp: string;
  }> => {
    const authHeader = AdminService.getAuthHeader();
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/settings/feature-flags/reset`,
        {},
        { headers: { Authorization: authHeader } }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to reset feature flags', error);
      throw error;
    }
  },

  getAllSettings: async (): Promise<Array<{
    id: number;
    settingKey: string;
    settingValue: string;
    category: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  }>> => {
    const authHeader = AdminService.getAuthHeader();
    try {
      const response = await axios.get(`${API_URL}/api/admin/settings`, {
        headers: { Authorization: authHeader }
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch all settings', error);
      throw error;
    }
  },

  updateSetting: async (key: string, value: string): Promise<{
    id: number;
    settingKey: string;
    settingValue: string;
    category: string;
    description: string;
  }> => {
    const authHeader = AdminService.getAuthHeader();
    try {
      const response = await axios.put(
        `${API_URL}/api/admin/settings/key/${encodeURIComponent(key)}`,
        { value },
        { headers: { Authorization: authHeader } }
      );
      return response.data;
    } catch (error) {
      logger.error(`Failed to update setting ${key}`, error);
      throw error;
    }
  },

  resetAllSettings: async (): Promise<{
    success: boolean;
    message: string;
    settings: Record<string, string>;
    timestamp: string;
  }> => {
    const authHeader = AdminService.getAuthHeader();
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/settings/reset`,
        {},
        { headers: { Authorization: authHeader } }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to reset all settings', error);
      throw error;
    }
  },

  /**
   * Sync feature flags to preprod environment
   * This allows pushing local feature flag changes to the preprod backend
   */
  syncFeatureFlagsToPreprod: async (flags: Record<string, boolean>): Promise<{
    success: boolean;
    flags: Record<string, boolean>;
    timestamp: string;
    environment: string;
  }> => {
    const authHeader = AdminService.getAuthHeader();
    try {
      logger.info('Syncing feature flags to preprod environment');
      const response = await axios.put(
        `${PREPROD_API_URL}/api/admin/settings/feature-flags`,
        flags,
        { 
          headers: { Authorization: authHeader },
          timeout: 30000 // 30 second timeout for cross-environment sync
        }
      );
      logger.info('Feature flags synced to preprod successfully');
      return {
        ...response.data,
        environment: 'preprod'
      };
    } catch (error) {
      logger.error('Failed to sync feature flags to preprod', error);
      throw error;
    }
  },

  /**
   * Get feature flags from preprod environment
   * This allows fetching the current state of feature flags in preprod
   */
  getFeatureFlagsFromPreprod: async (): Promise<Record<string, boolean>> => {
    const authHeader = AdminService.getAuthHeader();
    try {
      logger.info('Fetching feature flags from preprod environment');
      const response = await axios.get(`${PREPROD_API_URL}/api/admin/settings/feature-flags`, {
        headers: { Authorization: authHeader },
        timeout: 30000
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch feature flags from preprod', error);
      throw error;
    }
  },

  /**
   * Check if preprod backend is available
   */
  isPreprodAvailable: async (): Promise<boolean> => {
    try {
      const response = await axios.get(`${PREPROD_API_URL}/actuator/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch {
      logger.warn('Preprod backend not available');
      return false;
    }
  },

  /**
   * Get preprod API URL for display purposes
   */
  getPreprodApiUrl: (): string => {
    return PREPROD_API_URL;
  }
};

export default AdminService;