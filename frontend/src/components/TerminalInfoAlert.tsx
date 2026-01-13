import React from 'react';
import { MapPin, Info } from 'lucide-react';

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
    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-blue-900 font-semibold mb-2">
            Bus Terminal Information
          </h3>
          <div className="text-blue-800">
            <p className="mb-2">{terminal.message}</p>
            <div className="mt-2 space-y-1">
              <p className="font-medium">{terminal.displayName}</p>
              <p className="text-sm">{terminal.address}</p>
              <button
                onClick={handleOpenMap}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mt-2"
              >
                <MapPin className="h-3 w-3" />
                View on Map
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
