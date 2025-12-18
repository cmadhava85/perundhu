import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { describe, expect, vi, beforeEach, test } from 'vitest';
import ConnectingRoutes from '../ConnectingRoutes';
import * as apiService from '../../services/api';

// Mock the API service
vi.mock('../../services/api', () => ({
  getStops: vi.fn()
}));

// react-i18next is automatically mocked via jest.config.ts

describe('ConnectingRoutes Component', () => {
  const mockConnectingRoutes = [
    {
      id: 'route-1',
      legs: [
        {
          busId: '1',
          busName: 'SETC Express',
          busNumber: 'TN-01-1234',
          fromStopId: 'stop-1',
          toStopId: 'stop-3',
          fromStop: { id: 'stop-1', name: 'Chennai', order: 1 },
          toStop: { id: 'stop-3', name: 'Trichy', order: 3 },
          departureTime: '06:00',
          arrivalTime: '11:30',
          duration: 330 // 5h 30m in minutes
        },
        {
          busId: '2',
          busName: 'TNSTC',
          busNumber: 'TN-02-5678',
          fromStopId: 'stop-3',
          toStopId: 'stop-4',
          fromStop: { id: 'stop-3', name: 'Trichy', order: 1 },
          toStop: { id: 'stop-4', name: 'Madurai', order: 2 },
          departureTime: '12:30',
          arrivalTime: '14:30',
          duration: 120 // 2h in minutes
        }
      ],
      transfers: 1,
      totalDuration: 510 // 8h 30m in minutes
    },
    {
      id: 'route-2',
      legs: [
        {
          busId: '3',
          busName: 'SETC Fast',
          busNumber: 'TN-01-9876',
          fromStopId: 'stop-1',
          toStopId: 'stop-5',
          fromStop: { id: 'stop-1', name: 'Chennai', order: 1 },
          toStop: { id: 'stop-5', name: 'Salem', order: 2 },
          departureTime: '07:00',
          arrivalTime: '11:00',
          duration: 240 // 4h in minutes
        },
        {
          busId: '4',
          busName: 'Private AC',
          busNumber: 'TN-03-5432',
          fromStopId: 'stop-5',
          toStopId: 'stop-4',
          fromStop: { id: 'stop-5', name: 'Salem', order: 1 },
          toStop: { id: 'stop-4', name: 'Madurai', order: 2 },
          departureTime: '11:30',
          arrivalTime: '15:00',
          duration: 210 // 3h 30m in minutes
        }
      ],
      transfers: 1,
      totalDuration: 480 // 8h in minutes
    }
  ];
  
  const mockStops = [
    { id: 1, name: 'Chennai', arrivalTime: '06:00 AM', departureTime: '06:00 AM', order: 1 },
    { id: 2, name: 'Villupuram', arrivalTime: '08:00 AM', departureTime: '08:05 AM', order: 2 },
    { id: 3, name: 'Trichy', arrivalTime: '11:30 AM', departureTime: '11:30 AM', order: 3 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (apiService.getStops as ReturnType<typeof vi.fn>).mockResolvedValue(mockStops);
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
    
    // Check for bus cards (now called bus-card instead of leg-card)
    const busCards = document.querySelectorAll('.bus-card');
    expect(busCards.length).toBe(2);
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
    const busCards = document.querySelectorAll('.bus-card');
    expect(busCards.length).toBe(2);
    
    const busDetails = document.querySelectorAll('.bus-details');
    expect(busDetails.length).toBe(2);
  });
});