import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import RouteContributionList from './RouteContributionList';
import ImageContributionList from './ImageContributionList';
import './AdminDashboard.css';

/**
 * Admin dashboard for managing user contributions
 */
const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'routes' | 'images'>('routes');

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>{t('admin.dashboard.title', 'Admin Dashboard')}</h1>
        <p>{t('admin.dashboard.subtitle', 'Manage user contributions')}</p>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'routes' ? 'active' : ''}`} 
          onClick={() => setActiveTab('routes')}
        >
          {t('admin.tabs.routes', 'Route Contributions')}
        </button>
        <button 
          className={`tab-button ${activeTab === 'images' ? 'active' : ''}`} 
          onClick={() => setActiveTab('images')}
        >
          {t('admin.tabs.images', 'Image Contributions')}
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'routes' ? (
          <RouteContributionList />
        ) : (
          <ImageContributionList />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;