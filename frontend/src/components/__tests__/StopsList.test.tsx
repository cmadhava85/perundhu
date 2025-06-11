import { render, screen, within } from '@testing-library/react';
import StopsList from '../StopsList';

// Mock the react-i18next hook
jest.mock('react-i18next', () => ({
  useTranslation: () => {
    return {
      t: (key: string) => {
        // Return mapped values for translation keys used in the test
        const translations: {[key: string]: string} = {
          'stopsList.stops': 'Stops',
          'stopsList.arrival': 'Arr:',
          'stopsList.departure': 'Dep:',
          'busItem.noStops': 'This is a direct bus with no intermediate stops'
        };
        return translations[key] || key;
      },
      i18n: {
        changeLanguage: jest.fn(),
        language: 'en'
      }
    };
  },
}));

describe('StopsList Component', () => {
  const mockStops = [
    { id: 1, name: 'Chennai', arrivalTime: '06:00 AM', departureTime: '06:00 AM', order: 1 },
    { id: 2, name: 'Vellore', arrivalTime: '07:30 AM', departureTime: '07:35 AM', order: 2 },
    { id: 3, name: 'Salem', arrivalTime: '09:30 AM', departureTime: '09:40 AM', order: 3 },
    { id: 4, name: 'Coimbatore', arrivalTime: '12:30 PM', departureTime: '12:30 PM', order: 4 }
  ];
  
  test('renders stops list with correct stops', () => {
    render(<StopsList stops={mockStops} />);
    
    // Check the heading
    expect(screen.getByText('Stops')).toBeInTheDocument();
    
    // Check that each stop is rendered
    mockStops.forEach(stop => {
      expect(screen.getByText(stop.name)).toBeInTheDocument();
    });
    
    // Check times for one of the stops - use a more specific approach with type assertion for HTMLElement
    const velloreItem = screen.getByText('Vellore').closest('.stop-item') as HTMLElement;
    expect(velloreItem).not.toBeNull();
    
    // Use within to scope queries to just the velloreItem, with proper type
    const velloreStopTimes = within(velloreItem).getAllByText(/07:3/);
    expect(velloreStopTimes).toHaveLength(2);
    expect(velloreStopTimes[0].textContent).toContain('07:30 AM');
    expect(velloreStopTimes[1].textContent).toContain('07:35 AM');
  });
  
  test('displays a message when stops array is empty', () => {
    render(<StopsList stops={[]} />);
    expect(screen.getByText('This is a direct bus with no intermediate stops')).toBeInTheDocument();
  });
  
  test('renders correct stop order', () => {
    render(<StopsList stops={mockStops} />);
    
    // Get all stop items
    const stopItems = screen.getAllByText(/Chennai|Vellore|Salem|Coimbatore/);
    
    // Check that they're in the correct order
    expect(stopItems[0].textContent).toBe('Chennai');
    expect(stopItems[1].textContent).toBe('Vellore');
    expect(stopItems[2].textContent).toBe('Salem');
    expect(stopItems[3].textContent).toBe('Coimbatore');
  });
});