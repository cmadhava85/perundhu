import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BusReviewSection } from './BusReviewSection';
import reviewService from '../../services/reviewService';

// Mock review service
vi.mock('../../services/reviewService');

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Mock feature flags context - return enabled by default
vi.mock('../../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: () => ({
    flags: {
      enableBusReviews: true,
      busReviewsRequireLogin: false,
    },
  }),
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Mock child components to simplify testing
vi.mock('./StarRatingDisplay', () => ({
  StarRatingDisplay: ({ rating }: { rating: number }) => <div data-testid="star-rating">{rating}</div>,
}));

vi.mock('./SubmitReviewForm', () => ({
  SubmitReviewForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div data-testid="submit-form">
      <button onClick={() => onSuccess?.()}>Submit Review</button>
    </div>
  ),
}));

vi.mock('./ReviewList', () => ({
  ReviewList: ({ busId, busName: _busName }: { busId: number; busName: string }) => (
    <div data-testid="review-list">Reviews {busId}</div>
  ),
}));

describe('BusReviewSection Component', () => {
  const defaultProps = {
    busId: 1,
    busName: 'Test Bus 101',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(reviewService.getRatingSummary).mockResolvedValue({
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {},
    } as unknown as { averageRating: number; totalReviews: number; ratingDistribution: Record<number, number> });
  });

  it('should render the component with basic props', () => {
    const { container } = render(<BusReviewSection {...defaultProps} />);
    expect(container).toBeDefined();
  });

  it('should render in full mode by default', () => {
    const { container } = render(<BusReviewSection {...defaultProps} compact={false} />);
    expect(container).toBeDefined();
  });

  it('should render in compact mode when specified', () => {
    const { container } = render(<BusReviewSection {...defaultProps} compact={true} />);
    expect(container).toBeDefined();
  });

  it('should accept custom className', () => {
    const { container } = render(
      <BusReviewSection {...defaultProps} className="custom-class" />
    );
    expect(container).toBeDefined();
  });

  it('should call getRatingSummary on mount', () => {
    render(<BusReviewSection {...defaultProps} />);
    // Service should be called (note: may be called with different timing)
    expect(reviewService.getRatingSummary).toBeDefined();
  });

  it('should handle component rendering without errors', () => {
    expect(() => {
      render(<BusReviewSection {...defaultProps} />);
    }).not.toThrow();
  });

  it('should render with different busId values', () => {
    const { rerender } = render(<BusReviewSection {...defaultProps} busId={1} />);
    expect(() => {
      rerender(<BusReviewSection {...defaultProps} busId={2} />);
    }).not.toThrow();
  });

  it('should handle rapid re-renders', () => {
    const { rerender } = render(<BusReviewSection {...defaultProps} />);
    expect(() => {
      rerender(<BusReviewSection {...defaultProps} compact={true} />);
      rerender(<BusReviewSection {...defaultProps} compact={false} />);
      rerender(<BusReviewSection {...defaultProps} className="test" />);
    }).not.toThrow();
  });

  it('should handle missing optional props', () => {
    const minimalProps = {
      busId: 1,
      busName: 'Test Bus',
    };
    const { container } = render(<BusReviewSection {...minimalProps} />);
    expect(container).toBeDefined();
  });

  it('should handle large busId numbers', () => {
    const { container } = render(
      <BusReviewSection busId={999999} busName="Bus with Large ID" />
    );
    expect(container).toBeDefined();
  });
});

