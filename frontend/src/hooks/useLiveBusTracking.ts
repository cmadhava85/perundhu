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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

    let isMounted = true;
    const abortController = new AbortController();

    const fetchBusLocations = async () => {
      if (!isEnabled || !isMounted) return;

      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }
        const locations = await getCurrentBusLocations();
        
        if (isMounted) {
          setBusLocations(locations);
          setLastUpdated(new Date());
        }
      } catch (err: any) {
        if (err.name === 'AbortError' || err.name === 'CanceledError') {
          return; // Ignore aborted requests
        }
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch bus locations');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchBusLocations();

    // Set up polling
    intervalRef.current = setInterval(fetchBusLocations, 30000); // Update every 30 seconds

    return () => {
      isMounted = false;
      abortController.abort();
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