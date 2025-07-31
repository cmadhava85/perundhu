import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/FeatureSettings.css';

export interface FeatureSettingsProps {
  showTracking: boolean;
  showAnalytics: boolean;
  showRewards: boolean;
  showMap: boolean;
  enableNotifications: boolean;
  useHighAccuracyLocation: boolean;
  darkMode: boolean;
  saveSearchHistory: boolean;
  onSettingsChange: (settings: Partial<FeatureSettingsProps>) => void;
}

/**
 * Component for controlling app feature settings and preferences
 */
const FeatureSettings: React.FC<FeatureSettingsProps> = ({
  showTracking,
  showAnalytics,
  showRewards,
  showMap,
  enableNotifications,
  useHighAccuracyLocation,
  darkMode,
  saveSearchHistory,
  onSettingsChange
}) => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    showTracking,
    showAnalytics,
    showRewards,
    showMap,
    enableNotifications,
    useHighAccuracyLocation,
    darkMode,
    saveSearchHistory
  });

  const handleToggle = (key: keyof typeof settings) => {
    const updatedSettings = {
      ...settings,
      [key]: !settings[key]
    };
    setSettings(updatedSettings);
    onSettingsChange({ [key]: updatedSettings[key] });
  };

  return (
    <div className="feature-settings">
      <h2 className="settings-title">{t('settings.title', 'App Settings')}</h2>
      
      <div className="settings-section">
        <h3>{t('settings.features', 'Features')}</h3>
        
        <div className="setting-item">
          <span className="setting-label">{t('settings.showTracking', 'Show Bus Tracking')}</span>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={settings.showTracking} 
              onChange={() => handleToggle('showTracking')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        
        <div className="setting-item">
          <span className="setting-label">{t('settings.showAnalytics', 'Show Analytics')}</span>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={settings.showAnalytics} 
              onChange={() => handleToggle('showAnalytics')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        
        <div className="setting-item">
          <span className="setting-label">{t('settings.showRewards', 'Show Rewards')}</span>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={settings.showRewards} 
              onChange={() => handleToggle('showRewards')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        
        <div className="setting-item">
          <span className="setting-label">{t('settings.showMap', 'Show Map')}</span>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={settings.showMap} 
              onChange={() => handleToggle('showMap')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>{t('settings.privacy', 'Privacy')}</h3>
        
        <div className="setting-item">
          <span className="setting-label">{t('settings.notifications', 'Enable Notifications')}</span>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={settings.enableNotifications} 
              onChange={() => handleToggle('enableNotifications')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        
        <div className="setting-item">
          <span className="setting-label">{t('settings.highAccuracy', 'High Accuracy Location')}</span>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={settings.useHighAccuracyLocation} 
              onChange={() => handleToggle('useHighAccuracyLocation')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        
        <div className="setting-item">
          <span className="setting-label">{t('settings.saveHistory', 'Save Search History')}</span>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={settings.saveSearchHistory} 
              onChange={() => handleToggle('saveSearchHistory')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>{t('settings.appearance', 'Appearance')}</h3>
        
        <div className="setting-item">
          <span className="setting-label">{t('settings.darkMode', 'Dark Mode')}</span>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={settings.darkMode} 
              onChange={() => handleToggle('darkMode')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <div className="settings-info">
        <p>
          {t('settings.infoNote', 'Some settings may require restarting the app to take full effect.')}
        </p>
      </div>
    </div>
  );
};

export default FeatureSettings;