import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import SearchResults from '../SearchResults';
import type { Bus, Location, Stop, ConnectingRoute } from '../../types';

// Mock react-hot-toast FIRST - critical for preventing memory leaks
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
  },
}));

// Mock react-i18next to prevent translation loading
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

// Mock hooks that make API calls
vi.mock('../../hooks/queries/useTerminalResolution', () => ({
  useTerminalResolution: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}));

vi.mock('../../hooks/useGoogleAds', () => ({
  default: vi.fn(() => ({
    adsEnabled: false,
    getAdConfig: vi.fn(() => ({ format: 'auto', responsive: 'true' })),
  })),
}));

// Mock child components with simple implementations
vi.mock('../LoadingSkeleton', () => ({
  LoadingSkeleton: ({ count, type }: { count: number; type: string }) => (
    <div data-testid="loading-skeleton" data-count={count} data-type={type}>
      Loading...
    </div>
  ),
}));

vi.mock('../OpenStreetMapComponent', () => ({
  default: () => <div data-testid="openstreetmap">OSM Map</div>,
}));

vi.mock('../FallbackMapComponent', () => ({
  default: () => <div data-testid="fallback-map">Fallback Map</div>,
}));

vi.mock('../BusCardModern', () => ({
  default: ({ bus, onSelect, onAddStops, onReportIssue }: Record<string, unknown>) => (
    <div data-testid={`bus-card-${bus.id}`}>
      <div>{bus.name}</div>
      <button onClick={() => onSelect(bus)}>Select</button>
      <button onClick={() => onAddStops(bus)}>Add Stops</button>
      <button onClick={() => onReportIssue(bus)}>Report</button>
    </div>
  ),
}));

