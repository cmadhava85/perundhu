import { render, screen } from '@testing-library/react';
import StopsList from '../StopsList';
import type { Stop } from '../../types';

describe('StopsList Component', () => {
  const mockStops: Stop[] = [
    { id: 1, name: 'Chennai', arrivalTime: '06:00 AM', departureTime: '06:00 AM', order: 1 },
    { id: 2, name: 'Vellore', arrivalTime: '07:30 AM', departureTime: '07:35 AM', order: 2 },
    { id: 3, name: 'Salem', arrivalTime: '09:30 AM', departureTime: '09:40 AM', order: 3 },
    { id: 4, name: 'Coimbatore', arrivalTime: '12:30 PM', departureTime: '12:30 PM', order: 4 }
  ];
  
  test('renders stops list with correct stops', () => {
    render(<StopsList stops={mockStops} />);
    
    // Check heading
    expect(screen.getByText('Stops')).toBeInTheDocument();
    
    // Check all stop names
    expect(screen.getByText('Chennai')).toBeInTheDocument();
    expect(screen.getByText('Vellore')).toBeInTheDocument();
    expect(screen.getByText('Salem')).toBeInTheDocument();
    expect(screen.getByText('Coimbatore')).toBeInTheDocument();
    
    // Check times for one of the stops
    const velloreItem = screen.getByText('Vellore').closest('.stop-item');
    expect(velloreItem).toContainElement(screen.getByText('Arr: 07:30 AM'));
    expect(velloreItem).toContainElement(screen.getByText('Dep: 07:35 AM'));
  });
  
  test('returns null if stops array is empty', () => {
    const { container } = render(<StopsList stops={[]} />);
    expect(container.firstChild).toBeNull();
  });
  
  test('renders correct stop order', () => {
    render(<StopsList stops={mockStops} />);
    
    // Get all stops in the document
    const stopItems = screen.getAllByText(/Chennai|Vellore|Salem|Coimbatore/);
    expect(stopItems).toHaveLength(4);
    
    // Check the order of stops matches the expected order
    expect(stopItems[0].textContent).toBe('Chennai');
    expect(stopItems[1].textContent).toBe('Vellore');
    expect(stopItems[2].textContent).toBe('Salem');
    expect(stopItems[3].textContent).toBe('Coimbatore');
  });
});