import './App.css';
import './components/EnhancedSearchLayout.css';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import SearchForm from './components/SearchForm';
import BusList from './components/BusList';
import CombinedMapTracker from './components/CombinedMapTracker';
import ConnectingRoutes from './components/ConnectingRoutes';
import ErrorDisplay from './components/ErrorDisplay';
import ErrorBoundary from './components/ErrorBoundary';
import MapErrorFallback from './components/MapErrorFallback';
import Loading from './components/Loading';
import BusTracker from './components/BusTracker';
import UserSessionHistory from './components/UserSessionHistory';
import UserRewards from './components/UserRewards';
import AdminDashboard from './components/admin/AdminDashboard';
import BottomNavigation from './components/BottomNavigation';
// Import RouteContribution component
import RouteContributionComponent from './components/RouteContribution';

// Custom hooks
import { useLocationData } from './hooks/useLocationData';
import { useBusSearch } from './hooks/useBusSearch';
import useBrowserDetection from './hooks/useBrowserDetection';

// Utils
import { getFeatureFlag } from './utils/environment';

/**
 * Main App component that orchestrates the application flow
 */
function App() {
  // Use browser detection for mobile compatibility
  const browserInfo = useBrowserDetection();
  
  // Use i18n for future internationalization needs
  const { t } = useTranslation();

  // Use custom hooks for location and search functionality
  const locationData = useLocationData();
  const busSearch = useBusSearch();
  
  // Combine loading and error states from both hooks
  const isLoading = locationData.loading || busSearch.loading;
  const error = locationData.error || busSearch.error;
  
  // Handler for search button click
  const handleSearch = () => {
    if (locationData.fromLocation && locationData.toLocation) {
      busSearch.searchBuses(locationData.fromLocation, locationData.toLocation);
    }
  };
  
  // Handler for error dismissal
  const handleErrorReset = () => {
    locationData.clearError();
    busSearch.clearError();
  };
  
  // Feature toggles from env
  const [showTracking, setShowTracking] = useState(() => getFeatureFlag('VITE_FEATURE_TRACKING', true));
  const [showAnalytics, setShowAnalytics] = useState(() => getFeatureFlag('VITE_FEATURE_ANALYTICS', true));
  const [showRewards, setShowRewards] = useState(() => getFeatureFlag('VITE_FEATURE_REWARDS', true));
  const [showMap, setShowMap] = useState(() => getFeatureFlag('VITE_ENABLE_MAP', true));
  
  // Admin feature flag (more testable approach)
  const showAdmin = getFeatureFlag('VITE_FEATURE_ADMIN', false);
  
  // State to control main view tabs
  const [currentView, setCurrentView] = useState<'search' | 'contribute'>('search');
  
  // Enhanced mobile navigation state
  const [mobileActiveTab, setMobileActiveTab] = useState<'search' | 'routes' | 'map' | 'tracking' | 'contribute'>('search');
  
  // State for active feature tab
  const [activeFeature, setActiveFeature] = useState<'routes' | 'tracking' | 'analytics' | 'rewards'>('routes');
  
  // State for expanded map view
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  
  // Pull to refresh state
  const isPullToRefresh = false;
  
  // Use useEffect to apply browser-specific classes to root element
  useEffect(() => {
    const rootElement = document.documentElement;
    
    // Add browser-specific classes to the HTML element for CSS targeting
    if (browserInfo.isMobile) rootElement.classList.add('mobile');
    if (browserInfo.isIOS) rootElement.classList.add('ios');
    if (browserInfo.isAndroid) rootElement.classList.add('android');
    if (browserInfo.isSafariiOS) rootElement.classList.add('safari-ios');
    if (browserInfo.isChromeMobile) rootElement.classList.add('chrome-mobile');
    if (browserInfo.isFirefoxMobile) rootElement.classList.add('firefox-mobile');
    if (browserInfo.isSamsung) rootElement.classList.add('samsung-browser');
    if (browserInfo.isLandscape) {
      rootElement.classList.add('landscape');
      rootElement.classList.remove('portrait');
    } else {
      rootElement.classList.add('portrait');
      rootElement.classList.remove('landscape');
    }
    
    // Apply device type class
    rootElement.classList.add(browserInfo.deviceType);
    
    return () => {
      // Cleanup
      rootElement.classList.remove('mobile', 'ios', 'android', 'safari-ios', 
        'chrome-mobile', 'firefox-mobile', 'samsung-browser',
        'landscape', 'portrait', 'mobile', 'tablet', 'desktop');
    };
  }, [
    browserInfo.isMobile,
    browserInfo.isIOS,
    browserInfo.isAndroid,
    browserInfo.isSafariiOS,
    browserInfo.isChromeMobile,
    browserInfo.isFirefoxMobile,
    browserInfo.isSamsung,
    browserInfo.isLandscape,
    browserInfo.deviceType
  ]);

  // Check if we should display the admin dashboard
  // In a real app, this would be based on auth and URL routing
  const isAdminRoute = window.location.pathname.includes('/admin');

  // If admin route, display admin dashboard
  if (isAdminRoute && showAdmin) {
    return (
      <div className="app-container" data-testid="app-container" data-browser={browserInfo.browserName.toLowerCase()}>
        <Header 
          autoLocationEnabled={locationData.autoLocationEnabled}
          onToggleAutoLocation={locationData.toggleAutoLocation}
          isAdmin={true}
        />
        <main className="app-main">
          <AdminDashboard />
        </main>
        <Footer />
      </div>
    );
  }

  // Check if we have search results
  const hasSearchResults = !isLoading && !error && busSearch.buses.length > 0;
  const hasConnectingRoutes = !isLoading && !error && busSearch.buses.length === 0 && busSearch.connectingRoutes.length > 0;
  const showSearchResults = hasSearchResults || hasConnectingRoutes;
  
  // Mobile navigation handler
  const handleMobileTabChange = (tab: string) => {
    setMobileActiveTab(tab as 'search' | 'routes' | 'map' | 'tracking' | 'contribute');
    
    // Update feature tab for desktop compatibility
    switch (tab) {
      case 'routes':
        setActiveFeature('routes');
        break;
      case 'tracking':
        setActiveFeature('tracking');
        break;
      case 'map':
        setActiveFeature('routes'); // Show routes with map
        setShowMap(true);
        break;
    }
  };
  
  // Simplify mobile UI by automatically choosing the most relevant tab
  useEffect(() => {
    if (browserInfo.isMobile && hasSearchResults) {
      // On mobile, if there are search results, automatically select routes tab
      setActiveFeature('routes');
      setMobileActiveTab('routes');
    }
  }, [browserInfo.isMobile, hasSearchResults]);
  
  // Mobile content renderer based on bottom navigation
  const renderMobileContent = () => {
    if (!browserInfo.isMobile) return null;
    
    switch (mobileActiveTab) {
      case 'search':
        return (
          <div className="search-section">
            <SearchForm 
              locations={locationData.locations}
              destinations={locationData.destinations}
              fromLocation={locationData.fromLocation}
              toLocation={locationData.toLocation}
              setFromLocation={locationData.setFromLocation}
              setToLocation={locationData.setToLocation}
              onSearch={handleSearch}
              resetResults={busSearch.resetResults}
            />
            
            {/* Loading and error states */}
            {isLoading && <Loading />}
            {error && <ErrorDisplay error={error} reset={handleErrorReset} />}
          </div>
        );
        
      case 'routes':
        return showSearchResults ? (
          <div className="results-section">
            <h2>{t('busList.title', 'Available Routes')}</h2>
            <div className="bus-list">
              <BusList 
                buses={busSearch.buses}
                selectedBusId={busSearch.selectedBusId}
                stopsMap={busSearch.stopsMap}
                onSelectBus={(bus) => busSearch.setSelectedBusId(bus.id)}
                showTitle={false}
              />
            </div>
            
            {/* Connecting routes if available */}
            {hasConnectingRoutes && (
              <div className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon">🔄</div>
                  <h3 className="feature-title">{t('connectingRoutes.title', 'Connecting Routes')}</h3>
                </div>
                
                <ConnectingRoutes 
                  connectingRoutes={busSearch.connectingRoutes}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="no-results-message">
            <h3>{t('noResults.title', 'No routes found')}</h3>
            <p>{t('noResults.message', 'Search for routes first.')}</p>
          </div>
        );
        
      case 'map':
        return (locationData.fromLocation && locationData.toLocation && showMap) ? (
          <div className="map-section mobile-map">
            <ErrorBoundary fallback={MapErrorFallback}>
              <CombinedMapTracker 
                fromLocation={locationData.fromLocation}
                toLocation={locationData.toLocation}
                selectedStops={
                  busSearch.selectedBusId 
                    ? busSearch.stopsMap[busSearch.selectedBusId] || [] 
                    : (busSearch.buses.length > 0 && busSearch.stopsMap[busSearch.buses[0].id]) 
                      ? busSearch.stopsMap[busSearch.buses[0].id] 
                      : []
                }
                showLiveTracking={true}
              />
            </ErrorBoundary>
          </div>
        ) : (
          <div className="no-results-message">
            <h3>{t('map.noData', 'Map not available')}</h3>
            <p>{t('map.searchFirst', 'Search for routes to view on map.')}</p>
          </div>
        );
        
      case 'tracking':
        return showSearchResults ? (
          <div className="feature-card tracker-panel">
            <div className="feature-header">
              <div className="feature-icon">📍</div>
              <h3 className="feature-title">{t('busTracker.title', 'Help Track Buses')}</h3>
            </div>
            
            <BusTracker 
              buses={busSearch.buses}
              stops={busSearch.stopsMap}
            />
          </div>
        ) : (
          <div className="no-results-message">
            <h3>{t('tracking.noData', 'No buses to track')}</h3>
            <p>{t('tracking.searchFirst', 'Search for routes first.')}</p>
          </div>
        );
        
      case 'contribute':
        return (
          <div className="contribute-section">
            <RouteContributionComponent />
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div 
      className="app-container" 
      data-testid="app-container"
      data-browser={browserInfo.browserName.toLowerCase()}
    >
      <Header 
        autoLocationEnabled={locationData.autoLocationEnabled}
        onToggleAutoLocation={locationData.toggleAutoLocation}
      />
      
      <main className={`app-main ${browserInfo.isLandscape && browserInfo.isMobile ? 'landscape-adjust' : ''}`}>
        {/* Pull to refresh indicator */}
        {isPullToRefresh && (
          <div className="pull-refresh-indicator visible refreshing">
            <div className="refresh-arrow">↻</div>
          </div>
        )}
        
        {/* Display browser info on development environments - with proper styling */}
        {import.meta.env.MODE === 'development' && (
          <div className="browser-info-dev-banner visually-hidden">
            <small>
              {browserInfo.browserName} | {browserInfo.deviceType} | 
              {browserInfo.isLandscape ? 'Landscape' : 'Portrait'}
            </small>
          </div>
        )}

        {/* Desktop/Tablet navigation tabs - hidden on mobile */}
        {!browserInfo.isMobile && (
          <div className="main-tabs">
            <button 
              className={`main-tab ${currentView === 'search' ? 'active' : ''}`}
              onClick={() => setCurrentView('search')}
            >
              <span className="main-tab-icon">🔍</span>
              {t('nav.search', 'Search Routes')}
            </button>
            <button 
              className={`main-tab ${currentView === 'contribute' ? 'active' : ''}`}
              onClick={() => setCurrentView('contribute')}
            >
              <span className="main-tab-icon">➕</span>
              {t('nav.contribute', 'Contribute Route')}
            </button>
            {showAdmin && (
              <a 
                href="/admin" 
                className="main-tab"
                title={t('nav.admin', 'Admin Dashboard')}
              >
                <span className="main-tab-icon">⚙️</span>
                {t('nav.admin', 'Admin')}
              </a>
            )}
          </div>
        )}

        {/* Mobile-optimized content */}
        {browserInfo.isMobile ? (
          <div className="mobile-content-container">
            {renderMobileContent()}
          </div>
        ) : (
          /* Desktop/Tablet content - existing layout */
          <>
            {/* Show either search interface or contribution form based on currentView state */}
            {currentView === 'search' ? (
              <div className={`enhanced-search-container ${browserInfo.deviceType}`}>
                {/* Main search form - always visible */}
                <div className="search-section">
                  <SearchForm 
                    locations={locationData.locations}
                    destinations={locationData.destinations}
                    fromLocation={locationData.fromLocation}
                    toLocation={locationData.toLocation}
                    setFromLocation={locationData.setFromLocation}
                    setToLocation={locationData.setToLocation}
                    onSearch={handleSearch}
                    resetResults={busSearch.resetResults}
                    includeIntermediateStops={busSearch.includeIntermediateStops}
                    onToggleIntermediateStops={busSearch.toggleIncludeIntermediateStops}
                  />
                  
                  {/* Loading and error states */}
                  {isLoading && <Loading />}
                  {error && <ErrorDisplay error={error} reset={handleErrorReset} />}
                </div>

                {/* Feature tabs navigation - only show when there are search results */}
                {showSearchResults && (
                  <div className="main-tabs feature-tabs">
                    <button 
                      className={`main-tab ${activeFeature === 'routes' ? 'active' : ''}`}
                      onClick={() => setActiveFeature('routes')}
                    >
                      <span className="main-tab-icon">🚌</span>
                      {browserInfo.deviceType !== 'mobile' || browserInfo.isLandscape ? 
                        t('features.routes', 'Routes') : ''}
                    </button>
                    {showTracking && (
                      <button 
                        className={`main-tab ${activeFeature === 'tracking' ? 'active' : ''}`}
                        onClick={() => setActiveFeature('tracking')}
                      >
                        <span className="main-tab-icon">📍</span>
                        {browserInfo.deviceType !== 'mobile' || browserInfo.isLandscape ? 
                          t('features.tracking', 'Tracking') : ''}
                      </button>
                    )}
                    {showAnalytics && (
                      <button 
                        className={`main-tab ${activeFeature === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveFeature('analytics')}
                      >
                        <span className="main-tab-icon">📊</span>
                        {browserInfo.deviceType !== 'mobile' || browserInfo.isLandscape ? 
                          t('features.analytics', 'Analytics') : ''}
                      </button>
                    )}
                    {showRewards && (
                      <button 
                        className={`main-tab ${activeFeature === 'rewards' ? 'active' : ''}`}
                        onClick={() => setActiveFeature('rewards')}
                      >
                        <span className="main-tab-icon">🏆</span>
                        {browserInfo.deviceType !== 'mobile' || browserInfo.isLandscape ? 
                          t('features.rewards', 'Rewards') : ''}
                      </button>
                    )}
                  </div>
                )}
                
                {/* Feature toggles - only show on non-mobile or when in landscape */}
                {showSearchResults && (browserInfo.deviceType !== 'mobile' || browserInfo.isLandscape) && (
                  <div className="toggle-row">
                    <label className="toggle">
                      <input
                        type="checkbox"
                        aria-label="tracking"
                        checked={showTracking}
                        onChange={(e) => setShowTracking(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-label">{t('toggles.tracking', 'Tracking')}</span>
                    </label>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        aria-label="analytics"
                        checked={showAnalytics}
                        onChange={(e) => setShowAnalytics(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-label">{t('toggles.analytics', 'Analytics')}</span>
                    </label>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        aria-label="rewards"
                        checked={showRewards}
                        onChange={(e) => setShowRewards(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-label">{t('toggles.rewards', 'Rewards')}</span>
                    </label>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        aria-label="map"
                        checked={showMap}
                        onChange={(e) => setShowMap(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-label">{t('toggles.map', 'Show Map')}</span>
                    </label>
                  </div>
                )}

                {/* Content based on active feature tab */}
                {showSearchResults && (
                  <>
                    {/* Routes view */}
                    {activeFeature === 'routes' && (
                      <>
                        <div className={`content-grid ${browserInfo.deviceType}`}>
                          {/* Routes results section */}
                          <div className="results-section">
                            <h2>{t('busList.title', 'Available Routes')}</h2>
                            <div className="bus-list">
                              <BusList 
                                buses={busSearch.buses}
                                selectedBusId={busSearch.selectedBusId}
                                stopsMap={busSearch.stopsMap}
                                onSelectBus={(bus) => busSearch.setSelectedBusId(bus.id)}
                                showTitle={false}
                              />
                            </div>
                          </div>
                          
                          {/* Map section - Using combined map and tracker */}
                          {(locationData.fromLocation && locationData.toLocation && showMap) && (
                            <div className={`map-section ${isMapExpanded ? 'expanded' : ''}`}>
                              <button 
                                className="toggle-map-size" 
                                onClick={() => setIsMapExpanded(!isMapExpanded)}
                                title={isMapExpanded ? t('map.collapse', "Collapse map") : t('map.expand', "Expand map")}
                              >
                                {isMapExpanded ? '⊟' : '⊞'}
                              </button>
                              <ErrorBoundary fallback={MapErrorFallback}>
                                <CombinedMapTracker 
                                  fromLocation={locationData.fromLocation}
                                  toLocation={locationData.toLocation}
                                  selectedStops={
                                    busSearch.selectedBusId 
                                      ? busSearch.stopsMap[busSearch.selectedBusId] || [] 
                                      : (busSearch.buses.length > 0 && busSearch.stopsMap[busSearch.buses[0].id]) 
                                        ? busSearch.stopsMap[busSearch.buses[0].id] 
                                        : []
                                  }
                                  showLiveTracking={true}
                                />
                              </ErrorBoundary>
                            </div>
                          )}
                          
                          {/* Connecting routes if available */}
                          {hasConnectingRoutes && (
                            <div className="feature-card">
                              <div className="feature-header">
                                <div className="feature-icon">🔄</div>
                                <h3 className="feature-title">{t('connectingRoutes.title', 'Connecting Routes')}</h3>
                              </div>
                              
                              <ConnectingRoutes 
                                connectingRoutes={busSearch.connectingRoutes}
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    
                    {/* Tracking view */}
                    {activeFeature === 'tracking' && showTracking && (
                      <div className="feature-card tracker-panel">
                        <div className="feature-header">
                          <div className="feature-icon">📍</div>
                          <h3 className="feature-title">{t('busTracker.title', 'Help Track Buses')}</h3>
                        </div>
                        
                        <BusTracker 
                          buses={busSearch.buses}
                          stops={busSearch.stopsMap}
                        />
                      </div>
                    )}
                    
                    {/* Analytics view */}
                    {activeFeature === 'analytics' && showAnalytics && (
                      <div className="feature-card">
                        <div className="feature-header">
                          <div className="feature-icon">📊</div>
                          <h3 className="feature-title">{t('analytics.title', 'Your Travel Analytics')}</h3>
                        </div>
                        
                        <UserSessionHistory data-testid="user-session-history" userId="test-user" />
                      </div>
                    )}
                    
                    {/* Rewards view */}
                    {activeFeature === 'rewards' && showRewards && (
                      <div className="feature-card">
                        <div className="feature-header">
                          <div className="feature-icon">🏆</div>
                          <h3 className="feature-title">{t('rewards.title', 'Your Rewards')}</h3>
                        </div>
                        
                        <UserRewards data-testid="user-rewards" />
                      </div>
                    )}
                  </>
                )}
                
                {/* No results message */}
                {!isLoading && !error && !showSearchResults && locationData.fromLocation && locationData.toLocation && (
                  <div className="no-results-message">
                    <h3>{t('noResults.title', 'No routes found')}</h3>
                    <p>{t('noResults.message', 'Try different locations or check for connecting routes.')}</p>
                  </div>
                )}
              </div>
            ) : (
              <RouteContributionComponent />
            )}
          </>
        )}
      </main>
      
      {/* Floating Action Button for mobile quick search */}
      {browserInfo.isMobile && showSearchResults && mobileActiveTab !== 'search' && (
        <button 
          className="floating-action-button"
          onClick={() => setMobileActiveTab('search')}
          aria-label={t('fab.search', 'Quick search')}
        >
          🔍
        </button>
      )}
      
      {/* Bottom Navigation for Mobile */}
      {browserInfo.isMobile && (
        <BottomNavigation 
          activeTab={mobileActiveTab}
          onTabChange={handleMobileTabChange}
          hasResults={showSearchResults}
        />
      )}
      
      <Footer />
    </div>
  );
}

export default App;
