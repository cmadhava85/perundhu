import React from 'react';
import { useTranslation } from 'react-i18next';

interface OfflineBannerProps {
  isOnline: boolean;
  onRetry?: () => void;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline, onRetry }) => {
  const { t } = useTranslation();

  if (isOnline) return null;

  return (
    <div className="offline-banner mobile-optimized" role="alert" aria-live="polite">
      <div className="offline-content">
        <div className="offline-icon">📡</div>
        <div className="offline-text">
          <h3>{t('offline.title', 'You\'re offline')}</h3>
          <p>{t('offline.message', 'Check your internet connection')}</p>
        </div>
        {onRetry && (
          <button 
            className="retry-button"
            onClick={onRetry}
            aria-label={t('offline.retry', 'Retry connection')}
          >
            <span className="retry-icon">🔄</span>
            <span className="retry-text">{t('offline.retry', 'Retry')}</span>
          </button>
        )}
      </div>
      
      <div className="offline-tips">
        <h4>{t('offline.tips.title', 'While offline, you can:')}</h4>
        <ul>
          <li>{t('offline.tips.viewRecent', 'View recent searches')}</li>
          <li>{t('offline.tips.useMap', 'Browse saved routes')}</li>
          <li>{t('offline.tips.contribute', 'Prepare route contributions')}</li>
        </ul>
      </div>
    </div>
  );
};

export default OfflineBanner;