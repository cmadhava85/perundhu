import React from 'react';
import { useTranslation } from 'react-i18next';

interface BusHeaderProps {
  busNumber: string;
  busName: string;
  isLiveTracking?: boolean;
  onTrackClick?: (e: React.MouseEvent) => void;
  onSaveClick?: (e: React.MouseEvent) => void;
}

const BusHeader: React.FC<BusHeaderProps> = ({
  busNumber,
  busName,
  isLiveTracking,
  onTrackClick,
  onSaveClick
}) => {
  const { t } = useTranslation();

  const handleTrackClick = (e: React.MouseEvent) => {
    if (onTrackClick) {
      onTrackClick(e);
    }
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    if (onSaveClick) {
      onSaveClick(e);
    }
  };

  return (
    <div className="bus-header-row">
      <div className="bus-identity-top">
        <span className="bus-number">{busNumber}</span>
        <span className="bus-name">{busName}</span>
        <span className="status-indicator-inline">
          {isLiveTracking ? t('busItem.tracking', 'Live Tracking') : t('busItem.onTime', 'On Time')}
        </span>
      </div>
      
      <div className="bus-actions-top">
        <button 
          className={`action-btn-top track ${isLiveTracking ? 'active' : ''}`}
          onClick={handleTrackClick}
          title={isLiveTracking ? t('busItem.stopTracking', 'Stop Live Tracking') : t('busItem.startTracking', 'Start Live Tracking')}
        >
          📍
        </button>
        <button 
          className="action-btn-top save" 
          onClick={handleSaveClick}
          title={t('busItem.save', 'Save Route')}
        >
          💾
        </button>
      </div>
    </div>
  );
};

export default BusHeader;