import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './AdminDashboard.css';
import RouteAdminPanel from './RouteAdminPanel';
import { ImageContributionAdminPanel } from './ImageContributionAdminPanel';
import RouteIssuesAdminPanel from './RouteIssuesAdminPanel';

/**
 * Admin Dashboard component that serves as the main entry point for admin functionality
 */
const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'routes' | 'images' | 'issues' | 'users' | 'settings'>('routes');

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>{t('admin.dashboard.title', 'Admin Dashboard')}</h1>
        <p>{t('admin.dashboard.subtitle', 'Manage route contributions and system settings')}</p>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          <span className="tab-icon">🚌</span>
          {t('admin.tabs.routes', 'Route Management')}
        </button>
        <button 
          className={`tab-button ${activeTab === 'images' ? 'active' : ''}`}
          onClick={() => setActiveTab('images')}
        >
          <span className="tab-icon">🖼️</span>
          {t('admin.tabs.images', 'Image Contributions')}
        </button>
        <button 
          className={`tab-button ${activeTab === 'issues' ? 'active' : ''}`}
          onClick={() => setActiveTab('issues')}
        >
          <span className="tab-icon">⚠️</span>
          {t('admin.tabs.issues', 'Route Issues')}
        </button>
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <span className="tab-icon">👥</span>
          {t('admin.tabs.users', 'User Management')}
        </button>
        <button 
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="tab-icon">⚙️</span>
          {t('admin.tabs.settings', 'Settings')}
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'routes' && <RouteAdminPanel />}
        {activeTab === 'images' && <ImageContributionAdminPanel />}
        {activeTab === 'issues' && <RouteIssuesAdminPanel />}
        {activeTab === 'users' && <div className="coming-soon">
          <div className="coming-soon-icon">👥</div>
          <h3>{t('admin.comingSoon.title', 'Coming Soon')}</h3>
          <p>{t('admin.comingSoon.users', 'User management functionality will be available in an upcoming update.')}</p>
        </div>}
        {activeTab === 'settings' && <div className="coming-soon">
          <div className="coming-soon-icon">⚙️</div>
          <h3>{t('admin.comingSoon.title', 'Coming Soon')}</h3>
          <p>{t('admin.comingSoon.settings', 'System settings configuration will be available in an upcoming update.')}</p>
        </div>}
      </div>
    </div>
  );
};

export default AdminDashboard;