import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BusCardModern from '../BusCardModern';
import type { Bus, Stop, Location } from '../../types';

// Mock data
const mockBus: Bus = {
  id: 1,
  busName: 'Chennai Express',
  busNumber: '123A',
  from: 'Chennai',
  to: 'Bangalore',
  fromLocationId: 1,
  toLocationId: 2,
  departureTime: '14:30',
  arrivalTime: '20:30',
  category: 'Express',
  busType: 'AC Deluxe',
  status: 'On Time',
  duration: '6h 0m',
  name: 'Chennai Express',
  routeName: 'Chennai - Bangalore',
  isLive: false,
  availability: 'available',
  capacity: 45,
};

const mockStops: Stop[] = [
  {
    id: 1,
    name: 'CMBT',
    translatedName: 'சென்னை மொஃபுசில் பேருந்து நிலையம்',
    arrivalTime: '14:30',
    departureTime: '14:30',
    order: 1,
    stopOrder: 1,
    busId: 1,
  },
  {
    id: 2,
    name: 'Koyambedu',
    translatedName: 'கோயம்பேடு',
    arrivalTime: '14:45',
    departureTime: '14:50',
    order: 2,
    stopOrder: 2,
    busId: 1,
  },
  {
    id: 3,
    name: 'Bangalore',
    translatedName: 'பெங்களூரு',
    arrivalTime: '20:30',
    departureTime: '20:30',
    order: 3,
    stopOrder: 3,
    busId: 1,
  },
];

const mockFromLocation: Location = {
  id: 1,
  name: 'Chennai',
  translatedName: 'சென்னை',
  latitude: 13.0827,
  longitude: 80.2707,
  type: 'city',
};

const mockToLocation: Location = {
  id: 2,
  name: 'Bangalore',
  translatedName: 'பெங்களூரு',
  latitude: 12.9716,
  longitude: 77.5946,
  type: 'city',
};

describe('BusCardModern', () => {
  const mockOnSelect = vi.fn();
  const mockOnAddStops = vi.fn();
  const mockOnReportIssue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bus information correctly', () => {
    render(
      <BusCardModern
        bus={mockBus}
        index={0}
        isSelected={false}
        onSelect={mockOnSelect}
        fromLocation={mockFromLocation}
        toLocation={mockToLocation}
      />
    );

    expect(screen.getByText('Chennai Express')).toBeInTheDocument();
    expect(screen.getByText('123A')).toBeInTheDocument();
    expect(screen.getByText('14:30')).toBeInTheDocument();
    expect(screen.getByText('20:30')).toBeInTheDocument();
  });

  it('displays stops when provided', () => {
    render(
      <BusCardModern
        bus={mockBus}
        index={0}
        isSelected={true}
        onSelect={mockOnSelect}
        fromLocation={mockFromLocation}
        toLocation={mockToLocation}
        stops={mockStops}
      />
    );

    expect(screen.getByText('CMBT')).toBeInTheDocument();
    expect(screen.getByText('Koyambedu')).toBeInTheDocument();
    expect(screen.getByText('Bangalore')).toBeInTheDocument();
  });

  it('calls onSelect when card is clicked', () => {
    render(
      <BusCardModern
        bus={mockBus}
        index={0}
        isSelected={false}
        onSelect={mockOnSelect}
        fromLocation={mockFromLocation}
        toLocation={mockToLocation}
      />
    );

    const card = screen.getByRole('article');
    fireEvent.click(card);

    expect(mockOnSelect).toHaveBeenCalledWith(mockBus);
  });

  it('expands and collapses stops section', async () => {
    const { rerender: _rerender } = render(
      <BusCardModern
        bus={mockBus}
        index={0}
        isSelected={false}
        onSelect={mockOnSelect}
        fromLocation={mockFromLocation}
        toLocation={mockToLocation}
        stops={mockStops}
      />
    );

    // Initially collapsed
    const expandButton = screen.getByRole('button', { name: /show all stops/i });
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');

    // Click to expand
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });

    // Verify stops are visible
    expect(screen.getByText('CMBT')).toBeVisible();
  });

  it('calls onAddStops when Add Stops button is clicked', () => {
    render(
      <BusCardModern
        bus={mockBus}
        index={0}
        isSelected={false}
        onSelect={mockOnSelect}
        onAddStops={mockOnAddStops}
        fromLocation={mockFromLocation}
        toLocation={mockToLocation}
      />
    );

    const addStopsButton = screen.getByRole('button', { name: /add stops/i });
    fireEvent.click(addStopsButton);

    expect(mockOnAddStops).toHaveBeenCalledWith(mockBus);
  });

  it('calls onReportIssue when Report button is clicked', () => {
    render(
      <BusCardModern
        bus={mockBus}
        index={0}
        isSelected={false}
        onSelect={mockOnSelect}
        onReportIssue={mockOnReportIssue}
        fromLocation={mockFromLocation}
        toLocation={mockToLocation}
      />
    );

    const reportButton = screen.getByRole('button', { name: /report/i });
    fireEvent.click(reportButton);

    expect(mockOnReportIssue).toHaveBeenCalledWith(mockBus);
  });

  it('has proper accessibility attributes', () => {
    render(
      <BusCardModern
        bus={mockBus}
        index={0}
        isSelected={false}
        onSelect={mockOnSelect}
        fromLocation={mockFromLocation}
        toLocation={mockToLocation}
        stops={mockStops}
      />
    );

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-label');

    const expandButton = screen.getByRole('button', { name: /show all stops/i });
    expect(expandButton).toHaveAttribute('aria-expanded');
    expect(expandButton).toHaveAttribute('aria-label');
  });

  it('renders memoized component correctly on re-render', () => {
    const { rerender } = render(
      <BusCardModern
        bus={mockBus}
        index={0}
        isSelected={false}
        onSelect={mockOnSelect}
        fromLocation={mockFromLocation}
        toLocation={mockToLocation}
      />
    );

    // Verify initial render
    expect(screen.getByText('Chennai Express')).toBeInTheDocument();

    // Re-render with same props (should not re-render due to memo)
    rerender(
      <BusCardModern
        bus={mockBus}
        index={0}
        isSelected={false}
        onSelect={mockOnSelect}
        fromLocation={mockFromLocation}
        toLocation={mockToLocation}
      />
    );

    // Component should still be there
    expect(screen.getByText('Chennai Express')).toBeInTheDocument();
  });

  it('displays bus type and features', () => {
    render(
      <BusCardModern
        bus={mockBus}
        index={0}
        isSelected={false}
        onSelect={mockOnSelect}
        fromLocation={mockFromLocation}
        toLocation={mockToLocation}
      />
    );

    expect(screen.getByText('AC Deluxe')).toBeInTheDocument();
  });

  it('calculates and displays duration correctly', () => {
    render(
      <BusCardModern
        bus={mockBus}
        index={0}
        isSelected={false}
        onSelect={mockOnSelect}
        fromLocation={mockFromLocation}
        toLocation={mockToLocation}
      />
    );

    // Should show 6 hours duration
    expect(screen.getByText(/6h/)).toBeInTheDocument();
  });

  it('handles missing stops gracefully', () => {
    render(
      <BusCardModern
        bus={mockBus}
        index={0}
        isSelected={false}
        onSelect={mockOnSelect}
        fromLocation={mockFromLocation}
        toLocation={mockToLocation}
        stops={[]}
      />
    );

    // Should not show expand button when no stops
    expect(screen.queryByRole('button', { name: /show all stops/i })).not.toBeInTheDocument();
  });
});
