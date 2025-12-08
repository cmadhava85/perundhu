import React from 'react';

interface AvailabilityUpdate {
  isAvailable: boolean;
  lastUpdated: Date;
}

interface BusAvailabilityProps {
  stopsCount: number;
  isLiveTracking: boolean;
  onUpdate?: (availability: AvailabilityUpdate) => void;
}

const BusAvailability: React.FC<BusAvailabilityProps> = ({ stopsCount, isLiveTracking }) => {
  return (
    <div className="bus-availability">
      <div className="availability-info">
        <span className="stops-info">{stopsCount} stops</span>
        {isLiveTracking && <span className="live-indicator">Live</span>}
      </div>
    </div>
  );
};

export default BusAvailability;