import React from 'react';
import { useTranslation } from 'react-i18next';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasResults: boolean;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  hasResults 
}) => {
  const { t } = useTranslation();

  const tabs = [
    {
      id: 'search',
      icon: '🔍',
      label: t('nav.search', 'Search'),
      badge: null
    },
    {
      id: 'routes',
      icon: '🚌',
      label: t('nav.routes', 'Routes'),
      badge: null,
      disabled: !hasResults
    },
    {
      id: 'map',
      icon: '🗺️',
      label: t('nav.map', 'Map'),
      badge: null,
      disabled: !hasResults
    },
    {
      id: 'tracking',
      icon: '📍',
      label: t('nav.tracking', 'Track'),
      badge: null,
      disabled: !hasResults
    },
    {
      id: 'contribute',
      icon: '➕',
      label: t('nav.contribute', 'Contribute'),
      badge: null
    }
  ];

  return (
    <nav className="bottom-navigation" role="navigation" aria-label={t('nav.bottomNavigation', 'Bottom navigation')}>
      <div className="bottom-nav-container">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`bottom-nav-item ${activeTab === tab.id ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            aria-label={tab.label}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
            {tab.badge && (
              <span className="nav-badge" aria-label={`${tab.badge} notifications`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;