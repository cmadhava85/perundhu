import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import type { Bus, Stop, Location as BusLocation, ConnectingRoute } from '../types';

// Components (eager loaded - used on most pages)
import ErrorBoundary from './ErrorBoundary';
import { SearchErrorFallback, MapErrorFallback, ContributionErrorFallback } from './ErrorFallbacks';
import Loading from './Loading';
import ErrorDisplay from './ErrorDisplay';
import { LoadingSkeleton } from './LoadingSkeleton';
import TransitSearchForm from './TransitSearchForm';
import RouteContributionComponent from './RouteContribution';

// Lazy-loaded route components — these pull in Leaflet/map chunks; only fetch when navigated to
const SearchResults = React.lazy(() => import('./SearchResults'));
const BusTracker = React.lazy(() => import('./BusTracker'));
const CombinedMapTracker = React.lazy(() => import('./CombinedMapTracker'));
const ConnectingRoutes = React.lazy(() => import('./ConnectingRoutes'));

// Admin components
import AdminLogin from './admin/AdminLogin';
import ProtectedAdminRoute from './admin/ProtectedAdminRoute';

// Lazy loaded components (used less frequently)
const UserSessionHistory = React.lazy(() => import('./UserSessionHistory'));
const UserRewards = React.lazy(() => import('./UserRewards'));
const UserAnalyticsDashboard = React.lazy(() => import('./UserAnalyticsDashboard'));
const AdminDashboard = React.lazy(() => import('./admin/AdminDashboard'));
const FeatureSettings = React.lazy(() => import('./FeatureSettings'));

// Static pages - lazy loaded
const AboutUs = React.lazy(() => import('./StaticPages').then(module => ({ default: module.AboutUs })));
const ContactUs = React.lazy(() => import('./StaticPages').then(module => ({ default: module.ContactUs })));
const PrivacyPolicy = React.lazy(() => import('./StaticPages').then(module => ({ default: module.PrivacyPolicy })));
const TermsOfService = React.lazy(() => import('./StaticPages').then(module => ({ default: module.TermsOfService })));
const FAQ = React.lazy(() => import('./StaticPages').then(module => ({ default: module.FAQ })));

interface AppRoutesProps {
  locations: BusLocation[];
  fromLocation: BusLocation | null;
  toLocation: BusLocation | null;
  buses: Bus[];
  stops: Stop[];
  stopsMap: { [busId: number]: Stop[] };
  searchError: Error | null;
  connectingRoutes: ConnectingRoute[];
  busesLoading: boolean;
  loadingMore?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  totalCount?: number;
  showAnalytics: boolean;
  userId: string;
  featureSettings: {
    showTracking: boolean;
    showAnalytics: boolean;
    showRewards: boolean;
    showMap: boolean;
    enableNotifications: boolean;
    useHighAccuracyLocation: boolean;
    darkMode: boolean;
    saveSearchHistory: boolean;
  };
  onLocationChange: (from: BusLocation, to: BusLocation) => void;
  onSearch: (from: BusLocation, to: BusLocation) => void;
}

/**
 * Application routes configuration component
 * Extracted from App.tsx for better code organization and lazy loading
 */
