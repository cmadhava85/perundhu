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
import SearchResults from './SearchResults';
import BusTracker from './BusTracker';
import CombinedMapTracker from './CombinedMapTracker';
import ConnectingRoutes from './ConnectingRoutes';
import RouteContributionComponent from './RouteContribution';

// Admin components
// import AdminLogin from './admin/AdminLogin'; // TEMPORARILY DISABLED (Issue #3)
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
        <ErrorBoundary fallback={SearchErrorFallback}>
          <BusTracker 
            buses={buses} 
            stops={stopsMap} 
          />
        </ErrorBoundary>
      } />
      
      <Route path="/track/:busId" element={
        <ErrorBoundary fallback={MapErrorFallback}>
          {fromLocation && toLocation ? (
            <CombinedMapTracker 
              fromLocation={fromLocation}
              toLocation={toLocation}
              buses={buses}
            />
          ) : (
            <Loading message="Loading locations..." />
          )}
        </ErrorBoundary>
      } />
      
      <Route path="/connecting-routes" element={
        <ErrorBoundary fallback={SearchErrorFallback}>
          <ConnectingRoutes 
            connectingRoutes={connectingRoutes}
          />
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
      
      {/* Admin Login Route - TEMPORARILY DISABLED (Issue #3) */}
      {/* To re-enable: Uncomment the Route below and the AdminLogin import at the top of this file */}
      {/* <Route path="/admin/login" element={
        <AdminLogin />
      } /> */}
      
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
