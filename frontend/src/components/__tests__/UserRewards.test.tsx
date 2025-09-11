import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import UserRewards from '../UserRewards';
import * as userRewardsService from '../../services/userRewardsService';
import * as environment from '../../utils/environment';

// Mock the services
vi.mock('../../services/userRewardsService', () => ({
  getUserRewards: vi.fn()
}));

vi.mock('../../utils/environment', () => ({
  getFeatureFlag: vi.fn(() => true)
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key
  })
}));

const mockRewardsData = {
  userId: 'test-user-123',
  totalPoints: 150,
  currentTripPoints: 25,
  lifetimePoints: 500,
  userRank: 'Regular Traveler',
  leaderboardPosition: 15,
  recentActivities: []
};

describe('UserRewards Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Enable rewards in localStorage for tests
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => {
          if (key === 'perundhu-rewards-enabled') return 'true';
          if (key === 'userId') return 'test-user-123';
          return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  it('renders loading state initially', async () => {
    vi.mocked(userRewardsService.getUserRewards).mockResolvedValue(mockRewardsData);

    render(<UserRewards userId="test-user-123" />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('displays reward points when loaded', async () => {
    vi.mocked(userRewardsService.getUserRewards).mockResolvedValue(mockRewardsData);

    render(<UserRewards userId="test-user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // Total points
      expect(screen.getByText('Regular Traveler')).toBeInTheDocument(); // Rank
    });
  });

  it('handles loading state correctly', () => {
    vi.mocked(userRewardsService.getUserRewards).mockImplementation(() => new Promise(() => {}));

    render(<UserRewards userId="test-user-123" />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    vi.mocked(userRewardsService.getUserRewards).mockRejectedValue(new Error('Failed to load rewards'));

    render(<UserRewards userId="test-user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Could not load your reward points/)).toBeInTheDocument();
    });
  });

  it('does not render when rewards are disabled', () => {
    // Mock localStorage to return 'false' for rewards enabled
    window.localStorage.getItem = vi.fn((key) => {
      if (key === 'perundhu-rewards-enabled') return 'false';
      return null;
    });

    const { container } = render(<UserRewards userId="test-user-123" />);
    
    // Component should return null and render nothing
    expect(container.firstChild).toBeNull();
  });

  it('shows feature flag message when rewards feature is disabled', () => {
    vi.mocked(environment.getFeatureFlag).mockReturnValue(false);
    
    // Mock localStorage to return 'false' for rewards enabled  
    window.localStorage.getItem = vi.fn((key) => {
      if (key === 'perundhu-rewards-enabled') return 'false';
      return null;
    });

    const { container } = render(<UserRewards userId="test-user-123" />);
    
    // Should not render anything when disabled
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when feature flag is enabled', async () => {
    vi.mocked(environment.getFeatureFlag).mockReturnValue(true);
    vi.mocked(userRewardsService.getUserRewards).mockResolvedValue(mockRewardsData);

    render(<UserRewards userId="test-user-123" />);
    
    // Component should attempt to load
    await waitFor(() => {
      expect(userRewardsService.getUserRewards).toHaveBeenCalledWith('test-user-123');
    });
  });
});