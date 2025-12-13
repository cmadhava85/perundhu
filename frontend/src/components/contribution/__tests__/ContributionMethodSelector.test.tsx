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
    enableAddStops: true,
    enableReportIssue: false
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

    it('displays all method chips when features are enabled', () => {
      render(<ContributionMethodSelector {...defaultProps} />);
      
      // Component uses short labels in chips
      expect(screen.getByText('Manual')).toBeDefined();
      expect(screen.getByText('Voice')).toBeDefined();
      expect(screen.getByText('Upload')).toBeDefined();
      expect(screen.getByText('Paste')).toBeDefined();
      expect(screen.getByText('Verify')).toBeDefined();
      expect(screen.getByText('Stops')).toBeDefined();
    });

    it('displays method icons', () => {
      render(<ContributionMethodSelector {...defaultProps} />);
      
      expect(screen.getByText('📝')).toBeDefined(); // Manual
      expect(screen.getByText('🎤')).toBeDefined(); // Voice
      expect(screen.getByText('📷')).toBeDefined(); // Upload
      expect(screen.getByText('📋')).toBeDefined(); // Paste
      expect(screen.getByText('✅')).toBeDefined(); // Verify
      expect(screen.getByText('📍')).toBeDefined(); // Stops
    });
  });

  describe('Method Selection', () => {
    it('calls onMethodChange when Manual is clicked', () => {
      const onMethodChange = vi.fn();
      render(<ContributionMethodSelector {...defaultProps} onMethodChange={onMethodChange} selectedMethod="image" />);
      
      const manualChip = screen.getByText('Manual').closest('button');
      if (manualChip) {
        fireEvent.click(manualChip);
        expect(onMethodChange).toHaveBeenCalledWith('manual');
      }
    });

    it('calls onMethodChange when Stops is clicked', () => {
      const onMethodChange = vi.fn();
      render(<ContributionMethodSelector {...defaultProps} onMethodChange={onMethodChange} />);
      
      const stopsChip = screen.getByText('Stops').closest('button');
      if (stopsChip) {
        fireEvent.click(stopsChip);
        expect(onMethodChange).toHaveBeenCalledWith('addStops');
      }
    });

    it('calls onMethodChange when Verify is clicked', () => {
      const onMethodChange = vi.fn();
      render(<ContributionMethodSelector {...defaultProps} onMethodChange={onMethodChange} />);
      
      const verifyChip = screen.getByText('Verify').closest('button');
      if (verifyChip) {
        fireEvent.click(verifyChip);
        expect(onMethodChange).toHaveBeenCalledWith('verify');
      }
    });

    it('shows active state for selected method', () => {
      render(<ContributionMethodSelector {...defaultProps} selectedMethod="addStops" />);
      
      const stopsChip = screen.getByText('Stops').closest('button');
      if (stopsChip) {
        expect(stopsChip.classList.contains('active')).toBe(true);
        expect(stopsChip.getAttribute('aria-pressed')).toBe('true');
      }
    });
  });

  describe('Keyboard Accessibility', () => {
    it('handles Enter key on method chip', () => {
      const onMethodChange = vi.fn();
      render(<ContributionMethodSelector {...defaultProps} onMethodChange={onMethodChange} />);
      
      const stopsChip = screen.getByText('Stops').closest('button');
      if (stopsChip) {
        fireEvent.keyDown(stopsChip, { key: 'Enter' });
        expect(onMethodChange).toHaveBeenCalledWith('addStops');
      }
    });

    it('handles Space key on method chip', () => {
      const onMethodChange = vi.fn();
      render(<ContributionMethodSelector {...defaultProps} onMethodChange={onMethodChange} />);
      
      const verifyChip = screen.getByText('Verify').closest('button');
      if (verifyChip) {
        fireEvent.keyDown(verifyChip, { key: ' ' });
        expect(onMethodChange).toHaveBeenCalledWith('verify');
      }
    });

    it('method chips are buttons and keyboard navigable', () => {
      render(<ContributionMethodSelector {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('ARIA Attributes', () => {
    it('has aria-label on container', () => {
      render(<ContributionMethodSelector {...defaultProps} />);
      
      const container = screen.getByLabelText('Select contribution method');
      expect(container).toBeDefined();
    });

    it('uses aria-pressed on method chips', () => {
      render(<ContributionMethodSelector {...defaultProps} selectedMethod="manual" />);
      
      const manualChip = screen.getByText('Manual').closest('button');
      if (manualChip) {
        expect(manualChip.getAttribute('aria-pressed')).toBe('true');
      }
    });

    it('sets aria-pressed correctly for selected method', () => {
      render(<ContributionMethodSelector {...defaultProps} selectedMethod="verify" />);
      
      const verifyChip = screen.getByText('Verify').closest('button');
      const manualChip = screen.getByText('Manual').closest('button');
      
      if (verifyChip && manualChip) {
        expect(verifyChip.getAttribute('aria-pressed')).toBe('true');
        expect(manualChip.getAttribute('aria-pressed')).toBe('false');
      }
    });
  });

  describe('Method Badges', () => {
    it('shows star badge for Manual (recommended)', () => {
      render(<ContributionMethodSelector {...defaultProps} />);
      expect(screen.getByText('★')).toBeDefined();
    });

    it('shows lightning badge for Paste (fast)', () => {
      render(<ContributionMethodSelector {...defaultProps} />);
      expect(screen.getByText('⚡')).toBeDefined();
    });
  });
});
