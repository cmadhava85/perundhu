import { render, screen, fireEvent } from '@testing-library/react';
import BusItem from '../BusItem';
import type { Bus, Stop } from '../../types';

// Mock StopsList to simplify testing
jest.mock('../StopsList', () => {
  return function MockStopsList({ stops }: { stops: Stop[] }) {
    return (
      <div data-testid="stops-list">
        <h4>Stops</h4>
        {stops.map((stop, index) => (
          <div key={index} data-testid={`stop-item-${index}`}>
            {stop.name}
          </div>
        ))}
      </div>
    );
  };
});

// react-i18next is automatically mocked by Jest
describe('BusItem Component', () => {
  const mockBus: Bus = {
    id: 1,
    from: 'Chennai',
    to: 'Coimbatore',
    busName: 'SETC Express',
    busNumber: 'TN-01-1234',
    departureTime: '06:00 AM',
    arrivalTime: '12:30 PM'
  };

  const mockStops: Stop[] = [
    {
      id: 1,
      name: 'Chennai',
      arrivalTime: '06:00 AM',
      departureTime: '06:15 AM',
      order: 1
    },
    {
      id: 2,
      name: 'Vellore',
      arrivalTime: '08:30 AM',
      departureTime: '08:45 AM',
      order: 2
    },
    {
      id: 3,
      name: 'Coimbatore',
      arrivalTime: '12:30 PM',
      departureTime: '12:45 PM',
      order: 3
    }
  ];
  
  const mockSelectBus = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders bus details correctly', () => {
    render(
      <BusItem 
        bus={mockBus}
        selectedBusId={null}
        stops={[]}
        onSelectBus={mockSelectBus}
      />
    );
    
    // Verify both bus name and number are displayed together
    expect(screen.getByText('SETC Express TN-01-1234')).toBeInTheDocument();
    
    // Verify route info is displayed
    expect(screen.getByText('Chennai → Coimbatore')).toBeInTheDocument();
    
    // Verify times are displayed
    expect(screen.getByText('06:00 AM')).toBeInTheDocument();
    expect(screen.getByText('12:30 PM')).toBeInTheDocument();
  });
  
  test('calls onSelectBus when clicked', () => {
    render(
      <BusItem 
        bus={mockBus}
        selectedBusId={null}
        stops={[]}
        onSelectBus={mockSelectBus}
      />
    );
    
    const busItem = screen.getByText('SETC Express TN-01-1234').closest('.bus-item');
    fireEvent.click(busItem!);
    
    expect(mockSelectBus).toHaveBeenCalledWith(mockBus.id);
  });
  
  test('displays bus details when selected', () => {
    render(
      <BusItem 
        bus={mockBus}
        selectedBusId={mockBus.id}
        stops={mockStops}
        onSelectBus={mockSelectBus}
      />
    );
    
    // StopsList component should be rendered when bus is selected
    expect(screen.getByText('Stops')).toBeInTheDocument();
    expect(screen.getByText('Chennai')).toBeInTheDocument();
    expect(screen.getByText('Vellore')).toBeInTheDocument();
    expect(screen.getByText('Coimbatore')).toBeInTheDocument();
    
    // Check that the bus item has the 'expanded' class
    const busItem = screen.getByText('SETC Express TN-01-1234').closest('.bus-item');
    expect(busItem).toHaveClass('expanded');
  });
  
  test('does not display bus details when not selected', () => {
    render(
      <BusItem 
        bus={mockBus}
        selectedBusId={999} // Different ID than the bus
        stops={mockStops}
        onSelectBus={mockSelectBus}
      />
    );
    
    // StopsList shouldn't be rendered
    expect(screen.queryByText('Stops')).not.toBeInTheDocument();
    
    // Check that the bus item doesn't have the 'expanded' class
    const busItem = screen.getByText('SETC Express TN-01-1234').closest('.bus-item');
    expect(busItem).not.toHaveClass('expanded');
  });
});