/**
 * Example: How to integrate Google AdSense in Search Results
 * 
 * This is a reference/documentation file showing the integration pattern
 * Copy this pattern to SearchResults.tsx or similar components
 */

import React from 'react';
import { GoogleAdContainer, PremiumAdContainer } from './GoogleAdContainer';
import useGoogleAds from '../hooks/useGoogleAds';

/**
 * Example: Integrating ads into search results
 */
export const SearchResultsExample = () => {
  const { adsEnabled, getAdConfig } = useGoogleAds();

  // Your bus list state/data
  const buses = [
    { id: 1, number: '150', duration: '2h 30min', price: 180 },
    { id: 2, number: '151A', duration: '3h 0min', price: 120 },
    { id: 3, number: '152', duration: '2h 45min', price: 190 },
    // ... more buses
  ];

  return (
    <div className="search-results">
      {/* Option 1: Ad above search form (if enabled) */}
      {adsEnabled && (
        <PremiumAdContainer
          adSlot="ca-pub-xxxxxxxxxxxxxxxx/xxxxxxxx4"
          adFormat="horizontal"
          placement="search-results"
          placementKey="aboveSearchForm"
        />
      )}

      {/* Search form here */}
      
      {/* Option 2: Ad between every 3-4 results */}
      <div className="results-list">
        {buses.map((bus, index) => (
          <React.Fragment key={bus.id}>
            {/* Bus Card */}
            <div className="bus-card">
              <h3>Bus {bus.number}</h3>
              <p>{bus.duration} - ₹{bus.price}</p>
            </div>

            {/* Show ad after every 3rd result */}
            {adsEnabled && (index + 1) % 3 === 0 && (
              <PremiumAdContainer
                adSlot={getAdConfig('betweenSearchResults').adSlot}
                adFormat="square"
                placement="between-routes"
                placementKey="betweenSearchResults"
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Option 3: Right sidebar sticky ad (in layout component) */}
      <aside className="sidebar">
        {adsEnabled && (
          <GoogleAdContainer
            adSlot={getAdConfig('sidebarRight').adSlot}
            adFormat="vertical"
            placement="sidebar-right"
            placementKey="sidebarRight"
          />
        )}
      </aside>

      {/* Option 4: Footer ad (in footer component) */}
      <footer className="app-footer">
        {adsEnabled && (
          <PremiumAdContainer
            adSlot={getAdConfig('footerSection').adSlot}
            adFormat="horizontal"
            placement="footer"
            placementKey="footerSection"
          />
        )}
      </footer>
    </div>
  );
};

/**
 * Usage Pattern Summary:
 * 
 * 1. Import hooks and components:
 *    import { GoogleAdContainer } from '../components/GoogleAdContainer';
 *    import useGoogleAds from '../hooks/useGoogleAds';
 * 
 * 2. Get ad status in your component:
 *    const { adsEnabled, getAdConfig } = useGoogleAds();
 * 
 * 3. Render ads conditionally:
 *    {adsEnabled && (
 *      <GoogleAdContainer
 *        adSlot={getAdConfig('betweenSearchResults').adSlot}
 *        adFormat="square"
 *        placement="between-routes"
 *        placementKey="betweenSearchResults"
 *      />
 *    )}
 * 
 * 4. Control via admin panel:
 *    - Enable/disable master toggle
 *    - Enable/disable individual placements
 *    - Changes apply immediately (if using context)
 * 
 * 5. Environment variables:
 *    REACT_APP_GOOGLE_AD_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
 *    REACT_APP_AD_SLOT_RESULTS=ca-pub-xxxxxxxxxxxxxxxx/xxxxxxxx1
 *    REACT_APP_AD_SLOT_SIDEBAR=ca-pub-xxxxxxxxxxxxxxxx/xxxxxxxx2
 *    REACT_APP_AD_SLOT_FOOTER=ca-pub-xxxxxxxxxxxxxxxx/xxxxxxxx3
 *    REACT_APP_AD_SLOT_ABOVE=ca-pub-xxxxxxxxxxxxxxxx/xxxxxxxx4
 */
