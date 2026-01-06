import React from 'react';
import { useTranslation } from 'react-i18next';
import { SearchIcon, BusIcon, MapIcon, LocationIcon, PlusIcon } from './icons';
import { triggerHaptic } from '../utils/haptic';
import { useIsFeatureEnabled } from '../contexts/FeatureFlagsContext';

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
  const mapEnabled = useIsFeatureEnabled('enableMap');

  const tabs = [
    {
      id: 'search',
      icon: <SearchIcon size={22} />,
      label: t('nav.search', 'Search'),
      badge: null
    },
    {
      id: 'routes',
      icon: <BusIcon size={22} />,
      label: t('nav.routes', 'Routes'),
      badge: null,
      disabled: !hasResults
    },
    ...(mapEnabled ? [{
      id: 'map',
      icon: <MapIcon size={22} />,
      label: t('nav.map', 'Map'),
      badge: null,
      disabled: !hasResults
    }] : []),
    {
      id: 'tracking',
      icon: <LocationIcon size={22} />,
      label: t('nav.tracking', 'Track'),
      badge: null,
      disabled: !hasResults
    },
    {
      id: 'contribute',
      icon: <PlusIcon size={22} />,
      label: t('nav.contribute', 'Contribute'),
      badge: null
    }
  ];

  return (
    <nav 
      className="bottom-navigation" 
      role="navigation" 
      aria-label={t('nav.bottomNavigation', 'Bottom navigation')}
      data-testid="bottom-navigation"
    >
      <div className="bottom-nav-container">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-testid={`bottom-nav-${tab.id}`}
            className={`bottom-nav-item ${activeTab === tab.id ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
            onClick={() => {
              if (!tab.disabled) {
                triggerHaptic('selection');
                onTabChange(tab.id);
              }
            }}
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

export default React.memo(BottomNavigation);