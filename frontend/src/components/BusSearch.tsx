import { useState } from 'react';
import { t } from 'i18next';

const BusSearch = () => {
  // ...existing code...
  
  // Add OSM state management
  const [showOSMData, setShowOSMData] = useState(false);
  const [osmFilters, setOsmFilters] = useState({
    requireShelter: false,
    requireBench: false,
    requireAccessibility: false
  });

  return (
    <div className="bus-search">
      {/* ...existing search form... */}
      
      {/* OSM Integration Controls */}
      <div className="osm-controls-section">
        <div className="osm-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={showOSMData}
              onChange={(e) => setShowOSMData(e.target.checked)}
            />
            <span className="slider"></span>
            <span className="toggle-label">
              {t('search.enableOSM', 'Show additional routes from OpenStreetMap')}
            </span>
          </label>
        </div>
        
        {showOSMData && (
          <div className="osm-filters">
            <h4>{t('search.osmFilters', 'Bus Stop Facilities')}</h4>
            <div className="filter-options">
              <label>
                <input
                  type="checkbox"
                  checked={osmFilters.requireShelter}
                  onChange={(e) => setOsmFilters(prev => ({
                    ...prev,
                    requireShelter: e.target.checked
                  }))}
                />
                {t('search.requireShelter', 'Has Shelter')}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={osmFilters.requireBench}
                  onChange={(e) => setOsmFilters(prev => ({
                    ...prev,
                    requireBench: e.target.checked
                  }))}
                />
                {t('search.requireBench', 'Has Bench')}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={osmFilters.requireAccessibility}
                  onChange={(e) => setOsmFilters(prev => ({
                    ...prev,
                    requireAccessibility: e.target.checked
                  }))}
                />
                {t('search.requireAccessibility', 'Wheelchair Accessible')}
              </label>
            </div>
          </div>
        )}
      </div>
      
      {/* ...existing results display... */}
    </div>
  );
};

export default BusSearch;