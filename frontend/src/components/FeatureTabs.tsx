import React from 'react';
import { useTranslation } from 'react-i18next';
import FeatureSettings from './FeatureSettings';

interface FeatureTabsProps {
  activeFeature: 'routes' | 'tracking' | 'analytics' | 'rewards';
  setActiveFeature: (feature: 'routes' | 'tracking' | 'analytics' | 'rewards') => void;
  showTracking: boolean;
  showAnalytics: boolean;
  showRewards: boolean;
  showMap: boolean;
  setShowTracking: (show: boolean) => void;
  setShowAnalytics: (show: boolean) => void;
  setShowRewards: (show: boolean) => void;
  setShowMap: (show: boolean) => void;
  browserInfo: {
    deviceType: string;
    isLandscape: boolean;
  };
}

/**
 * Component that renders the feature tabs for navigation between different features
 */
const FeatureTabs: React.FC<FeatureTabsProps> = ({
  activeFeature,
  setActiveFeature,
  showTracking,
  showAnalytics,
  showRewards,
  showMap,
  setShowTracking,
  setShowAnalytics,
  setShowRewards,
  setShowMap,
  browserInfo
}) => {
  const { t } = useTranslation();
  
  // Prepare feature settings and handle changes
  const featureSettings = {
    showTracking,
    showAnalytics,
    showRewards,
    showMap,
    enableNotifications: true, // Default value
    useHighAccuracyLocation: true, // Default value
    darkMode: false, // Default value
    saveSearchHistory: true, // Default value
  };
  
  // Map partial updates to the appropriate setter functions
  const handleSettingsChange = (settings: Partial<typeof featureSettings>) => {
    if ('showTracking' in settings) {
      setShowTracking(settings.showTracking!);
    }
    if ('showAnalytics' in settings) {
      setShowAnalytics(settings.showAnalytics!);
    }
    if ('showRewards' in settings) {
      setShowRewards(settings.showRewards!);
    }
    if ('showMap' in settings) {
      setShowMap(settings.showMap!);
    }
    // Other settings could be handled similarly
  };
  
  return (
    <div className="main-tabs feature-tabs">
      <button 
        className={`main-tab ${activeFeature === 'routes' ? 'active' : ''}`}
        onClick={() => setActiveFeature('routes')}
      >
        <span className="main-tab-icon">🚌</span>
        {browserInfo.deviceType !== 'mobile' || browserInfo.isLandscape ? 
          t('features.routes', 'Routes') : ''}
      </button>
      {showTracking && (
        <button 
          className={`main-tab ${activeFeature === 'tracking' ? 'active' : ''}`}
          onClick={() => setActiveFeature('tracking')}
        >
          <span className="main-tab-icon">📍</span>
          {browserInfo.deviceType !== 'mobile' || browserInfo.isLandscape ? 
            t('features.tracking', 'Tracking') : ''}
        </button>
      )}
      {showAnalytics && (
        <button 
          className={`main-tab ${activeFeature === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveFeature('analytics')}
        >
          <span className="main-tab-icon">📊</span>
          {browserInfo.deviceType !== 'mobile' || browserInfo.isLandscape ? 
            t('features.analytics', 'Analytics') : ''}
        </button>
      )}
      {showRewards && (
        <button 
          className={`main-tab ${activeFeature === 'rewards' ? 'active' : ''}`}
          onClick={() => setActiveFeature('rewards')}
        >
          <span className="main-tab-icon">🏆</span>
          {browserInfo.deviceType !== 'mobile' || browserInfo.isLandscape ? 
            t('features.rewards', 'Rewards') : ''}
        </button>
      )}
      
      <FeatureSettings
        {...featureSettings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
};

export default React.memo(FeatureTabs);