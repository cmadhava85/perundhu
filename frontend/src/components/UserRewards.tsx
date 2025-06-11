import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { RewardPoints } from '../types';
import { getUserRewards } from '../services/userRewardsService';

/**
 * Component to display user rewards and achievements for contributing to bus tracking
 */
const UserRewards: React.FC = () => {
  const { t } = useTranslation();
  const [rewards, setRewards] = useState<RewardPoints | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rewardsEnabled] = useState<boolean>(
    localStorage.getItem('perundhu-rewards-enabled') === 'true'
  );

  // Load user reward points data
  useEffect(() => {
    if (!rewardsEnabled) return;
    
    const loadRewards = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem('userId') || 'demo';
        const data = await getUserRewards(userId);
        setRewards(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load user rewards:', err);
        setError(t('rewards.loadError', 'Could not load your reward points'));
      } finally {
        setLoading(false);
      }
    };

    loadRewards();
  }, [t, rewardsEnabled]);

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

  if (loading) {
    return (
      <div className="user-rewards">
        <h2>{t('rewards.title', 'Your Rewards')}</h2>
        <div className="rewards-loading">
          <div className="spinner"></div>
          <p>{t('common.loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-rewards">
        <h2>{t('rewards.title', 'Your Rewards')}</h2>
        <div className="rewards-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            {t('rewards.tryAgain', 'Try Again')}
          </button>
        </div>
      </div>
    );
  }

  if (!rewards) {
    return (
      <div className="user-rewards">
        <h2>{t('rewards.title', 'Your Rewards')}</h2>
        <div className="rewards-empty">
          <p>{t('rewards.noRewards', 'Start tracking buses to earn rewards!')}</p>
          <p>{t('rewards.howToEarn', 'Contribute by enabling bus tracking when you board a bus.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-rewards">
      <h2>{t('rewards.title', 'Your Rewards')}</h2>
      
      <div className="user-stats">
        <div className="stat-card">
          <div className="stat-value">{rewards.totalPoints}</div>
          <div className="stat-label">{t('rewards.totalPoints', 'Total Points')}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{rewards.currentTripPoints}</div>
          <div className="stat-label">{t('rewards.currentTrip', 'Current Trip')}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{rewards.lifetimePoints}</div>
          <div className="stat-label">{t('rewards.lifetime', 'Lifetime Points')}</div>
        </div>
      </div>
      
      <div className="user-rank">
        <div className="rank-badge">{getBadgeCharacter(rewards.userRank)}</div>
        <div className="rank-info">
          <h3 className="rank-title">{rewards.userRank}</h3>
          <p className="rank-description">{getRankDescription(rewards.userRank)}</p>
        </div>
      </div>
      
      {rewards.recentActivities && rewards.recentActivities.length > 0 && (
        <div className="activities-list">
          <h3>{t('rewards.recentActivity', 'Recent Activity')}</h3>
          
          {rewards.recentActivities.map((activity, index) => (
            <div className="activity-item" key={`activity-${index}`}>
              <div className="activity-info">
                <div className="activity-description">{activity.description}</div>
                <div className="activity-time">{formatDate(activity.timestamp)}</div>
              </div>
              <div className="activity-points">
                +{activity.pointsEarned} {t('rewards.points', 'pts')}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="rewards-info">
        <h3>{t('rewards.howItWorks', 'How It Works:')}</h3>
        <ul>
          <li>{t('rewards.earnDesc1', 'Earn 5 points each time you report a bus location')}</li>
          <li>{t('rewards.earnDesc2', 'Get bonus points for accurate locations & complete trips')}</li>
          <li>{t('rewards.earnDesc3', 'Level up to new ranks as you earn more points')}</li>
          <li>{t('rewards.earnDesc4', 'Help others find their buses in real-time')}</li>
        </ul>
      </div>
    </div>
  );
};

export default UserRewards;