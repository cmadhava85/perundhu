import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// User Rewards API
export const getUserRewards = async (userId: string) => {
  const response = await api.get(`/v1/user-rewards/${userId}`);
  return response.data;
};

// User Sessions API
export const getUserSessions = async (userId: string) => {
  const response = await api.get(`/v1/user-sessions/${userId}`);
  return response.data;
};

// Session Tracking APIs
export const startUserSession = async (userId: string, busId: number, startLocationId: number) => {
  const response = await api.post('/v1/user-tracking-sessions', {
    userId,
    busId,
    startLocationId,
    startTime: new Date().toISOString(),
  });
  return response.data;
};

export const endUserSession = async (sessionId: number, endLocationId: number) => {
  const response = await api.patch(`/v1/user-tracking-sessions/${sessionId}/end`, {
    endLocationId,
    endTime: new Date().toISOString(),
  });
  return response.data;
};

export const fetchUserTrackingSessions = async (userId: string) => {
  try {
    const response = await api.get(`/v1/user-tracking-sessions?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user tracking sessions:', error);
    throw error;
  }
};
