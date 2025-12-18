import { render, screen, fireEvent, waitFor } from '../../../test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddStopsToRoute } from '../AddStopsToRoute';
import type { Bus } from '../../../types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback || key,
    i18n: { language: 'en' }
  })
}));

// Mock API services
vi.mock('../../../services/api', () => ({
  searchBuses: vi.fn(() => Promise.resolve([])),
  getStops: vi.fn(() => Promise.resolve([])),
  getLocations: vi.fn(() => Promise.resolve([
    { id: 1, name: 'Chennai', translatedName: 'சென்னை' },
    { id: 2, name: 'Madurai', translatedName: 'மதுரை' },
    { id: 3, name: 'Trichy', translatedName: 'திருச்சி' }
  ]))
}));

const mockBus: Bus = {
  id: 1,
  busName: 'Chennai Express',
  busNumber: 'TN01AB1234',
  from: 'Chennai',
  to: 'Madurai',
  departureTime: '06:00',
  arrivalTime: '12:00',
  fare: 350
};

describe('AddStopsToRoute Component', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    onError: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => render(<AddStopsToRoute {...defaultProps} />)).not.toThrow();
    });

    it('displays info banner with title', () => {
      render(<AddStopsToRoute {...defaultProps} />);
      expect(screen.getByText('Add Stops to Existing Route')).toBeDefined();
    });

    it('displays description text', () => {
      render(<AddStopsToRoute {...defaultProps} />);
      expect(screen.getByText(/Help improve our data by adding intermediate stops/)).toBeDefined();
    });
  });

  describe('Without pre-selected bus', () => {
    it('shows route selection step first', () => {
      render(<AddStopsToRoute {...defaultProps} />);
      expect(screen.getByText('Find the Route')).toBeDefined();
    });

    it('shows From and To input fields', () => {
      render(<AddStopsToRoute {...defaultProps} />);
      expect(screen.getByPlaceholderText('Enter starting location')).toBeDefined();
      expect(screen.getByPlaceholderText('Enter destination')).toBeDefined();
    });

    it('has disabled Find Buses button when locations not selected', () => {
      render(<AddStopsToRoute {...defaultProps} />);
      const button = screen.getByRole('button', { name: /Find Buses/i });
      expect(button).toBeDisabled();
    });
  });

  describe('With pre-selected bus', () => {
    it('skips route selection and shows selected bus', () => {
      render(<AddStopsToRoute {...defaultProps} preSelectedBus={mockBus} />);
      expect(screen.getByText('Selected Route')).toBeDefined();
    });

    it('displays bus details as read-only', () => {
      render(<AddStopsToRoute {...defaultProps} preSelectedBus={mockBus} />);
      
      // Check for disabled inputs with bus info
      const busNumberInput = screen.getByDisplayValue('TN01AB1234');
      expect(busNumberInput).toBeDisabled();
      
      const busNameInput = screen.getByDisplayValue('Chennai Express');
      expect(busNameInput).toBeDisabled();
    });

    it('shows locked badge', () => {
      render(<AddStopsToRoute {...defaultProps} preSelectedBus={mockBus} />);
      // The locked badge contains "🔒 Locked"
      expect(screen.getByText(/Locked/)).toBeDefined();
    });

    it('displays readonly notice', () => {
      render(<AddStopsToRoute {...defaultProps} preSelectedBus={mockBus} />);
      expect(screen.getByText(/Route details cannot be edited/)).toBeDefined();
    });

    it('shows Add Stop button', async () => {
      render(<AddStopsToRoute {...defaultProps} preSelectedBus={mockBus} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Stop/i })).toBeDefined();
      });
    });
  });

  describe('Adding stops', () => {
    it('adds a new stop entry when Add Stop is clicked', async () => {
      render(<AddStopsToRoute {...defaultProps} preSelectedBus={mockBus} />);
      
      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /Add Stop/i });
        fireEvent.click(addButton);
      });

      // Should now have a stop entry with location input
      expect(screen.getByPlaceholderText('Enter stop name')).toBeDefined();
    });

    it('shows time inputs for new stops', async () => {
      render(<AddStopsToRoute {...defaultProps} preSelectedBus={mockBus} />);
      
      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /Add Stop/i });
        fireEvent.click(addButton);
      });

      // Check for time inputs - they have type="time" attribute
      const timeInputs = document.querySelectorAll('input[type="time"]');
      expect(timeInputs.length).toBeGreaterThanOrEqual(2);
    });

    it('can remove a stop entry', async () => {
      render(<AddStopsToRoute {...defaultProps} preSelectedBus={mockBus} />);
      
      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /Add Stop/i });
        fireEvent.click(addButton);
      });

      // Find and click remove button
      const removeButton = screen.getByTitle('Remove stop');
      fireEvent.click(removeButton);

      // Stop input should be gone
      expect(screen.queryByPlaceholderText('Enter stop name')).toBeNull();
    });
  });

  describe('Form submission', () => {
    it('submit button is disabled when no stops added', async () => {
      render(<AddStopsToRoute {...defaultProps} preSelectedBus={mockBus} />);
      
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Submit Stops/i });
        expect(submitButton).toBeDisabled();
      });
    });

    it('shows cancel button when onCancel is provided', async () => {
      render(<AddStopsToRoute {...defaultProps} preSelectedBus={mockBus} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeDefined();
      });
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const onCancel = vi.fn();
      render(<AddStopsToRoute {...defaultProps} preSelectedBus={mockBus} onCancel={onCancel} />);
      
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /Cancel/i });
        fireEvent.click(cancelButton);
      });

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for inputs', () => {
      render(<AddStopsToRoute {...defaultProps} />);
      expect(screen.getByText(/From/)).toBeDefined();
      expect(screen.getByText(/To/)).toBeDefined();
    });

    it('inputs are focusable', () => {
      render(<AddStopsToRoute {...defaultProps} />);
      const fromInput = screen.getByPlaceholderText('Enter starting location');
      fromInput.focus();
      expect(document.activeElement).toBe(fromInput);
    });
  });
});
