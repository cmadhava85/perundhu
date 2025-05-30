import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConnectingRoutes from '../ConnectingRoutes';
import * as apiService from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  getStops: jest.fn()
}));

// react-i18next is automatically mocked via jest.config.ts

describe('ConnectingRoutes Component', () => {
  const mockConnectingRoutes = [
    {
      id: 1,
      isDirectRoute: false,
      firstLeg: {
        id: 1,
        from: 'Chennai',
        to: 'Trichy',
        busName: 'SETC Express',
        busNumber: 'TN-01-1234',
        departureTime: '06:00 AM',
        arrivalTime: '11:30 AM'
      },
      connectionPoint: 'Trichy',
      secondLeg: {
        id: 2,
        from: 'Trichy',
        to: 'Madurai',
        busName: 'TNSTC',
        busNumber: 'TN-02-5678',
        departureTime: '12:30 PM',
        arrivalTime: '02:30 PM'
      },
      waitTime: '01:00',
      totalDuration: '8h 30m'
    },
    {
      id: 2,
      isDirectRoute: false,
      firstLeg: {
        id: 3,
        from: 'Chennai',
        to: 'Salem',
        busName: 'SETC Fast',
        busNumber: 'TN-01-9876',
        departureTime: '07:00 AM',
        arrivalTime: '11:00 AM'
      },
      connectionPoint: 'Salem',
      secondLeg: {
        id: 4,
        from: 'Salem',
        to: 'Madurai',
        busName: 'Private AC',
        busNumber: 'TN-03-5432',
        departureTime: '11:30 AM',
        arrivalTime: '03:00 PM'
      },
      waitTime: '00:30',
      totalDuration: '8h 0m'
    }
  ];
  
  const mockStops = [
    { id: 1, name: 'Chennai', arrivalTime: '06:00 AM', departureTime: '06:00 AM', order: 1 },
    { id: 2, name: 'Villupuram', arrivalTime: '08:00 AM', departureTime: '08:05 AM', order: 2 },
    { id: 3, name: 'Trichy', arrivalTime: '11:30 AM', departureTime: '11:30 AM', order: 3 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.getStops as jest.Mock).mockResolvedValue(mockStops);
  });

  test('renders connecting routes title when routes exist', () => {
    render(<ConnectingRoutes connectingRoutes={mockConnectingRoutes} />);
    
    // Since our i18n mock now returns the actual text, not the key
    const titleElement = screen.getByRole('heading', { level: 2 });
    expect(titleElement).toBeInTheDocument();
    
    // Use querySelector instead of getByClassName
    const subtitle = document.querySelector('.connecting-routes-subtitle');
    expect(subtitle).toBeInTheDocument();
  });

  test('returns null when no connecting routes are provided', () => {
    const { container } = render(<ConnectingRoutes connectingRoutes={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders multiple connecting routes correctly', () => {
    render(<ConnectingRoutes connectingRoutes={mockConnectingRoutes} />);
    
    // Check for route information using more specific selectors
    const fromElements = screen.getAllByText('Chennai');
    expect(fromElements).toHaveLength(2);
    
    // Use getAllByText and check length instead of getByText
    const trichyElements = screen.getAllByText('Trichy');
    expect(trichyElements.length).toBeGreaterThan(0);
    
    const salemElements = screen.getAllByText('Salem');
    expect(salemElements.length).toBeGreaterThan(0);
    
    // Check for the total duration elements 
    const durationElements = screen.getAllByText(/8h/);
    expect(durationElements.length).toBeGreaterThan(0);
  });

  test('clicking on a route expands it to show details', async () => {
    render(<ConnectingRoutes connectingRoutes={mockConnectingRoutes} />);
    
    // Click on the first route card
    const routeCards = document.querySelectorAll('.connecting-route-card');
    const firstRoute = routeCards[0];
    if (firstRoute) {
      fireEvent.click(firstRoute);
    }
    
    // Wait for expanded view using class or elements that will be displayed
    await waitFor(() => {
      expect(document.querySelector('.route-details')).toBeInTheDocument();
    });
    
    // Check for leg cards
    const legCards = document.querySelectorAll('.leg-card');
    expect(legCards.length).toBe(2);
  });

  test('displays route details when expanded', async () => {
    render(<ConnectingRoutes connectingRoutes={mockConnectingRoutes} />);
    
    // First expand the route
    const routeCards = document.querySelectorAll('.connecting-route-card');
    const firstRoute = routeCards[0];
    if (firstRoute) {
      fireEvent.click(firstRoute);
    }
    
    // Wait for expanded section to appear
    await waitFor(() => {
      expect(document.querySelector('.route-details')).toBeInTheDocument();
    });
    
    // Verify route details are displayed by checking specific elements
    const legDetails = document.querySelectorAll('.leg-details');
    expect(legDetails.length).toBe(2);
    
    const busTimeElements = document.querySelectorAll('.bus-time');
    expect(busTimeElements.length).toBe(2);
  });
});