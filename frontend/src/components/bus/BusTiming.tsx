import React from 'react';

interface BusTimingProps {
  departureTime: string;
  arrivalTime: string;
  duration: string;
}

const BusTiming: React.FC<BusTimingProps> = ({
  departureTime,
  arrivalTime,
  duration
}) => {
  return (
    <div className="timing-row">
      <div className="time-info">
        <span className="departure-time">{departureTime}</span>
        <span className="route-separator">→</span>
        <span className="arrival-time">{arrivalTime}</span>
        <span className="duration-inline">({duration})</span>
      </div>
    </div>
  );
};

export default BusTiming;