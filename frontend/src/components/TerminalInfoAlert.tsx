import React from 'react';
import { MapPin, Info, Navigation } from 'lucide-react';

interface TerminalInfoAlertProps {
  terminal: {
    displayName: string;
    address: string;
    latitude: number;
    longitude: number;
    message?: string;
  };
}

export const TerminalInfoAlert: React.FC<TerminalInfoAlertProps> = ({ terminal }) => {
  const handleOpenMap = () => {
    const mapsUrl = `https://www.google.com/maps?q=${terminal.latitude},${terminal.longitude}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="terminal-info-card">
      <div className="terminal-info-header">
        <div className="terminal-icon-wrapper">
          <Info className="terminal-icon" />
        </div>
        <h3 className="terminal-title">
          Bus Terminal Information
        </h3>
      </div>
      
      <div className="terminal-content">
        {terminal.message && (
          <p className="terminal-message">{terminal.message}</p>
        )}
        
        <div className="terminal-details">
          <div className="terminal-location">
            <Navigation className="location-icon" />
            <div className="location-info">
              <p className="location-name">{terminal.displayName}</p>
              <p className="location-address">{terminal.address}</p>
            </div>
          </div>
          
          <button
            onClick={handleOpenMap}
            className="terminal-map-button"
            aria-label={`View ${terminal.displayName} on map`}
          >
            <MapPin className="map-icon" />
            <span>View on Map</span>
          </button>
        </div>
      </div>
    </div>
  );
};
