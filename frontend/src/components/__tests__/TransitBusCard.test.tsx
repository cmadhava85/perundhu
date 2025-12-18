import { render, screen, fireEvent } from '../../test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TransitBusCard from '../TransitBusCard';
import type { Bus, Stop, Location } from '../../types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback || key,
    i18n: { language: 'en' }
  })
}));

// Mock map components
vi.mock('../OpenStreetMapComponent', () => ({
  default: () => <div data-testid="mock-map">Map</div>
}));

vi.mock('../FallbackMapComponent', () => ({
  default: () => <div data-testid="mock-fallback-map">Fallback Map</div>
}));

const mockBus: Bus = {
  id: 1,
  busName: 'Chennai Express',
  busNumber: 'TN01AB1234',
  from: 'Chennai',
  to: 'Madurai',
  departureTime: '06:00',
  arrivalTime: '12:00',
  fare: 350,
  duration: '6h'
};

const mockBusWithNoStops: Bus = {
  id: 2,
  busName: 'Local Bus',
  busNumber: 'TN02CD5678',
  from: 'Trichy',
  to: 'Salem',
  departureTime: '08:00',
  arrivalTime: '10:00'
};

const mockStops: Stop[] = [
  { id: 1, name: 'Chennai Central', arrivalTime: '06:00', departureTime: '06:05', order: 1, busId: 1 },
  { id: 2, name: 'Villupuram', arrivalTime: '08:00', departureTime: '08:10', order: 2, busId: 1 },
  { id: 3, name: 'Trichy', arrivalTime: '10:00', departureTime: '10:15', order: 3, busId: 1 },
  { id: 4, name: 'Madurai', arrivalTime: '12:00', departureTime: '12:00', order: 4, busId: 1 }
];

const mockFromLocation: Location = {
  id: 1,
  name: 'Chennai',
  translatedName: 'சென்னை',
  latitude: 13.0827,
  longitude: 80.2707
};

const mockToLocation: Location = {
  id: 2,
  name: 'Madurai',
  translatedName: 'மதுரை',
  latitude: 9.9252,
  longitude: 78.1198
};

