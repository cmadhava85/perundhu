import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppContextState {
  activeFeature: 'routes' | 'tracking' | 'analytics' | 'rewards';
  setActiveFeature: (feature: 'routes' | 'tracking' | 'analytics' | 'rewards') => void;
  showMap: boolean;
  setShowMap: (show: boolean) => void;
  showTracking: boolean;
  setShowTracking: (show: boolean) => void;
  showAnalytics: boolean;
  setShowAnalytics: (show: boolean) => void;
  showRewards: boolean;
  setShowRewards: (show: boolean) => void;
  autoLocationEnabled: boolean;
  setAutoLocationEnabled: (enabled: boolean) => void;
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  browserInfo: {
    deviceType: string;
    browserName: string;
    isLandscape: boolean;
  };
  updateBrowserInfo: () => void;
}

const AppContext = createContext<AppContextState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Feature states
  const [activeFeature, setActiveFeature] = useState<'routes' | 'tracking' | 'analytics' | 'rewards'>('routes');
  const [showMap, setShowMap] = useState<boolean>(true);
  const [showTracking, setShowTracking] = useState<boolean>(false);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);
  const [showRewards, setShowRewards] = useState<boolean>(false);
  
  // Location states
  const [autoLocationEnabled, setAutoLocationEnabled] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // UI states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Browser detection
  const [browserInfo, setBrowserInfo] = useState({
    deviceType: 'desktop',
    browserName: 'Unknown',
    isLandscape: true
  });

  const updateBrowserInfo = () => {
    // Detect browser
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';
    
    if (userAgent.match(/chrome|chromium|crios/i)) {
      browserName = 'Chrome';
    } else if (userAgent.match(/firefox|fxios/i)) {
      browserName = 'Firefox';
    } else if (userAgent.match(/safari/i)) {
      browserName = 'Safari';
    } else if (userAgent.match(/opr\//i)) {
      browserName = 'Opera';
    } else if (userAgent.match(/edg/i)) {
      browserName = 'Edge';
    }
    
    // Detect device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    const deviceType = isMobile ? 'mobile' : 'desktop';
    
    // Detect orientation
    const isLandscape = window.innerWidth > window.innerHeight;
    
    setBrowserInfo({
      browserName,
      deviceType,
      isLandscape
    });
  };

  // Initial browser detection
  useEffect(() => {
    updateBrowserInfo();
    
    // Update on resize
    const handleResize = () => {
      updateBrowserInfo();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Location tracking effect
  useEffect(() => {
    let watchId: number;
    
    if (autoLocationEnabled) {
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (err) => {
            console.error("Error getting location:", err);
            setError("Unable to access location services");
            setAutoLocationEnabled(false);
          }
        );
      } else {
        setError("Location services not available in your browser");
        setAutoLocationEnabled(false);
      }
    }
    
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [autoLocationEnabled]);

  return (
    <AppContext.Provider
      value={{
        activeFeature,
        setActiveFeature,
        showMap,
        setShowMap,
        showTracking,
        setShowTracking,
        showAnalytics,
        setShowAnalytics,
        showRewards,
        setShowRewards,
        autoLocationEnabled,
        setAutoLocationEnabled,
        userLocation,
        setUserLocation,
        isLoading,
        setIsLoading,
        error,
        setError,
        browserInfo,
        updateBrowserInfo
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextState => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;