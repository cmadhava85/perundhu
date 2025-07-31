import { api } from './api';
// Fix the import path to ensure it resolves correctly
import type { RouteContribution, ImageContribution } from '../types/contributionTypes';

/**
 * Service for admin operations on contributions
 * Updated to align with Java 17 backend implementation
 */
const AdminService = {
  // Route contribution methods
  getRouteContributions: async (): Promise<RouteContribution[]> => {
    const response = await api.get('/api/admin/contributions/routes');
    return response.data;
  },

  getPendingRouteContributions: async (): Promise<RouteContribution[]> => {
    const response = await api.get('/api/admin/contributions/routes/pending');
    return response.data;
  },

  approveRouteContribution: async (id: number, notes?: string): Promise<RouteContribution> => {
    const response = await api.post(`/api/admin/contributions/routes/${id}/approve`, 
      notes ? { notes } : undefined);
    return response.data;
  },

  rejectRouteContribution: async (id: number, notes?: string): Promise<RouteContribution> => {
    const response = await api.post(`/api/admin/contributions/routes/${id}/reject`, 
      notes ? { notes } : undefined);
    return response.data;
  },

  deleteRouteContribution: async (id: number): Promise<void> => {
    await api.delete(`/api/admin/contributions/routes/${id}`);
  },

  // Image contribution methods
  getImageContributions: async (): Promise<ImageContribution[]> => {
    const response = await api.get('/api/admin/contributions/images');
    return response.data;
  },

  getPendingImageContributions: async (): Promise<ImageContribution[]> => {
    const response = await api.get('/api/admin/contributions/images/pending');
    return response.data;
  },

  approveImageContribution: async (id: number, notes?: string): Promise<ImageContribution> => {
    const response = await api.post(`/api/admin/contributions/images/${id}/approve`, 
      notes ? { notes } : undefined);
    return response.data;
  },

  rejectImageContribution: async (id: number, reason?: string): Promise<ImageContribution> => {
    const response = await api.post(`/api/admin/contributions/images/${id}/reject`, 
      reason ? { reason } : undefined);
    return response.data;
  },

  deleteImageContribution: async (id: number): Promise<void> => {
    await api.delete(`/api/admin/contributions/images/${id}`);
  },

  /**
   * Update status for an image contribution with action pattern matching
   * Aligns with the Java 17 backend implementation using ContributionAction record
   */
  updateImageContributionStatus: async (
    id: number, 
    action: 'APPROVE' | 'REJECT', 
    notes?: string
  ): Promise<ImageContribution> => {
    const response = await api.post(
      `/api/admin/contributions/images/${id}/status`, 
      { action, notes }
    );
    return response.data;
  },

  /**
   * Get admin dashboard statistics
   */
  getAdminStats: async (): Promise<Record<string, any>> => {
    const response = await api.get('/api/admin/contributions/stats');
    return response.data;
  }
};

export default AdminService;