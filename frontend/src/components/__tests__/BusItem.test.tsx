import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BusItem from '../BusItem';
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
    selectedBusId: null,
    stops: mockBusStops,
    onSelectBus: vi.fn()
  };

  it('renders bus details correctly', () => {
    render(<BusItem {...defaultProps} />);
    
    expect(screen.getByText('Express Bus')).toBeInTheDocument();
    expect(screen.getByText('TN01AB1234')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('16:00')).toBeInTheDocument();
  });

  it('calls onSelectBus when clicked', () => {
    const onSelectBus = vi.fn();
    render(<BusItem {...defaultProps} onSelectBus={onSelectBus} />);
    
    // Click on the main bus item container instead of looking for a specific button
    const busItem = screen.getByText('Express Bus').closest('.compact-bus-item');
    fireEvent.click(busItem!);
    
    expect(onSelectBus).toHaveBeenCalledWith(1);
  });

  it('displays stops when selected', () => {
    render(<BusItem {...defaultProps} selectedBusId={1} />);
    
    expect(screen.getByText('Chennai Central')).toBeInTheDocument();
    expect(screen.getByText('Salem')).toBeInTheDocument();
    expect(screen.getByText('Bangalore')).toBeInTheDocument();
  });
});