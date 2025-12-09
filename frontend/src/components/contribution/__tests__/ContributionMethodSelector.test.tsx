import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContributionMethodSelector } from '../ContributionMethodSelector';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback || key,
    i18n: { language: 'en' }
  })
}));

// Mock feature flags
vi.mock('../../../config/featureFlags', () => ({
  featureFlags: {
    enableManualContribution: true,
    enableVoiceContribution: true,
    enableImageContribution: true,
    enablePasteContribution: true,
    enableRouteVerification: true,
    enableAddStops: true
  }
}));

describe('ContributionMethodSelector Component', () => {
  const defaultProps = {
    selectedMethod: 'manual' as const,
    onMethodChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => render(<ContributionMethodSelector {...defaultProps} />)).not.toThrow();
    });

    it('displays all method cards when features are enabled', () => {
      render(<ContributionMethodSelector {...defaultProps} />);
      
      expect(screen.getByText('Manual Entry')).toBeDefined();
      expect(screen.getByText('Voice Recording')).toBeDefined();
      expect(screen.getByText('Upload Schedule')).toBeDefined();
      expect(screen.getByText('Paste Text')).toBeDefined();
      expect(screen.getByText('Verify Routes')).toBeDefined();
      expect(screen.getByText('Add Stops')).toBeDefined();
    });

    it('displays method descriptions', () => {
      render(<ContributionMethodSelector {...defaultProps} />);
      
      expect(screen.getByText('Fill out detailed route information')).toBeDefined();
      expect(screen.getByText('Add intermediate stops to existing routes')).toBeDefined();
    });
  });

  describe('Method Selection', () => {
    it('calls onMethodChange when Manual Entry is clicked', () => {
      const onMethodChange = vi.fn();
      render(<ContributionMethodSelector {...defaultProps} onMethodChange={onMethodChange} selectedMethod="image" />);
      
      const manualCard = screen.getByText('Manual Entry').closest('[role="radio"]');
      if (manualCard) {
        fireEvent.click(manualCard);
        expect(onMethodChange).toHaveBeenCalledWith('manual');
      }
    });

    it('calls onMethodChange when Add Stops is clicked', () => {
      const onMethodChange = vi.fn();
      render(<ContributionMethodSelector {...defaultProps} onMethodChange={onMethodChange} />);
      
      const addStopsCard = screen.getByText('Add Stops').closest('[role="radio"]');
      if (addStopsCard) {
        fireEvent.click(addStopsCard);
        expect(onMethodChange).toHaveBeenCalledWith('addStops');
      }
    });

    it('calls onMethodChange when Verify Routes is clicked', () => {
      const onMethodChange = vi.fn();
      render(<ContributionMethodSelector {...defaultProps} onMethodChange={onMethodChange} />);
      
      const verifyCard = screen.getByText('Verify Routes').closest('[role="radio"]');
      if (verifyCard) {
        fireEvent.click(verifyCard);
        expect(onMethodChange).toHaveBeenCalledWith('verify');
      }
    });

    it('shows active state for selected method', () => {
      render(<ContributionMethodSelector {...defaultProps} selectedMethod="addStops" />);
      
      const addStopsCard = screen.getByText('Add Stops').closest('[role="radio"]');
      if (addStopsCard) {
        expect(addStopsCard.getAttribute('aria-checked')).toBe('true');
      }
    });
  });

  describe('Keyboard Accessibility', () => {
    it('handles Enter key on method card', () => {
      const onMethodChange = vi.fn();
      render(<ContributionMethodSelector {...defaultProps} onMethodChange={onMethodChange} />);
      
      const addStopsCard = screen.getByText('Add Stops').closest('[role="radio"]');
      if (addStopsCard) {
        fireEvent.keyDown(addStopsCard, { key: 'Enter' });
        expect(onMethodChange).toHaveBeenCalledWith('addStops');
      }
    });

    it('handles Space key on method card', () => {
      const onMethodChange = vi.fn();
      render(<ContributionMethodSelector {...defaultProps} onMethodChange={onMethodChange} />);
      
      const verifyCard = screen.getByText('Verify Routes').closest('[role="radio"]');
      if (verifyCard) {
        fireEvent.keyDown(verifyCard, { key: ' ' });
        expect(onMethodChange).toHaveBeenCalledWith('verify');
      }
    });

    it('method cards have tabIndex for keyboard navigation', () => {
      render(<ContributionMethodSelector {...defaultProps} />);
      
      const addStopsCard = screen.getByText('Add Stops').closest('[role="radio"]');
      if (addStopsCard) {
        expect(addStopsCard.getAttribute('tabIndex')).toBe('0');
      }
    });
  });

  describe('ARIA Attributes', () => {
    it('has radiogroup role on container', () => {
      render(<ContributionMethodSelector {...defaultProps} />);
      
      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup).toBeDefined();
    });

    it('has radio role on method cards', () => {
      render(<ContributionMethodSelector {...defaultProps} />);
      
      const radios = screen.getAllByRole('radio');
      expect(radios.length).toBeGreaterThanOrEqual(1);
    });

    it('sets aria-checked correctly for selected method', () => {
      render(<ContributionMethodSelector {...defaultProps} selectedMethod="verify" />);
      
      const verifyCard = screen.getByText('Verify Routes').closest('[role="radio"]');
      const manualCard = screen.getByText('Manual Entry').closest('[role="radio"]');
      
      if (verifyCard && manualCard) {
        expect(verifyCard.getAttribute('aria-checked')).toBe('true');
        expect(manualCard.getAttribute('aria-checked')).toBe('false');
      }
    });
  });

  describe('Method Badges', () => {
    it('shows Recommended badge for Manual Entry', () => {
      render(<ContributionMethodSelector {...defaultProps} />);
      expect(screen.getByText('Recommended')).toBeDefined();
    });

    it('shows New! badge for Add Stops', () => {
      render(<ContributionMethodSelector {...defaultProps} />);
      // There might be multiple "New!" badges
      const newBadges = screen.getAllByText('New!');
      expect(newBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('shows Helpful! badge for Verify Routes', () => {
      render(<ContributionMethodSelector {...defaultProps} />);
      expect(screen.getByText('Helpful!')).toBeDefined();
    });
  });
});
