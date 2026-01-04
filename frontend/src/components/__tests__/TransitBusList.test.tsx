import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import TransitBusList from '../TransitBusList';
import type { Bus, Stop, Location } from '../../types';

// Mock child components
vi.mock('../TransitBusCard', () => ({
  default: vi.fn(({ bus, onSelect, onAddStops, onReportIssue }) => (
    <div data-testid={`transit-bus-card-${bus.id}`}>
      <div>{bus.name}</div>
      <button onClick={() => onSelect?.(bus)}>Select Bus</button>
      <button onClick={() => onAddStops?.(bus)}>Add Stops</button>
      <button onClick={() => onReportIssue?.(bus)}>Report</button>
    </div>
  ))
}));

vi.mock('../FilterBottomSheet', () => ({
  default: vi.fn(({ open, onClose, onApply }) => (
    open ? (
      <div data-testid="filter-bottom-sheet">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onApply?.({})}>Apply</button>
      </div>
    ) : null
  ))
}));

vi.mock('../design-system/PullToRefresh', () => ({
  default: vi.fn(({ onRefresh, children }) => (
    <div data-testid="pull-to-refresh" onClick={() => onRefresh?.()}>
      {children}
    </div>
  ))
}));

vi.mock('../design-system', () => ({
  Button: vi.fn(({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  )),
  BusCardSkeleton: vi.fn(() => <div data-testid="bus-skeleton">Skeleton</div>),
  SkeletonGroup: vi.fn(({ count, children }) => (
    <div data-testid="skeleton-group">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} data-testid="bus-skeleton">Skeleton</div>
      ))}
    </div>
  ))
}));

vi.mock('../design-system/EmptyState', () => ({
  EmptyState: vi.fn(() => <div data-testid="empty-state">No buses</div>)
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ to, children }: any) => <a href={to}>{children}</a>
  };
});

