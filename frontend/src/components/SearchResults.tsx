import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FixedSizeList as List } from 'react-window';
import { LoadingSkeleton } from './LoadingSkeleton';
import OpenStreetMapComponent from './OpenStreetMapComponent';
import FallbackMapComponent from './FallbackMapComponent';
import ReportIssue from './contribution/ReportIssue';
import ConnectingRoutes from './ConnectingRoutes';
import BusCardModern from './BusCardModern';
import { TerminalInfoAlert } from './TerminalInfoAlert';
import { useTerminalResolution } from '../hooks/queries/useTerminalResolution';
import { PremiumAdContainer } from './GoogleAdContainer';
import useGoogleAds from '../hooks/useGoogleAds';
import type { Bus, Stop, Location as AppLocation, ConnectingRoute } from '../types';
import { ApiError } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/premium-design-system.css';
import '../styles/transit-design-system.css';
import '../styles/premium-bus-grid.css';

// Inline CSS for spin animation
const spinKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Using TransitBusList with new Transit design system

interface SearchResultsProps {
  buses: Bus[];
  fromLocation: AppLocation;
  toLocation: AppLocation;
  stops: Stop[];  // Keep this for compatibility, but also add stopsMap
  stopsMap?: Record<number, Stop[]>;  // Add this for the complete stops data
  error?: Error | ApiError | null;
  connectingRoutes?: ConnectingRoute[];
  loading?: boolean;  // Add loading prop
  loadingMore?: boolean;  // Loading state for next page
  hasNextPage?: boolean;  // Whether more results are available
  onLoadMore?: () => void;  // Function to load next page
  totalCount?: number;  // Total number of results across all pages
}

// Virtual list item renderer for efficient large-list rendering
// Each row includes a bus card + optional ad
interface VirtualBusRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    buses: Bus[];
    selectedBusId: number | null;
    handleSelectBus: (bus: Bus) => void;
    handleAddStops: (bus: Bus) => void;
    handleReportIssue: (bus: Bus) => void;
    fromLocation: AppLocation;
    toLocation: AppLocation;
    stopsMap: Record<number, Stop[]>;
    stops: Stop[];
    adsEnabled: boolean;
    getAdConfig: (key: 'betweenSearchResults' | 'sidebarRight' | 'footerSection' | 'aboveSearchForm') => { adSlot: string };
  };
}

const VirtualBusRow = memo(({ index, style, data }: VirtualBusRowProps) => {
  const bus = data.buses[index];
  if (!bus) return null;

  return (
    <div style={style} key={`bus-row-${bus.id}`}>
      <React.Fragment key={bus.id}>
        <BusCardModern
          bus={bus}
          index={index}
          isSelected={data.selectedBusId === bus.id}
          onSelect={data.handleSelectBus}
          onAddStops={data.handleAddStops}
          onReportIssue={data.handleReportIssue}
          fromLocation={data.fromLocation}
          toLocation={data.toLocation}
          stops={data.stopsMap[bus.id] || data.stops.filter(s => s.busId === bus.id)}
        />
        {/* Show ad between results - every 3 buses */}
        {data.adsEnabled && (index + 1) % 3 === 0 && (
          <PremiumAdContainer
            adSlot={data.getAdConfig('betweenSearchResults').adSlot}
            adFormat="square"
            placement="between-routes"
            placementKey="betweenSearchResults"
          />
        )}
      </React.Fragment>
    </div>
  );
});

VirtualBusRow.displayName = 'VirtualBusRow';