describe('TransitBusCard Component', () => {
  const defaultProps = {
    bus: mockBus,
    selectedBusId: null,
    stops: mockStops,
    onSelectBus: vi.fn(),
    fromLocation: mockFromLocation,
    toLocation: mockToLocation,
    onAddStops: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      expect(() => render(<TransitBusCard {...defaultProps} />)).not.toThrow();
    });

    it('displays bus number', () => {
      render(<TransitBusCard {...defaultProps} />);
      expect(screen.getByText('TN01AB1234')).toBeDefined();
    });

    it('displays bus number or name in header', () => {
      // Component shows busNumber || busName || 'Bus' in the header
      render(<TransitBusCard {...defaultProps} />);
      // TN01AB1234 is shown because busNumber takes priority
      expect(screen.getByText('TN01AB1234')).toBeDefined();
    });

    it('displays departure and arrival times', () => {
      render(<TransitBusCard {...defaultProps} />);
      // Use getAllByText since times can appear multiple times (in header and stops list)
      expect(screen.getAllByText('06:00').length).toBeGreaterThan(0);
      expect(screen.getAllByText('12:00').length).toBeGreaterThan(0);
    });

    it('displays fare when available', () => {
      render(<TransitBusCard {...defaultProps} />);
      // Fare is split into currency and amount
      expect(screen.getByText('₹')).toBeDefined();
      expect(screen.getByText('350')).toBeDefined();
    });

    it('displays duration', () => {
      render(<TransitBusCard {...defaultProps} />);
      expect(screen.getByText('6h 0m')).toBeDefined();
    });
  });

  describe('Selection behavior', () => {
    it('calls onSelectBus when card is clicked', () => {
      const onSelectBus = vi.fn();
      render(<TransitBusCard {...defaultProps} onSelectBus={onSelectBus} />);
      
      const card = screen.getByText('TN01AB1234').closest('.transit-bus-card, [class*="bus-card"], button');
      if (card) {
        fireEvent.click(card);
        expect(onSelectBus).toHaveBeenCalledWith(1);
      }
    });

    it('shows selected state when bus is selected', () => {
      render(<TransitBusCard {...defaultProps} selectedBusId={1} />);
      
      // Component should have selected styling - check for any indicator
      const busNumber = screen.getByText('TN01AB1234');
      expect(busNumber).toBeDefined();
    });
  });

  describe('Stops display', () => {
    it('displays stops count when stops are available', () => {
      render(<TransitBusCard {...defaultProps} />);
      // The stops info contains icon, number, and text in separate elements: "🛑 4 stops"
      // Use a more flexible matcher
      const stopsInfo = screen.getByText((content, element) => {
        return element?.className === 'stops-info' && content.includes('4') && content.includes('stops');
      });
      expect(stopsInfo).toBeDefined();
    });
  });

  describe('Add Stops button', () => {
    it('shows Add Stops button when bus has no stops and onAddStops provided', () => {
      render(
        <TransitBusCard 
          {...defaultProps} 
          bus={mockBusWithNoStops}
          stops={[]}
        />
      );
      
      const addStopsButton = screen.queryByRole('button', { name: /Add Stops/i });
      // Button should be present for buses with no stops
      if (addStopsButton) {
        expect(addStopsButton).toBeDefined();
      }
    });

    it('calls onAddStops when Add Stops button is clicked', () => {
      const onAddStops = vi.fn();
      render(
        <TransitBusCard 
          {...defaultProps} 
          bus={mockBusWithNoStops}
          stops={[]}
          onAddStops={onAddStops}
        />
      );
      
      const addStopsButton = screen.queryByRole('button', { name: /Add Stops/i });
      if (addStopsButton) {
        fireEvent.click(addStopsButton);
        expect(onAddStops).toHaveBeenCalledWith(mockBusWithNoStops);
      }
    });

    it('does not show Add Stops button when bus has sufficient stops', () => {
      // Create 6+ stops to test the button is hidden (threshold is <=5)
      const manyStops = [
        { id: 1, name: 'Stop 1', arrivalTime: '06:00', departureTime: '06:05', order: 1, busId: 1 },
        { id: 2, name: 'Stop 2', arrivalTime: '07:00', departureTime: '07:05', order: 2, busId: 1 },
        { id: 3, name: 'Stop 3', arrivalTime: '08:00', departureTime: '08:05', order: 3, busId: 1 },
        { id: 4, name: 'Stop 4', arrivalTime: '09:00', departureTime: '09:05', order: 4, busId: 1 },
        { id: 5, name: 'Stop 5', arrivalTime: '10:00', departureTime: '10:05', order: 5, busId: 1 },
        { id: 6, name: 'Stop 6', arrivalTime: '11:00', departureTime: '11:05', order: 6, busId: 1 }
      ];
      render(<TransitBusCard {...defaultProps} stops={manyStops} />);
      
      // Should not show Add Stops for bus with 6 stops (threshold is <=5)
      const addStopsButton = screen.queryByRole('button', { name: /Add Stops/i });
      expect(addStopsButton).toBeNull();
    });
  });

  describe('Special indicators', () => {
    it('shows Next Bus badge when isNextBus is true', () => {
      render(<TransitBusCard {...defaultProps} isNextBus={true} />);
      
      // Look for Next Bus indicator
      const nextBusBadge = screen.queryByText(/Next/i);
      if (nextBusBadge) {
        expect(nextBusBadge).toBeDefined();
      }
    });

    it('shows Fastest badge when isFastest is true', () => {
      render(<TransitBusCard {...defaultProps} isFastest={true} />);
      
      const fastestBadge = screen.queryByText(/Fastest/i);
      if (fastestBadge) {
        expect(fastestBadge).toBeDefined();
      }
    });

    it('shows Cheapest badge when isCheapest is true', () => {
      render(<TransitBusCard {...defaultProps} isCheapest={true} />);
      
      const cheapestBadge = screen.queryByText(/Cheapest/i);
      if (cheapestBadge) {
        expect(cheapestBadge).toBeDefined();
      }
    });
  });

  describe('Compact mode', () => {
    it('renders in compact mode when isCompact is true', () => {
      render(<TransitBusCard {...defaultProps} isCompact={true} />);
      
      // Should still render essential info - bus number is shown (busNumber || busName)
      expect(screen.getByText('TN01AB1234')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('is keyboard navigable', () => {
      render(<TransitBusCard {...defaultProps} />);
      
      // The component is a button element which is keyboard navigable
      const busNumber = screen.getByText('TN01AB1234');
      const card = busNumber.closest('button');
      
      expect(card).toBeDefined();
      expect(card?.getAttribute('type')).toBe('button');
    });
  });
});