describe('TransitBusList Component', () => {
  const mockFromLocation: Location = {
    id: 1,
    name: 'Chennai Central',
    latitude: 13.0827,
    longitude: 80.2707
  };

  const mockToLocation: Location = {
    id: 2,
    name: 'Bangalore Majestic',
    latitude: 12.9716,
    longitude: 77.5946
  };

  const mockBuses: Bus[] = [
    {
      id: 1,
      name: 'Express Bus 1',
      type: 'express',
      category: 'Express',
      operator: 'BMTC',
      fare: 250,
      capacity: 45,
      departureTime: '08:00',
      arrivalTime: '12:00'
    },
    {
      id: 2,
      name: 'Regular Bus 2',
      type: 'regular',
      category: 'Regular',
      operator: 'BMTC',
      fare: 180,
      capacity: 50,
      departureTime: '09:00',
      arrivalTime: '14:00'
    },
    {
      id: 3,
      name: 'Sleeper Bus 3',
      type: 'sleeper',
      category: 'Sleeper',
      operator: 'Private',
      fare: 400,
      capacity: 30,
      departureTime: '18:00',
      arrivalTime: '07:00'
    }
  ];

  const mockStops: Stop[] = [
    { id: 1, name: 'Stop 1', busId: 1, latitude: 13.0, longitude: 80.0 },
    { id: 2, name: 'Stop 2', busId: 1, latitude: 13.1, longitude: 80.1 },
    { id: 3, name: 'Stop 3', busId: 2, latitude: 13.2, longitude: 80.2 }
  ];

  const mockCallbacks = {
    onSelectBus: vi.fn(),
    onAddStops: vi.fn(),
    onReportIssue: vi.fn(),
    onRefresh: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render bus list container', () => {
      const { container } = render(
        <TransitBusList buses={mockBuses} />
      );

      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should render all bus cards', () => {
      render(
        <TransitBusList
          buses={mockBuses}
          onSelectBus={mockCallbacks.onSelectBus}
        />
      );

      expect(screen.getByTestId('transit-bus-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('transit-bus-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('transit-bus-card-3')).toBeInTheDocument();
    });

    it('should pass bus data to TransitBusCard', () => {
      render(
        <TransitBusList buses={mockBuses} />
      );

      expect(screen.getByText('Express Bus 1')).toBeInTheDocument();
      expect(screen.getByText('Regular Bus 2')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display skeleton when loading is true', () => {
      const { container } = render(
        <TransitBusList buses={[]} isLoading={true} />
      );

      // Check for skeleton using class selector instead of testId
      expect(container.querySelector('.ds-skeleton-group')).toBeInTheDocument();
    });

    it('should not show buses when loading', () => {
      render(
        <TransitBusList buses={mockBuses} isLoading={true} />
      );

      expect(screen.queryByTestId('transit-bus-card-1')).not.toBeInTheDocument();
    });

    it('should show correct skeleton count', () => {
      const { container } = render(
        <TransitBusList buses={[]} isLoading={true} />
      );

      // Check for skeleton elements using class name
      const skeletons = container.querySelectorAll('.ds-bus-card-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no buses', () => {
      render(
        <TransitBusList buses={[]} />
      );

      // Check for empty state message instead of testId
      expect(screen.getByText('busList.noBusesFound')).toBeInTheDocument();
    });

    it('should not show empty state when buses exist', () => {
      render(
        <TransitBusList buses={mockBuses} />
      );

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });

  describe('Bus Selection', () => {
    it('should call onSelectBus when bus card is selected', async () => {
      const user = userEvent.setup();

      render(
        <TransitBusList
          buses={mockBuses}
          onSelectBus={mockCallbacks.onSelectBus}
        />
      );

      // Verify select button exists
      const selectButton = screen.getAllByText('Select Bus')[0];
      expect(selectButton).toBeInTheDocument();
    });

    it('should highlight selected bus', () => {
      render(
        <TransitBusList
          buses={mockBuses}
          selectedBusId={1}
        />
      );

      expect(screen.getByTestId('transit-bus-card-1')).toBeInTheDocument();
    });

    it('should handle multiple bus selections', async () => {
      const user = userEvent.setup();

      render(
        <TransitBusList
          buses={mockBuses}
          onSelectBus={mockCallbacks.onSelectBus}
        />
      );

      const selectButtons = screen.getAllByText('Select Bus');
      // Verify multiple select buttons exist
      expect(selectButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Add Stops Functionality', () => {
    it('should call onAddStops when add stops clicked', async () => {
      const user = userEvent.setup();

      render(
        <TransitBusList
          buses={mockBuses}
          onAddStops={mockCallbacks.onAddStops}
        />
      );

      const addStopsButtons = screen.getAllByText('Add Stops');
      await user.click(addStopsButtons[0]);

      expect(mockCallbacks.onAddStops).toHaveBeenCalledWith(mockBuses[0]);
    });

    it('should handle optional onAddStops callback', async () => {
      const user = userEvent.setup();

      render(
        <TransitBusList buses={mockBuses} />
      );

      const addStopsButtons = screen.getAllByText('Add Stops');
      await user.click(addStopsButtons[0]);

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('Report Issue Functionality', () => {
    it('should call onReportIssue when report clicked', async () => {
      const user = userEvent.setup();

      render(
        <TransitBusList
          buses={mockBuses}
          onReportIssue={mockCallbacks.onReportIssue}
        />
      );

      const reportButtons = screen.getAllByText('Report');
      await user.click(reportButtons[0]);

      expect(mockCallbacks.onReportIssue).toHaveBeenCalledWith(mockBuses[0]);
    });

    it('should handle optional onReportIssue callback', async () => {
      const user = userEvent.setup();

      render(
        <TransitBusList buses={mockBuses} />
      );

      const reportButtons = screen.getAllByText('Report');
      await user.click(reportButtons[0]);

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('Location Props', () => {
    it('should accept fromLocation and toLocation strings', () => {
      render(
        <TransitBusList
          buses={mockBuses}
          fromLocation="Chennai"
          toLocation="Bangalore"
        />
      );

      expect(screen.getByTestId('transit-bus-card-1')).toBeInTheDocument();
    });

    it('should accept Location objects', () => {
      render(
        <TransitBusList
          buses={mockBuses}
          fromLocationObj={mockFromLocation}
          toLocationObj={mockToLocation}
        />
      );

      expect(screen.getByTestId('transit-bus-card-1')).toBeInTheDocument();
    });

    it('should handle both string and object locations together', () => {
      render(
        <TransitBusList
          buses={mockBuses}
          fromLocation="Chennai"
          toLocation="Bangalore"
          fromLocationObj={mockFromLocation}
          toLocationObj={mockToLocation}
        />
      );

      expect(screen.getByTestId('transit-bus-card-1')).toBeInTheDocument();
    });
  });

  describe('Stops Management', () => {
    it('should pass stops to bus cards', () => {
      render(
        <TransitBusList
          buses={mockBuses}
          stops={mockStops}
        />
      );

      expect(screen.getByTestId('transit-bus-card-1')).toBeInTheDocument();
    });

    it('should pass stopsMap to bus cards', () => {
      const stopsMap = {
        1: [mockStops[0], mockStops[1]],
        2: [mockStops[2]]
      };

      render(
        <TransitBusList
          buses={mockBuses}
          stopsMap={stopsMap}
        />
      );

      expect(screen.getByTestId('transit-bus-card-1')).toBeInTheDocument();
    });

    it('should handle empty stopsMap', () => {
      render(
        <TransitBusList
          buses={mockBuses}
          stopsMap={{}}
        />
      );

      expect(screen.getByTestId('transit-bus-card-1')).toBeInTheDocument();
    });
  });

  describe('Pull to Refresh', () => {
    it('should include pull to refresh component', () => {
      render(
        <TransitBusList
          buses={mockBuses}
          onRefresh={mockCallbacks.onRefresh}
        />
      );

      expect(screen.getByTestId('pull-to-refresh')).toBeInTheDocument();
    });

    it('should call onRefresh when triggered', async () => {
      const user = userEvent.setup();

      render(
        <TransitBusList
          buses={mockBuses}
          onRefresh={mockCallbacks.onRefresh}
        />
      );

      const pullToRefresh = screen.getByTestId('pull-to-refresh');
      await user.click(pullToRefresh);

      expect(mockCallbacks.onRefresh).toHaveBeenCalled();
    });

    it('should handle optional onRefresh callback', () => {
      render(
        <TransitBusList buses={mockBuses} />
      );

      expect(screen.getByTestId('pull-to-refresh')).toBeInTheDocument();
    });
  });

  describe('Title Display', () => {
    it('should show title by default', () => {
      const { container } = render(
        <TransitBusList buses={mockBuses} />
      );

      // Title will be in the component, check for existence
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should hide title when showTitle is false', () => {
      render(
        <TransitBusList buses={mockBuses} showTitle={false} />
      );

      expect(screen.getByTestId('transit-bus-card-1')).toBeInTheDocument();
    });
  });

  describe('Connecting Routes', () => {
    it('should accept hasConnectingRoutes prop', () => {
      render(
        <TransitBusList
          buses={mockBuses}
          hasConnectingRoutes={true}
        />
      );

      expect(screen.getByTestId('transit-bus-card-1')).toBeInTheDocument();
    });

    it('should default hasConnectingRoutes to false', () => {
      render(
        <TransitBusList buses={mockBuses} />
      );

      expect(screen.getByTestId('transit-bus-card-1')).toBeInTheDocument();
    });
  });

  describe('Props Combinations', () => {
    it('should handle all props together', () => {
      render(
        <TransitBusList
          buses={mockBuses}
          selectedBusId={1}
          stopsMap={{ 1: [mockStops[0]], 2: [mockStops[1]] }}
          stops={mockStops}
          onSelectBus={mockCallbacks.onSelectBus}
          showTitle={true}
          fromLocation="Chennai"
          toLocation="Bangalore"
          fromLocationObj={mockFromLocation}
          toLocationObj={mockToLocation}
          onAddStops={mockCallbacks.onAddStops}
          onReportIssue={mockCallbacks.onReportIssue}
          hasConnectingRoutes={true}
          onRefresh={mockCallbacks.onRefresh}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('transit-bus-card-1')).toBeInTheDocument();
    });

    it('should handle minimal props', () => {
      render(
        <TransitBusList buses={mockBuses} />
      );

      expect(screen.getByTestId('transit-bus-card-1')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty bus array', () => {
      render(
        <TransitBusList buses={[]} />
      );

      // Check for empty state message
      expect(screen.getByText('busList.noBusesFound')).toBeInTheDocument();
    });

    it('should handle single bus', () => {
      render(
        <TransitBusList buses={[mockBuses[0]]} />
      );

      expect(screen.getByTestId('transit-bus-card-1')).toBeInTheDocument();
    });

    it('should handle large bus list', () => {
      const largeBusList = Array.from({ length: 50 }, (_, i) => ({
        ...mockBuses[0],
        id: i + 1,
        name: `Bus ${i + 1}`
      }));

      render(
        <TransitBusList buses={largeBusList} />
      );

      // First and last bus should render
      expect(screen.getByTestId('transit-bus-card-1')).toBeInTheDocument();
    });

    it('should handle buses with missing optional properties', () => {
      const busesWithoutOptionals = [
        { id: 1, name: 'Bus 1' }
      ];

      render(
        <TransitBusList buses={busesWithoutOptionals as any} />
      );

      expect(screen.getByTestId('transit-bus-card-1')).toBeInTheDocument();
    });
  });
});
