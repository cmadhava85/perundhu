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
              <div className="tab-content">
                <span className="main-tab-icon">🔍</span>
                <div className="tab-text">
                  <span className="main-tab-title">{t('nav.search', 'Search')}</span>
                  <span className="main-tab-subtitle">{t('nav.searchSubtitle', 'Find Routes')}</span>
                </div>
              </div>
              {activeMainTab === 'search' && <div className="active-indicator"></div>}
            </button>
            
            <button
              className={`main-tab contribute-tab ${activeMainTab === 'contribute' ? 'active' : ''}`}
              onClick={() => onTabChange('contribute')}
              aria-pressed={activeMainTab === 'contribute'}
              aria-label={t('nav.contributeTabDescription', 'Switch to contribute route data')}
            >
              <div className="tab-content">
                <svg className="main-tab-icon contribute-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  <path d="M11 7h2v2h-2zm0 3h2v2h-2z" opacity="0.7"/>
                </svg>
                <div className="tab-text">
                  <span className="main-tab-title">{t('nav.contribute', 'Contribute')}</span>
                  <span className="main-tab-subtitle">{t('nav.contributeSubtitle', 'Share Routes')}</span>
                </div>
              </div>
              {activeMainTab === 'contribute' && <div className="active-indicator"></div>}
            </button>
          </div>
          
          {/* Tab Indicator Line */}
          <div className="tab-indicator-line">
            <div className={`tab-indicator ${activeMainTab === 'contribute' ? 'contribute-active' : 'search-active'}`}></div>
          </div>
        </div>
        
        {/* Tab Context Info */}
        <div className="tab-context">
          {activeMainTab === 'search' ? (
            <p className="context-text">
              {t('nav.searchContext', 'Discover bus routes across Tamil Nadu')}
            </p>
          ) : (
            <p className="context-text">
              {t('nav.contributeContext', 'Help improve our database by sharing route information')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

MainTabNavigation.displayName = 'MainTabNavigation';

export default MainTabNavigation;
