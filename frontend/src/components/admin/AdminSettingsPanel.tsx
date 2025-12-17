import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { 
  Settings, 
  ToggleLeft, 
  ToggleRight, 
  RefreshCw, 
  Shield, 
  Image, 
  MessageSquare, 
  MapPin, 
  Share2, 
  AlertTriangle,
  Mic,
  ClipboardPaste,
  CheckCircle,
  Cpu,
  RotateCcw,
  Save,
  Cloud,
  CloudOff,
  Loader2,
  Lock,
  Mail,
  Zap,
  Database,
  AlertOctagon,
  Upload
} from 'lucide-react';
import './AdminSettingsPanel.css';

type SettingsTab = 'features' | 'security' | 'system';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange, label, description, icon }) => {
  return (
    <div className="toggle-setting">
      <div className="toggle-info">
        {icon && <span className="toggle-icon">{icon}</span>}
        <div className="toggle-text">
          <span className="toggle-label">{label}</span>
          {description && <span className="toggle-description">{description}</span>}
        </div>
      </div>
      <button
        type="button"
        className={`toggle-switch ${enabled ? 'enabled' : 'disabled'}`}
        onClick={() => onChange(!enabled)}
        aria-label={`Toggle ${label}`}
      >
        {enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
      </button>
    </div>
  );
};

const AdminSettingsPanel: React.FC = () => {
  const { t } = useTranslation();
  const { 
    flags, 
    updateFlag, 
    resetToDefaults, 
    saveToBackend, 
    syncWithBackend,
    syncToPreprod,
    isSyncing,
    isSyncingToPreprod, 
    lastSyncError,
    isBackendAvailable,
    isPreprodAvailable 
  } = useFeatureFlags();
  const [activeTab, setActiveTab] = useState<SettingsTab>('features');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (flagName: keyof typeof flags, value: boolean) => {
    updateFlag(flagName, value);
    setSaveMessage('Settings saved locally');
    setTimeout(() => setSaveMessage(null), 2000);
  };

  const handleSaveToServer = async () => {
    setIsSaving(true);
    try {
      await saveToBackend();
      setSaveMessage('Settings saved to server');
    } catch {
      setSaveMessage('Failed to save to server');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleSync = async () => {
    try {
      await syncWithBackend();
      setSaveMessage('Settings synced from server');
    } catch {
      setSaveMessage('Sync failed');
    }
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleSyncToPreprod = async () => {
    try {
      await syncToPreprod();
      setSaveMessage('Settings synced to preprod environment');
    } catch {
      setSaveMessage('Preprod sync failed');
    }
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleReset = async () => {
    await resetToDefaults();
    setShowResetConfirm(false);
    setSaveMessage('Settings reset to defaults');
    setTimeout(() => setSaveMessage(null), 2000);
  };

  return (
    <div className="admin-settings-panel">
      {/* Header */}
      <div className="settings-header">
        <div className="settings-title">
          <Settings size={24} />
          <h2>{t('admin.settings.title', 'System Settings')}</h2>
          <span className={`backend-status ${isBackendAvailable ? 'connected' : 'disconnected'}`}>
            {isBackendAvailable ? (
              <>
                <Cloud size={14} />
                <span>Server Connected</span>
              </>
            ) : (
              <>
                <CloudOff size={14} />
                <span>Local Only</span>
              </>
            )}
          </span>
        </div>
        <div className="settings-actions">
          {lastSyncError && (
            <span className="sync-error">
              <AlertTriangle size={14} />
              {lastSyncError}
            </span>
          )}
          {saveMessage && (
            <span className="save-message">
              <Save size={14} />
              {saveMessage}
            </span>
          )}
          <button 
            className="sync-button"
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
            {t('admin.settings.sync', 'Sync')}
          </button>
          {isBackendAvailable && (
            <button 
              className="save-server-button"
              onClick={handleSaveToServer}
              disabled={isSaving || isSyncing}
            >
              {isSaving ? <Loader2 size={16} className="spin" /> : <Cloud size={16} />}
              {t('admin.settings.saveToServer', 'Save to Server')}
            </button>
          )}
          <button 
            className="sync-preprod-button"
            onClick={handleSyncToPreprod}
            disabled={isSyncingToPreprod || isSyncing}
            title={isPreprodAvailable ? 'Sync settings to preprod environment' : 'Preprod not available'}
          >
            {isSyncingToPreprod ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
            {t('admin.settings.syncToPreprod', 'Sync to Preprod')}
          </button>
          <button 
            className="reset-button"
            onClick={() => setShowResetConfirm(true)}
          >
            <RotateCcw size={16} />
            {t('admin.settings.resetDefaults', 'Reset to Defaults')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'features' ? 'active' : ''}`}
          onClick={() => setActiveTab('features')}
        >
          <ToggleRight size={18} />
          {t('admin.settings.tabs.features', 'Feature Toggles')}
        </button>
        <button
          className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Shield size={18} />
          {t('admin.settings.tabs.security', 'Security')}
        </button>
        <button
          className={`settings-tab ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          <Cpu size={18} />
          {t('admin.settings.tabs.system', 'System')}
        </button>
      </div>

      {/* Content */}
      <div className="settings-content">
        {/* Feature Toggles Tab */}
        {activeTab === 'features' && (
          <div className="settings-section">
            {/* Contribution Methods */}
            <div className="settings-group">
              <h3 className="group-title">
                <MessageSquare size={18} />
                {t('admin.settings.contributionMethods', 'Contribution Methods')}
              </h3>
              <p className="group-description">
                {t('admin.settings.contributionMethodsDesc', 'Control which contribution methods are available to users on the Contribute page.')}
              </p>
              
              <div className="toggles-list">
                <ToggleSwitch
                  enabled={flags.enableManualContribution}
                  onChange={(v) => handleToggle('enableManualContribution', v)}
                  label={t('admin.settings.manualContribution', 'Manual Form Entry')}
                  description={t('admin.settings.manualContributionDesc', 'Traditional form-based route contribution')}
                  icon={<MessageSquare size={18} />}
                />
                
                <ToggleSwitch
                  enabled={flags.enableImageContribution}
                  onChange={(v) => handleToggle('enableImageContribution', v)}
                  label={t('admin.settings.imageContribution', 'Image Upload (OCR)')}
                  description={t('admin.settings.imageContributionDesc', 'Upload bus timing photos for AI extraction')}
                  icon={<Image size={18} />}
                />
                
                <ToggleSwitch
                  enabled={flags.enableVoiceContribution}
                  onChange={(v) => handleToggle('enableVoiceContribution', v)}
                  label={t('admin.settings.voiceContribution', 'Voice Recording')}
                  description={t('admin.settings.voiceContributionDesc', 'Speak route information for transcription (Beta)')}
                  icon={<Mic size={18} />}
                />
                
                <ToggleSwitch
                  enabled={flags.enablePasteContribution}
                  onChange={(v) => handleToggle('enablePasteContribution', v)}
                  label={t('admin.settings.pasteContribution', 'Paste Text')}
                  description={t('admin.settings.pasteContributionDesc', 'Copy-paste route info from WhatsApp, social media, etc.')}
                  icon={<ClipboardPaste size={18} />}
                />
                
                <ToggleSwitch
                  enabled={flags.enableRouteVerification}
                  onChange={(v) => handleToggle('enableRouteVerification', v)}
                  label={t('admin.settings.routeVerification', 'Route Verification')}
                  description={t('admin.settings.routeVerificationDesc', 'Allow users to verify existing routes')}
                  icon={<CheckCircle size={18} />}
                />
              </div>
            </div>

            {/* Search Results Features */}
            <div className="settings-group">
              <h3 className="group-title">
                <MapPin size={18} />
                {t('admin.settings.searchFeatures', 'Search Result Actions')}
              </h3>
              <p className="group-description">
                {t('admin.settings.searchFeaturesDesc', 'Control which action buttons appear on search result cards.')}
              </p>
              
              <div className="toggles-list">
                <ToggleSwitch
                  enabled={flags.enableShareRoute}
                  onChange={(v) => handleToggle('enableShareRoute', v)}
                  label={t('admin.settings.shareRoute', 'Share Route')}
                  description={t('admin.settings.shareRouteDesc', 'Allow users to share routes via social media')}
                  icon={<Share2 size={18} />}
                />
                
                <ToggleSwitch
                  enabled={flags.enableAddStops}
                  onChange={(v) => handleToggle('enableAddStops', v)}
                  label={t('admin.settings.addStops', 'Add Stops')}
                  description={t('admin.settings.addStopsDesc', 'Allow users to add intermediate stops to existing routes')}
                  icon={<MapPin size={18} />}
                />
                
                <ToggleSwitch
                  enabled={flags.enableReportIssue}
                  onChange={(v) => handleToggle('enableReportIssue', v)}
                  label={t('admin.settings.reportIssue', 'Report Issue')}
                  description={t('admin.settings.reportIssueDesc', 'Allow users to report issues with bus routes')}
                  icon={<AlertTriangle size={18} />}
                />
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="settings-section">
            {/* API Security */}
            <div className="settings-group">
              <h3 className="group-title">
                <Shield size={18} />
                {t('admin.settings.apiSecurity', 'API Security')}
              </h3>
              <p className="group-description">
                {t('admin.settings.apiSecurityDesc', 'Configure API rate limiting and protection features.')}
              </p>
              
              <div className="toggles-list">
                <ToggleSwitch
                  enabled={flags.enableRateLimiting}
                  onChange={(v) => handleToggle('enableRateLimiting', v)}
                  label={t('admin.settings.rateLimiting', 'Rate Limiting')}
                  description={t('admin.settings.rateLimitingDesc', 'Limit API requests per user to prevent abuse')}
                  icon={<Lock size={18} />}
                />
                
                <div className="number-setting">
                  <div className="setting-info">
                    <span className="setting-icon"><Zap size={18} /></span>
                    <div className="setting-text">
                      <span className="setting-label">{t('admin.settings.maxRequests', 'Max Requests Per Minute')}</span>
                      <span className="setting-description">{t('admin.settings.maxRequestsDesc', 'Maximum API requests allowed per minute per user')}</span>
                    </div>
                  </div>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={flags.maxRequestsPerMinute}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value, 10);
                      if (!Number.isNaN(value) && value >= 10 && value <= 1000) {
                        updateFlag('maxRequestsPerMinute', value);
                        setSaveMessage('Settings saved locally');
                        setTimeout(() => setSaveMessage(null), 2000);
                      }
                    }}
                    className="number-input"
                  />
                </div>
              </div>
            </div>

            {/* User Verification */}
            <div className="settings-group">
              <h3 className="group-title">
                <Mail size={18} />
                {t('admin.settings.userVerification', 'User Verification')}
              </h3>
              <p className="group-description">
                {t('admin.settings.userVerificationDesc', 'Configure user authentication and verification requirements.')}
              </p>
              
              <div className="toggles-list">
                <ToggleSwitch
                  enabled={flags.requireEmailVerification}
                  onChange={(v) => handleToggle('requireEmailVerification', v)}
                  label={t('admin.settings.emailVerification', 'Email Verification')}
                  description={t('admin.settings.emailVerificationDesc', 'Require email verification before accepting contributions')}
                  icon={<Mail size={18} />}
                />
                
                <ToggleSwitch
                  enabled={flags.enableAutoApproval}
                  onChange={(v) => handleToggle('enableAutoApproval', v)}
                  label={t('admin.settings.autoApproval', 'Auto-Approve Contributions')}
                  description={t('admin.settings.autoApprovalDesc', 'Automatically approve contributions without manual review')}
                  icon={<CheckCircle size={18} />}
                />
              </div>
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="settings-section">
            {/* AI Processing */}
            <div className="settings-group">
              <h3 className="group-title">
                <Cpu size={18} />
                {t('admin.settings.aiProcessing', 'AI Processing')}
              </h3>
              <p className="group-description">
                {t('admin.settings.aiProcessingDesc', 'Configure AI and machine learning features.')}
              </p>
              
              <div className="toggles-list">
                <ToggleSwitch
                  enabled={flags.enableGeminiAI}
                  onChange={(v) => handleToggle('enableGeminiAI', v)}
                  label={t('admin.settings.geminiAI', 'Gemini AI Processing')}
                  description={t('admin.settings.geminiAIDesc', 'Use Google Gemini AI for image OCR and text extraction')}
                  icon={<Cpu size={18} />}
                />
              </div>
            </div>

            {/* Performance */}
            <div className="settings-group">
              <h3 className="group-title">
                <Database size={18} />
                {t('admin.settings.performance', 'Performance')}
              </h3>
              <p className="group-description">
                {t('admin.settings.performanceDesc', 'Configure caching and performance optimization settings.')}
              </p>
              
              <div className="toggles-list">
                <ToggleSwitch
                  enabled={flags.enableCache}
                  onChange={(v) => handleToggle('enableCache', v)}
                  label={t('admin.settings.caching', 'Response Caching')}
                  description={t('admin.settings.cachingDesc', 'Cache API responses to improve performance')}
                  icon={<Database size={18} />}
                />
                
                <ToggleSwitch
                  enabled={flags.enableMap}
                  onChange={(v) => handleToggle('enableMap', v)}
                  label={t('admin.settings.mapFeature', 'Map View')}
                  description={t('admin.settings.mapFeatureDesc', 'Show interactive maps for routes')}
                  icon={<MapPin size={18} />}
                />
              </div>
            </div>

            {/* Maintenance */}
            <div className="settings-group">
              <h3 className="group-title">
                <AlertOctagon size={18} />
                {t('admin.settings.maintenance', 'Maintenance')}
              </h3>
              <p className="group-description">
                {t('admin.settings.maintenanceDesc', 'System maintenance and operational controls.')}
              </p>
              
              <div className="toggles-list">
                <ToggleSwitch
                  enabled={flags.enableMaintenanceMode}
                  onChange={(v) => handleToggle('enableMaintenanceMode', v)}
                  label={t('admin.settings.maintenanceMode', 'Maintenance Mode')}
                  description={t('admin.settings.maintenanceModeDesc', 'Display maintenance page to users (admin access only)')}
                  icon={<AlertOctagon size={18} />}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="reset-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('admin.settings.resetConfirmTitle', 'Reset Settings?')}</h3>
            <p>{t('admin.settings.resetConfirmMessage', 'This will reset all feature flags to their default values. This action cannot be undone.')}</p>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowResetConfirm(false)}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button 
                className="confirm-btn"
                onClick={handleReset}
              >
                {t('admin.settings.resetConfirm', 'Yes, Reset')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPanel;
