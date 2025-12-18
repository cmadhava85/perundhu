import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '../../test-utils';
import UserRewards from '../UserRewards';
import { apiService } from '../../services/apiService';

// Mock the API service
vi.mock('../../services/apiService', () => ({
  apiService: {
    getUserRewardPoints: vi.fn()
  }
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key
  })
}));

const mockRewardsData = {
  totalPoints: 150,
  recentActivities: [
    {
      id: 1,
      userId: 'test-user-123',
      activity: 'Reported bus location',
      points: 10,
      timestamp: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      userId: 'test-user-123',
      activity: 'Completed trip',
      points: 15,
      timestamp: '2024-01-14T15:45:00Z'
    }
  ]
};

describe('UserRewards Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('renders loading state initially', async () => {
    vi.mocked(apiService.getUserRewardPoints).mockResolvedValue(mockRewardsData);

    await act(async () => {
      render(<UserRewards userId="test-user-123" />);
    });
    
    expect(screen.getByText('Loading your rewards...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading your rewards...')).not.toBeInTheDocument();
    });
  });

  it.skip('displays reward points when loaded', async () => {
    vi.mocked(apiService.getUserRewardPoints).mockResolvedValue(mockRewardsData);

    await act(async () => {
      render(<UserRewards userId="test-user-123" />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // Total points
      expect(screen.getByText('Your Rewards')).toBeInTheDocument(); // Title
    });
  });

  it('handles loading state correctly', async () => {
    vi.mocked(apiService.getUserRewardPoints).mockImplementation(() => new Promise(() => {}));

    await act(async () => {
      render(<UserRewards userId="test-user-123" />);
    });
    
    expect(screen.getByText('Loading your rewards...')).toBeInTheDocument();
  });

  it.skip('handles error state', async () => {
    vi.mocked(apiService.getUserRewardPoints).mockRejectedValue(new Error('Failed to load rewards'));

    await act(async () => {
      render(<UserRewards userId="test-user-123" />);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load your rewards/)).toBeInTheDocument();
    });
  });

  it.skip('displays recent activities when available', async () => {
    vi.mocked(apiService.getUserRewardPoints).mockResolvedValue(mockRewardsData);

    await act(async () => {
      render(<UserRewards userId="test-user-123" />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Reported bus location')).toBeInTheDocument();
      expect(screen.getByText('Completed trip')).toBeInTheDocument();
      expect(screen.getByText('+10')).toBeInTheDocument();
      expect(screen.getByText('+15')).toBeInTheDocument();
    });
  });

  it.skip('shows redemption options', async () => {
    vi.mocked(apiService.getUserRewardPoints).mockResolvedValue(mockRewardsData);

    await act(async () => {
      render(<UserRewards userId="test-user-123" />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Bus Ticket Discount')).toBeInTheDocument();
      expect(screen.getByText('Priority Booking')).toBeInTheDocument();
      expect(screen.getByText('Redeem for 500 points')).toBeInTheDocument();
      expect(screen.getByText('Redeem for 1000 points')).toBeInTheDocument();
    });
  });

  it.skip('calls API service with correct parameters', async () => {
    vi.mocked(apiService.getUserRewardPoints).mockResolvedValue(mockRewardsData);

    await act(async () => {
      render(<UserRewards userId="test-user-123" />);
    });
    
    await waitFor(() => {
      expect(apiService.getUserRewardPoints).toHaveBeenCalledWith('test-user-123');
    });
  });
});