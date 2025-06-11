import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getOfflineMode, getOfflineDataAge, checkOnlineStatus } from '../services/api';

/**
 * A banner displayed when the app is in offline mode.
 * Shows status of offline data and prompts for action when needed.
 */
const OfflineBanner: React.FC = () => {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState<boolean>(getOfflineMode());
  const [dataAge, setDataAge] = useState<number | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);

  useEffect(() => {
    // Get the age of the offline data as an indicator
    const fetchDataAge = async () => {
      const age = await getOfflineDataAge();
      setDataAge(age);
    };

    fetchDataAge();

    // Set up a listener for online/offline status changes
    const handleStatusChange = async () => {
      await checkOnlineStatus();
      setIsOffline(getOfflineMode());
      fetchDataAge();
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    // Periodically check connection status
    const intervalId = setInterval(async () => {
      if (isOffline) {
        handleStatusChange();
      }
    }, 30000); // Check every 30 seconds when offline

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
      clearInterval(intervalId);
    };
  }, [isOffline]);

  const handleRetryConnection = async () => {
    setIsCheckingConnection(true);
    await checkOnlineStatus();
    setIsOffline(getOfflineMode());
    setIsCheckingConnection(false);
  };

  if (!isOffline) {
    return null;
  }

  return (
    <div className="offline-banner">
      <div className="offline-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23"></line>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
          <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
      </div>
      <div className="offline-message">
        <h4>{t('offline.offlineMode', 'Offline Mode')}</h4>
        <p>{t('offline.usingOfflineData', 'You are using offline data')}</p>
        {dataAge !== null && (
          <p className="offline-data-age">
            {t('offline.staleData', 'Data is {{days}} days old - update when you reconnect', { days: dataAge })}
          </p>
        )}
      </div>
      <button
        className={`offline-retry-button ${isCheckingConnection ? 'checking' : ''}`}
        onClick={handleRetryConnection}
        disabled={isCheckingConnection}
      >
        {isCheckingConnection ? (
          <span className="checking-indicator"></span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"></polyline>
            <polyline points="23 20 23 14 17 14"></polyline>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
          </svg>
        )}
        {t('offline.syncNeeded', 'Check Connection')}
      </button>
    </div>
  );
};

export default OfflineBanner;