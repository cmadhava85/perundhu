import React from 'react';
import { FixedSizeList as List } from 'react-window';
import type { Bus } from '../types';
import '../styles/transit-design-system.css';
import '../styles/transit-bus-card.css';

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

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const bus = buses[index];
    const isSelected = selectedBusId === bus.id;

    return (
      <div style={style}>
        <div
          className={`transit-bus-card ${isSelected ? 'selected' : ''}`}
          onClick={() => onBusClick?.(bus)}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onBusClick?.(bus);
            }
          }}
          aria-label={`Bus ${bus.number} from ${bus.fromLocation?.name} to ${bus.toLocation?.name}`}
        >
          <div className="bus-card-header">
            <div className="bus-info">
              <h3 className="bus-name">{bus.name}</h3>
              <span className="bus-number">{bus.number}</span>
            </div>
          </div>

          <div className="timing-section">
            <div className="time-display">
              <div className="departure-info">
                <span className="time-label">Departs</span>
                <span className="time-value">{bus.departureTime}</span>
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
                <span className="time-value">{bus.arrivalTime}</span>
                <span className="location-name">{bus.toLocation?.name}</span>
              </div>
            </div>
          </div>

          {bus.features && Object.keys(bus.features).length > 0 && (
            <div className="bus-features">
              {Object.entries(bus.features).map(([key, value]) => (
                <span key={key} className="feature-badge">
                  {value}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

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
    >
      {Row}
    </List>
  );
};

// Helper function to calculate duration
function calculateDuration(departureTime: string, arrivalTime: string): string {
  try {
    const [depHours, depMinutes] = departureTime.split(':').map(Number);
    const [arrHours, arrMinutes] = arrivalTime.split(':').map(Number);

    let totalMinutes = (arrHours * 60 + arrMinutes) - (depHours * 60 + depMinutes);
    
    // Handle next-day arrival
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }

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
