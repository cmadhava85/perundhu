import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';
import './NetworkStatusIndicator.css';

/**
 * Network Status Indicator Component
 * Shows when user goes offline with reconnect instructions
 */
export const NetworkStatusIndicator: React.FC = () => {
  const isOnline = useNetworkStatus();
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (!isOnline) {
      setShow(true);
      // Auto-hide after 5 seconds if back online
      const timer = setTimeout(() => {
        if (isOnline) setShow(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return () => {}; // Return empty cleanup function when online
  }, [isOnline]);

  if (!show || isOnline) {
    return null;
  }

  return (
    <div 
      className="network-status-indicator network-status-offline"
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="network-status-content">
        <div className="network-status-icon">
          <WifiOff size={20} />
        </div>
        <div className="network-status-text">
          <strong>You're offline</strong>
          <p>Some features may be unavailable. Check your connection.</p>
        </div>
        <button 
          className="network-status-close"
          onClick={() => setShow(false)}
          aria-label="Close offline notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

/**
 * Minimal Network Status Indicator
 * Compact version for header
 */
export const NetworkStatusBadge: React.FC = () => {
  const isOnline = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div 
      className="network-status-badge"
      title="No internet connection"
      role="status"
    >
      <WifiOff size={16} />
      <span className="sr-only">Offline</span>
    </div>
  );
};

export default NetworkStatusIndicator;
