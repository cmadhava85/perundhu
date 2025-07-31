import React from 'react';
import Header from '../Header';
import Footer from '../Footer';
import FeatureTabs from '../FeatureTabs';

interface MainLayoutProps {
  children: React.ReactNode;
  activeFeature: 'routes' | 'tracking' | 'analytics' | 'rewards';
  setActiveFeature: (feature: 'routes' | 'tracking' | 'analytics' | 'rewards') => void;
  showTracking: boolean;
  showAnalytics: boolean;
  showRewards: boolean;
  showMap: boolean;
  setShowTracking: (show: boolean) => void;
  setShowAnalytics: (show: boolean) => void;
  setShowRewards: (show: boolean) => void;
  setShowMap: (show: boolean) => void;
  autoLocationEnabled: boolean;
  onToggleAutoLocation: () => void;
  browserInfo: {
    deviceType: string;
    browserName: string;
    isLandscape: boolean;
  };
}

/**
 * Main layout component that provides the common structure for all pages
 */
const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeFeature,
  setActiveFeature,
  showTracking,
  showAnalytics,
  showRewards,
  showMap,
  setShowTracking,
  setShowAnalytics,
  setShowRewards,
  setShowMap,
  autoLocationEnabled,
  onToggleAutoLocation,
  browserInfo
}) => {
  return (
    <div className="app-container" data-testid="app-container" data-browser={browserInfo.browserName.toLowerCase()}>
      <Header 
        autoLocationEnabled={autoLocationEnabled}
        onToggleAutoLocation={onToggleAutoLocation}
      />
      
      <main className="app-main">
        <FeatureTabs 
          activeFeature={activeFeature}
          setActiveFeature={setActiveFeature}
          showTracking={showTracking}
          showAnalytics={showAnalytics}
          showRewards={showRewards}
          showMap={showMap}
          setShowTracking={setShowTracking}
          setShowAnalytics={setShowAnalytics}
          setShowRewards={setShowRewards}
          setShowMap={setShowMap}
          browserInfo={browserInfo}
        />
        
        <div className="app-content">
          {children}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MainLayout;