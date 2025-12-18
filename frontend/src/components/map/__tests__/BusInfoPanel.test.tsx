import { render, screen, fireEvent } from '../../../test-utils';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import BusInfoPanel from '../BusInfoPanel';
import type { BusLocation } from '../../../types';

// Mock the react-i18next hook
vi.mock('react-i18next', () => ({
  useTranslation: () => {
    return {
      t: (key: string, fallback: string) => fallback || key,
      i18n: {
        language: 'en'
      }
    };
  }
}));

describe('BusInfoPanel Component', () => {
  // Test data
  const mockBus: BusLocation = {
    busId: 1,
    busName: 'SETC Express',
    busNumber: 'TN-01-1234',
    fromLocation: 'Chennai',
    toLocation: 'Coimbatore',
    latitude: 12.5,
    longitude: 78.5,
    speed: 65, // 65 m/s = 234.0 km/h
    heading: 45,
    timestamp: new Date('2025-06-13T10:30:00').toISOString(),
    lastReportedStopName: 'Vellore',
    nextStopName: 'Salem',
    estimatedArrivalTime: '11:15',
    reportCount: 5,
    confidenceScore: 85
  };
  
  const mockOnClose = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders bus information correctly', () => {
    render(<BusInfoPanel bus={mockBus} onClose={mockOnClose} />);
    
    // Check that the bus name and number are displayed
    expect(screen.getByText(`${mockBus.busName} ${mockBus.busNumber}`)).toBeInTheDocument();
    
    // Check all info fields are present
    expect(screen.getByText(/Last updated/)).toBeInTheDocument();
    expect(screen.getByText(/Speed/)).toBeInTheDocument();
    expect(screen.getByText(/Next stop/)).toBeInTheDocument();
    expect(screen.getByText(/ETA/)).toBeInTheDocument();
    expect(screen.getByText(/Active trackers/)).toBeInTheDocument();
    expect(screen.getByText(/Confidence/)).toBeInTheDocument();
    
    // Check that the values are displayed correctly - using regex to be more flexible
    expect(screen.getByText(/10:30/)).toBeInTheDocument(); // Formatted time
    expect(screen.getByText(/234.0 km\/h/)).toBeInTheDocument(); // Converted speed
    expect(screen.getByText('Salem')).toBeInTheDocument(); // Next stop
    expect(screen.getByText('11:15')).toBeInTheDocument(); // ETA
    expect(screen.getByText('5')).toBeInTheDocument(); // Active trackers
    expect(screen.getByText(/85/)).toBeInTheDocument(); // Confidence score
  });
  
  it('calls onClose when close button is clicked', () => {
    render(<BusInfoPanel bus={mockBus} onClose={mockOnClose} />);
    
    // Click the close button (×)
    fireEvent.click(screen.getByText('×'));
    
    // Check that onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('displays "N/A" for missing nextStopName', () => {
    const busWithoutNextStop = { ...mockBus, nextStopName: '' };
    render(<BusInfoPanel bus={busWithoutNextStop} onClose={mockOnClose} />);
    
    // Check that a dash is shown when next stop is missing
    expect(screen.getByText('-')).toBeInTheDocument();
  });
  
  it('displays "N/A" for missing estimatedArrivalTime', () => {
    const busWithoutETA = { ...mockBus, estimatedArrivalTime: '' };
    render(<BusInfoPanel bus={busWithoutETA} onClose={mockOnClose} />);
    
    // Check that a dash is shown when ETA is missing
    expect(screen.getByText('-')).toBeInTheDocument();
  });
  
  it('formats time correctly', () => {
    const busWithDifferentTime = {
      ...mockBus,
      timestamp: new Date('2025-06-13T15:45:00').toISOString() // Afternoon time
    };
    
    render(<BusInfoPanel bus={busWithDifferentTime} onClose={mockOnClose} />);
    
    // Check that time is formatted correctly - use regex to be more flexible with the format
    expect(screen.getByText(/03:45/)).toBeInTheDocument();
  });
  
  it('handles invalid timestamp', () => {
    const busWithInvalidTime = {
      ...mockBus,
      timestamp: 'invalid-date'
    };
    
    render(<BusInfoPanel bus={busWithInvalidTime} onClose={mockOnClose} />);
    
    // Should display "Invalid Date" when parsing fails
    expect(screen.getByText(/Invalid Date/i)).toBeInTheDocument();
  });
  
  it('displays high confidence score with green color', () => {
    const busWithHighConfidence = { ...mockBus, confidenceScore: 95 };
    const { container } = render(<BusInfoPanel bus={busWithHighConfidence} onClose={mockOnClose} />);
    
    // Use querySelector instead of the non-existent getByClassName
    const confidenceBarFill = container.querySelector('.confidence-bar-fill');
    expect(confidenceBarFill).toHaveStyle('width: 95%');
    expect(confidenceBarFill).toHaveStyle('background-color: rgb(76, 175, 80)'); // Green for high confidence
  });
  
  it('displays medium confidence score with yellow color', () => {
    const busWithMediumConfidence = { ...mockBus, confidenceScore: 50 };
    const { container } = render(<BusInfoPanel bus={busWithMediumConfidence} onClose={mockOnClose} />);
    
    // Use querySelector instead of the non-existent getByClassName
    const confidenceBarFill = container.querySelector('.confidence-bar-fill');
    expect(confidenceBarFill).toHaveStyle('width: 50%');
    expect(confidenceBarFill).toHaveStyle('background-color: rgb(255, 193, 7)'); // Yellow for medium confidence
  });
  
  it('displays low confidence score with red color', () => {
    const busWithLowConfidence = { ...mockBus, confidenceScore: 25 };
    const { container } = render(<BusInfoPanel bus={busWithLowConfidence} onClose={mockOnClose} />);
    
    // Use querySelector instead of the non-existent getByClassName
    const confidenceBarFill = container.querySelector('.confidence-bar-fill');
    expect(confidenceBarFill).toHaveStyle('width: 25%');
    expect(confidenceBarFill).toHaveStyle('background-color: rgb(255, 0, 0)'); // Red for low confidence
  });
});