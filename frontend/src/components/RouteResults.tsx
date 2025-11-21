/**
 * RouteResults - Simple route results display component
 * TODO: This is a placeholder - consolidate with TransitBusList functionality
 */
import React from 'react';

interface RouteResultsProps {
  results: any[];
  isSearching: boolean;
  selectedRoute: any | null;
  setSelectedRoute: (route: any | null) => void;
  browserInfo: {
    deviceType: string;
    isLandscape: boolean;
  };
}

const RouteResults: React.FC<RouteResultsProps> = ({
  results,
  isSearching,
  selectedRoute,
  setSelectedRoute,
  browserInfo
}) => {
  if (isSearching) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔄</div>
        <div>Searching for routes...</div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚌</div>
        <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px' }}>
          No routes found
        </div>
        <div style={{ fontSize: '14px' }}>
          Try searching for a different route or location
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 500 }}>
        {results.length} route{results.length !== 1 ? 's' : ''} found
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {results.map((route, index) => (
          <div
            key={route.id || index}
            onClick={() => setSelectedRoute(route)}
            style={{
              padding: '16px',
              background: selectedRoute?.id === route.id ? '#e3f2fd' : 'white',
              border: `2px solid ${selectedRoute?.id === route.id ? '#2196f3' : '#ddd'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (selectedRoute?.id !== route.id) {
                e.currentTarget.style.borderColor = '#aaa';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedRoute?.id !== route.id) {
                e.currentTarget.style.borderColor = '#ddd';
              }
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: '4px' }}>
              {route.name || route.routeNumber || `Route ${index + 1}`}
            </div>
            {route.description && (
              <div style={{ fontSize: '14px', color: '#666' }}>
                {route.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RouteResults;
