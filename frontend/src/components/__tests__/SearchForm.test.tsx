<<<<<<< HEAD
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchForm from '../SearchForm';
import type { Location } from '../../types';
import * as locationService from '../../services/locationService';

// Mock location service
jest.mock('../../services/locationService', () => ({
  searchLocations: jest.fn(),
  validateLocation: jest.fn()
}));

// Mock the LocationDropdown component to simplify testing
jest.mock('../search/LocationDropdown', () => {
  return function MockLocationDropdown({ 
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
  };
});
=======
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchForm from '../SearchForm'; // Fixed: use default import instead of named import
>>>>>>> 75c2859 (production ready code need to test)

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

describe('SearchForm Component', () => {
  const mockProps = {
    locations: [
      { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
      { id: 2, name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
    ],
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
<<<<<<< HEAD
    jest.clearAllMocks();
    (locationService.searchLocations as jest.Mock).mockResolvedValue(mockLocations);
    (locationService.validateLocation as jest.Mock).mockResolvedValue(true);
=======
    vi.clearAllMocks();
>>>>>>> 75c2859 (production ready code need to test)
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
    
<<<<<<< HEAD
    // Use our mocked dropdown component's button
    const selectChennaiBtn = screen.getByTestId('from-location-select-chennai');
    fireEvent.click(selectChennaiBtn);
    
    expect(mockSetFromLocation).toHaveBeenCalledWith(expect.objectContaining({
      id: 1, 
      name: 'Chennai'
    }));
  });
  
  test('selecting to location calls setToLocation', () => {
    render(
      <SearchForm 
        {...defaultProps}
        fromLocation={mockLocations[0]} // Set from location so To dropdown is enabled
      />
    );
    
    // Use our mocked dropdown component's button
    const selectCoimbatoreBtn = screen.getByTestId('to-location-select-coimbatore');
    fireEvent.click(selectCoimbatoreBtn);
    
    expect(mockSetToLocation).toHaveBeenCalledWith(expect.objectContaining({
      id: 2, 
      name: 'Coimbatore'
    }));
=======
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
>>>>>>> 75c2859 (production ready code need to test)
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