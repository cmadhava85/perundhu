import './App.css';
import './components/EnhancedSearchLayout.css';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

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
import { useParams } from 'react-router-dom';

// Mock data for development
const mockLocations = [
  { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
  { id: 2, name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
  { id: 3, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 }
];

const mockBuses = [
  { 
    id: 1, 
    name: 'Express', 
    busNumber: 'TN01X1234', 
    fromLocationId: 1, 
    toLocationId: 2,
    busName: 'Chennai Express',
    departureTime: '08:00',
    arrivalTime: '14:00',
    from: 'Chennai',
    to: 'Bangalore',
    category: 'AC',
    capacity: 40,
    fromLocation: mockLocations[0],
    toLocation: mockLocations[1]
  },
  { 
    id: 2, 
    name: 'Deluxe', 
    busNumber: 'TN02X5678', 
    fromLocationId: 1, 
    toLocationId: 3,
    busName: 'Chennai Deluxe',
    departureTime: '20:00',
    arrivalTime: '06:00',
    from: 'Chennai',
    to: 'Coimbatore',
    category: 'Non-AC',
    capacity: 36,
    fromLocation: mockLocations[0],
    toLocation: mockLocations[2]
  }
];

const mockStops = [
  { 
    id: 1, 
    name: 'Stop 1', 
    busId: 1, 
    locationId: 1,
    arrivalTime: '08:00',
    departureTime: '08:10',
    stopOrder: 1,
    location: mockLocations[0]
  },
  { 
    id: 2, 
    name: 'Stop 2', 
    busId: 1, 
    locationId: 2,
    arrivalTime: '13:50',
    departureTime: '14:00',
    stopOrder: 2,
    location: mockLocations[1]
  },
];

// Create a grouped stops record for BusTracker
const mockStopsByBus: Record<number, typeof mockStops> = {
  1: mockStops.filter(stop => stop.busId === 1),
  2: mockStops.filter(stop => stop.busId === 2)
};

const mockConnectingRoutes = [
  {
    id: 1, 
    isDirectRoute: false,
    firstLeg: {
      id: 1,
      from: 'Chennai',
      to: 'Bangalore',
      busName: 'Express',
      busNumber: 'TN01X1234',
      departureTime: '08:00',
      arrivalTime: '14:00'
    },
    secondLeg: {
      id: 2,
      from: 'Bangalore',
      to: 'Coimbatore',
      busName: 'Local',
      busNumber: 'TN03X9876',
      departureTime: '15:00',
      arrivalTime: '20:00'
    },
    connectionPoint: 'Bangalore',
    waitTime: '1 hour',
    totalDuration: '12 hours'
  }
];

/**
 * Main App component that orchestrates the application flow
 */
function App() {
  const { t } = useTranslation();
  const { browser } = useBrowserDetection();
  
  // Track app initialization state
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Mock states for development
  const [locations, setLocations] = useState(mockLocations);
  const [destinations, setDestinations] = useState(mockLocations);
  const [fromLocation, setFromLocation] = useState(mockLocations[0]);
  const [toLocation, setToLocation] = useState(mockLocations[1]);
  const [buses, setBuses] = useState(mockBuses);
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [stops, setStops] = useState(mockStops);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<Error | null>(null);
  
  useEffect(() => {
    // Check if this is the first time user is opening the app
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    
    if (!hasVisitedBefore) {
      // Show welcome message or onboarding
      // This could show a modal or redirect to an onboarding page
      localStorage.setItem('hasVisitedBefore', 'true');
    }
    
    // Mark app as initialized
    setIsInitialized(true);
  }, []);

  // Handler for the "Find Buses" button click
  const handleSearch = async () => {
    if (!fromLocation || !toLocation) {
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      console.log(`Searching for buses from ${fromLocation.name} to ${toLocation.name}`);
      
      // In a real application, this would be an API call
      // For now, simulate an API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter mock data based on selected locations
      const filteredBuses = mockBuses.filter(bus => 
        (bus.fromLocationId === fromLocation.id && bus.toLocationId === toLocation.id) ||
        (bus.fromLocationId === fromLocation.id || bus.toLocationId === toLocation.id)
      );
      
      setBuses(filteredBuses);
      setSelectedBusId(null); // Reset selected bus
      
      // Redirect to search results page if we have results
      if (filteredBuses.length > 0) {
        window.location.href = '/search-results';
      }
    } catch (error) {
      console.error('Error searching buses:', error);
      setSearchError(error instanceof Error ? error : new Error('Unknown error occurred'));
    } finally {
      setIsSearching(false);
    }
  };

  // Check if analytics is enabled
  const isAnalyticsEnabled = getFeatureFlag('ANALYTICS_ENABLED', true);
  
  // Only show analytics if the feature flag is enabled
  const showAnalytics = isAnalyticsEnabled;

  // Mock user ID for development
  const userId = 'user123';

  if (!isInitialized) {
    return <Loading message={t('app.initializing', 'Initializing app...')} />;
  }

  // Mock feature settings for development
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

  const handleSelectBus = (busId: number) => {
    setSelectedBusId(busId);
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
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
                      isLoading={isSearching}
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
                      isLoading={isSearching}
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
                    />
                  </ErrorBoundary>
                } />
                <Route path="/bus/:busId" element={
                  <ErrorBoundary>
                    <BusTracker 
                      buses={buses} 
                      stops={mockStopsByBus} 
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
                      connectingRoutes={mockConnectingRoutes}
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
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
