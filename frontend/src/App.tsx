import './App.css';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import SearchForm from './components/SearchForm';
import ModernBusList from './components/ModernBusList';
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
import { EnhancedRouteForm } from './components/forms/EnhancedRouteForm';

// Services
import { submitRouteContribution } from './services/api';

// Types
import type { RouteContribution } from './types/index';

// Custom hooks
import { useLocationData } from './hooks/useLocationData';
import { useBusSearch } from './hooks/useBusSearch';
import useBrowserDetection from './hooks/useBrowserDetection';

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
  const browserInfo = useBrowserDetection();
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
    destinations, 
    loading: locationsLoading,
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
    setSelectedBusId,
    resetResults
  } = useBusSearch();
  
  // State for selected locations with safer initialization
  const [fromLocation, setFromLocation] = useState(initialFromLocation);
  const [toLocation, setToLocation] = useState(initialToLocation);
  const [isSearching, setIsSearching] = useState(false);
  
  // Update location states when API data is loaded
  useEffect(() => {
    if (locations && locations.length > 0) {
      if (!fromLocation) {
        setFromLocation(locations[0]);
      }
      if (!toLocation && locations.length > 1) {
        setToLocation(locations[1]); // Set second location as default destination
      }
    }
  }, [locations, fromLocation, toLocation]);
  
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

  // Update main tab when route changes
  useEffect(() => {
    if (location.pathname === '/contribute') {
      setActiveMainTab('contribute');
      setActiveTab('contribute');
    } else if (location.pathname === '/' || location.pathname === '/search' || location.pathname === '/search-results') {
      setActiveMainTab('search');
      setActiveTab('search');
    }
  }, [location.pathname]);

  // Handler for the "Find Buses" button click
  const handleSearch = async () => {
    if (!fromLocation || !toLocation) {
      return;
    }

    setIsSearching(true);
    resetResults();

    try {
      console.log(`Searching for buses from ${fromLocation.name} to ${toLocation.name}`);
      
      await searchBuses(fromLocation, toLocation);
      
      // Navigate to search results page
      navigate('/search-results');
    } catch (error) {
      console.error('Error searching buses:', error);
      
      // Navigate to search results page even if there's an error
      // The SearchResults component will handle displaying the error
      navigate('/search-results');
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
        // Navigate to tracking if results exist
        if (buses.length > 0) {
          navigate('/track/' + buses[0].id);
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

  // Enhanced route contribution submission handler
  const handleRouteContribution = async (data: RouteContribution) => {
    try {
      await submitRouteContribution(data);
      // You could add a toast notification here
      console.log('Route contribution submitted successfully:', data);
    } catch (error) {
      console.error('Failed to submit route contribution:', error);
      // You could add error handling/notification here
    }
  };

  // Compile stops from stopsMap for selected bus
  const stops = selectedBusId && stopsMap[selectedBusId] ? stopsMap[selectedBusId] : [];

  return (
    <div className="app-container min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
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
                <SearchForm 
                  locations={locations}
                  destinations={destinations}
                  fromLocation={fromLocation}
                  toLocation={toLocation}
                  onFromLocationChange={setFromLocation}
                  onToLocationChange={setToLocation}
                  onSearch={handleSearch}
                  isLoading={isSearching || locationsLoading}
                />
              ) : (
                <Loading message={t('loading.locations', 'Loading locations...')} />
              )}
            </ErrorBoundary>
          } />
          <Route path="/search" element={
            <ErrorBoundary>
              {fromLocation && toLocation ? (
                <SearchForm 
                  locations={locations}
                  destinations={destinations}
                  fromLocation={fromLocation}
                  toLocation={toLocation}
                  onFromLocationChange={setFromLocation}
                  onToLocationChange={setToLocation}
                  onSearch={handleSearch}
                  isLoading={isSearching || locationsLoading}
                />
              ) : (
                <Loading message={t('loading.locations', 'Loading locations...')} />
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
                />
              ) : (
                <Loading message={t('loading.locations', 'Loading locations...')} />
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
