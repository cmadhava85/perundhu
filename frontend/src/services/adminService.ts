import axios from 'axios';
import type { RouteContribution, ImageContribution } from '../types/contributionTypes';
import AuthService from './authService';

// Use empty base URL since Vite proxy handles /api routing
const API_URL = '';

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