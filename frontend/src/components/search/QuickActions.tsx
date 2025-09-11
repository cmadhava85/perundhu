import React from 'react';
import { useTranslation } from 'react-i18next';

interface QuickActionsProps {
  onSaveSearch: () => void;
  onPriceAlert: () => void;
  onShare: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onSaveSearch,
  onPriceAlert,
  onShare
}) => {
  const { t } = useTranslation();

  return (
    <div className="premium-quick-actions">
      <div className="quick-actions-container">
        <button className="quick-action-item save" onClick={onSaveSearch}>
          <div className="action-icon">💾</div>
          <div className="action-content">
            <span className="action-title">{t('search.saveSearch', 'Save Search')}</span>
            <span className="action-desc">{t('search.saveSearchDesc', 'Get notified of changes')}</span>
          </div>
        </button>
        
        <button className="quick-action-item alert" onClick={onPriceAlert}>
          <div className="action-icon">🔔</div>
          <div className="action-content">
            <span className="action-title">{t('search.priceAlert', 'Price Alert')}</span>
            <span className="action-desc">{t('search.priceAlertDesc', 'Track price drops')}</span>
          </div>
        </button>
        
        <button className="quick-action-item share" onClick={onShare}>
          <div className="action-icon">📤</div>
          <div className="action-content">
            <span className="action-title">{t('search.share', 'Share Results')}</span>
            <span className="action-desc">{t('search.shareDesc', 'Send to friends')}</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default QuickActions;