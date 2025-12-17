import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiService } from '../services/apiService';
import type { RewardPoints } from '../types';
import '../styles/UserRewards.css';

interface UserRewardsProps {
  userId?: string;
}

/**
 * Component to display user rewards and achievements for contributing to bus tracking
 */
const UserRewards: React.FC<UserRewardsProps> = ({ userId: propUserId }) => {
  const { t } = useTranslation();
  const [rewards, setRewards] = useState<RewardPoints | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoading(true);
        const userId = propUserId || localStorage.getItem('userId') || 'demo';
        const data = await apiService.getUserRewardPoints(userId);
        setRewards(data);
        setError(null);
      } catch (_err) {
        // Failed to fetch rewards
        setError(t('rewards.error', 'Failed to load your rewards. Please try again later.'));
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, [t, propUserId]);

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
    } catch (_e) {
      return timestamp;
    }
  };

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
        
        {!rewards.recentActivities || rewards.recentActivities.length === 0 ? (
          <p className="no-activities">{t('rewards.noActivities', 'No recent activities found.')}</p>
        ) : (
          <div className="activities-list">
            {rewards.recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-details">
                  <div className="activity-name">{activity.activityType}</div>
                  <div className="activity-date">
                    {formatDate(activity.timestamp)}
                  </div>
                </div>
                <div className="activity-points">+{activity.pointsEarned}</div>
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