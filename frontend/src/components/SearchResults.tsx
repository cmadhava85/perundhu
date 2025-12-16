import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import TransitBusList from './TransitBusList';
import { VirtualBusList } from './VirtualBusList';
import { LoadingSkeleton } from './LoadingSkeleton';
import OpenStreetMapComponent from './OpenStreetMapComponent';
import FallbackMapComponent from './FallbackMapComponent';
import ReportIssue from './contribution/ReportIssue';
import type { Bus, Stop, Location as AppLocation } from '../types';
import { ApiError } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/transit-design-system.css';
// Using TransitBusList with new Transit design system

interface SearchResultsProps {
  buses: Bus[];
  fromLocation: AppLocation;
  toLocation: AppLocation;
  stops: Stop[];  // Keep this for compatibility, but also add stopsMap
  stopsMap?: Record<number, Stop[]>;  // Add this for the complete stops data
  error?: Error | ApiError | null;
  connectingRoutes?: unknown[];
  loading?: boolean;  // Add loading prop
}

const SearchResults: React.FC<SearchResultsProps> = ({
  buses,
  fromLocation,
  toLocation,
  stops,
  stopsMap = {},
  error,
  connectingRoutes: _connectingRoutes = [],
  loading = false
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [selectedBusStops, setSelectedBusStops] = useState<Stop[]>([]);
  const [reportIssueBus, setReportIssueBus] = useState<Bus | null>(null);
  
  // Helper function to get display name for location
  const getLocationDisplayName = (location: AppLocation) => {
    if (i18n.language === 'ta' && location.translatedName) {
      return location.translatedName;
    }
    return location.name;
  };
  
  // Use virtual scrolling for large lists (50+ buses)
  const useVirtualScrolling = buses.length > 50;
  
  // Auto-select first bus when buses are loaded
  useEffect(() => {
    if (buses.length > 0 && selectedBusId === null) {
      setSelectedBusId(buses[0].id);
    }
  }, [buses, selectedBusId]);
  
  useEffect(() => {
    if (selectedBusId) {
      // Compute allStops inside effect to avoid dependency issues
      const allStops = Object.keys(stopsMap).length > 0 
        ? Object.values(stopsMap).flat() 
        : stops;
      
      // Try to get stops from stopsMap first, then fall back to filtering all stops
      const busStops = stopsMap[selectedBusId] || allStops.filter(stop => stop.busId === selectedBusId);
      setSelectedBusStops(busStops);
    } else {
      setSelectedBusStops([]);
    }
  }, [selectedBusId, stopsMap, stops]);
  
  const handleSelectBus = (bus: Bus) => {
    setSelectedBusId(bus.id);
  };

  // Handle Add Stops - navigate to contribute page with bus pre-selected
  const handleAddStops = (bus: Bus) => {
    console.log('SearchResults - handleAddStops called with bus:', bus);
    console.log('SearchResults - fromLocation:', fromLocation);
    console.log('SearchResults - toLocation:', toLocation);
    // Navigate to contribute page with bus info in state
    navigate('/contribute', { 
      state: { 
        selectedBus: bus,
        method: 'add-stops',
        fromSearch: true,
        fromLocation: fromLocation,
        toLocation: toLocation
      }
    });
  };

  // Handle Report Issue - open modal with bus pre-selected
  const handleReportIssue = (bus: Bus) => {
    setReportIssueBus(bus);
  };

  // Handle report issue submission success
  const handleReportSubmit = () => {
    setReportIssueBus(null);
    // Could add a toast notification here
  };

  // Handle report issue error
  const handleReportError = (error: string) => {
    console.error('Report issue error:', error);
    // Could add error toast notification here
  };

  // Show loading skeleton while searching
  if (loading) {
    return (
      <div className="transit-app">
        <div className="search-results-content">
          <div className="bus-list-section">
            <LoadingSkeleton count={5} type="bus-card" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transit-app">
        <div className="container-sm" style={{ paddingTop: 'var(--space-8)' }}>
          <div className="transit-card elevated" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>⚠️</div>
            <h2 className="text-title-2" style={{ marginBottom: 'var(--space-2)' }}>
              {t('searchResults.error.title', 'Search Error')}
            </h2>
            <p className="text-body" style={{ color: 'var(--transit-text-secondary)', marginBottom: 'var(--space-4)' }}>
              {t('searchResults.error.message', "We couldn't complete your search right now. Please try again in a moment.")}
            </p>
            <Link to="/" className="transit-button primary">
              {t('searchResults.error.home', 'Back to Search')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="transit-app">
      <div className="search-results-content">
        {/* Edit Search Button - Sticky at top */}
        <div className="edit-search-header" style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: '16px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {/* Current Search Display */}
          <div style={{ 
            flex: '1 1 auto',
            minWidth: '200px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ 
              fontSize: '11px', 
              fontWeight: 600,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {t('searchResults.currentSearch', 'Current Search')}
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#1F2937'
            }}>
                          <div className="row row-sm" style={{ alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
              <span>📍 {getLocationDisplayName(fromLocation)}</span>
              <span style={{ color: 'var(--transit-primary)' }}>→</span>
              <span>🎯 {getLocationDisplayName(toLocation)}</span>
            </div>
          </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '8px',
            flexShrink: 0
          }}>
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.25)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span className="hidden sm:inline">{t('searchResults.editSearch', 'Edit Search')}</span>
              <span className="sm:hidden">{t('searchResults.edit', 'Edit')}</span>
            </button>

            <button
              onClick={() => {
                navigate('/', { replace: true });
                globalThis.location.reload();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                background: '#FFFFFF',
                color: '#6B7280',
                border: '1.5px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F9FAFB';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.color = '#3B82F6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.color = '#6B7280';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <span className="hidden sm:inline">{t('searchResults.newSearch', 'New Search')}</span>
              <span className="sm:hidden">{t('searchResults.new', 'New')}</span>
            </button>
          </div>
        </div>

        <div className="bus-list-section">{useVirtualScrolling ? (
            <VirtualBusList
              buses={buses}
              onBusClick={handleSelectBus}
              selectedBusId={selectedBusId}
              height={600}
            />
          ) : (
            <TransitBusList 
              buses={buses} 
              selectedBusId={selectedBusId} 
              stops={Object.keys(stopsMap).length > 0 ? Object.values(stopsMap).flat() : stops}
              stopsMap={stopsMap}
              onSelectBus={handleSelectBus}
              fromLocation={getLocationDisplayName(fromLocation)}
              toLocation={getLocationDisplayName(toLocation)}
              fromLocationObj={fromLocation}
              toLocationObj={toLocation}
              onAddStops={handleAddStops}
              onReportIssue={handleReportIssue}
            />
          )}
        </div>
        
        <div className="map-section">
          {typeof globalThis !== 'undefined' && (globalThis as unknown as { L?: unknown }).L ? (
            <OpenStreetMapComponent
              fromLocation={fromLocation}
              toLocation={toLocation}
              selectedStops={selectedBusStops}
              style={{ height: '400px', width: '100%' }}
            />
          ) : (
            <FallbackMapComponent
              fromLocation={fromLocation}
              toLocation={toLocation}
              selectedStops={selectedBusStops}
              style={{ height: '400px', width: '100%' }}
            />
          )}
        </div>

        {/* Report Issue Modal */}
        {reportIssueBus && (
          <div 
            className="report-issue-modal-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '16px'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setReportIssueBus(null);
              }
            }}
          >
            <div 
              className="report-issue-modal-content"
              style={{
                background: '#fff',
                borderRadius: '16px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
            >
              <ReportIssue
                preSelectedBus={reportIssueBus}
                preSelectedFrom={fromLocation}
                preSelectedTo={toLocation}
                onSubmit={handleReportSubmit}
                onError={handleReportError}
                onClose={() => setReportIssueBus(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(SearchResults);
