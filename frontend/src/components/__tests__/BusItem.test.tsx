import { render, screen } from '../../test-utils';
import { describe, it, expect, vi } from 'vitest';
import BusItem from '../bus-list/BusItem';
import type { Bus, Stop } from '../../types';

const mockBus: Bus = {
  id: 1,
  busName: 'Express Bus',
  busNumber: 'TN01AB1234',
  from: 'Chennai',
  to: 'Bangalore',
  departureTime: '10:00',
  arrivalTime: '16:00'
};

const mockBusStops: Stop[] = [
  { id: 1, name: 'Chennai Central', arrivalTime: '10:00', departureTime: '10:05', order: 1 },
  { id: 2, name: 'Salem', arrivalTime: '13:00', departureTime: '13:05', order: 2 },
  { id: 3, name: 'Bangalore', arrivalTime: '16:00', departureTime: '16:00', order: 3 }
];

describe('BusItem Component', () => {
const defaultProps = {
  bus: mockBus,
  isSelected: false,
  stops: mockBusStops,
  onSelect: vi.fn(),
};  it('renders bus basic information', () => {
    render(<BusItem {...defaultProps} />);
    
    expect(screen.getByText('Express Bus')).toBeDefined();
    expect(screen.getByText('TN01AB1234')).toBeDefined();
  });

  it('renders without crashing', () => {
    expect(() => render(<BusItem {...defaultProps} />)).not.toThrow();
  });

  it('displays bus component structure', () => {
    render(<BusItem {...defaultProps} />);
    
    // Check that the component renders with some content
    const component = screen.getByText('Express Bus');
    expect(component).toBeDefined();
  });
});