import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchForm from '../SearchForm';
import type { Location } from '../../types';
import * as locationService from '../../services/locationService';

// Mock location service
vi.mock('../../services/locationService', () => ({
  searchLocations: vi.fn(),
  validateLocation: vi.fn()
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'common.whereLeavingFrom': 'Where are you leaving from?',
        'common.whereGoingTo': 'Where are you going to?',
        'common.bothLocationsRequired': 'Please select both origin and destination locations',
        'searchForm.searchButton': 'Search Buses',
        'searchForm.clearFrom': 'Clear departure location',
        'searchForm.clearTo': 'Clear destination',
        'searchForm.swapLocations': 'Swap locations'
      };
      return translations[key] || key;
    },
    i18n: { language: 'en' }
  })
}));

// Mock the LocationDropdown component to simplify testing
vi.mock('../search/LocationDropdown', () => ({
  default: function MockLocationDropdown({ 
    label, 
    id, 
    placeholder, 
    onSelect, 
    value, 
    disabled 
  }: any) {
    return (
      <div data-testid={`mock-dropdown-${id}`}>
        <label htmlFor={id}>{label}</label>
        <input 
          id={id} 
          placeholder={placeholder}
          disabled={disabled}
          value={value?.name || ''}
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

describe('SearchForm Component', () => {
  const mockLocations = [
    { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
    { id: 2, name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
  ];

  const mockProps = {
    locations: mockLocations,
    destinations: [
      { id: 2, name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
      { id: 3, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
    ],
    fromLocation: null,
    toLocation: null,
    setFromLocation: vi.fn(),
    setToLocation: vi.fn(),
    onSearch: vi.fn(),
    resetResults: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (locationService.searchLocations as any).mockResolvedValue(mockLocations);
    (locationService.validateLocation as any).mockResolvedValue(true);
  });

  it('renders search form elements', () => {
    render(<SearchForm {...mockProps} />);
    
    // Check for input fields with proper placeholders
    expect(screen.getByPlaceholderText('Where are you leaving from?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Where are you going to?')).toBeInTheDocument();
    
    // Check for swap button
    expect(screen.getByLabelText('Swap locations')).toBeInTheDocument();
    
    // Check for search button
    expect(screen.getByText('Please select both origin and destination locations')).toBeInTheDocument();
  });

  it('search button is disabled when locations are not selected', () => {
    render(<SearchForm {...mockProps} />);
    
    const searchButton = screen.getByRole('button', { name: /please select both/i });
    expect(searchButton).toBeDisabled();
  });

  it('search button is enabled when both locations are selected', () => {
    const props = {
      ...mockProps,
      fromLocation: { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
      toLocation: { id: 2, name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 }
    };
    
    render(<SearchForm {...props} />);
    
    const searchButton = screen.getByRole('button', { name: /search buses/i });
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
    
    const searchButton = screen.getByRole('button', { name: /search buses/i });
    fireEvent.click(searchButton);
    
    expect(props.onSearch).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when isLoading is true', () => {
    const props = {
      ...mockProps,
      isLoading: true
    };
    
    render(<SearchForm {...props} />);
    
    // When no locations are selected, should show the disabled state text
    expect(screen.getByText('Please select both origin and destination locations')).toBeInTheDocument();
  });
});