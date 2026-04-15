import './App.css';
import './styles/transit-design-system.css';
import './styles/transit-bus-card.css';
import './styles/transit-realtime.css';
import './styles/micro-interactions.css';
import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom';
import type { Location as BusLocation } from './types';

// Layout Components
import Header from './components/Header';
import Footer from './components/Footer';
import MainTabNavigation from './components/MainTabNavigation';
import BottomNavigation from './components/BottomNavigation';
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/Loading';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import NetworkStatusIndicator from './components/NetworkStatusIndicator';
import ToastProvider from './components/ToastProvider';

// PHASE 2 OPTIMIZATION: Lazy load AppRoutes for code splitting
const AppRoutes = lazy(() => import('./components/AppRoutes'));

// Custom hooks
import { useLocationData } from './hooks/useLocationData';
import { useBusSearchEnhanced } from './hooks/useBusSearchEnhanced';
import { useKeyboardDetector } from './hooks/useKeyboardDetector';

// Context providers
import { ThemeProvider } from './context/ThemeContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { FeatureFlagsProvider, useIsFeatureEnabled } from './contexts/FeatureFlagsContext';
import { ErrorProvider } from './contexts/ErrorContext';

// Utils
import { getFeatureFlag } from './utils/environment';
import { csrfTokenManager } from './utils/csrfTokenManager';

