import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import './AdminDashboard.css';
import RouteAdminPanel from './RouteAdminPanel';
import { ImageContributionAdminPanel } from './ImageContributionAdminPanel';
import RouteIssuesAdminPanel from './RouteIssuesAdminPanel';
import AdminSettingsPanel from './AdminSettingsPanel';
import BusDatabaseBrowser from './BusDatabaseBrowser';

/**
 * Admin Dashboard component that serves as the main entry point for admin functionality
 */
const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'routes' | 'images' | 'issues' | 'busdb' | 'users' | 'settings'>('routes');

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-content">
          <h1>{t('admin.dashboard.title', 'Admin Dashboard')}</h1>
          <p>{t('admin.dashboard.subtitle', 'Manage route contributions and system settings')}</p>
        </div>
        <button className="admin-logout-button" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {t('admin.logout', 'Logout')}
        </button>
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
          className={`tab-button ${activeTab === 'busdb' ? 'active' : ''}`}
          onClick={() => setActiveTab('busdb')}
        >
          <span className="tab-icon">🗄️</span>
          {t('admin.tabs.busdb', 'Bus Database')}
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
        {activeTab === 'busdb' && <BusDatabaseBrowser />}
        {activeTab === 'users' && <div className="coming-soon">
          <div className="coming-soon-icon">👥</div>
          <h3>{t('admin.comingSoon.title', 'Coming Soon')}</h3>
          <p>{t('admin.comingSoon.users', 'User management functionality will be available in an upcoming update.')}</p>
        </div>}
        {activeTab === 'settings' && <AdminSettingsPanel />}
      </div>
    </div>
  );
};

export default AdminDashboard;