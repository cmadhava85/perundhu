import React, { useEffect } from 'react';
import useGoogleAds from '../hooks/useGoogleAds';
import './GoogleAdContainer.css';

// Declare adsbygoogle on window object for TypeScript
declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

interface GoogleAdContainerProps {
  adSlot: string;
  adFormat: 'horizontal' | 'vertical' | 'square';
  placement: 'search-results' | 'sidebar-right' | 'footer' | 'between-routes';
  placementKey?: keyof import('../config/adConfiguration').GoogleAdsConfig['placements'];
  width?: number;
  height?: number;
}

/**
 * Google AdSense Container Component
 * 
 * Displays Google ads in allocated spaces only (not in header/nav)
 * Respects admin feature flags for enabling/disabling ads
 * Styled consistently with the rest of the application
 * 
 * @param adSlot - Google AdSense slot ID (e.g., "ca-pub-xxxxxxxxxxxxxxxx/xxxxxxxx")
 * @param adFormat - Ad size: 'horizontal' (728x90), 'vertical' (300x600), 'square' (300x250)
 * @param placement - Location: search-results, sidebar-right, footer, between-routes
 * @param placementKey - Feature flag key for this placement (e.g., 'betweenSearchResults')
 */
export const GoogleAdContainer: React.FC<GoogleAdContainerProps> = ({
  adSlot,
  adFormat,
  placement,
  placementKey,
  width,
  height
}) => {
  const { adsEnabled, isAdEnabled } = useGoogleAds();

  // Check if this ad should be shown based on feature flags
  const shouldShowAd = adsEnabled && (!placementKey || isAdEnabled(placementKey as any));

  useEffect(() => {
    if (!shouldShowAd) return;

    // Push ad to Google AdSense only if enabled
    try {
      if (window.adsbygoogle && window.adsbygoogle.length >= 0) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.warn('AdSense not loaded or error occurred:', error);
    }
  }, [shouldShowAd]);

  // Don't render if ads are disabled
  if (!shouldShowAd) {
    return null;
  }

  // Determine dimensions based on format
  const dimensions = {
    horizontal: { w: width || 728, h: height || 90 },
    vertical: { w: width || 300, h: height || 600 },
    square: { w: width || 300, h: height || 250 }
  };

  const dim = dimensions[adFormat];

  return (
    <div
      className={`google-ad-container google-ad-${adFormat} google-ad-placement-${placement}`}
      style={{
        minWidth: `${dim.w}px`,
        minHeight: `${dim.h}px`,
        width: '100%',
        maxWidth: `${dim.w}px`,
        margin: '0 auto'
      }}
    >
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          width: `${dim.w}px`,
          height: `${dim.h}px`
        }}
        data-ad-client={process.env.REACT_APP_GOOGLE_AD_CLIENT || 'ca-pub-xxxxxxxxxxxxxxxx'}
        data-ad-slot={adSlot}
        data-ad-format={adFormat === 'horizontal' ? 'horizontal' : 'rectangle'}
        data-full-width-responsive="false"
      />
    </div>
  );
};

/**
 * Ad Container specifically styled like the mockup design
 * Used for premium placements (between search results)
 * Only renders if feature flag is enabled
 */
export const PremiumAdContainer: React.FC<GoogleAdContainerProps> = (props) => {
  const { adsEnabled } = useGoogleAds();

  if (!adsEnabled) return null;

  return (
    <div className="premium-ad-wrapper">
      <GoogleAdContainer {...props} />
      <div className="ad-label">
        <small>Advertisement</small>
      </div>
    </div>
  );
};

export default GoogleAdContainer;
