import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/mobile-first.css';

interface OfflineBannerProps {
  show: boolean;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ show }) => {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 safe-area-inset animate-slide-in">
      <div className="bg-yellow-500 text-yellow-900 px-4 py-3 text-center font-medium">
        <div className="flex items-center justify-center gap-2">
          <span>📡</span>
          <span>{t('offline.message', 'You are offline. Some features may be limited.')}</span>
        </div>
      </div>
    </div>
  );
};

export default OfflineBanner;