// PHASE 2 OPTIMIZATION: Memoize SearchResults to prevent unnecessary re-renders
const SearchResults: React.FC<SearchResultsProps> = memo(({
  buses,
  fromLocation,
  toLocation,
  stops,
  stopsMap = {},
  error,
  connectingRoutes = [],
  loading = false,
  loadingMore = false,
  hasNextPage = false,
  onLoadMore,
  totalCount
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { adsEnabled, getAdConfig } = useGoogleAds();
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [selectedBusStops, setSelectedBusStops] = useState<Stop[]>([]);
  const [reportIssueBus, setReportIssueBus] = useState<Bus | null>(null);
  
  // Filter and sort state
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'night'>('all');
  const [sortBy, setSortBy] = useState<'earliest' | 'latest' | 'duration'>('earliest');

  // Inject spin animation styles on mount
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = spinKeyframes;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  // Show error toast
  useEffect(() => {
    if (error) {
      const errorMsg = error instanceof ApiError 
        ? error.userMessage || error.message 
        : error.message;
      toast.error(errorMsg, {
        duration: 5000,
        icon: '❌',
      });
    }
  }, [error]);
  
  // Resolve terminal information for the selected route
  const { data: terminalInfo } = useTerminalResolution(
    fromLocation.name, 
    toLocation.name,
    buses.length > 0 // Only enable query when we have results
  );
  
  // Helper function to get display name for location
  const getLocationDisplayName = (location: AppLocation) => {
    if (i18n.language === 'ta' && location.translatedName) {
      return location.translatedName;
    }
    return location.name;
  };
  
  // Helper function to parse time and calculate duration
  const parseTime = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };
  
  const calculateDuration = (departure: string, arrival: string): number => {
    const depMin = parseTime(departure);
    const arrMin = parseTime(arrival);
    let duration = arrMin - depMin;
    if (duration < 0) duration += 24 * 60; // Handle overnight journeys
    return duration;
  };
  
  const getTimeCategory = (timeStr: string): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const minutes = parseTime(timeStr);
    const hours = Math.floor(minutes / 60);
    if (hours >= 6 && hours < 12) return 'morning';
    if (hours >= 12 && hours < 17) return 'afternoon';
    if (hours >= 17 && hours < 21) return 'evening';
    return 'night';
  };
  
  // Filter and sort buses
  const filteredAndSortedBuses = useMemo(() => {
    let result = [...buses];
    
    // Apply time filter
    if (timeFilter !== 'all') {
      result = result.filter(bus => {
        if (!bus.departureTime) return false;
        return getTimeCategory(bus.departureTime) === timeFilter;
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'earliest') {
        return parseTime(a.departureTime || '00:00') - parseTime(b.departureTime || '00:00');
      } else if (sortBy === 'latest') {
        return parseTime(b.departureTime || '00:00') - parseTime(a.departureTime || '00:00');
      } else if (sortBy === 'duration') {
        const durationA = calculateDuration(a.departureTime || '00:00', a.arrivalTime || '00:00');
        const durationB = calculateDuration(b.departureTime || '00:00', b.arrivalTime || '00:00');
        return durationA - durationB;
      }
      return 0;
    });
    
    return result;
  }, [buses, timeFilter, sortBy]);
  
  // Calculate quick stats
  const quickStats = useMemo(() => {
    if (buses.length === 0) return null;
    
    const durations = buses
      .filter(b => b.departureTime && b.arrivalTime)
      .map(b => calculateDuration(b.departureTime!, b.arrivalTime!));
    
    const fastestDuration = durations.length > 0 ? Math.min(...durations) : 0;
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    
    // Find next departure
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const nextBus = buses
      .filter(b => b.departureTime)
      .map(b => ({ bus: b, minutes: parseTime(b.departureTime!) }))
      .filter(({ minutes }) => minutes >= currentMinutes)
      .sort((a, b) => a.minutes - b.minutes)[0];
    
    return {
      total: buses.length,
      fastestDuration: Math.floor(fastestDuration / 60) + 'h ' + (fastestDuration % 60) + 'm',
      avgDuration: Math.floor(avgDuration / 60) + 'h ' + (avgDuration % 60) + 'm',
      nextDeparture: nextBus ? nextBus.bus.departureTime : null
    };
  }, [buses]);
  
  // Use virtual scrolling for large lists (50+ buses)
  // const useVirtualScrolling = buses.length > 50;
  
  // Auto-select first bus when buses are loaded
  useEffect(() => {
    if (buses.length > 0 && selectedBusId === null) {
      setSelectedBusId(buses[0].id);
    }
  }, [buses.length, selectedBusId]); // ✅ Only depend on buses.length to avoid unnecessary re-renders
  
  // ✅ Optimized: Compute selected bus stops - removed state setter from dependencies
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
  }, [selectedBusId, stopsMap, stops]); // ✅ State setter (setSelectedBusStops) is stable and doesn't need to be in deps
  
  // PHASE 2 OPTIMIZATION: Memoize callbacks to prevent child re-renders
  const handleSelectBus = useCallback((bus: Bus) => {
    setSelectedBusId(bus.id);
  }, []);

  // Handle Add Stops - navigate to contribute page with bus pre-selected
  const handleAddStops = useCallback((bus: Bus) => {
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
  }, [fromLocation, toLocation, navigate]);

  // Handle Report Issue - open modal with bus pre-selected
  const handleReportIssue = useCallback((bus: Bus) => {
    setReportIssueBus(bus);
  }, []);

  // Handle report issue submission success
  const handleReportSubmit = useCallback(() => {
    // Don't close immediately - let ReportIssue component show success message
    // and close automatically after 3 seconds
    // Could add a toast notification here if needed
  }, []);

  // Handle report issue error
  const handleReportError = useCallback((error: string) => {
    console.error('Report issue error:', error);
    // Could add error toast notification here
  }, []);

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

        {/* Terminal Information Alert */}
        {terminalInfo?.needsTerminalInfo && terminalInfo.terminal && (
          <TerminalInfoAlert terminal={terminalInfo.terminal} />
        )}        
        {/* Results Summary and Filters */}
        {buses.length > 0 && (
          <>
            {/* Quick Stats Summary */}
            {quickStats && (
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '0',
                padding: '8px 12px',
                background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                borderRadius: '10px',
                marginBottom: '12px',
                border: '1px solid rgba(59, 130, 246, 0.1)'
              }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <div style={{ fontSize: '16px', lineHeight: 1 }}>🚌</div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937', lineHeight: 1.2 }}>
                      {quickStats.total}
                    </div>
                    <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {t('searchResults.totalBuses', 'Total Buses')}
                    </div>
                  </div>
                </div>

                <div style={{ width: '1px', height: '32px', background: 'rgba(59,130,246,0.15)', flexShrink: 0 }} />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <div style={{ fontSize: '16px', lineHeight: 1 }}>⚡</div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937', lineHeight: 1.2 }}>
                      {quickStats.fastestDuration}
                    </div>
                    <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {t('searchResults.fastest', 'Fastest')}
                    </div>
                  </div>
                </div>

                {quickStats.nextDeparture && (
                  <>
                    <div style={{ width: '1px', height: '32px', background: 'rgba(59,130,246,0.15)', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <div style={{ fontSize: '16px', lineHeight: 1 }}>⏰</div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937', lineHeight: 1.2 }}>
                          {quickStats.nextDeparture}
                        </div>
                        <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {t('searchResults.nextDeparture', 'Next Departure')}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Compact Filter & Sort Bar */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '8px 10px',
              background: '#FFFFFF',
              borderRadius: '10px',
              marginBottom: '12px',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}>
              {/* Time filter chips — horizontal scroll, no wrap */}
              <div style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                flexWrap: 'nowrap',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              } as React.CSSProperties}>
                {[
                  { value: 'all', label: t('searchResults.allTimes', 'All'), icon: '🕐' },
                  { value: 'morning', label: t('searchResults.morningShort', 'Morning'), icon: '🌅' },
                  { value: 'afternoon', label: t('searchResults.afternoonShort', 'Afternoon'), icon: '☀️' },
                  { value: 'evening', label: t('searchResults.eveningShort', 'Evening'), icon: '🌆' },
                  { value: 'night', label: t('searchResults.nightShort', 'Night'), icon: '🌙' },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setTimeFilter(filter.value as typeof timeFilter)}
                    style={{
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '20px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      background: timeFilter === filter.value
                        ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                        : '#F3F4F6',
                      color: timeFilter === filter.value ? '#FFFFFF' : '#4B5563',
                      boxShadow: timeFilter === filter.value
                        ? '0 2px 6px rgba(59, 130, 246, 0.3)'
                        : 'none',
                    }}
                  >
                    <span>{filter.icon}</span>
                    <span>{filter.label}</span>
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: '#F3F4F6' }} />

              {/* Sort chips — horizontal scroll, no wrap */}
              <div style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                flexWrap: 'nowrap',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              } as React.CSSProperties}>
                {[
                  { value: 'earliest', label: t('searchResults.earliestShort', 'Earliest'), icon: '🔼' },
                  { value: 'latest', label: t('searchResults.latestShort', 'Latest'), icon: '🔽' },
                  { value: 'duration', label: t('searchResults.fastestShort', 'Fastest'), icon: '⚡' },
                ].map((sort) => (
                  <button
                    key={sort.value}
                    onClick={() => setSortBy(sort.value as typeof sortBy)}
                    style={{
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '20px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      background: sortBy === sort.value
                        ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                        : '#F3F4F6',
                      color: sortBy === sort.value ? '#FFFFFF' : '#4B5563',
                      boxShadow: sortBy === sort.value
                        ? '0 2px 6px rgba(16, 185, 129, 0.3)'
                        : 'none',
                    }}
                  >
                    <span>{sort.icon}</span>
                    <span>{sort.label}</span>
                  </button>
                ))}
                {filteredAndSortedBuses.length !== buses.length && (
                  <span style={{
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '5px 10px',
                    fontSize: '12px',
                    fontWeight: 500,
                    borderRadius: '20px',
                    background: '#FEF3C7',
                    color: '#92400E',
                    whiteSpace: 'nowrap',
                  }}>
                    {filteredAndSortedBuses.length}/{buses.length}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
        {/* Show Connecting Routes FIRST when no direct buses */}
        {buses.length === 0 && connectingRoutes && connectingRoutes.length > 0 && (
          <div className="connecting-routes-section" style={{ marginBottom: '16px' }}>
            <ConnectingRoutes connectingRoutes={connectingRoutes} />
          </div>
        )}

        <div className="bus-list-section">
          {buses.length === 0 ? (
            <div className="empty-results">
              <div className="empty-state-container">
                <img src="/favicon.svg" alt="No bus routes found for your search" className="empty-state-logo" loading="lazy" />
                <h2 className="empty-state-title">{t('searchResults.noResults', 'No buses found for this route')}</h2>
                <p className="empty-state-description">
                  {t('searchResults.noResultsDescription', 'We couldn\'t find any buses operating on this route. You can help by contributing this route information.')}
                </p>
                <div className="empty-state-actions">
                  <Link 
                    to="/contribute" 
                    className="btn-contribute"
                  >
                    <span className="btn-icon">📝</span>
                    {t('searchResults.contributeRoute', 'Contribute Route Info')}
                  </Link>
                  <button 
                    className="btn-secondary-empty"
                    onClick={() => navigate('/')}
                  >
                    <span className="btn-icon">🏠</span>
                    {t('searchResults.backHome', 'Back to Home')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="modern-bus-cards">
                {/* Use virtual scrolling for performance with large lists (50+) */}
                {filteredAndSortedBuses.length > 50 ? (
                  <List
                    height={600}
                    itemCount={filteredAndSortedBuses.length}
                    itemSize={420}
                    width="100%"
                    itemData={{
                      buses: filteredAndSortedBuses,
                      selectedBusId,
                      handleSelectBus,
                      handleAddStops,
                      handleReportIssue,
                      fromLocation,
                      toLocation,
                      stopsMap,
                      stops,
                      adsEnabled,
                      getAdConfig
                    }}
                  >
                    {VirtualBusRow}
                  </List>
                ) : (
                  // Non-virtualized rendering for small lists (< 50 buses)
                  filteredAndSortedBuses.map((bus, index) => (
                    <React.Fragment key={bus.id}>
                      <BusCardModern
                        bus={bus}
                        index={index}
                        isSelected={selectedBusId === bus.id}
                        onSelect={handleSelectBus}
                        onAddStops={handleAddStops}
                        onReportIssue={handleReportIssue}
                        fromLocation={fromLocation}
                        toLocation={toLocation}
                        stops={stopsMap[bus.id] || stops.filter(s => s.busId === bus.id)}
                      />
                      {/* Show ad between results - every 3 buses */}
                      {adsEnabled && (index + 1) % 3 === 0 && (
                        <PremiumAdContainer
                          adSlot={getAdConfig('betweenSearchResults').adSlot}
                          adFormat="square"
                          placement="between-routes"
                          placementKey="betweenSearchResults"
                        />
                      )}
                    </React.Fragment>
                  ))
                )}
              </div>
              
              {/* Load More Button */}
              {hasNextPage && onLoadMore && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  gap: '12px',
                  marginTop: '24px',
                  padding: '16px'
                }}>
                  {totalCount && (
                    <div style={{
                      fontSize: '14px',
                      color: '#6B7280',
                      fontWeight: 500
                    }}>
                      {t('searchResults.showingResults', { count: buses.length, total: totalCount }) || `Showing ${buses.length} of ${totalCount} results`}
                    </div>
                  )}
                  <button
                    onClick={onLoadMore}
                    disabled={loadingMore}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '14px 32px',
                      background: loadingMore ? '#E5E7EB' : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                      color: loadingMore ? '#9CA3AF' : '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: loadingMore ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: loadingMore ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)',
                      minWidth: '180px',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (!loadingMore) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loadingMore) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                      }
                    }}
                  >
                    {loadingMore ? (
                      <>
                        <svg 
                          width="18" 
                          height="18" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                          style={{ animation: 'spin 1s linear infinite' }}
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        <span>{t('searchResults.loadingMore', 'Loading...')}</span>
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12l7 7 7-7" />
                        </svg>
                        <span>{t('searchResults.loadMore', 'Load More Buses')}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Show Connecting Routes AFTER bus list when direct buses exist */}
        {buses.length > 0 && connectingRoutes && connectingRoutes.length > 0 && (
          <div className="connecting-routes-section" style={{ marginTop: '24px' }}>
            <ConnectingRoutes connectingRoutes={connectingRoutes} />
          </div>
        )}
        
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
});

// PHASE 2 OPTIMIZATION: Add display name for better debugging
SearchResults.displayName = 'SearchResults';


export default React.memo(SearchResults);
