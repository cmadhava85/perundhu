import React from 'react';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import './AdSettingsPanel.css';

/**
 * Admin Panel for Google AdSense Settings
 * Allows admins to enable/disable ads and specific placements
 */
export const AdSettingsPanel: React.FC = () => {
  const { flags, updateFlag } = useFeatureFlags();

  const handleToggleAds = (enabled: boolean) => {
    updateFlag('enableAds', enabled);
  };

  const handleTogglePlacement = (placement: 'betweenSearchResults' | 'sidebarRight' | 'footerSection' | 'aboveSearchForm', enabled: boolean) => {
    const flagMap = {
      betweenSearchResults: 'enableAdBetweenSearchResults',
      sidebarRight: 'enableAdSidebarRight',
      footerSection: 'enableAdFooterSection',
      aboveSearchForm: 'enableAdAboveSearchForm'
    };
    updateFlag(flagMap[placement] as keyof typeof flags, enabled);
  };

  return (
    <div className="ad-settings-panel">
      <div className="settings-card">
        <h3>📢 Google AdSense Settings</h3>
        
        {/* Master toggle */}
        <div className="settings-group">
          <div className="setting-item">
            <div className="setting-label">
              <label htmlFor="ads-master-toggle">Enable Google AdSense</label>
              <p className="setting-description">Master toggle for all ads</p>
            </div>
            <div className="setting-control">
              <input
                id="ads-master-toggle"
                type="checkbox"
                checked={flags?.enableAds || false}
                onChange={(e) => handleToggleAds(e.target.checked)}
                className="toggle-switch"
              />
            </div>
          </div>
        </div>

        {/* Individual placement toggles */}
        {flags?.enableAds && (
          <div className="placements-section">
            <h4>Ad Placements</h4>
            
            <div className="placement-item">
              <div className="placement-header">
                <div>
                  <h5>Between Search Results</h5>
                  <p>300x250 medium rectangle between bus cards</p>
                </div>
                <input
                  type="checkbox"
                  checked={flags?.enableAdBetweenSearchResults || false}
                  onChange={(e) => handleTogglePlacement('betweenSearchResults', e.target.checked)}
                  className="toggle-switch"
                />
              </div>
              <div className="placement-status">
                Status: {flags?.enableAdBetweenSearchResults ? '✅ Enabled' : '❌ Disabled'}
              </div>
            </div>

            <div className="placement-item">
              <div className="placement-header">
                <div>
                  <h5>Right Sidebar</h5>
                  <p>300x600 vertical, sticky position</p>
                </div>
                <input
                  type="checkbox"
                  checked={flags?.enableAdSidebarRight || false}
                  onChange={(e) => handleTogglePlacement('sidebarRight', e.target.checked)}
                  className="toggle-switch"
                />
              </div>
              <div className="placement-status">
                Status: {flags?.enableAdSidebarRight ? '✅ Enabled' : '❌ Disabled'}
              </div>
            </div>

            <div className="placement-item">
              <div className="placement-header">
                <div>
                  <h5>Footer Section</h5>
                  <p>728x90 horizontal leaderboard</p>
                </div>
                <input
                  type="checkbox"
                  checked={flags?.enableAdFooterSection || false}
                  onChange={(e) => handleTogglePlacement('footerSection', e.target.checked)}
                  className="toggle-switch"
                />
              </div>
              <div className="placement-status">
                Status: {flags?.enableAdFooterSection ? '✅ Enabled' : '❌ Disabled'}
              </div>
            </div>

            <div className="placement-item">
              <div className="placement-header">
                <div>
                  <h5>Above Search Form</h5>
                  <p>728x90 horizontal (less intrusive)</p>
                </div>
                <input
                  type="checkbox"
                  checked={flags?.enableAdAboveSearchForm || false}
                  onChange={(e) => handleTogglePlacement('aboveSearchForm', e.target.checked)}
                  className="toggle-switch"
                />
              </div>
              <div className="placement-status">
                Status: {flags?.enableAdAboveSearchForm ? '✅ Enabled' : '❌ Disabled'}
              </div>
            </div>
          </div>
        )}

        {/* Info section */}
        <div className="info-box">
          <h5>⚙️ Configuration</h5>
          <ul>
            <li>Google Publisher ID: Set in <code>.env</code> as <code>REACT_APP_GOOGLE_AD_CLIENT</code></li>
            <li>Ad Slots: Set individual slots in <code>.env</code> as <code>REACT_APP_AD_SLOT_RESULTS</code>, etc.</li>
            <li>Ads will only show if the master toggle is ON</li>
            <li>Individual placements can be disabled even when master toggle is ON</li>
            <li>Changes are saved and synced with backend</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdSettingsPanel;
