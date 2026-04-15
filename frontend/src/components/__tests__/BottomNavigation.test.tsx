import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import BottomNavigation from '../BottomNavigation';

// Mock haptic feedback
vi.mock('../../utils/haptic', () => ({
  triggerHaptic: vi.fn()
}));

// Mock feature flags context - enable map by default for tests
vi.mock('../../contexts/FeatureFlagsContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useIsFeatureEnabled: (flag: string) => flag === 'enableMap' || flag === 'enableTracking'
  };
});

describe('BottomNavigation Component', () => {
  const mockOnTabChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all navigation tabs', () => {
      render(
        <BottomNavigation 
          activeTab="search" 
          onTabChange={mockOnTabChange}
          hasResults={true}
        />
      );

      expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-nav-search')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-nav-routes')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-nav-map')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-nav-tracking')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-nav-contribute')).toBeInTheDocument();
    });

    it('should display active tab with active class', () => {
      render(
        <BottomNavigation 
          activeTab="search" 
          onTabChange={mockOnTabChange}
          hasResults={true}
        />
      );

      const activeTab = screen.getByTestId('bottom-nav-search');
      expect(activeTab).toHaveClass('active');
    });

    it('should display different active tab when changed', () => {
      const { rerender } = render(
        <BottomNavigation 
          activeTab="search" 
          onTabChange={mockOnTabChange}
          hasResults={true}
        />
      );

      rerender(
        <BottomNavigation 
          activeTab="routes" 
          onTabChange={mockOnTabChange}
          hasResults={true}
        />
      );

      expect(screen.getByTestId('bottom-nav-routes')).toHaveClass('active');
      expect(screen.getByTestId('bottom-nav-search')).not.toHaveClass('active');
    });
  });

  describe('Tab Disabling', () => {
    it('should disable non-search tabs when no results', () => {
      render(
        <BottomNavigation 
          activeTab="search" 
          onTabChange={mockOnTabChange}
          hasResults={false}
        />
      );

      expect(screen.getByTestId('bottom-nav-search')).not.toBeDisabled();
      expect(screen.getByTestId('bottom-nav-contribute')).not.toBeDisabled();
      expect(screen.getByTestId('bottom-nav-routes')).toBeDisabled();
      expect(screen.getByTestId('bottom-nav-map')).toBeDisabled();
      expect(screen.getByTestId('bottom-nav-tracking')).toBeDisabled();
    });

    it('should enable result-dependent tabs when results exist', () => {
      render(
        <BottomNavigation 
          activeTab="search" 
          onTabChange={mockOnTabChange}
          hasResults={true}
        />
      );

      expect(screen.getByTestId('bottom-nav-routes')).not.toBeDisabled();
      expect(screen.getByTestId('bottom-nav-map')).not.toBeDisabled();
      expect(screen.getByTestId('bottom-nav-tracking')).not.toBeDisabled();
    });
  });

  describe('User Interaction', () => {
    it('should call onTabChange when clicking enabled tab', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <BottomNavigation 
          activeTab="search" 
          onTabChange={mockOnTabChange}
          hasResults={true}
        />
      );

      await user.click(screen.getByTestId('bottom-nav-routes'));
      expect(mockOnTabChange).toHaveBeenCalledWith('routes');
    });

    it('should not call onTabChange when clicking disabled tab', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <BottomNavigation 
          activeTab="search" 
          onTabChange={mockOnTabChange}
          hasResults={false}
        />
      );

      await user.click(screen.getByTestId('bottom-nav-routes'));
      expect(mockOnTabChange).not.toHaveBeenCalled();
    });

    it('should call onTabChange when clicking same active tab', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <BottomNavigation 
          activeTab="search" 
          onTabChange={mockOnTabChange}
          hasResults={true}
        />
      );

      await user.click(screen.getByTestId('bottom-nav-search'));
      expect(mockOnTabChange).toHaveBeenCalledWith('search');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <BottomNavigation 
          activeTab="search" 
          onTabChange={mockOnTabChange}
          hasResults={true}
        />
      );

      const nav = screen.getByTestId('bottom-navigation');
      expect(nav).toHaveAttribute('role', 'navigation');
      expect(nav).toHaveAttribute('aria-label');
    });

    it('should mark active tab with aria-current', () => {
      render(
        <BottomNavigation 
          activeTab="routes" 
          onTabChange={mockOnTabChange}
          hasResults={true}
        />
      );

      const activeTab = screen.getByTestId('bottom-nav-routes');
      expect(activeTab).toHaveAttribute('aria-current', 'page');
    });

    it('should not have aria-current on inactive tabs', () => {
      render(
        <BottomNavigation 
          activeTab="search" 
          onTabChange={mockOnTabChange}
          hasResults={true}
        />
      );

      const inactiveTab = screen.getByTestId('bottom-nav-routes');
      expect(inactiveTab).not.toHaveAttribute('aria-current');
    });

    it('should have aria-label for disabled buttons', () => {
      render(
        <BottomNavigation 
          activeTab="search" 
          onTabChange={mockOnTabChange}
          hasResults={false}
        />
      );

      const disabledTab = screen.getByTestId('bottom-nav-routes');
      expect(disabledTab).toHaveAttribute('aria-label');
    });
  });
});
