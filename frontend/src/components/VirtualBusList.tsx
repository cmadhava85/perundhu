import React, { memo, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import type { Bus } from '../types';
import '../styles/transit-design-system.css';
import '../styles/transit-bus-card.css';

interface BusRowData {
  buses: Bus[];
  selectedBusId: number | null | undefined;
  onBusClick?: (bus: Bus) => void;
}

interface BusRowProps {
  index: number;
  style: React.CSSProperties;
  data: BusRowData;
}

const BusRow = memo(({ index, style, data }: BusRowProps) => {
  const bus = data.buses[index];
  const isSelected = data.selectedBusId === bus.id;

  return (
    <div style={style}>
      <button
        type="button"
        className={`transit-bus-card ${isSelected ? 'selected' : ''}`}
        onClick={() => data.onBusClick?.(bus)}
        aria-label={`Bus ${bus.number || bus.busNumber} from ${bus.fromLocation?.name} to ${bus.toLocation?.name}`}
        aria-pressed={isSelected}
      >
        <div className="bus-card-header">
          <div className="bus-info">
            <h3 className="bus-name">{bus.name || bus.busName}</h3>
            <span className="bus-number">{bus.number || bus.busNumber}</span>
          </div>
        </div>

        <div className="timing-section">
          <div className="time-display">
            <div className="departure-info">
              <span className="time-label">Departs</span>
              <span className="time-value">{bus.departureTime.split(':').slice(0, 2).join(':')}</span>
              <span className="location-name">{bus.fromLocation?.name}</span>
            </div>

            <div className="journey-info">
              <div className="duration-badge">
                <span className="duration-value">
                  {calculateDuration(bus.departureTime, bus.arrivalTime)}
                </span>
              </div>
              <div className="journey-line" />
            </div>

            <div className="arrival-info">
              <span className="time-label">Arrives</span>
              <span className="time-value">{bus.arrivalTime.split(':').slice(0, 2).join(':')}</span>
              <span className="location-name">{bus.toLocation?.name}</span>
            </div>
          </div>
        </div>

        {bus.features && Object.keys(bus.features).length > 0 && (
          <div className="bus-features">
            {Object.entries(bus.features).map(([key, value]) => (
              <span key={key} className="feature-badge">
                {String(value)}
              </span>
            ))}
          </div>
        )}
      </button>
    </div>
  );
});

BusRow.displayName = 'BusRow';

interface VirtualBusListProps {
  buses: Bus[];
  onBusClick?: (bus: Bus) => void;
  selectedBusId?: number | null;
  height?: number;
}

/**
 * Virtualized bus list component for better performance with large datasets
 * Only renders visible items, dramatically improving performance for 100+ buses
 */
export const VirtualBusList: React.FC<VirtualBusListProps> = ({
  buses,
  onBusClick,
  selectedBusId,
  height = 600,
}) => {
  const itemHeight = 160; // Height of each bus card

  const rowData = useMemo<BusRowData>(() => ({
    buses,
    selectedBusId,
    onBusClick,
  }), [buses, selectedBusId, onBusClick]);

  if (buses.length === 0) {
    return (
      <div className="empty-state">
        <p>No buses found</p>
      </div>
    );
  }

  return (
    <List
      height={height}
      itemCount={buses.length}
      itemSize={itemHeight}
      width="100%"
      overscanCount={3} // Render 3 extra items for smooth scrolling
      itemData={rowData}
    >
      {BusRow}
    </List>
  );
};

// Helper function to calculate duration
function calculateDuration(departureTime: string | null | undefined, arrivalTime: string | null | undefined): string {
  try {
    if (!departureTime || !arrivalTime) return 'N/A';
    // Treat "00:00" as invalid/missing time
    if (departureTime === '00:00' || departureTime === '00:00:00') return 'N/A';
    if (arrivalTime === '00:00' || arrivalTime === '00:00:00') return 'N/A';
    
    const [depHours, depMinutes] = departureTime.split(':').map(Number);
    const [arrHours, arrMinutes] = arrivalTime.split(':').map(Number);

    let totalMinutes = (arrHours * 60 + arrMinutes) - (depHours * 60 + depMinutes);
    
    // Handle next-day arrival
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }
    
    // Don't show duration if it's 0
    if (totalMinutes === 0) return 'N/A';

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  } catch {
    return 'N/A';
  }
}

export default VirtualBusList;