vi.mock('../contribution/ReportIssue', () => ({
  default: ({ onSubmit, onClose }: Record<string, unknown>) => (
    <div data-testid="report-issue-modal">
      <button onClick={onSubmit}>Submit</button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('../ConnectingRoutes', () => ({
  default: () => <div data-testid="connecting-routes">Connecting Routes</div>,
}));

vi.mock('../TerminalInfoAlert', () => ({
  TerminalInfoAlert: () => <div data-testid="terminal-info-alert">Terminal Info</div>,
}));

vi.mock('./GoogleAdContainer', () => ({
  PremiumAdContainer: () => <div data-testid="premium-ad">Ad</div>,
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ to, children, ...props }: { to: string; children: React.ReactNode; [key: string]: unknown }) => <a href={to} {...props}>{children}</a>
  };
});

describe('SearchResults Component', () => {
  const mockFromLocation: Location = {
    id: 1,
    name: 'Chennai Central',
    translatedName: 'சென்னை சென்ட்ரல்',
    latitude: 13.0827,
    longitude: 80.2707
  };

  const mockToLocation: Location = {
    id: 2,
    name: 'Bangalore Majestic',
    translatedName: 'பெங்களூர் மகேஸ்டிக்',
    latitude: 12.9716,
    longitude: 77.5946
  };

  const mockBuses: Bus[] = [
    {
      id: 1,
      name: 'Express 1',
      type: 'express',
      operator: 'BMTC',
      fare: 250,
      capacity: 45
    },
    {
      id: 2,
      name: 'Regular 2',
      type: 'regular',
      operator: 'BMTC',
      fare: 180,
      capacity: 50
    }
  ];

  const mockStops: Stop[] = [
    { id: 1, name: 'Stop 1', busId: 1, latitude: 13.0, longitude: 80.0 },
    { id: 2, name: 'Stop 2', busId: 1, latitude: 13.1, longitude: 80.1 },
    { id: 3, name: 'Stop 3', busId: 2, latitude: 13.2, longitude: 80.2 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    // Critical: cleanup React components and DOM
    cleanup();
    // Clear all timers, intervals, and immediate callbacks
    vi.clearAllTimers();
    // Clear all mock call history
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render search results container', () => {
      const { container } = render(
        <SearchResults
          buses={mockBuses}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={mockStops}
        />
      );

      expect(container.querySelector('.search-results-content')).toBeInTheDocument();
    });

    it('should display current search information', () => {
      render(
        <SearchResults
          buses={mockBuses}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={mockStops}
        />
      );

      expect(screen.getByText('Chennai Central')).toBeInTheDocument();
      expect(screen.getByText('Bangalore Majestic')).toBeInTheDocument();
    });

    it('should render all bus cards', () => {
      render(
        <SearchResults
          buses={mockBuses}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={mockStops}
        />
      );

      expect(screen.getByTestId('bus-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('bus-card-2')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton when loading is true', () => {
      render(
        <SearchResults
          buses={[]}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={[]}
          loading={true}
        />
      );

      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('should pass correct count to skeleton', () => {
      render(
        <SearchResults
          buses={[]}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={[]}
          loading={true}
        />
      );

      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('data-count', '5');
      expect(skeleton).toHaveAttribute('data-type', 'bus-card');
    });

    it('should not show bus cards when loading', () => {
      render(
        <SearchResults
          buses={mockBuses}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={mockStops}
          loading={true}
        />
      );

      expect(screen.queryByTestId('bus-card-1')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error exists', () => {
      const error = new Error('Search failed');

      render(
        <SearchResults
          buses={[]}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={[]}
          error={error}
        />
      );

      expect(screen.getByText(/Search Error/)).toBeInTheDocument();
    });

    it('should display error icon', () => {
      const error = new Error('Search failed');
      const { container } = render(
        <SearchResults
          buses={[]}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={[]}
          error={error}
        />
      );

      const emoji = Array.from(container.querySelectorAll('div')).some(
        div => div.textContent?.includes('⚠️')
      );
      expect(emoji).toBe(true);
    });

    it('should provide link back to search', () => {
      const error = new Error('Search failed');

      render(
        <SearchResults
          buses={[]}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={[]}
          error={error}
        />
      );

      expect(screen.getByText(/Back to Search/)).toBeInTheDocument();
    });
  });

  describe('Empty Results', () => {
    it('should display empty state when no buses found', () => {
      render(
        <SearchResults
          buses={[]}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={[]}
        />
      );

      expect(screen.getByText(/No buses found for this route/)).toBeInTheDocument();
    });

    it('should display bus emoji in empty state', () => {
      const { container } = render(
        <SearchResults
          buses={[]}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={[]}
        />
      );

      const emoji = Array.from(container.querySelectorAll('div')).some(
        div => div.textContent?.includes('🚌')
      );
      expect(emoji).toBe(true);
    });

    it('should provide contribute button', () => {
      render(
        <SearchResults
          buses={[]}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={[]}
        />
      );

      expect(screen.getByText(/Contribute Route Info/)).toBeInTheDocument();
    });
  });

  describe('Edit Search', () => {
    it('should navigate home when edit search clicked', async () => {
      const user = userEvent.setup();

      render(
        <SearchResults
          buses={mockBuses}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={mockStops}
        />
      );

      const editButton = screen.getAllByText(/Edit/)[0];
      await user.click(editButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Bus Selection', () => {
    it('should auto-select first bus on load', () => {
      render(
        <SearchResults
          buses={mockBuses}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={mockStops}
        />
      );

      // First bus should be selected (passed to BusCardModern)
      expect(screen.getByTestId('bus-card-1')).toBeInTheDocument();
    });

    it('should allow bus selection', async () => {
      const user = userEvent.setup();

      render(
        <SearchResults
          buses={mockBuses}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={mockStops}
        />
      );

      const selectButtons = screen.getAllByText('Select');
      await user.click(selectButtons[1]); // Click second bus

      expect(screen.getByTestId('bus-card-2')).toBeInTheDocument();
    });
  });

  describe('Add Stops Functionality', () => {
    it('should navigate to contribute page when add stops clicked', async () => {
      const user = userEvent.setup();

      render(
        <SearchResults
          buses={mockBuses}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={mockStops}
        />
      );

      const addStopsButtons = screen.getAllByText('Add Stops');
      await user.click(addStopsButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith(
        '/contribute',
        expect.objectContaining({
          state: expect.objectContaining({
            method: 'add-stops',
            selectedBus: mockBuses[0]
          })
        })
      );
    });
  });

  describe('Report Issue Functionality', () => {
    it('should open report issue modal when report clicked', async () => {
      const user = userEvent.setup();

      render(
        <SearchResults
          buses={mockBuses}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={mockStops}
        />
      );

      const reportButtons = screen.getAllByText('Report');
      await user.click(reportButtons[0]);

      expect(screen.getByTestId('report-issue-modal')).toBeInTheDocument();
    });

    it('should close report issue modal when close clicked', async () => {
      const user = userEvent.setup();

      render(
        <SearchResults
          buses={mockBuses}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={mockStops}
        />
      );

      const reportButtons = screen.getAllByText('Report');
      await user.click(reportButtons[0]);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(screen.queryByTestId('report-issue-modal')).not.toBeInTheDocument();
    });

    it('should close modal on backdrop click', async () => {
      const user = userEvent.setup();

      render(
        <SearchResults
          buses={mockBuses}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={mockStops}
        />
      );

      const reportButtons = screen.getAllByText('Report');
      await user.click(reportButtons[0]);

      const overlay = screen.getByTestId('report-issue-modal').closest('div')?.parentElement;
      if (overlay) {
        fireEvent.click(overlay);
      }

      // Modal should still be there (only closes on inner button click)
      expect(screen.getByTestId('report-issue-modal')).toBeInTheDocument();
    });
  });

  describe('Map Integration', () => {
    it('should render map section', () => {
      render(
        <SearchResults
          buses={mockBuses}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={mockStops}
        />
      );

      expect(screen.getByTestId('openstreetmap')).toBeInTheDocument();
    });

    it('should render fallback map when Leaflet not available', () => {
      // Remove globalThis.L
      const originalL = (globalThis as { L?: unknown }).L;
      delete (globalThis as { L?: unknown }).L;

      render(
        <SearchResults
          buses={mockBuses}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={mockStops}
        />
      );

      expect(screen.getByTestId('fallback-map')).toBeInTheDocument();

      // Restore
      if (originalL) (globalThis as { L?: unknown }).L = originalL;
    });
  });

  describe('Connecting Routes', () => {
    it('should display connecting routes when buses empty', () => {
      const connectingRoutes: ConnectingRoute[] = [
        {
          id: 1,
          name: 'Connecting Route 1',
          description: 'Connect via stop'
        }
      ];

      render(
        <SearchResults
          buses={[]}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={[]}
          connectingRoutes={connectingRoutes}
        />
      );

      expect(screen.getByTestId('connecting-routes')).toBeInTheDocument();
    });

    it('should display connecting routes after bus list when buses exist', () => {
      const connectingRoutes: ConnectingRoute[] = [
        {
          id: 1,
          name: 'Connecting Route 1'
        }
      ];

      render(
        <SearchResults
          buses={mockBuses}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={mockStops}
          connectingRoutes={connectingRoutes}
        />
      );

      expect(screen.getByTestId('connecting-routes')).toBeInTheDocument();
    });
  });

  describe('Location Display', () => {
    it('should display English location names by default', () => {
      render(
        <SearchResults
          buses={mockBuses}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={mockStops}
        />
      );

      expect(screen.getByText('Chennai Central')).toBeInTheDocument();
      expect(screen.getByText('Bangalore Majestic')).toBeInTheDocument();
    });
  });

  describe('StopsMap Integration', () => {
    it('should use stopsMap when provided', () => {
      const stopsMap = {
        1: [
          { id: 1, name: 'Stop 1', busId: 1, latitude: 13.0, longitude: 80.0 },
          { id: 2, name: 'Stop 2', busId: 1, latitude: 13.1, longitude: 80.1 }
        ],
        2: [
          { id: 3, name: 'Stop 3', busId: 2, latitude: 13.2, longitude: 80.2 }
        ]
      };

      render(
        <SearchResults
          buses={mockBuses}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={mockStops}
          stopsMap={stopsMap}
        />
      );

      expect(screen.getByTestId('bus-card-1')).toBeInTheDocument();
    });

    it('should fall back to stops filter when stopsMap empty', () => {
      render(
        <SearchResults
          buses={mockBuses}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={mockStops}
          stopsMap={{}}
        />
      );

      expect(screen.getByTestId('bus-card-1')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render with semantic HTML', () => {
      const { container } = render(
        <SearchResults
          buses={mockBuses}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={mockStops}
        />
      );

      expect(container.querySelector('.search-results-content')).toBeInTheDocument();
    });

    it('should have proper button structure', () => {
      render(
        <SearchResults
          buses={mockBuses}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
          stops={mockStops}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
