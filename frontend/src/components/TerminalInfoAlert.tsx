import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
    <Alert className="mb-4 bg-blue-50 border-blue-200">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-900 font-semibold">
        Bus Terminal Information
      </AlertTitle>
      <AlertDescription className="text-blue-800">
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
      </AlertDescription>
    </Alert>
  );
};