/**
 * Main App component with router
 */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <FeatureFlagsProvider>
          <AdminAuthProvider>
            <ErrorProvider>
              <ToastProvider>
                <Router>
                  <AppContent />
                </Router>
              </ToastProvider>
            </ErrorProvider>
          </AdminAuthProvider>
        </FeatureFlagsProvider>
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
    loadingMore,
    hasNextPage,
    fetchNextPage,
    totalCount,
    error: searchError,
    connectingRoutes,
    searchBuses,
    setSelectedBusId: _setSelectedBusId,
    resetResults,
    LoadingComponent: _LoadingComponent,
    isSearchPending,
  } = useBusSearchEnhanced();
  
  // State for selected locations - use defaults from hook (KCBT Kilambakkam to Madurai - Mattuthavani)
  const [fromLocation, setFromLocation] = useState(initialFromLocation);
  const [toLocation, setToLocation] = useState(initialToLocation);
  const [_isSearching, setIsSearching] = useState(false);

  // Refs for stable access in URL-restore effect without triggering re-runs or stale closures
  const fromLocationRef = useRef(fromLocation);
  fromLocationRef.current = fromLocation;
  const toLocationRef = useRef(toLocation);
  toLocationRef.current = toLocation;
  const busesRef = useRef(buses);
  busesRef.current = buses;
  const searchBusesRef = useRef(searchBuses);
  searchBusesRef.current = searchBuses;
  
  // Detect mobile keyboard to prevent bottom navigation overlap
  useKeyboardDetector();
  
  // Sync with the hook's default locations when they're set
  useEffect(() => {
    if (initialFromLocation && !fromLocation) {
      setFromLocation(initialFromLocation);
    }
    if (initialToLocation && !toLocation) {
      setToLocation(initialToLocation);
    }
  }, [initialFromLocation, initialToLocation, fromLocation, toLocation]);
  
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    if (!hasVisitedBefore) {
      localStorage.setItem('hasVisitedBefore', 'true');
    }
    setIsInitialized(true);
    
    // Initialize CSRF token for state-changing operations
    // This ensures the token is cached before any POST/PUT/DELETE requests
    csrfTokenManager.getToken()
      .catch(error => {
        // Log but don't fail - CSRF is optional for GET requests
        console.warn('Could not initialize CSRF token:', error);
      });

    // Record a lightweight visit session once per browser session
    // Used by the footer to display real daily user counts
    const SESSION_PING_KEY = 'perundhu_session_pinged';
    if (!sessionStorage.getItem(SESSION_PING_KEY)) {
      sessionStorage.setItem(SESSION_PING_KEY, '1');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const ping = (csrf?: { token: string; headerName: string }) => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (csrf) headers[csrf.headerName] = csrf.token;
        fetch(`${apiUrl}/v1/user-tracking-sessions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            deviceInfo: navigator.userAgent.substring(0, 100),
          }),
        }).catch(() => { /* fire-and-forget, ignore errors */ });
      };
      csrfTokenManager.getToken().then(ping).catch(() => ping());
    }
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
        if (fromLocationRef.current?.id !== from.id) {
          setFromLocation(from);
        }
        if (toLocationRef.current?.id !== to.id) {
          setToLocation(to);
        }
        
        // Only trigger search once when on search-results page with no results
        if (location.pathname === '/search-results' && 
            busesRef.current.length === 0 && 
            !busesLoading && 
            !searchTriggered) {
          setSearchTriggered(true);
          searchBusesRef.current(from, to);
        }
      }
    }
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

    if (!searchFrom || !searchTo) {
      return;
    }

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
  const mapEnabled = useIsFeatureEnabled('enableMap');
  const userId = localStorage.getItem('userId') || 'anonymous';

  if (!isInitialized) {
    return <Loading message={t('app.initializing', 'Initializing app...')} />;
  }

  const featureSettings = {
    showTracking: true,
    showAnalytics: true,
    showRewards: true,
    showMap: mapEnabled,
    enableNotifications: true,
    useHighAccuracyLocation: true,
    darkMode: false,
    saveSearchHistory: true
  };

  const stops = selectedBusId && stopsMap[selectedBusId] ? stopsMap[selectedBusId] : [];

  // Phase 2: Keyboard shortcuts
  // CRITICAL: All shortcuts that use single letters (f, s, k) MUST have modifiers
  // to prevent blocking normal text input in form fields
  const keyboardShortcuts = [
    {
      key: 'f',
      description: t('shortcuts.filters', 'Open Filters'),
      action: () => {
        const filtersSection = document.querySelector('.filters-section') as HTMLElement;
        if (filtersSection) {
          filtersSection.scrollIntoView({ behavior: 'smooth' });
          filtersSection.focus();
        }
      },
      modifiers: ['ctrl' as const], // Add Ctrl modifier to prevent blocking 'F'/'f' in forms
    },
    {
      key: 's',
      description: t('shortcuts.search', 'Focus Search'),
      action: () => {
        const searchInput = document.querySelector('#from-location-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      },
      modifiers: ['ctrl' as const], // Add Ctrl modifier to prevent blocking 'S'/'s' in forms
    },
    {
      key: 'k',
      description: t('shortcuts.quickSearch', 'Quick Search'),
      action: () => {
        const searchInput = document.querySelector('#from-location-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      },
      modifiers: ['ctrl' as const], // Ctrl modifier already present
    },
    {
      key: 'Escape',
      description: t('shortcuts.closeDialogs', 'Close Dialogs'),
      action: () => {
        // Close any open modals or dialogs
        const modals = document.querySelectorAll('[role="dialog"]');
        modals.forEach(modal => {
          const closeButton = modal.querySelector('button[aria-label*="lose"]') as HTMLButtonElement;
          if (closeButton) closeButton.click();
        });
      },
      // Escape doesn't need modifiers as it's not a typing key
    },
  ];

  return (
    <div className="transit-app app-container min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      {/* Skip to main content - Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {/* Network status indicator */}
      <NetworkStatusIndicator />
      
      <Header />
      
      <MainTabNavigation 
        activeMainTab={activeMainTab}
        onTabChange={handleMainTabChange}
      />

      <main id="main-content" className="flex-grow container mx-auto px-4 py-6">
        <Suspense fallback={<Loading message={t('app.loading', 'Loading...')} />}>
          <AppRoutes
            locations={locations}
            fromLocation={fromLocation}
            toLocation={toLocation}
            buses={buses}
            stops={stops}
            stopsMap={stopsMap}
            searchError={searchError}
            connectingRoutes={connectingRoutes}
            busesLoading={busesLoading || isSearchPending}
            loadingMore={loadingMore}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            totalCount={totalCount}
            showAnalytics={showAnalytics}
            userId={userId}
            featureSettings={featureSettings}
            onLocationChange={handleLocationChange}
            onSearch={handleRoutesSearch}
          />
        </Suspense>
      </main>
      
      <Footer />
      <BottomNavigation 
        onTabChange={handleTabChange} 
        activeTab={activeTab} 
        hasResults={buses.length > 0} 
      />
      
      {/* Phase 2: Global Keyboard Shortcuts */}
      <KeyboardShortcuts shortcuts={keyboardShortcuts} />
    </div>
  );
}

export default App;
