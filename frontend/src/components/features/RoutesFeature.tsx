import React from 'react';
import { useTranslation } from 'react-i18next';
import RouteSearch from '../RouteSearch';
import RouteMap from '../RouteMap';
import RouteResults from '../RouteResults';

interface RoutesFeatureProps {
  showMap: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedRoute: any | null;
  setSelectedRoute: (route: any | null) => void;
  searchResults: any[];
  isSearching: boolean;
  onSearch: (query: string) => void;
  browserInfo: {
    deviceType: string;
    isLandscape: boolean;
  };
  userLocation: {
    lat: number;
    lng: number;
  } | null;
}

/**
 * Component that handles the Routes feature functionality
 */
const RoutesFeature: React.FC<RoutesFeatureProps> = ({
  showMap,
  searchQuery,
  setSearchQuery,
  selectedRoute,
  setSelectedRoute,
  searchResults,
  isSearching,
  onSearch,
  browserInfo,
  userLocation
}) => {
  const { t } = useTranslation();

  return (
    <div className="routes-feature-container">
      <div className="route-search-container">
        <RouteSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={onSearch}
          isSearching={isSearching}
        />
      </div>

      <div className="routes-content">
        {showMap && (
          <div className="map-container">
            <RouteMap 
              selectedRoute={selectedRoute}
              userLocation={userLocation}
              routes={searchResults}
            />
          </div>
        )}
        
        <div className={`results-container ${showMap ? 'with-map' : 'full-width'}`}>
          <RouteResults 
            results={searchResults}
            isSearching={isSearching}
            selectedRoute={selectedRoute}
            setSelectedRoute={setSelectedRoute}
            browserInfo={browserInfo}
          />
        </div>
      </div>
    </div>
  );
};

export default RoutesFeature;