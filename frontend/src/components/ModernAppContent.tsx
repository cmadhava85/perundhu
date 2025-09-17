import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';

// Modern UI Components
import MobileNavigation from './ui/MobileNavigation';
import ModernLayout, { SearchLayout, ResultsLayout, ContributionLayout } from './ui/ModernLayout';
import ModernSearchForm from './ui/ModernSearchForm';
import { ModernBusCard, ModernSearchResults } from './ui/ModernExamples';
import { FloatingActionButton, useToast } from './ui/ModernAnimations';

// Existing components (we'll gradually replace these)
import SearchForm from './SearchForm';
import ModernBusList from './ModernBusList';
import RouteContributionComponent from './RouteContribution';
import ErrorDisplay from './ErrorDisplay';
import Loading from './Loading';

// Hooks
import { useLocationData } from '../hooks/useLocationData';
import { useBusSearch } from '../hooks/useBusSearch';

export const ModernAppContent: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  
  // State management
  const [currentView, setCurrentView] = useState<'search' | 'results' | 'contribute'>('search');
  const [showModernUI, setShowModernUI] = useState(true); // Toggle for A/B testing
  
  // Data hooks
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
    loading: busesLoading,
    error: searchError,
    searchBuses,
    resetResults
  } = useBusSearch();
  
  // Local state
  const [fromLocation, setFromLocation] = useState(initialFromLocation);
  const [toLocation, setToLocation] = useState(initialToLocation);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Navigation items
  const navItems = [
    { id: 'search', label: 'Search', icon: Search, href: '/search' },
    { id: 'routes', label: 'Routes', icon: Search, href: '/routes' },
    { id: 'tracker', label: 'Tracker', icon: Search, href: '/tracker' },
    { id: 'contribute', label: 'Contribute', icon: Plus, href: '/contribute' },
  ];
  
  // Update view based on route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/contribute') {
      setCurrentView('contribute');
    } else if (path === '/search-results' || searchResults.length > 0) {
      setCurrentView('results');
    } else {
      setCurrentView('search');
    }
  }, [location.pathname, searchResults.length]);
  
  // Handle search
  const handleModernSearch = async (from: string, to: string, filters?: any) => {
    setIsSearching(true);
    
    try {
      // Convert string locations to location objects
      const fromLoc = locations?.find(loc => 
        loc.name.toLowerCase().includes(from.toLowerCase())
      ) || { id: 1, name: from, latitude: 0, longitude: 0 };
      
      const toLoc = destinations?.find(loc => 
        loc.name.toLowerCase().includes(to.toLowerCase())
      ) || { id: 2, name: to, latitude: 0, longitude: 0 };
      
      // Use existing search function
      await searchBuses(fromLoc, toLoc);
      
      // Transform results for modern UI
      const modernResults = buses.map((bus, index) => ({
        id: bus.id || `bus-${index}`,
        name: bus.busName || `Bus ${index + 1}`,
        route: `${from} → ${to}`,
        departure: bus.departureTime || '08:30',
        arrival: bus.arrivalTime || '14:45',
        duration: bus.duration || '6h 15m',
        price: Math.floor(Math.random() * 500) + 300,
        rating: 4.2 + Math.random() * 0.8,
        type: bus.busType || 'AC Bus',
        seatsAvailable: Math.floor(Math.random() * 20) + 1,
        amenities: ['WiFi', 'Charging Point', 'Water Bottle']
      }));
      
      setSearchResults(modernResults);
      setCurrentView('results');
      navigate('/search-results');
      
      showToast({
        type: 'success',
        title: 'Search Complete',
        message: `Found ${modernResults.length} buses`
      });
      
    } catch (error) {
      console.error('Search failed:', error);
      showToast({
        type: 'error',
        title: 'Search Failed',
        message: 'Please try again'
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle navigation
  const handleNavigation = (path: string) => {
    navigate(path);
  };
  
  // Handle bus booking
  const handleBookBus = (busId: string) => {
    showToast({
      type: 'success',
      title: 'Booking Initiated',
      message: 'Redirecting to booking page...'
    });
    
    // Here you would typically navigate to booking page
    // navigate(`/book/${busId}`);
  };
  
  // Prepare suggestions for search form
  const suggestions = locations?.slice(0, 6).map(loc => ({
    id: loc.id.toString(),
    name: loc.name,
    type: 'city' as const
  })) || [];
  
  // Render based on current view
  const renderContent = () => {
    if (!showModernUI) {
      // Fallback to original components
      return (
        <Routes>
          <Route path="/" element={
            <div className="container mx-auto px-4 py-8">
              <SearchForm 
                locations={locations}
                onSearch={() => { 
                  if (fromLocation && toLocation) {
                    handleModernSearch(fromLocation.name, toLocation.name);
                  }
                }}
                fromLocation={fromLocation || { id: 1, name: '', latitude: 0, longitude: 0 }}
                toLocation={toLocation || { id: 2, name: '', latitude: 0, longitude: 0 }}
                onFromLocationChange={setFromLocation}
                onToLocationChange={setToLocation}
                destinations={destinations}
                isLoading={locationsLoading}
              />
              {buses.length > 0 && (
                <ModernBusList 
                  buses={buses}
                  showTitle={true}
                  fromLocation={fromLocation?.name}
                  toLocation={toLocation?.name}
                />
              )}
              {searchError && <ErrorDisplay error={searchError} />}
            </div>
          } />
          <Route path="/contribute" element={<RouteContributionComponent />} />
        </Routes>
      );
    }
    
    // Modern UI
    switch (currentView) {
      case 'search':
        return (
          <SearchLayout>
            <ModernSearchForm
              onSearch={handleModernSearch}
              suggestions={suggestions}
              isLoading={isSearching}
              variant="glass"
            />
          </SearchLayout>
        );
        
      case 'results':
        return (
          <ModernSearchResults
            results={searchResults}
            isLoading={isSearching}
            filters={{}}
            onFilterChange={() => {}}
          />
        );
        
      case 'contribute':
        return (
          <ContributionLayout>
            <RouteContributionComponent />
          </ContributionLayout>
        );
        
      default:
        return (
          <SearchLayout>
            <ModernSearchForm
              onSearch={handleModernSearch}
              suggestions={suggestions}
              isLoading={isSearching}
              variant="glass"
            />
          </SearchLayout>
        );
    }
  };
  
  return (
    <ModernLayout
      showNavigation={true}
      showBottomNav={true}
      background="default"
      padding="none"
    >
      {/* Custom Navigation */}
      <MobileNavigation
        items={navItems}
        currentPath={location.pathname}
        onNavigate={handleNavigation}
      />
      
      {/* Main Content */}
      <div className="pt-16 pb-20 md:pb-0">
        <Routes>
          <Route path="/" element={renderContent()} />
          <Route path="/search" element={renderContent()} />
          <Route path="/search-results" element={renderContent()} />
          <Route path="/contribute" element={renderContent()} />
          <Route path="*" element={renderContent()} />
        </Routes>
      </div>
      
      {/* Floating Action Button for quick actions */}
      {currentView === 'search' && (
        <FloatingActionButton
          icon={Plus}
          onClick={() => navigate('/contribute')}
          label="Add Route"
          position="bottom-right"
        />
      )}
      
      {/* Loading overlay */}
      {(isSearching || busesLoading || locationsLoading) && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <Loading />
        </div>
      )}
      
      {/* Modern UI Toggle (for development) */}
      <button
        onClick={() => setShowModernUI(!showModernUI)}
        className="fixed top-20 left-4 z-40 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg"
      >
        {showModernUI ? 'Classic UI' : 'Modern UI'}
      </button>
    </ModernLayout>
  );
};