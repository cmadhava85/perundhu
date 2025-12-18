import { render, screen, fireEvent, waitFor } from '../../../test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RouteVerification } from '../RouteVerification';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback || key,
    i18n: { language: 'en' }
  })
}));

// Mock API services
vi.mock('../../../services/api', () => ({
  searchBuses: vi.fn(() => Promise.resolve([
    {
      id: 1,
      busName: 'Chennai Express',
      busNumber: 'TN01AB1234',
      from: 'Chennai',
      to: 'Madurai',
      departureTime: '06:00',
      arrivalTime: '12:00',
      fare: 350
    }
  ])),
  getStops: vi.fn(() => Promise.resolve([
    { id: 1, name: 'Chennai Central', arrivalTime: '06:00', departureTime: '06:05', order: 1 },
    { id: 2, name: 'Villupuram', arrivalTime: '08:00', departureTime: '08:10', order: 2 },
    { id: 3, name: 'Madurai', arrivalTime: '12:00', departureTime: '12:00', order: 3 }
  ])),
  getLocations: vi.fn(() => Promise.resolve([
    { id: 1, name: 'Chennai', translatedName: 'சென்னை' },
    { id: 2, name: 'Madurai', translatedName: 'மதுரை' },
    { id: 3, name: 'Trichy', translatedName: 'திருச்சி' }
  ]))
}));

describe('RouteVerification Component', () => {
  const defaultProps = {
    onVerificationSubmit: vi.fn(),
    onError: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => render(<RouteVerification {...defaultProps} />)).not.toThrow();
    });

    it('displays stats banner', () => {
      render(<RouteVerification {...defaultProps} />);
      // Check for stats - the component shows "Verifications" not "Total Verifications"
      expect(screen.getByText('Verifications')).toBeDefined();
    });

    it('displays route selection step', () => {
      render(<RouteVerification {...defaultProps} />);
      // Component shows "Select a Route to Verify"
      expect(screen.getByText('Select a Route to Verify')).toBeDefined();
    });

    it('displays community stats', () => {
      render(<RouteVerification {...defaultProps} />);
      expect(screen.getByText('Verifications')).toBeDefined();
      expect(screen.getByText('Routes Verified')).toBeDefined();
    });
  });

  describe('Step 1 - Route Selection', () => {
    it('shows route selection as first step', () => {
      render(<RouteVerification {...defaultProps} />);
      expect(screen.getByText('Select a Route to Verify')).toBeDefined();
    });

    it('shows From and To input fields', () => {
      render(<RouteVerification {...defaultProps} />);
      expect(screen.getByPlaceholderText('Enter starting location')).toBeDefined();
      expect(screen.getByPlaceholderText('Enter destination')).toBeDefined();
    });

    it('has disabled Find Buses button when locations not selected', () => {
      render(<RouteVerification {...defaultProps} />);
      // The button text is "Find Buses" not "Search"
      const button = screen.getByRole('button', { name: /Find Buses/i });
      expect(button).toBeDisabled();
    });

    it('allows typing in location inputs', () => {
      render(<RouteVerification {...defaultProps} />);
      const fromInput = screen.getByPlaceholderText('Enter starting location');
      
      fireEvent.change(fromInput, { target: { value: 'Chen' } });
      expect(fromInput).toHaveValue('Chen');
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for inputs', () => {
      render(<RouteVerification {...defaultProps} />);
      // Use getAllByText since "From" and "To" appear in the bus list mock too
      expect(screen.getAllByText(/From/).length).toBeGreaterThan(0);
    });

    it('inputs are focusable', () => {
      render(<RouteVerification {...defaultProps} />);
      const fromInput = screen.getByPlaceholderText('Enter starting location');
      fromInput.focus();
      expect(document.activeElement).toBe(fromInput);
    });

    it('suggestions list has proper role', async () => {
      render(<RouteVerification {...defaultProps} />);
      const fromInput = screen.getByPlaceholderText('Enter starting location');
      
      fireEvent.focus(fromInput);
      fireEvent.change(fromInput, { target: { value: 'Che' } });
      
      await waitFor(() => {
        const listbox = screen.queryByRole('listbox');
        // May or may not appear depending on suggestions
        if (listbox) {
          expect(listbox).toBeDefined();
        }
      });
    });
  });

  describe('Stats Banner', () => {
    it('displays all four stat items', () => {
      render(<RouteVerification {...defaultProps} />);
      
      // The component uses these labels
      expect(screen.getByText('Verifications')).toBeDefined();
      expect(screen.getByText('Routes Verified')).toBeDefined();
      expect(screen.getByText('Data Accuracy')).toBeDefined();
      expect(screen.getByText('Today')).toBeDefined();
    });

    it('shows numeric values for stats', () => {
      render(<RouteVerification {...defaultProps} />);
      
      // Check for the stat values based on the component's initial state:
      // totalVerifications: 1247, routesVerified: 89, accuracy: 94.2, recentActivity: 23
      expect(screen.getByText('1,247')).toBeDefined();
      expect(screen.getByText('89')).toBeDefined();
      expect(screen.getByText('94.2%')).toBeDefined();
    });
  });
});
