import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface Announcement {
  id?: number;
  uniqueId: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'NEW_FEATURE' | 'MAINTENANCE';
  titleKey: string;
  titleFallback: string;
  messageKey: string;
  messageFallback: string;
  link?: string;
  linkTextKey?: string;
  linkTextFallback?: string;
  isActive: boolean;
  isDismissible: boolean;
  priority: number;
  announcementCategory?: string;
  targetUsers: 'ALL' | 'ADMIN' | 'CONTRIBUTORS' | 'REGULAR_USERS';
  displayBanner: boolean;
  displayModal: boolean;
  startsAt?: string;
  expiresAt?: string;
  viewCount?: number;
  dismissCount?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  status: 'DRAFT' | 'PUBLISHED';
}

export interface AnnouncementStats {
  total: number;
  active: number;
  expired: number;
  upcoming: number;
  totalViews: number;
  totalDismisses: number;
}

const AnnouncementService = {
  // Public endpoints
  getActiveAnnouncements: async (): Promise<Announcement[]> => {
    try {
      const response = await axios.get(`${API_URL}/v1/announcements`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active announcements:', error);
      return [];
    }
  },

  getAnnouncementsByAudience: async (audience: string): Promise<Announcement[]> => {
    try {
      const response = await axios.get(`${API_URL}/v1/announcements/audience/${audience}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching announcements for audience ${audience}:`, error);
      return [];
    }
  },

  trackView: async (id: number): Promise<void> => {
    try {
      await axios.post(`${API_URL}/v1/announcements/${id}/view`);
    } catch (error) {
      console.error('Error tracking announcement view:', error);
    }
  },

  trackDismiss: async (id: number): Promise<void> => {
    try {
      await axios.post(`${API_URL}/v1/announcements/${id}/dismiss`);
    } catch (error) {
      console.error('Error tracking announcement dismiss:', error);
    }
  },

  // Admin endpoints
  getAllAnnouncements: async (): Promise<Announcement[]> => {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/admin/announcements`, {
        headers: { Authorization: authHeader }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all announcements:', error);
      return [];
    }
  },

  getAnnouncement: async (id: number): Promise<Announcement | null> => {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/admin/announcements/${id}`, {
        headers: { Authorization: authHeader }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching announcement:', error);
      return null;
    }
  },

  createAnnouncement: async (announcement: Announcement): Promise<Announcement | null> => {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.post(`${API_URL}/admin/announcements`, announcement, {
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  },

  updateAnnouncement: async (id: number, announcement: Announcement): Promise<Announcement | null> => {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.put(`${API_URL}/admin/announcements/${id}`, announcement, {
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  },

  deleteAnnouncement: async (id: number): Promise<boolean> => {
    try {
      const authHeader = getAuthHeader();
      await axios.delete(`${API_URL}/admin/announcements/${id}`, {
        headers: { Authorization: authHeader }
      });
      return true;
    } catch (error) {
      console.error('Error deleting announcement:', error);
      return false;
    }
  },

  publishAnnouncement: async (id: number): Promise<Announcement | null> => {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.post(`${API_URL}/admin/announcements/${id}/publish`, {}, {
        headers: { Authorization: authHeader }
      });
      return response.data;
    } catch (error) {
      console.error('Error publishing announcement:', error);
      throw error;
    }
  },

  unpublishAnnouncement: async (id: number): Promise<Announcement | null> => {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.post(`${API_URL}/admin/announcements/${id}/unpublish`, {}, {
        headers: { Authorization: authHeader }
      });
      return response.data;
    } catch (error) {
      console.error('Error unpublishing announcement:', error);
      throw error;
    }
  },

  getAnnouncementsByStatus: async (status: string): Promise<Announcement[]> => {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/admin/announcements/status/${status}`, {
        headers: { Authorization: authHeader }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching announcements with status ${status}:`, error);
      return [];
    }
  },

  getStatistics: async (): Promise<AnnouncementStats | null> => {
    try {
      const authHeader = getAuthHeader();
      const response = await axios.get(`${API_URL}/admin/announcements/stats`, {
        headers: { Authorization: authHeader }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching announcement statistics:', error);
      return null;
    }
  }
};

// Helper function to get auth header
function getAuthHeader(): string {
  // Check sessionStorage first (where AdminAuthContext stores credentials)
  const sessionCredentials = sessionStorage.getItem('admin_auth_credentials');
  if (sessionCredentials) {
    return `Basic ${sessionCredentials}`;
  }

  // Fall back to localStorage (legacy support)
  const basicAuthCredentials = localStorage.getItem('basicAuthCredentials');
  if (basicAuthCredentials) {
    return `Basic ${basicAuthCredentials}`;
  }
  
  const token = localStorage.getItem('token');
  if (token) {
    return `Bearer ${token}`;
  }
  
  return 'Bearer dev-admin-token';
}

export default AnnouncementService;
