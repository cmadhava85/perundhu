import './App.css';
import './styles/transit-design-system.css';
import './styles/transit-bus-card.css';
import './styles/transit-realtime.css';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom';
import type { Location as BusLocation } from './types';

// Layout Components
import Header from './components/Header';
import Footer from './components/Footer';
import MainTabNavigation from './components/MainTabNavigation';
import BottomNavigation from './components/BottomNavigation';
import AppRoutes from './components/AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/Loading';

// Custom hooks
import { useLocationData } from './hooks/useLocationData';
import { useBusSearchEnhanced } from './hooks/useBusSearchEnhanced';

// Context providers
import { ThemeProvider } from './context/ThemeContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';

// Utils
import { getFeatureFlag } from './utils/environment';

/**
 * Main App component with router
 */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AdminAuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AdminAuthProvider>
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
  // Track if initial locations have been set to prevent infinite loops
  const [initialLocationsSet, setInitialLocationsSet] = useState(false);
  
  // Update location states when API data is loaded (only once)
  useEffect(() => {
    if (locations && locations.length > 0 && !initialLocationsSet) {
      if (!fromLocation) {
        setFromLocation(locations[0]);
      }
      if (!toLocation && locations.length > 1) {
        setToLocation(locations[1]);
      }
      setInitialLocationsSet(true);
    }
  }, [locations, fromLocation, toLocation, initialLocationsSet]);
  
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    if (!hasVisitedBefore) {
      localStorage.setItem('hasVisitedBefore', 'true');
    }
    setIsInitialized(true);
  }, []);

  // Get destinations when from location changes
  useEffect(() => {
    if (fromLocation && fromLocation.id) {
      getDestinations(fromLocation.id);
    }
  }, [fromLocation, getDestinations]);

  // Track if search has been triggered to prevent duplicate calls
  const [searchTriggered, setSearchTriggered] = useState(false);

  // Restore search parameters from URL on page load/refresh
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const fromId = searchParams.get('from');
    const toId = searchParams.get('to');
    
    if (fromId && toId && locations && locations.length > 0) {
      const from = locations.find(loc => loc.id === parseInt(fromId));
      const to = locations.find(loc => loc.id === parseInt(toId));
      
      if (from && to) {
        // Only update locations if they differ
        if (fromLocation?.id !== from.id) {
          setFromLocation(from);
        }
        if (toLocation?.id !== to.id) {
          setToLocation(to);
        }
        
        // Only trigger search once when on search-results page with no results
        if (location.pathname === '/search-results' && 
            buses.length === 0 && 
            !busesLoading && 
            !searchTriggered) {
          setSearchTriggered(true);
          searchBuses(from, to);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, location.pathname, locations, busesLoading, searchTriggered]);

  // Reset searchTriggered when navigating away from search-results
  useEffect(() => {
    if (location.pathname !== '/search-results') {
      setSearchTriggered(false);
    }
  }, [location.pathname]);

  // Update main tab when route changes - removed activeMainTab from dependencies
  // to prevent unnecessary re-renders
  useEffect(() => {
    const pathname = location.pathname;
    if (pathname === '/contribute') {
      setActiveMainTab('contribute');
      setActiveTab('contribute');
    } else if (pathname === '/' || pathname === '/search' || pathname === '/search-results') {
      setActiveMainTab('search');
      setActiveTab('search');
    }
  }, [location.pathname]);

  // Handler for the "Find Buses" button click
  const handleSearch = useCallback(async (fromLoc?: BusLocation, toLoc?: BusLocation) => {
    const searchFrom = fromLoc || fromLocation;
    const searchTo = toLoc || toLocation;
    
    if (!searchFrom || !searchTo) return;

    setIsSearching(true);
    resetResults();

    try {
      await searchBuses(searchFrom, searchTo);
      navigate(`/search-results?from=${searchFrom.id}&to=${searchTo.id}`);
    } catch (error) {
      console.error('Error searching buses:', error);
      navigate(`/search-results?from=${searchFrom.id}&to=${searchTo.id}`);
    } finally {
      setIsSearching(false);
    }
  }, [fromLocation, toLocation, resetResults, searchBuses, navigate]);

  // Handler for main tab changes
  const handleMainTabChange = useCallback((tab: 'search' | 'contribute') => {
    setActiveMainTab(tab);
    setActiveTab(tab);
    navigate(tab === 'search' ? '/' : '/contribute');
  }, [navigate]);

  // Handler for bottom navigation tab changes
  const handleTabChange = useCallback((tabId: string) => {
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
        if (buses.length > 0) navigate('/track/' + buses[0].id);
        break;
      case 'tracking':
        navigate(buses.length > 0 ? '/bus/' + buses[0].id : '/history');
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
  }, [navigate, buses]);

  // Handler for location changes
  const handleLocationChange = useCallback((from: BusLocation, to: BusLocation) => {
    setFromLocation(from);
    setToLocation(to);
  }, []);

  // Handler for search from routes component
  const handleRoutesSearch = useCallback((from: BusLocation, to: BusLocation) => {
    setFromLocation(from);
    setToLocation(to);
    handleSearch(from, to);
  }, [handleSearch]);

  // Feature flags and settings
  const isAnalyticsEnabled = getFeatureFlag('ANALYTICS_ENABLED', true);
  const showAnalytics = isAnalyticsEnabled;
  const userId = 'user123';

  if (!isInitialized) {
    return <Loading message={t('app.initializing', 'Initializing app...')} />;
  }

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

  const stops = selectedBusId && stopsMap[selectedBusId] ? stopsMap[selectedBusId] : [];

  return (
    <div className="transit-app app-container min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <Header />
      
      <MainTabNavigation 
        activeMainTab={activeMainTab}
        onTabChange={handleMainTabChange}
      />

      <main className="flex-grow container mx-auto px-4 py-6">
        <AppRoutes
          locations={locations}
          fromLocation={fromLocation}
          toLocation={toLocation}
          buses={buses}
          stops={stops}
          stopsMap={stopsMap}
          searchError={searchError}
          connectingRoutes={connectingRoutes}
          busesLoading={busesLoading}
          showAnalytics={showAnalytics}
          userId={userId}
          featureSettings={featureSettings}
          onLocationChange={handleLocationChange}
          onSearch={handleRoutesSearch}
        />
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
