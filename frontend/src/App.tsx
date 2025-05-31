import './App.css';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import SearchForm from './components/SearchForm';
import BusList from './components/BusList';
import RouteMap from './components/RouteMap';
import ConnectingRoutes from './components/ConnectingRoutes';
import ErrorDisplay from './components/ErrorDisplay';
import Loading from './components/Loading';
import BusTracker from './components/BusTracker';
import LiveBusTracker from './components/LiveBusTracker';
import UserSessionHistory from './components/UserSessionHistory';
import UserRewards from './components/UserRewards';

// Custom hooks
import { useLocationData } from './hooks/useLocationData';
import { useBusSearch } from './hooks/useBusSearch';

// Utils
import { getFeatureFlag } from './utils/environment';

/**
 * Main App component that orchestrates the application flow
 */
function App() {
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
  
  // Active tab state for the tabbed interface
  const [activeTab, setActiveTab] = useState('tracking');

  return (
    <div className="app-container" data-testid="app-container">
      <Header 
        autoLocationEnabled={locationData.autoLocationEnabled}
        onToggleAutoLocation={locationData.toggleAutoLocation}
      />
      
      <main className="app-main">
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
        
        {isLoading && <Loading />}
        
        {error && <ErrorDisplay error={error} reset={handleErrorReset} />}

        {/* Accessibility toggles */}
        <div className="toggle-container">
          <label className="toggle">
            <input
              type="checkbox"
              aria-label="tracking"
              checked={showTracking}
              onChange={(e) => setShowTracking(e.target.checked)}
            />
            <span className="toggle-label"></span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              aria-label="rewards"
              checked={showRewards}
              onChange={(e) => setShowRewards(e.target.checked)}
            />
            <span className="toggle-label"></span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              aria-label="analytics"
              checked={showAnalytics}
              onChange={(e) => setShowAnalytics(e.target.checked)}
            />
            <span className="toggle-label"></span>
          </label>
        </div>

        {/* Show search list (BusList) first */}
        {!isLoading && !error && busSearch.buses.length > 0 && (
          <>
            <BusList 
              buses={busSearch.buses}
              selectedBusId={busSearch.selectedBusId}
              stops={busSearch.selectedBusId ? busSearch.stopsMap[busSearch.selectedBusId] || [] : []}
              onSelectBus={busSearch.selectBus}
            />
          </>
        )}

        {/* Show LiveBusTracker after the search list */}
        {!isLoading && !error && locationData.fromLocation && locationData.toLocation && (
          <LiveBusTracker 
            fromLocation={locationData.fromLocation}
            toLocation={locationData.toLocation}
            buses={busSearch.buses}
          />
        )}

        {!isLoading && !error && busSearch.buses.length > 0 && (
          <>
            {/* Add tabbed interface for Tracking, Analytics, and Rewards */}
            {(showTracking || showAnalytics || showRewards) && (
              <div className="tabs-container">
                <div className="tabs-header">
                  {showTracking && (
                    <button 
                      className={`tab-button ${activeTab === 'tracking' ? 'active' : ''}`}
                      onClick={() => setActiveTab('tracking')}
                    >
                      Tracking
                    </button>
                  )}
                  {showAnalytics && (
                    <button 
                      className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
                      onClick={() => setActiveTab('analytics')}
                    >
                      Analytics
                    </button>
                  )}
                  {showRewards && (
                    <button 
                      className={`tab-button ${activeTab === 'rewards' ? 'active' : ''}`}
                      onClick={() => setActiveTab('rewards')}
                    >
                      Rewards
                    </button>
                  )}
                </div>
                
                <div className="tabs-content">
                  {showTracking && (
                    <div style={{ display: activeTab === 'tracking' ? 'block' : 'none' }}>
                      <BusTracker 
                        buses={busSearch.buses}
                        stops={busSearch.stopsMap}
                      />
                    </div>
                  )}
                  
                  {showAnalytics && (
                    <div style={{ display: activeTab === 'analytics' ? 'block' : 'none' }}>
                      <UserSessionHistory data-testid="user-session-history" userId="test-user" />
                    </div>
                  )}

                  {showRewards && (
                    <div style={{ display: activeTab === 'rewards' ? 'block' : 'none' }}>
                      <UserRewards data-testid="user-rewards" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        
        {!isLoading && !error && busSearch.buses.length === 0 && busSearch.connectingRoutes.length > 0 && (
          <ConnectingRoutes 
            connectingRoutes={busSearch.connectingRoutes}
          />
        )}

        {(locationData.fromLocation && locationData.toLocation) && !error && (
          <RouteMap 
            fromLocation={locationData.fromLocation}
            toLocation={locationData.toLocation}
            selectedStops={busSearch.selectedBusId ? busSearch.stopsMap[busSearch.selectedBusId] || [] : []}
          />
        )}
      </main>
      
      <Footer />
    </div>
  );
}

export default App;
