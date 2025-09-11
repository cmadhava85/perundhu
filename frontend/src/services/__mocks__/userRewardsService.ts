import { vi } from 'vitest';
import type { RewardPoints } from '../../types';

// Mock data for testing
const mockRewardPoints: RewardPoints = {
  userId: 'test-user-123',
  totalPoints: 150,
  currentTripPoints: 25,
  lifetimePoints: 500,
  userRank: 'Regular Traveler',
  leaderboardPosition: 15,
  recentActivities: [
    {
      activityType: 'bus_location_report',
      description: 'Reported bus location',
      pointsEarned: 10,
      timestamp: '2023-10-01T10:00:00Z',
    },
    {
      activityType: 'route_contribution',
      description: 'Contributed new route information',
      pointsEarned: 50,
      timestamp: '2023-09-30T15:30:00Z',
    },
  ],
};

// Mock implementations using Vitest syntax
export const getUserRewards = vi.fn().mockResolvedValue(mockRewardPoints);
export const addPoints = vi.fn().mockResolvedValue(undefined);
export const getUserRank = vi.fn().mockResolvedValue('Regular Traveler');
export const addRewardPoints = vi.fn().mockResolvedValue(undefined);
export const getUserLevel = vi.fn().mockReturnValue(3);
export const getUserSessions = vi.fn().mockResolvedValue([]);

// Default export for compatibility
const userRewardsService = {
  getUserRewards,
  addPoints,
  getUserRank,
  addRewardPoints,
  getUserLevel,
  getUserSessions
};

export default userRewardsService;