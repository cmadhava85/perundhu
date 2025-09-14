import './App.css';
import './components/EnhancedSearchLayout.css';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import SearchForm from './components/SearchForm';
import BusList from './components/BusList';
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
  const { browser } = useBrowserDetection();
  const navigate = useNavigate();
  
  // Track app initialization state
  const [isInitialized, setIsInitialized] = useState(false);
  
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
    selectBus,
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
    }
  }, [locations, fromLocation]);
  
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
    <div className="app-container min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={
            <ErrorBoundary>
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
            </ErrorBoundary>
          } />
          <Route path="/search" element={
            <ErrorBoundary>
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
            </ErrorBoundary>
          } />
          <Route path="/search-results" element={
            <ErrorBoundary>
              <SearchResults 
                buses={buses}
                fromLocation={fromLocation}
                toLocation={toLocation}
                stops={stops}
                error={searchError}
                connectingRoutes={connectingRoutes}
              />
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
              <CombinedMapTracker 
                fromLocation={fromLocation}
                toLocation={toLocation}
                buses={buses}
              />
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
              <RouteContributionComponent userId={userId} />
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
              message={t('error.notFound.message', 'Sorry, the page you are looking for does not exist.')}
            />
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
