import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import BusList from '../BusList';
import type { Bus } from '../../types';

// Mock the BusItem component to simplify testing
vi.mock('../BusItem', () => ({
  default: function MockBusItem({ bus, onSelectBus }: { 
    bus: Bus; 
    onSelectBus: (busId: number) => void 
  }) {
    return (
      <div 
        data-testid={`bus-item-${bus.id}`} 
        onClick={() => onSelectBus(bus.id)}
      >
        {bus.busName} - {bus.from} to {bus.to}
      </div>
    );
  }
}));

// react-i18next is automatically mocked by Vitest
describe('BusList Component', () => {
  const mockBuses: Bus[] = [
    {
      id: 1,
      from: 'Chennai',
      to: 'Coimbatore',
      busName: 'SETC Express',
      busNumber: 'TN-01-1234',
      departureTime: '06:00 AM',
      arrivalTime: '12:30 PM'
    },
    {
      id: 2,
      from: 'Chennai',
      to: 'Madurai',
      busName: 'TNSTC',
      busNumber: 'TN-02-5678',
      departureTime: '07:00 AM',
      arrivalTime: '02:00 PM'
    }
  ];
  
  const mockSelectBus = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  test('renders heading and bus items', () => {
    render(
      <BusList 
        buses={mockBuses}
        selectedBusId={null}
        stopsMap={{}}
        onSelectBus={mockSelectBus}
      />
    );
    
    // Check heading - "Available Buses" instead of translation key
    expect(screen.getByText('Available Buses')).toBeInTheDocument();
    
    // Check bus items are rendered
    expect(screen.getByTestId('bus-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('bus-item-2')).toBeInTheDocument();
    expect(screen.getAllByTestId(/bus-item-/)).toHaveLength(2);
  });
  
  test('returns null if buses array is empty', () => {
    const { container } = render(
      <BusList 
        buses={[]}
        selectedBusId={null}
        stopsMap={{}}
        onSelectBus={mockSelectBus}
      />
    );
    
    // Check that the component renders nothing
    expect(container.firstChild).toBeNull();
  });
  
  test('passes correct props to BusItem components', () => {
    render(
      <BusList 
        buses={mockBuses}
        selectedBusId={1}
        stopsMap={{ 1: [{ id: 1, name: 'Test Stop', arrivalTime: '10:00 AM', departureTime: '10:05 AM', order: 1 }] }}
        onSelectBus={mockSelectBus}
      />
    );
    
    // Check that all buses are rendered
    const busItems = screen.getAllByTestId(/bus-item-/);
    expect(busItems).toHaveLength(2);
    
    // Check bus specific details are rendered correctly
    expect(screen.getByText('SETC Express - Chennai to Coimbatore')).toBeInTheDocument();
    expect(screen.getByText('TNSTC - Chennai to Madurai')).toBeInTheDocument();
  });
  
  it('calls onSelectBus when bus item is clicked', () => {
    render(
      <BusList 
        buses={mockBuses} 
        onSelectBus={mockSelectBus}
        selectedBusId={null}
        stopsMap={{}}
      />
    );
    
    // Click on the first bus item using the test ID
    const firstBusItem = screen.getByTestId('bus-item-1');
    fireEvent.click(firstBusItem);
    
    // The BusItem component calls onSelectBus with busId, which BusList then converts to the full bus object
    expect(mockSelectBus).toHaveBeenCalledWith(mockBuses[0]);
  });
});