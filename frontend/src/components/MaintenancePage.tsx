import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './MaintenancePage.css';

interface MaintenanceStatus {
  maintenance: boolean;
  reason?: string;
  message?: string;
  dbAvailable?: boolean;
  backendReady?: boolean;
  timestamp?: string;
  estimatedRestoreTime?: string;
}

interface MaintenancePageProps {
  /**
   * Optional: force manual maintenance mode regardless of backend status
   */
  forceMaintenanceMode?: boolean;
  
  /**
   * Optional: custom message to display
   */
  customMessage?: string;
  
  /**
   * Poll interval in milliseconds (default: 30 seconds)
   */
  pollInterval?: number;
  
  /**
   * Callback when maintenance ends
   */
  onMaintenanceEnd?: () => void;
}

/**
 * MaintenancePage Component
 * 
 * Displays a user-friendly maintenance page when:
 * 1. Database is down
 * 2. Backend is not ready
 * 3. Manual maintenance mode is enabled
 * 4. Critical system errors occur
 * 
 * Features:
 * - Auto-polling to detect when maintenance ends
 * - Animated visual indicators
 * - Tamil and English translations
 * - Graceful degradation when backend is unreachable
 * - Countdown timer if estimated restore time is provided
 */
const MaintenancePage: React.FC<MaintenancePageProps> = ({
  forceMaintenanceMode = false,
  customMessage,
  pollInterval = 30000, // 30 seconds
  onMaintenanceEnd
}) => {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkMaintenanceStatus = async () => {
      // If forced into maintenance mode, skip the check
      if (forceMaintenanceMode) {
        setStatus({
          maintenance: true,
          message: customMessage || 'System is under maintenance',
          reason: 'MANUAL_MAINTENANCE'
        });
        return;
      }

      try {
        const response = await fetch('/api/v1/maintenance/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Short timeout to avoid hanging
          signal: AbortSignal.timeout(5000)
        });

        const data: MaintenanceStatus = await response.json();
        setStatus(data);
        setRetryCount(0);

        // If maintenance is over, trigger callback
        if (!data.maintenance && onMaintenanceEnd) {
          setIsPolling(false);
          onMaintenanceEnd();
        }

      } catch (error) {
        console.error('Failed to check maintenance status:', error);
        
        // Increment retry count (max 3 before assuming backend is really down)
        setRetryCount((prev) => prev + 1);
        
        if (retryCount >= 3) {
          // After 3 failed attempts, assume backend is down
          setStatus({
            maintenance: true,
            message: 'Unable to reach the server. Please check back later.',
            reason: 'BACKEND_UNREACHABLE',
            dbAvailable: false,
            backendReady: false
          });
        }
      }
    };

    // Initial check
    checkMaintenanceStatus();

    // Set up polling if maintenance mode is active
    if (isPolling) {
      intervalId = setInterval(checkMaintenanceStatus, pollInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [forceMaintenanceMode, customMessage, pollInterval, onMaintenanceEnd, retryCount, isPolling]);

  const getIconForReason = (reason?: string) => {
    switch (reason) {
      case 'DATABASE_UNAVAILABLE':
        return '🗄️';
      case 'BACKEND_NOT_READY':
        return '⚙️';
      case 'MANUAL_MAINTENANCE':
        return '🔧';
      case 'HEALTH_CHECK_ERROR':
      case 'BACKEND_UNREACHABLE':
        return '⚠️';
      default:
        return '🚧';
    }
  };

  const getMessage = () => {
    if (customMessage) return customMessage;
    if (status?.message) return status.message;
    
    // Fallback messages based on language
    if (i18n.language === 'ta') {
      return 'சேவையில் சில தொழில்நுட்ப சிக்கல்கள். விரைவில் மீண்டும் வருக.';
    }
    return 'We are experiencing technical difficulties. Please check back soon.';
  };

  const formatEstimatedTime = (isoTime: string) => {
    try {
      const date = new Date(isoTime);
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        return i18n.language === 'ta' ? 'விரைவில்' : 'Shortly';
      }
      
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) {
        return i18n.language === 'ta' 
          ? `${diffMins} நிமிடங்களில்` 
          : `in ${diffMins} minutes`;
      }
      
      const diffHours = Math.floor(diffMins / 60);
      return i18n.language === 'ta' 
        ? `${diffHours} மணி நேரத்தில்` 
        : `in ${diffHours} hours`;
        
    } catch (e) {
      return isoTime;
    }
  };

  return (
    <div className="maintenance-page">
      <div className="maintenance-container">
        {/* Animated Icon */}
        <div className="maintenance-icon-wrapper">
          <div className="maintenance-icon pulse">
            {getIconForReason(status?.reason)}
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="maintenance-heading">
          {i18n.language === 'ta' ? 'பராமரிப்பு பணி' : 'Under Maintenance'}
        </h1>

        {/* Main Message */}
        <p className="maintenance-message">
          {getMessage()}
        </p>

        {/* Estimated Restore Time */}
        {status?.estimatedRestoreTime && (
          <div className="maintenance-eta">
            <span className="eta-label">
              {i18n.language === 'ta' ? 'மீண்டும் கிடைக்கும்:' : 'Expected to return:'}
            </span>
            <span className="eta-time">
              {formatEstimatedTime(status.estimatedRestoreTime)}
            </span>
          </div>
        )}

        {/* Status Details (debug info, only show in development) */}
        {import.meta.env.MODE === 'development' && status && (
          <details className="maintenance-debug">
            <summary>Technical Details (Dev Only)</summary>
            <pre>{JSON.stringify(status, null, 2)}</pre>
          </details>
        )}

        {/* Auto-refresh indicator */}
        <div className="maintenance-footer">
          <div className="auto-refresh-indicator">
            <span className="spinner">🔄</span>
            <span className="refresh-text">
              {i18n.language === 'ta' 
                ? 'தானாக புதுப்பிக்கப்படும்...' 
                : 'Auto-refreshing...'}
            </span>
          </div>
          
          {/* Social Links */}
          <div className="maintenance-links">
            <a href="mailto:support@perundhu.org" className="maintenance-link">
              📧 {i18n.language === 'ta' ? 'தொடர்பு கொள்ளுங்கள்' : 'Contact Us'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
