import { useState, useEffect, useRef } from 'react';
import type { BusLocation } from '../types';
import { getCurrentBusLocations } from '../services/busTrackingService';

interface UseLiveBusTrackingProps {
  fromLocation?: any;
  toLocation?: any;
  buses?: any[];
  routeId?: string;
  isEnabled?: boolean;
}

interface UseLiveBusTrackingReturn {
  liveLocations: BusLocation[];
  isTracking: boolean;
  error: string | null;
  startTracking: () => void;
  stopTracking: () => void;
  busLocations: BusLocation[];
  loading: boolean;
  lastUpdated: Date | null;
}

export const useLiveBusTracking = ({ 
  routeId, 
  isEnabled = true 
}: UseLiveBusTrackingProps = {}): UseLiveBusTrackingReturn => {
  const [busLocations, setBusLocations] = useState<BusLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const fetchBusLocations = async () => {
    if (!isEnabled) return;

    try {
      setLoading(true);
      setError(null);
      const locations = await getCurrentBusLocations();
      setBusLocations(locations);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bus locations');
    } finally {
      setLoading(false);
    }
  };

  const startTracking = () => {
    setIsTracking(true);
  };

  const stopTracking = () => {
    setIsTracking(false);
  };

  useEffect(() => {
    if (!isEnabled) {
      setBusLocations([]);
      setError(null);
      setLastUpdated(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchBusLocations();

    // Set up polling
    intervalRef.current = setInterval(fetchBusLocations, 30000); // Update every 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [routeId, isEnabled]);

  return {
    liveLocations: busLocations,
    isTracking,
    error,
    startTracking,
    stopTracking,
    busLocations,
    loading,
    lastUpdated
  };
};