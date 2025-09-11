import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiService } from '../services/apiService';
import '../styles/UserRewards.css';

interface UserRewardsProps {
<<<<<<< HEAD
  userId: string;
}

interface RewardActivity {
  id: number;
  userId: string;
  activity: string;
  points: number;
  timestamp: string;
}

interface UserRewardData {
  totalPoints: number;
  recentActivities: RewardActivity[];
}

const UserRewards: React.FC<UserRewardsProps> = ({ userId }) => {
=======
  userId?: string; // Add optional userId prop
}

/**
 * Component to display user rewards and achievements for contributing to bus tracking
 */
const UserRewards: React.FC<UserRewardsProps> = ({ userId: propUserId }) => {
>>>>>>> 75c2859 (production ready code need to test)
  const { t } = useTranslation();
  const [rewards, setRewards] = useState<UserRewardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoading(true);
<<<<<<< HEAD
=======
        const userId = propUserId || localStorage.getItem('userId') || 'demo';
        const data = await getUserRewards(userId);
        setRewards(data);
>>>>>>> 75c2859 (production ready code need to test)
        setError(null);
        const data = await apiService.getUserRewardPoints(userId);
        setRewards(data);
      } catch (err) {
        console.error('Error fetching user rewards:', err);
        setError(t('rewards.error', 'Failed to load your rewards. Please try again later.'));
      } finally {
        setLoading(false);
      }
    };

<<<<<<< HEAD
    fetchRewards();
  }, [userId, t]);
=======
    loadRewards();
  }, [t, rewardsEnabled, propUserId]);

  if (!rewardsEnabled) {
    return null;
  }

  // Format the date for display
  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString(undefined, { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return timestamp;
    }
  };

  // Find the badge character based on user rank
  const getBadgeCharacter = (rank: string): string => {
    switch (rank) {
      case 'Beginner':
        return '🔰';
      case 'Regular Traveler':
        return '🌟';
      case 'Frequent Commuter':
        return '🚌';
      case 'Bus Expert':
        return '🏆';
      case 'Master Navigator':
        return '👑';
      default:
        return '🔰';
    }
  };

  // Get rank description based on user rank
  const getRankDescription = (rank: string): string => {
    switch (rank) {
      case 'Beginner':
        return t('rewards.beginnerDesc', 'You\'re just getting started. Keep tracking buses to level up!');
      case 'Regular Traveler':
        return t('rewards.regularDesc', 'You\'re becoming a valuable contributor to the bus tracking community.');
      case 'Frequent Commuter':
        return t('rewards.frequentDesc', 'Your tracking data is helping many others plan their journey better.');
      case 'Bus Expert':
        return t('rewards.expertDesc', 'You\'re one of our top contributors. Thank you for your dedication!');
      case 'Master Navigator':
        return t('rewards.masterDesc', 'Legendary status! Your contributions have helped countless travelers.');
      default:
        return t('rewards.defaultDesc', 'Start tracking bus locations to earn points and rewards.');
    }
  };
>>>>>>> 75c2859 (production ready code need to test)

  if (loading) {
    return (
      <div className="rewards-loading">
        <div className="loading-spinner"></div>
        <p>{t('rewards.loading', 'Loading your rewards...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rewards-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          {t('common.retry', 'Retry')}
        </button>
      </div>
    );
  }

  if (!rewards) {
    return (
      <div className="rewards-empty">
        <p>{t('rewards.noData', 'No rewards data available.')}</p>
      </div>
    );
  }

  return (
    <div className="rewards-container">
      <div className="rewards-header">
        <h2>{t('rewards.title', 'Your Rewards')}</h2>
        <div className="rewards-total">
          <span className="rewards-points">{rewards.totalPoints}</span>
          <span className="rewards-label">{t('rewards.points', 'Points')}</span>
        </div>
      </div>

      <div className="rewards-info-card">
        <h3>{t('rewards.howItWorks', 'How It Works')}</h3>
        <p>{t('rewards.explanation', 'Earn points by reporting bus locations, contributing to routes, and using the app regularly. Redeem your points for discounts on bus tickets and other rewards.')}</p>
      </div>

      <div className="rewards-activities">
        <h3>{t('rewards.recentActivities', 'Recent Activities')}</h3>
        
        {rewards.recentActivities.length === 0 ? (
          <p className="no-activities">{t('rewards.noActivities', 'No recent activities found.')}</p>
        ) : (
          <div className="activities-list">
            {rewards.recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-details">
                  <div className="activity-name">{activity.activity}</div>
                  <div className="activity-date">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className="activity-points">+{activity.points}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rewards-redemption">
        <h3>{t('rewards.redeem', 'Redeem Points')}</h3>
        <div className="redemption-options">
          <div className="redemption-option">
            <div className="option-details">
              <h4>{t('rewards.discountTicket', 'Bus Ticket Discount')}</h4>
              <p>{t('rewards.discountDescription', '10% off on your next bus ticket')}</p>
            </div>
            <button 
              className="redeem-button"
              disabled={rewards.totalPoints < 500}
            >
              {t('rewards.redeemFor', 'Redeem for 500 points')}
            </button>
          </div>
          
          <div className="redemption-option">
            <div className="option-details">
              <h4>{t('rewards.priorityBooking', 'Priority Booking')}</h4>
              <p>{t('rewards.priorityDescription', 'Early access to book high-demand routes')}</p>
            </div>
            <button 
              className="redeem-button"
              disabled={rewards.totalPoints < 1000}
            >
              {t('rewards.redeemFor', 'Redeem for 1000 points')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRewards;