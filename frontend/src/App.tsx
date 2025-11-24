import './App.css';
import './styles/transit-design-system.css';
import './styles/transit-bus-card.css';
import './styles/transit-realtime.css';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import type { Location as BusLocation } from './types';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import TransitSearchForm from './components/TransitSearchForm';
import CombinedMapTracker from './components/CombinedMapTracker';
import ConnectingRoutes from './components/ConnectingRoutes';
import ErrorDisplay from './components/ErrorDisplay';
import Loading from './components/Loading';
import BusTracker from './components/BusTracker';
import UserSessionHistory from './components/UserSessionHistory';
import UserRewards from './components/UserRewards';
import UserAnalyticsDashboard from './components/UserAnalyticsDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import RouteContributionComponent from './components/RouteContribution';
import FeatureSettings from './components/FeatureSettings';
import ErrorBoundary from './components/ErrorBoundary';
import SearchResults from './components/SearchResults';
import BottomNavigation from './components/BottomNavigation';

// Custom hooks
import { useLocationData } from './hooks/useLocationData';
import { useBusSearchEnhanced } from './hooks/useBusSearchEnhanced';
import useBrowserDetection from './hooks/useBrowserDetection';
import { LoadingSkeleton } from './components/LoadingSkeleton';

// Context providers
import { ThemeProvider } from './context/ThemeContext';

// Utils
import { getFeatureFlag } from './utils/environment';

/**
 * Main App component with router
 */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

/**
 * App content component that orchestrates the application flow
 * This is wrapped in Router to enable useNavigate hook
 */
function AppContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Track app initialization state
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Main tab state for Search vs Contribute - derive from current route
  const [activeMainTab, setActiveMainTab] = useState<'search' | 'contribute'>(() => {
    return location.pathname === '/contribute' ? 'contribute' : 'search';
  });
  
  // Bottom navigation state
  const [activeTab, setActiveTab] = useState('search');
  
  // Use real data hooks instead of mock data
  const { 
    locations, 
    destinations: _destinations, 
    loading: _locationsLoading,
    getDestinations,
    fromLocation: initialFromLocation,
    toLocation: initialToLocation
  } = useLocationData();
  
  const {
    buses,
    selectedBusId,
    stopsMap,
    loading: busesLoading,
    error: searchError,
    connectingRoutes,
    searchBuses,
    setSelectedBusId: _setSelectedBusId,
    resetResults,
    LoadingComponent: _LoadingComponent
  } = useBusSearchEnhanced();
  
  // State for selected locations with safer initialization
  const [fromLocation, setFromLocation] = useState(initialFromLocation);
  const [toLocation, setToLocation] = useState(initialToLocation);
  const [_isSearching, setIsSearching] = useState(false);
  
  // Update location states when API data is loaded - only run when locations change
  useEffect(() => {
    if (locations && locations.length > 0) {
      if (!fromLocation) {
        setFromLocation(locations[0]);
      }
      if (!toLocation && locations.length > 1) {
        setToLocation(locations[1]); // Set second location as default destination
      }
    }
  }, [locations, !fromLocation, !toLocation]); // More specific dependencies to prevent unnecessary re-renders
  
  useEffect(() => {
    // Check if this is the first time user is opening the app
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    
    if (!hasVisitedBefore) {
      // Show welcome message or onboarding
      localStorage.setItem('hasVisitedBefore', 'true');
    }
    
    // Mark app as initialized
    setIsInitialized(true);
  }, []);

  // Get destinations when from location changes
  useEffect(() => {
    if (fromLocation && fromLocation.id) {
      getDestinations(fromLocation.id);
    }
  }, [fromLocation, getDestinations]);

  // Restore search parameters from URL on page load/refresh
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const fromId = searchParams.get('from');
    const toId = searchParams.get('to');
    
    if (fromId && toId && locations && locations.length > 0) {
      const from = locations.find(loc => loc.id === parseInt(fromId));
      const to = locations.find(loc => loc.id === parseInt(toId));
      
      if (from && to) {
        // Only update if different from current state to avoid unnecessary re-renders
        if (fromLocation?.id !== from.id) {
          setFromLocation(from);
        }
        if (toLocation?.id !== to.id) {
          setToLocation(to);
        }
        
        // If on search-results page and search hasn't been performed yet, perform search
        if (location.pathname === '/search-results' && buses.length === 0 && !busesLoading) {
          searchBuses(from, to);
        }
      }
    }
  }, [location.search, location.pathname, locations]);

  // Update main tab when route changes - memoize to prevent excessive updates
  useEffect(() => {
    const pathname = location.pathname;
    if (pathname === '/contribute') {
      if (activeMainTab !== 'contribute') {
        setActiveMainTab('contribute');
        setActiveTab('contribute');
      }
    } else if (pathname === '/' || pathname === '/search' || pathname === '/search-results') {
      if (activeMainTab !== 'search') {
        setActiveMainTab('search');
        setActiveTab('search');
      }
    }
  }, [location.pathname, activeMainTab]);

  // Handler for the "Find Buses" button click
  const handleSearch = async (fromLoc?: BusLocation, toLoc?: BusLocation) => {
    // Use parameters if provided, otherwise fall back to state
    const searchFrom = fromLoc || fromLocation;
    const searchTo = toLoc || toLocation;
    
    if (!searchFrom || !searchTo) {
      return;
    }

    setIsSearching(true);
    resetResults();

    try {
      console.log(`Searching for buses from ${searchFrom.name} to ${searchTo.name}`);
      
      await searchBuses(searchFrom, searchTo);
      
      // Navigate to search results page with query parameters
      navigate(`/search-results?from=${searchFrom.id}&to=${searchTo.id}`);
    } catch (error) {
      console.error('Error searching buses:', error);
      
      // Navigate to search results page even if there's an error
      // The SearchResults component will handle displaying the error
      navigate(`/search-results?from=${searchFrom.id}&to=${searchTo.id}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Handler for main tab changes (Search vs Contribute)
  const handleMainTabChange = (tab: 'search' | 'contribute') => {
    setActiveMainTab(tab);
    setActiveTab(tab);
    
    if (tab === 'search') {
      navigate('/');
    } else if (tab === 'contribute') {
      navigate('/contribute');
    }
  };

  // Handler for bottom navigation tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    switch (tabId) {
      case 'search':
        setActiveMainTab('search');
        navigate('/');
        break;
      case 'routes':
        navigate('/search-results');
        break;
      case 'map':
        // Navigate to map view if results exist
        if (buses.length > 0) {
          navigate('/track/' + buses[0].id);
        }
        break;
      case 'tracking':
        // Navigate to tracking history or first bus if available
        if (buses.length > 0) {
          navigate('/bus/' + buses[0].id);
        } else {
          navigate('/history');
        }
        break;
      case 'contribute':
        setActiveMainTab('contribute');
        navigate('/contribute');
        break;
      case 'rewards':
        navigate('/rewards');
        break;
      case 'history':
        navigate('/history');
        break;
      case 'settings':
        navigate('/settings');
        break;
      default:
        navigate('/');
    }
  };

  // Check if analytics is enabled
  const isAnalyticsEnabled = getFeatureFlag('ANALYTICS_ENABLED', true);
  
  // Only show analytics if the feature flag is enabled
  const showAnalytics = isAnalyticsEnabled;

  // User ID - in production this would come from authentication service
  const userId = 'user123';

  if (!isInitialized) {
    return <Loading message={t('app.initializing', 'Initializing app...')} />;
  }

  // Feature settings from user preferences or defaults
  const featureSettings = {
    showTracking: true,
    showAnalytics: true,
    showRewards: true,
    showMap: true,
    enableNotifications: true,
    useHighAccuracyLocation: true,
    darkMode: false,
    saveSearchHistory: true
  };

  // Compile stops from stopsMap for selected bus
  const stops = selectedBusId && stopsMap[selectedBusId] ? stopsMap[selectedBusId] : [];

  return (
    <div className="transit-app app-container min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <Header />
      
      {/* Enhanced Main Tab Navigation - Search vs Contribute */}
      <div className="main-tab-navigation">
        <div className="container mx-auto px-4">
          <div className="tab-wrapper">
            {/* Tab Container */}
            <div className="main-tabs">
              <button
                className={`main-tab search-tab ${activeMainTab === 'search' ? 'active' : ''}`}
                onClick={() => handleMainTabChange('search')}
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
                onClick={() => handleMainTabChange('contribute')}
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

      <main className="flex-grow container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={
            <ErrorBoundary>
              {fromLocation && toLocation ? (
                <TransitSearchForm 
                  locations={locations}
                  fromLocation={fromLocation}
                  toLocation={toLocation}
                  onLocationChange={(from, to) => {
                    setFromLocation(from);
                    setToLocation(to);
                  }}
                  onSearch={(from, to, _options) => {
                    setFromLocation(from);
                    setToLocation(to);
                    handleSearch(from, to);
                  }}
                />
              ) : (
                <LoadingSkeleton count={1} type="text" />
              )}
            </ErrorBoundary>
          } />
          <Route path="/search" element={
            <ErrorBoundary>
              {fromLocation && toLocation ? (
                <TransitSearchForm 
                  locations={locations}
                  fromLocation={fromLocation}
                  toLocation={toLocation}
                  onLocationChange={(from, to) => {
                    setFromLocation(from);
                    setToLocation(to);
                  }}
                  onSearch={(from, to, _options) => {
                    setFromLocation(from);
                    setToLocation(to);
                    handleSearch(from, to);
                  }}
                />
              ) : (
                <LoadingSkeleton count={1} type="text" />
              )}
            </ErrorBoundary>
          } />
          <Route path="/search-results" element={
            <ErrorBoundary>
              {fromLocation && toLocation ? (
                <SearchResults 
                  buses={buses}
                  fromLocation={fromLocation}
                  toLocation={toLocation}
                  stops={stops}
                  stopsMap={stopsMap}
                  error={searchError}
                  connectingRoutes={connectingRoutes}
                  loading={busesLoading}
                />
              ) : (
                <LoadingSkeleton count={1} type="text" />
              )}
            </ErrorBoundary>
          } />
          <Route path="/bus/:busId" element={
            <ErrorBoundary>
              <BusTracker 
                buses={buses} 
                stops={stopsMap} 
              />
            </ErrorBoundary>
          } />
          <Route path="/track/:busId" element={
            <ErrorBoundary>
              {fromLocation && toLocation ? (
                <CombinedMapTracker 
                  fromLocation={fromLocation}
                  toLocation={toLocation}
                  buses={buses}
                />
              ) : (
                <Loading message={t('loading.locations', 'Loading locations...')} />
              )}
            </ErrorBoundary>
          } />
          <Route path="/connecting-routes" element={
            <ErrorBoundary>
              <ConnectingRoutes 
                connectingRoutes={connectingRoutes}
              />
            </ErrorBoundary>
          } />
          {showAnalytics && (
            <Route path="/analytics" element={
              <ErrorBoundary>
                <UserAnalyticsDashboard userId={userId} />
              </ErrorBoundary>
            } />
          )}
          <Route path="/history" element={
            <ErrorBoundary>
              <UserSessionHistory userId={userId} />
            </ErrorBoundary>
          } />
          <Route path="/rewards" element={
            <ErrorBoundary>
              <UserRewards userId={userId} />
            </ErrorBoundary>
          } />
          <Route path="/contribute" element={
            <ErrorBoundary>
              <RouteContributionComponent />
            </ErrorBoundary>
          } />
          <Route path="/admin" element={
            <ErrorBoundary>
              <AdminDashboard />
            </ErrorBoundary>
          } />
          <Route path="/settings" element={
            <ErrorBoundary>
              <FeatureSettings 
                {...featureSettings}
                onSettingsChange={() => {}}
              />
            </ErrorBoundary>
          } />
          <Route path="*" element={
            <ErrorDisplay 
              error={new Error(t('error.notFound.message', 'Sorry, the page you are looking for does not exist.'))}
            />
          } />
        </Routes>
      </main>
      <Footer />
      <BottomNavigation 
        onTabChange={handleTabChange} 
        activeTab={activeTab} 
        hasResults={buses.length > 0} 
      />
    </div>
  );
}

export default App;
