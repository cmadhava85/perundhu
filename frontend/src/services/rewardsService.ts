export interface Reward {
  id: string;
  title: string;
  description: string;
  points: number;
  type: 'BADGE' | 'DISCOUNT' | 'FREEBIE' | 'MILESTONE';
  category: string;
  imageUrl?: string;
  expiryDate?: string;
  isActive: boolean;
  requirements?: {
    minTrips?: number;
    minDistance?: number;
    specificRoutes?: string[];
    timeFrame?: string;
  };
}

export interface UserReward {
  id: string;
  rewardId: string;
  userId: string;
  earnedAt: string;
  redeemedAt?: string;
  isRedeemed: boolean;
  reward: Reward;
}

export interface RewardsStats {
  totalPoints: number;
  totalRewards: number;
  redeemedRewards: number;
  nextMilestone?: {
    title: string;
    pointsRequired: number;
    pointsRemaining: number;
  };
}

class RewardsService {
  private baseURL = '/api/rewards';

  async getUserRewards(userId: string): Promise<UserReward[]> {
    try {
      const response = await fetch(`${this.baseURL}/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user rewards');
      return await response.json();
    } catch (error) {
      console.error('Error fetching user rewards:', error);
      return [];
    }
  }

  async getAvailableRewards(): Promise<Reward[]> {
    try {
      const response = await fetch(`${this.baseURL}/available`);
      if (!response.ok) throw new Error('Failed to fetch available rewards');
      return await response.json();
    } catch (error) {
      console.error('Error fetching available rewards:', error);
      return [];
    }
  }

  async getUserStats(userId: string): Promise<RewardsStats> {
    try {
      const response = await fetch(`${this.baseURL}/user/${userId}/stats`);
      if (!response.ok) throw new Error('Failed to fetch user stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        totalPoints: 0,
        totalRewards: 0,
        redeemedRewards: 0
      };
    }
  }

  async redeemReward(userId: string, rewardId: string): Promise<UserReward> {
    try {
      const response = await fetch(`${this.baseURL}/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, rewardId }),
      });
      if (!response.ok) throw new Error('Failed to redeem reward');
      return await response.json();
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }
  }

  async checkEligibility(userId: string, rewardId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/eligibility/${userId}/${rewardId}`);
      if (!response.ok) return false;
      const data = await response.json();
      return data.eligible;
    } catch (error) {
      console.error('Error checking eligibility:', error);
      return false;
    }
  }
}

// Export the specific function that UserRewards component expects
export const getUserRewards = async (userId: string) => {
  const service = new RewardsService();
  return service.getUserRewards(userId);
};

export default new RewardsService();