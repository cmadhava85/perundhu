import { render, screen, fireEvent } from '@testing-library/react';
import SearchForm from '../SearchForm';
import type { Location } from '../../types';

describe('SearchForm Component', () => {
  const mockLocations: Location[] = [
    { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
    { id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
    { id: 3, name: 'Madurai', latitude: 9.9252, longitude: 78.1198 }
  ];
  
  const mockDestinations: Location[] = [
    { id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
    { id: 3, name: 'Madurai', latitude: 9.9252, longitude: 78.1198 }
  ];
  
  const mockSetFromLocation = jest.fn();
  const mockSetToLocation = jest.fn();
  const mockOnSearch = jest.fn();
  const mockResetResults = jest.fn();
  
  const defaultProps = {
    locations: mockLocations,
    destinations: mockDestinations,
    fromLocation: null,
    toLocation: null,
    setFromLocation: mockSetFromLocation,
    setToLocation: mockSetToLocation,
    onSearch: mockOnSearch,
    resetResults: mockResetResults
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders search form with location dropdowns', () => {
    render(<SearchForm {...defaultProps} />);
    
    expect(screen.getByLabelText(/from:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search buses/i })).toBeInTheDocument();
  });
  
  test('search button is disabled when locations are not selected', () => {
    render(<SearchForm {...defaultProps} />);
    
    const searchButton = screen.getByRole('button', { name: /search buses/i });
    expect(searchButton).toBeDisabled();
  });
  
  test('search button is enabled when both locations are selected', () => {
    const fromLocation = mockLocations[0];
    const toLocation = mockDestinations[0];
    
    render(
      <SearchForm 
        {...defaultProps} 
        fromLocation={fromLocation} 
        toLocation={toLocation} 
      />
    );
    
    const searchButton = screen.getByRole('button', { name: /search buses/i });
    expect(searchButton).not.toBeDisabled();
  });
  
  test('selecting from location calls setFromLocation', () => {
    render(<SearchForm {...defaultProps} />);
    
    // First click the input field to show the dropdown
    const fromInput = screen.getByLabelText(/from:/i);
    fireEvent.click(fromInput);
    
    // Then click on the first location item in the dropdown
    const firstLocationOption = screen.getByText('Chennai');
    fireEvent.click(firstLocationOption);
    
    expect(mockSetFromLocation).toHaveBeenCalledWith(mockLocations[0]);
    expect(mockResetResults).toHaveBeenCalled();
  });
  
  test('selecting to location calls setToLocation', () => {
    const fromLocation = mockLocations[0];
    
    render(
      <SearchForm 
        {...defaultProps} 
        fromLocation={fromLocation} 
      />
    );
    
    // First click the input field to show the dropdown
    const toInput = screen.getByLabelText(/to:/i);
    fireEvent.click(toInput);
    
    // Then click on the first destination item in the dropdown
    const firstDestinationOption = screen.getByText('Coimbatore');
    fireEvent.click(firstDestinationOption);
    
    expect(mockSetToLocation).toHaveBeenCalledWith(mockDestinations[0]);
    expect(mockResetResults).toHaveBeenCalled();
  });
  
  test('clicking search button calls onSearch', () => {
    const fromLocation = mockLocations[0];
    const toLocation = mockDestinations[0];
    
    render(
      <SearchForm 
        {...defaultProps} 
        fromLocation={fromLocation} 
        toLocation={toLocation} 
      />
    );
    
    const searchButton = screen.getByRole('button', { name: /search buses/i });
    fireEvent.click(searchButton);
    
    expect(mockOnSearch).toHaveBeenCalled();
  });
});