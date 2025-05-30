import { render, screen } from '@testing-library/react';
import BusList from '../BusList';
import type { Bus } from '../../types';

// Mock the BusItem component to simplify testing
jest.mock('../BusItem', () => {
  // Remove unused parameter completely
  return function MockBusItem({ bus, onSelectBus }: { 
    bus: Bus; 
    onSelectBus: (id: number) => void 
  }) {
    return (
      <div data-testid={`bus-item-${bus.id}`} className="bus-item">
        <div>Bus: {bus.busName} {bus.busNumber}</div>
        <div>From: {bus.from} to {bus.to}</div>
        <button onClick={() => onSelectBus(bus.id)}>Select</button>
      </div>
    );
  };
});

// react-i18next is automatically mocked by Jest
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
  
  const mockSelectBus = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders heading and bus items', () => {
    render(
      <BusList 
        buses={mockBuses}
        selectedBusId={null}
        stops={[]}
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
        stops={[]}
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
        stops={[{ id: 1, name: 'Test Stop', arrivalTime: '10:00 AM', departureTime: '10:05 AM', order: 1 }]}
        onSelectBus={mockSelectBus}
      />
    );
    
    // Check that all buses are rendered
    const busItems = screen.getAllByTestId(/bus-item-/);
    expect(busItems).toHaveLength(2);
    
    // Check bus specific details are rendered correctly
    expect(screen.getByText('Bus: SETC Express TN-01-1234')).toBeInTheDocument();
    expect(screen.getByText('From: Chennai to Coimbatore')).toBeInTheDocument();
    expect(screen.getByText('Bus: TNSTC TN-02-5678')).toBeInTheDocument();
    expect(screen.getByText('From: Chennai to Madurai')).toBeInTheDocument();
  });
});