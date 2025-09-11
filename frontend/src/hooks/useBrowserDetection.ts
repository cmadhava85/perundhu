import { useEffect, useState } from 'react';

interface BrowserInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSamsung: boolean;
  isFirefoxMobile: boolean;
  isChromeMobile: boolean;
  isSafariiOS: boolean;
  isEdgeMobile: boolean;
  isOperaMobile: boolean;
  isUCBrowser: boolean;
  browserName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  isLandscape: boolean;
}

export const useBrowserDetection = (): BrowserInfo => {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo>({
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    isSamsung: false,
    isFirefoxMobile: false,
    isChromeMobile: false,
    isSafariiOS: false,
    isEdgeMobile: false,
    isOperaMobile: false,
    isUCBrowser: false,
    browserName: 'unknown',
    deviceType: 'desktop',
    isLandscape: false
  });

  useEffect(() => {
    const detectBrowser = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      
      // Detect if mobile
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobile = mobileRegex.test(userAgent);
      
      // Detect specific platforms
      const isIOS = /iPhone|iPad|iPod/i.test(userAgent) && !(window as any).MSStream;
      const isAndroid = /Android/i.test(userAgent);
      
      // Detect specific browsers
      const isSamsung = /SamsungBrowser/i.test(userAgent);
      const isFirefoxMobile = /FxiOS|Firefox/i.test(userAgent) && isMobile;
      const isChromeMobile = /CriOS|Chrome/i.test(userAgent) && isMobile;
      const isSafariiOS = /Safari/i.test(userAgent) && isIOS && !isChromeMobile;
      const isEdgeMobile = /EdgiOS|Edge/i.test(userAgent) && isMobile;
      const isOperaMobile = /OPiOS|OPR|Opera/i.test(userAgent) && isMobile;
      const isUCBrowser = /UCBrowser/i.test(userAgent);
      
      // Remove unused variables
      // const isIE = userAgent.indexOf('MSIE') !== -1 || userAgent.indexOf('Trident/') !== -1;
      // const isEdge = userAgent.indexOf('Edge/') !== -1 || userAgent.indexOf('Edg/') !== -1;
      // const isIEAlternative = !!(window as any).MSInputMethodContext && !!(document as any).documentMode;
      
      // Get browser name
      let browserName = 'unknown';
      if (isSafariiOS) browserName = 'Safari';
      else if (isChromeMobile) browserName = 'Chrome';
      else if (isFirefoxMobile) browserName = 'Firefox';
      else if (isEdgeMobile) browserName = 'Edge';
      else if (isOperaMobile) browserName = 'Opera';
      else if (isSamsung) browserName = 'Samsung Internet';
      else if (isUCBrowser) browserName = 'UC Browser';
      
      // Detect device type
      let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
      if (isMobile) {
        // Check if tablet
        if (/iPad|tablet|Tablet/i.test(userAgent) || 
           (isAndroid && !/Mobile/i.test(userAgent)) ||
           (userAgent.includes('Macintosh') && 'ontouchend' in document)) {
          deviceType = 'tablet';
        } else {
          deviceType = 'mobile';
        }
      }
      
      // Detect orientation
      const isLandscape = window.innerWidth > window.innerHeight;
      
      setBrowserInfo({
        isMobile,
        isIOS,
        isAndroid,
        isSamsung,
        isFirefoxMobile,
        isChromeMobile,
        isSafariiOS,
        isEdgeMobile,
        isOperaMobile,
        isUCBrowser,
        browserName,
        deviceType,
        isLandscape
      });
    };
    
    // Initial detection
    detectBrowser();
    
    // Re-detect on resize (for orientation changes)
    window.addEventListener('resize', detectBrowser);
    
    return () => {
      window.removeEventListener('resize', detectBrowser);
    };
  }, []);

  return browserInfo;
};

export default useBrowserDetection;