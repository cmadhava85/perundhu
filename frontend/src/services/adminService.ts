import axios from 'axios';
// Fix the import path to ensure it resolves correctly
import type { RouteContribution, ImageContribution } from '../types/contributionTypes';

// Using process.env now that it's defined in the Vite config
const API_URL = process.env.NODE_ENV === 'test' ? '' : (process.env.VITE_API_URL || '');

/**
 * Service for admin operations on contributions
 */
const AdminService = {
  // Route contribution methods
  getRouteContributions: async (): Promise<RouteContribution[]> => {
    const response = await axios.get(`${API_URL}/api/admin/contributions/routes`);
    return response.data;
  },

  getPendingRouteContributions: async (): Promise<RouteContribution[]> => {
    const response = await axios.get(`${API_URL}/api/admin/contributions/routes/pending`);
    return response.data;
  },

  approveRouteContribution: async (id: number): Promise<RouteContribution> => {
    const response = await axios.post(`${API_URL}/api/admin/contributions/routes/${id}/approve`);
    return response.data;
  },

  rejectRouteContribution: async (id: number, reason: string): Promise<RouteContribution> => {
    const response = await axios.post(`${API_URL}/api/admin/contributions/routes/${id}/reject`, 
      { reason });
    return response.data;
  },

  deleteRouteContribution: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/api/admin/contributions/routes/${id}`);
  },

  // Image contribution methods
  getImageContributions: async (): Promise<ImageContribution[]> => {
    const response = await axios.get(`${API_URL}/api/admin/contributions/images`);
    return response.data;
  },

  getPendingImageContributions: async (): Promise<ImageContribution[]> => {
    const response = await axios.get(`${API_URL}/api/admin/contributions/images/pending`);
    return response.data;
  },

  approveImageContribution: async (id: number): Promise<ImageContribution> => {
    const response = await axios.post(`${API_URL}/api/admin/contributions/images/${id}/approve`);
    return response.data;
  },

  rejectImageContribution: async (id: number, reason: string): Promise<ImageContribution> => {
    const response = await axios.post(`${API_URL}/api/admin/contributions/images/${id}/reject`, 
      { reason });
    return response.data;
  },

  deleteImageContribution: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/api/admin/contributions/images/${id}`);
  }
};

export default AdminService;