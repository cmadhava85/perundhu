import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchForm from '../SearchForm';
import type { Location } from '../../types/apiTypes';

// Mock the LocationDropdown component to simplify testing
vi.mock('../search/LocationDropdown', () => ({
  default: function MockLocationDropdown({ 
    label, 
    id, 
    placeholder, 
    onSelect, 
    selectedLocation, 
    disabled 
  }: any) {
    return (
      <div data-testid={`mock-dropdown-${id}`}>
        <label htmlFor={id}>{label}</label>
        <input 
          id={id} 
          placeholder={placeholder}
          disabled={disabled}
          value={selectedLocation?.name || ''}
          readOnly
        />
        <button 
          data-testid={`${id}-select-chennai`}
          onClick={() => onSelect({ id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 })}
        >
          Select Chennai
        </button>
        <button 
          data-testid={`${id}-select-coimbatore`}
          onClick={() => onSelect({ id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 })}
        >
          Select Coimbatore
        </button>
      </div>
    );
  }
}));

// Mock reference data service
vi.mock('../../services/referenceDataService', () => ({
  getBusTypes: vi.fn().mockResolvedValue([]),
  getOperators: vi.fn().mockResolvedValue([]),
  getDepartureTimeSlots: vi.fn().mockResolvedValue([])
}));

describe('SearchForm Component', () => {
  const mockLocations: Location[] = [
    { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
    { id: 2, name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
  ];

  const mockDestinations: Location[] = [
    { id: 2, name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
    { id: 3, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
  ];

  const mockProps = {
    locations: mockLocations,
    destinations: mockDestinations,
    fromLocation: null as Location | null,
    toLocation: null as Location | null,
    onFromLocationChange: vi.fn(),
    onToLocationChange: vi.fn(),
    onSearch: vi.fn(),
    isLoading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search form elements', () => {
    render(<SearchForm {...mockProps} />);
    
    // Check for title - use the actual rendered text
    expect(screen.getByText('Find Buses')).toBeInTheDocument();
    
    // Check for form labels - use the actual rendered text
    expect(screen.getByText('From:')).toBeInTheDocument();
    expect(screen.getByText('To:')).toBeInTheDocument();
    
    // Check for buttons using data-testid or class names since translations aren't working
    expect(screen.getByRole('button', { name: 'search.showAdvanced' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'search.findBuses' })).toBeInTheDocument();
  });

  it('search button is disabled when locations are not selected', () => {
    render(<SearchForm {...mockProps} />);
    
    const searchButton = screen.getByRole('button', { name: 'search.findBuses' });
    expect(searchButton).toBeDisabled();
  });

  it('search button is enabled when both locations are selected', () => {
    const props = {
      ...mockProps,
      fromLocation: { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
      toLocation: { id: 2, name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 }
    };
    
    render(<SearchForm {...props} />);
    
    const searchButton = screen.getByRole('button', { name: 'search.findBuses' });
    expect(searchButton).not.toBeDisabled();
  });

  it('displays selected from location', () => {
    const props = {
      ...mockProps,
      fromLocation: { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 }
    };
    
    render(<SearchForm {...props} />);
    
    expect(screen.getByDisplayValue('Chennai')).toBeInTheDocument();
  });

  it('displays selected to location', () => {
    const props = {
      ...mockProps,
      toLocation: { id: 2, name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 }
    };
    
    render(<SearchForm {...props} />);
    
    expect(screen.getByDisplayValue('Bangalore')).toBeInTheDocument();
  });

  it('calls onSearch when form is submitted with both locations', () => {
    const props = {
      ...mockProps,
      fromLocation: { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
      toLocation: { id: 2, name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 }
    };
    
    render(<SearchForm {...props} />);
    
    const searchButton = screen.getByRole('button', { name: 'search.findBuses' });
    fireEvent.click(searchButton);
    
    expect(props.onSearch).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when isLoading is true', () => {
    const props = {
      ...mockProps,
      isLoading: true
    };
    
    render(<SearchForm {...props} />);
    
    const searchButton = screen.getByRole('button', { name: 'search.searching' });
    expect(searchButton).toBeDisabled();
  });

  it('shows advanced options when toggle is clicked', () => {
    render(<SearchForm {...mockProps} />);
    
    const advancedToggle = screen.getByRole('button', { name: 'search.showAdvanced' });
    fireEvent.click(advancedToggle);
    
    // After clicking, the button text should change to hide advanced
    expect(screen.getByRole('button', { name: 'search.hideAdvanced' })).toBeInTheDocument();
    
    // Check for advanced option labels using the actual translation keys that are rendered
    expect(screen.getByText('search.busType')).toBeInTheDocument();
    expect(screen.getByText('search.departureTime')).toBeInTheDocument();
    expect(screen.getByText('search.operator')).toBeInTheDocument();
  });

  it('calls onFromLocationChange when from location is selected', () => {
    render(<SearchForm {...mockProps} />);
    
    const selectChennaiButton = screen.getByTestId('fromLocation-select-chennai');
    fireEvent.click(selectChennaiButton);
    
    expect(mockProps.onFromLocationChange).toHaveBeenCalledWith({
      id: 1, 
      name: 'Chennai', 
      latitude: 13.0827, 
      longitude: 80.2707
    });
  });

  it('calls onToLocationChange when to location is selected', () => {
    const props = {
      ...mockProps,
      fromLocation: { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 }
    };
    
    render(<SearchForm {...props} />);
    
    const selectCoimbatoreButton = screen.getByTestId('toLocation-select-coimbatore');
    fireEvent.click(selectCoimbatoreButton);
    
    expect(mockProps.onToLocationChange).toHaveBeenCalledWith({
      id: 2, 
      name: 'Coimbatore', 
      latitude: 11.0168, 
      longitude: 76.9558
    });
  });
});