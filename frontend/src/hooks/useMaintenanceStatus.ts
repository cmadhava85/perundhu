import { useState, useEffect } from 'react';

interface MaintenanceStatus {
  inMaintenance: boolean;
  reason?: string;
  message?: string;
  dbAvailable?: boolean;
  backendReady?: boolean;
}

/**
 * Custom hook to check if the system is in maintenance mode.
 * 
 * Polls the backend /api/v1/maintenance/status endpoint on:
 * 1. Initial load
 * 2. Window focus (when user comes back to tab)
 * 3. Network reconnection
 * 
 * Returns maintenance status and a manual refresh function.
 * 
 * This hook is designed to be cost-efficient:
 * - Only polls when window is focused
 * - Stops polling if not in maintenance
 * - Uses reasonable intervals (30s)
 * - Leverages browser visibility API
 */
export const useMaintenanceStatus = (pollInterval = 30000) => {
  const [status, setStatus] = useState<MaintenanceStatus>({
    inMaintenance: false
  });
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let isActive = true;

    const checkStatus = async () => {
      // Don't check if tab is not visible (save backend costs)
      if (document.hidden) {
        return;
      }

      try {
        const response = await fetch('/api/v1/maintenance/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000)
        });

        const data = await response.json();
        
        if (isActive) {
          setStatus({
            inMaintenance: data.maintenance || false,
            reason: data.reason,
            message: data.message,
            dbAvailable: data.dbAvailable,
            backendReady: data.backendReady
          });
          
          setIsChecking(false);

          // If not in maintenance, stop polling to save costs
          if (!data.maintenance && intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }

      } catch (error) {
        console.error('Maintenance status check failed:', error);
        
        // On error, assume system might be down
        // But don't show maintenance page immediately (give it 2 retries)
        if (isActive) {
          setIsChecking(false);
        }
      }
    };

    // Initial check
    checkStatus();

    // Set up polling only if in maintenance mode
    // We'll restart polling via visibility change if needed
    if (status.inMaintenance) {
      intervalId = setInterval(checkStatus, pollInterval);
    }

    // Handle visibility change - check when user comes back
    const handleVisibilityChange = () => {
      if (!document.hidden && status.inMaintenance) {
        checkStatus();
      }
    };

    // Handle online event - check when network reconnects
    const handleOnline = () => {
      if (status.inMaintenance) {
        checkStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      isActive = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [status.inMaintenance, pollInterval]);

  // Manual refresh function
  const refresh = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/v1/maintenance/status');
      const data = await response.json();
      setStatus({
        inMaintenance: data.maintenance || false,
        reason: data.reason,
        message: data.message,
        dbAvailable: data.dbAvailable,
        backendReady: data.backendReady
      });
    } catch (error) {
      console.error('Manual maintenance check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  return {
    ...status,
    isChecking,
    refresh
  };
};
