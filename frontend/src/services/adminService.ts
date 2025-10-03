import axios from 'axios';
import type { RouteContribution, ImageContribution } from '../types/contributionTypes';
import AuthService from './authService';

// Direct API URL configuration
const API_URL = 'http://localhost:8080';

/**
 * Service to handle admin operations with development admin authentication
 */
const AdminService = {
  // Helper method to get admin token for development
  getAdminToken: (): string => {
    // For development, use a special admin token that the MockJwtDecoder will recognize
    const existingToken = AuthService.getToken();
    if (existingToken) {
      return existingToken;
    }
    // Return development admin token
    return 'dev-admin-token';
  },

  // Route contribution methods
  getRouteContributions: async (): Promise<RouteContribution[]> => {
    const token = AdminService.getAdminToken();
    const response = await axios.get(`${API_URL}/api/admin/contributions/routes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getPendingRouteContributions: async (): Promise<RouteContribution[]> => {
    const token = AdminService.getAdminToken();
    const response = await axios.get(`${API_URL}/api/admin/contributions/routes/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  approveRouteContribution: async (id: number): Promise<RouteContribution> => {
    const token = AdminService.getAdminToken();
    const response = await axios.post(
      `${API_URL}/api/admin/contributions/routes/${id}/approve`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  rejectRouteContribution: async (id: number, reason: string): Promise<RouteContribution> => {
    const token = AdminService.getAdminToken();
    const response = await axios.post(
      `${API_URL}/api/admin/contributions/routes/${id}/reject`, 
      { reason },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  deleteRouteContribution: async (id: number): Promise<void> => {
    const token = AdminService.getAdminToken();
    await axios.delete(`${API_URL}/api/admin/contributions/routes/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Integration methods - for syncing approved contributions to main database
  integrateApprovedRoutes: async (): Promise<any> => {
    const token = AdminService.getAdminToken();
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/integration/approved-routes`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Integration endpoint not available - using manual integration guidance');
      
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

  integrateSpecificRoute: async (id: number): Promise<any> => {
    const token = AdminService.getAdminToken();
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/integration/route/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Integration endpoint not available for specific route');
      throw new Error('Integration service not available for this route.');
    }
  },

  getIntegrationStatus: async (): Promise<any> => {
    const token = AdminService.getAdminToken();
    try {
      const response = await axios.get(`${API_URL}/api/admin/integration/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Integration status endpoint not available');
      return { error: 'Integration status not available' };
    }
  },

  // Image contribution methods
  getImageContributions: async (): Promise<ImageContribution[]> => {
    const token = AdminService.getAdminToken();
    const response = await axios.get(`${API_URL}/api/admin/contributions/images`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getPendingImageContributions: async (): Promise<ImageContribution[]> => {
    const token = AdminService.getAdminToken();
    const response = await axios.get(`${API_URL}/api/admin/contributions/images/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  approveImageContribution: async (id: number): Promise<ImageContribution> => {
    const token = AdminService.getAdminToken();
    const response = await axios.post(
      `${API_URL}/api/admin/contributions/images/${id}/approve`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  rejectImageContribution: async (id: number, reason: string): Promise<ImageContribution> => {
    const token = AdminService.getAdminToken();
    const response = await axios.post(
      `${API_URL}/api/admin/contributions/images/${id}/reject`,
      { reason },
      { headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  deleteImageContribution: async (id: number): Promise<void> => {
    const token = AdminService.getAdminToken();
    await axios.delete(`${API_URL}/api/admin/contributions/images/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};

export default AdminService;