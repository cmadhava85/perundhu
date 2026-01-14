import { useEffect, useState } from 'react';

/**
 * Hook to detect network status
 * Returns true when online, false when offline
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    // Set up event listeners for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Log reconnection for debugging
      console.log('✅ Back online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Log disconnection for debugging
      console.log('📡 Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook for more advanced network detection
 * Includes periodic health checks
 */
export function useNetworkStatusAdvanced() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic health check every 30 seconds
    const healthCheckInterval = setInterval(async () => {
      setIsChecking(true);
      try {
        // Try to fetch a lightweight endpoint
        const response = await fetch('/api/v1/health', { 
          method: 'HEAD',
          cache: 'no-store',
        });
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      } finally {
        setLastChecked(new Date());
        setIsChecking(false);
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(healthCheckInterval);
    };
  }, []);

  return { isOnline, lastChecked, isChecking };
}
