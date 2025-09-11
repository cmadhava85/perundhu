/**
 * User Rewards Service
 * Manages user points, achievements, and reward activities
 */

import type { RewardPoints, RewardActivity } from '../types';

export interface UserReward {
  id: number;
  userId: string;
  points: number;
  level: number;
  lifetimePoints: number;
  activities: RewardActivity[];
}

export interface UserRewardsData {
  totalPoints: number;
  currentTripPoints: number;
  lifetimePoints: number;
  userRank: string;
  recentActivities: RewardActivity[];
}

/**
 * Get user rewards data
 */
export const getUserRewards = async (userId: string): Promise<RewardPoints> => {
  // Mock implementation for testing - return RewardPoints type
  return {
    userId,
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
        timestamp: new Date().toISOString(),
      },
      {
        activityType: 'route_contribution',
        description: 'Contributed new route information',
        pointsEarned: 50,
        timestamp: new Date().toISOString(),
      },
    ],
  };
};

/**
 * Add points to user's account
 */
export const addPoints = async (userId: string, points: number, activity: string): Promise<void> => {
  // In a real implementation, this would make an API call
  console.log(`Adding ${points} points to user ${userId} for: ${activity}`);
};

export const addRewardPoints = async (userId: string, points: number, activityType: string): Promise<void> => {
  // Mock implementation for testing
  console.log(`Adding ${points} points to user ${userId} for ${activityType}`);
};

/**
 * Get user's current rank
 */
export const getUserRank = async (userId: string): Promise<string> => {
  // In a real implementation, this would calculate based on total points
  const userData = await getUserRewards(userId);
  
  if (userData.lifetimePoints >= 5000) return 'Elite Traveler';
  if (userData.lifetimePoints >= 2000) return 'Regular Traveler';
  if (userData.lifetimePoints >= 500) return 'Frequent Rider';
  return 'New Rider';
};

export const getUserLevel = (points: number): number => {
  if (points >= 1000) return 5;
  if (points >= 500) return 4;
  if (points >= 250) return 3;
  if (points >= 100) return 2;
  return 1;
};

/**
 * Get user session history
 */
export const getUserSessions = async (userId: string): Promise<any[]> => {
  // Mock implementation for testing
  return [
    {
      id: 1,
      userId,
      sessionDate: new Date().toISOString(),
      busesTracked: 3,
      pointsEarned: 15,
      duration: '2h 30m'
    }
  ];
};

// Default export for convenience
export default {
  getUserRewards,
  addPoints,
  getUserRank,
  addRewardPoints,
  getUserLevel,
  getUserSessions
};
