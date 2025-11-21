import { useState } from 'react';
import type { Bus, Stop } from '../types';

interface UseBusTrackingProps {
  buses: Bus[];
  stops: Record<number, Stop[]>;
}

interface UseBusTrackingReturn {
  buses: Bus[];
  isLoading: boolean;
  error: string | null;
  searchForBuses: () => Promise<void>;
  selectedBusId: number | null;
  selectedStopId: number | null;
  trackingEnabled: boolean;
  lastReportTime: string | null;
  busStops: Stop[];
  isOnboard: boolean;
  handleBusSelect: (busId: number) => void;
  handleStopSelect: (stopId: number) => void;
  toggleTracking: () => void;
  startTracking: () => void;
  stopTracking: () => void;
  setError: (error: string | null) => void;
}

export const useBusTracking = ({ buses, stops }: UseBusTrackingProps): UseBusTrackingReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [lastReportTime, setLastReportTime] = useState<string | null>(null);
  const [isOnboard, setIsOnboard] = useState(false);

  const busStops = selectedBusId && stops[selectedBusId] ? stops[selectedBusId] : [];

  const searchForBuses = async () => {
    setIsLoading(false);
  };

  const handleBusSelect = (busId: number) => {
    setSelectedBusId(busId);
    setSelectedStopId(null);
  };

  const handleStopSelect = (stopId: number) => {
    setSelectedStopId(stopId);
  };

  const toggleTracking = () => {
    setTrackingEnabled(!trackingEnabled);
    if (trackingEnabled) {
      setSelectedBusId(null);
      setSelectedStopId(null);
      setIsOnboard(false);
    }
  };

  const startTracking = () => {
    if (selectedBusId && selectedStopId) {
      setIsOnboard(true);
      setLastReportTime(new Date().toISOString());
      console.log('Started tracking bus', selectedBusId, 'from stop', selectedStopId);
    }
  };

  const stopTracking = () => {
    setIsOnboard(false);
    setSelectedBusId(null);
    setSelectedStopId(null);
    setLastReportTime(null);
    console.log('Stopped tracking');
  };

  return {
    buses,  // Use prop directly instead of duplicating in state
    isLoading,
    error,
    searchForBuses,
    selectedBusId,
    selectedStopId,
    trackingEnabled,
    lastReportTime,
    busStops,
    isOnboard,
    handleBusSelect,
    handleStopSelect,
    toggleTracking,
    startTracking,
    stopTracking,
    setError
  };
};