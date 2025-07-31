import { api, handleApiError } from './api';

// User Rewards API
export const getUserRewards = async (userId: string) => {
  try {
    const response = await api.get(`/api/v1/user-rewards/${userId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// User Sessions API
export const getUserSessions = async (userId: string) => {
  try {
    const response = await api.get(`/api/v1/user-sessions/${userId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Session Tracking APIs
export const startUserSession = async (userId: string, busId: number, startLocationId: number) => {
  try {
    const response = await api.post('/api/v1/user-tracking-sessions', {
      userId,
      busId,
      startLocationId,
      startTime: new Date().toISOString(),
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const endUserSession = async (sessionId: number, endLocationId: number) => {
  try {
    const response = await api.patch(`/api/v1/user-tracking-sessions/${sessionId}/end`, {
      endLocationId,
      endTime: new Date().toISOString(),
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const fetchUserTrackingSessions = async (userId: string) => {
  try {
    const response = await api.get(`/api/v1/user-tracking-sessions?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user tracking sessions:', error);
    return handleApiError(error);
  }
};
