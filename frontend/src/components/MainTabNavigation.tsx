import React from 'react';
import { useTranslation } from 'react-i18next';

interface MainTabNavigationProps {
  activeMainTab: 'search' | 'contribute';
  onTabChange: (tab: 'search' | 'contribute') => void;
}

/**
 * Main navigation tabs for switching between Search and Contribute modes
 * Extracted from App.tsx for better component organization
 */
const MainTabNavigation: React.FC<MainTabNavigationProps> = React.memo(({ 
  activeMainTab, 
  onTabChange 
}) => {
  const { t } = useTranslation();

  return (
    <div className="main-tab-navigation">
      <div className="container mx-auto px-4">
        <div className="tab-wrapper">
          {/* Tab Container */}
          <div className="main-tabs">
            <button
              className={`main-tab search-tab ${activeMainTab === 'search' ? 'active' : ''}`}
              onClick={() => onTabChange('search')}
              aria-pressed={activeMainTab === 'search'}
              aria-label={t('nav.searchTabDescription', 'Switch to search for bus routes')}
            >
              <span className="main-tab-icon">🔍</span>
              <span className="main-tab-label">{t('nav.searchBuses', 'Search Buses')}</span>
            </button>
            
            <button
              className={`main-tab contribute-tab ${activeMainTab === 'contribute' ? 'active' : ''}`}
              onClick={() => onTabChange('contribute')}
              aria-pressed={activeMainTab === 'contribute'}
              aria-label={t('nav.contributeTabDescription', 'Switch to contribute route data')}
            >
              <span className="main-tab-icon">🤝</span>
              <span className="main-tab-label">{t('nav.contribute', 'Contribute')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

MainTabNavigation.displayName = 'MainTabNavigation';

export default MainTabNavigation;