const AppRoutes: React.FC<AppRoutesProps> = React.memo(({
  locations,
  fromLocation,
  toLocation,
  buses,
  stops,
  stopsMap,
  searchError,
  connectingRoutes,
  busesLoading,
  loadingMore,
  hasNextPage,
  fetchNextPage,
  totalCount,
  showAnalytics,
  userId,
  featureSettings,
  onLocationChange,
  onSearch
}) => {
  // Lazy loading fallback component
  const LazyLoadingFallback = (
    <Loading message="Loading..." />
  );

  return (
    <Routes>
      <Route path="/" element={
        <ErrorBoundary fallback={SearchErrorFallback}>
          {fromLocation && toLocation ? (
            <TransitSearchForm 
              locations={locations}
              fromLocation={fromLocation}
              toLocation={toLocation}
              onLocationChange={onLocationChange}
              onSearch={(from, to, _options) => onSearch(from, to)}
            />
          ) : (
            <LoadingSkeleton count={1} type="text" />
          )}
        </ErrorBoundary>
      } />
      
      <Route path="/search" element={
        <ErrorBoundary fallback={SearchErrorFallback}>
          {fromLocation && toLocation ? (
            <TransitSearchForm 
              locations={locations}
              fromLocation={fromLocation}
              toLocation={toLocation}
              onLocationChange={onLocationChange}
              onSearch={(from, to, _options) => onSearch(from, to)}
            />
          ) : (
            <LoadingSkeleton count={1} type="text" />
          )}
        </ErrorBoundary>
      } />
      
      <Route path="/search-results" element={
        <ErrorBoundary fallback={SearchErrorFallback}>
          <Suspense fallback={LazyLoadingFallback}>
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
                loadingMore={loadingMore}
                hasNextPage={hasNextPage}
                onLoadMore={fetchNextPage}
                totalCount={totalCount}
              />
            ) : (
              <LoadingSkeleton count={1} type="text" />
            )}
          </Suspense>
        </ErrorBoundary>
      } />
      
      <Route path="/bus/:busId" element={
        <ErrorBoundary fallback={SearchErrorFallback}>
          <Suspense fallback={LazyLoadingFallback}>
            <BusTracker 
              buses={buses} 
              stops={stopsMap} 
            />
          </Suspense>
        </ErrorBoundary>
      } />
      
      <Route path="/track/:busId" element={
        <ErrorBoundary fallback={MapErrorFallback}>
          <Suspense fallback={LazyLoadingFallback}>
            {fromLocation && toLocation ? (
              <CombinedMapTracker 
                fromLocation={fromLocation}
                toLocation={toLocation}
                buses={buses}
              />
            ) : (
              <Loading message="Loading locations..." />
            )}
          </Suspense>
        </ErrorBoundary>
      } />
      
      <Route path="/connecting-routes" element={
        <ErrorBoundary fallback={SearchErrorFallback}>
          <Suspense fallback={LazyLoadingFallback}>
            <ConnectingRoutes 
              connectingRoutes={connectingRoutes}
            />
          </Suspense>
        </ErrorBoundary>
      } />
      
      {showAnalytics && (
        <Route path="/analytics" element={
          <ErrorBoundary>
            <Suspense fallback={LazyLoadingFallback}>
              <UserAnalyticsDashboard userId={userId} />
            </Suspense>
          </ErrorBoundary>
        } />
      )}
      
      <Route path="/history" element={
        <ErrorBoundary>
          <Suspense fallback={LazyLoadingFallback}>
            <UserSessionHistory userId={userId} />
          </Suspense>
        </ErrorBoundary>
      } />
      
      <Route path="/rewards" element={
        <ErrorBoundary>
          <Suspense fallback={LazyLoadingFallback}>
            <UserRewards userId={userId} />
          </Suspense>
        </ErrorBoundary>
      } />
      
      <Route path="/contribute" element={
        <ErrorBoundary fallback={ContributionErrorFallback}>
          <RouteContributionComponent />
        </ErrorBoundary>
      } />
      
      {/* Admin Login Route */}
      <Route path="/admin/login" element={
        <AdminLogin />
      } />
      
      {/* Protected Admin Dashboard */}
      <Route path="/admin" element={
        <ProtectedAdminRoute>
          <ErrorBoundary>
            <Suspense fallback={LazyLoadingFallback}>
              <AdminDashboard />
            </Suspense>
          </ErrorBoundary>
        </ProtectedAdminRoute>
      } />
      
      <Route path="/settings" element={
        <ErrorBoundary>
          <Suspense fallback={LazyLoadingFallback}>
            <FeatureSettings 
              {...featureSettings}
              onSettingsChange={() => {}}
            />
          </Suspense>
        </ErrorBoundary>
      } />
      
      {/* Static Pages */}
      <Route path="/about" element={
        <ErrorBoundary>
          <Suspense fallback={LazyLoadingFallback}>
            <AboutUs />
          </Suspense>
        </ErrorBoundary>
      } />
      
      <Route path="/contact" element={
        <ErrorBoundary>
          <Suspense fallback={LazyLoadingFallback}>
            <ContactUs />
          </Suspense>
        </ErrorBoundary>
      } />
      
      <Route path="/privacy" element={
        <ErrorBoundary>
          <Suspense fallback={LazyLoadingFallback}>
            <PrivacyPolicy />
          </Suspense>
        </ErrorBoundary>
      } />
      
      <Route path="/terms" element={
        <ErrorBoundary>
          <Suspense fallback={LazyLoadingFallback}>
            <TermsOfService />
          </Suspense>
        </ErrorBoundary>
      } />
      
      <Route path="/faq" element={
        <ErrorBoundary>
          <Suspense fallback={LazyLoadingFallback}>
            <FAQ />
          </Suspense>
        </ErrorBoundary>
      } />
      
      <Route path="*" element={
        <ErrorDisplay 
          error={new Error('Sorry, the page you are looking for does not exist.')}
        />
      } />
    </Routes>
  );
});

AppRoutes.displayName = 'AppRoutes';

export default AppRoutes;
