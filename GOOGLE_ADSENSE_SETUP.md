# Google AdSense Implementation Guide

## Overview

Google AdSense is now fully integrated into Perundhu with **feature flag controls**. Admins can enable/disable ads and individual placements without touching code.

## ✅ What's Implemented

### 1. **Feature Flags** (Admin Controlled)
- `enableAds` - Master toggle for all ads
- `enableAdBetweenSearchResults` - Between bus results (336x280)
- `enableAdSidebarRight` - Right sidebar sticky (300x600)
- `enableAdFooterSection` - Footer section (728x90)
- `enableAdAboveSearchForm` - Above search form (728x90)

### 2. **Ad Components**
- `GoogleAdContainer.tsx` - Base component respecting feature flags
- `PremiumAdContainer.tsx` - Styled with "Advertisement" label
- Auto-checks flags before rendering - won't show if disabled

### 3. **Admin Control Panel**
- Location: Admin Dashboard → AdSense Settings
- Toggle master switch and individual placements
- Real-time updates
- Settings persisted to backend

### 4. **Configuration Files**
- `config/adConfiguration.ts` - Ad placement definitions
- `hooks/useGoogleAds.ts` - Hook for checking flags
- Environment variables for slot IDs

## 🚀 Setup Steps

### Step 1: Get Google Publisher ID

1. Go to: https://www.google.com/adsense/start/
2. Sign up if you haven't already
3. Copy your **Publisher ID** (format: `ca-pub-xxxxxxxxxxxxxxxx`)
4. Wait for approval (24-48 hours)

### Step 2: Create Ad Units

1. In AdSense dashboard → Ad Units → Create New
2. Create 4 ad units with these dimensions:
   - **Between Results**: 336x280 (Medium Rectangle)
   - **Sidebar**: 300x600 (Half Page)
   - **Footer**: 728x90 (Leaderboard)
   - **Above Form**: 728x90 (Leaderboard)

3. Copy the **ad slot IDs** for each

### Step 3: Configure Environment Variables

Add to `frontend/.env`:

```bash
REACT_APP_GOOGLE_AD_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
REACT_APP_AD_SLOT_RESULTS=ca-pub-xxxxxxxxxxxxxxxx/xxxxxxxx1
REACT_APP_AD_SLOT_SIDEBAR=ca-pub-xxxxxxxxxxxxxxxx/xxxxxxxx2
REACT_APP_AD_SLOT_FOOTER=ca-pub-xxxxxxxxxxxxxxxx/xxxxxxxx3
REACT_APP_AD_SLOT_ABOVE=ca-pub-xxxxxxxxxxxxxxxx/xxxxxxxx4
```

Replace with your actual IDs from AdSense.

### Step 4: Add Google AdSense Script

Add to `frontend/public/index.html` in `<head>`:

```html
<!-- Google AdSense -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-xxxxxxxxxxxxxxxx"></script>
```

### Step 5: Enable Ads in Admin Panel

1. Login as admin
2. Go to Admin Dashboard → Settings → AdSense
3. Toggle "Enable Google AdSense" ON
4. Enable specific placements as needed
5. Save and refresh

## 💻 Integration Examples

### Example 1: Between Search Results

```tsx
import { PremiumAdContainer } from '../components/GoogleAdContainer';
import useGoogleAds from '../hooks/useGoogleAds';

export const SearchResults = () => {
  const { adsEnabled, getAdConfig } = useGoogleAds();
  const buses = [...];

  return (
    <div className="results">
      {buses.map((bus, idx) => (
        <React.Fragment key={bus.id}>
          <BusCard bus={bus} />
          
          {/* Show ad after every 3rd result */}
          {adsEnabled && (idx + 1) % 3 === 0 && (
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
  );
};
```

### Example 2: Sidebar Ad

```tsx
import { GoogleAdContainer } from '../components/GoogleAdContainer';
import useGoogleAds from '../hooks/useGoogleAds';

export const SearchLayout = ({ children }) => {
  const { adsEnabled, getAdConfig } = useGoogleAds();

  return (
    <div className="search-layout">
      <main>{children}</main>
      
      {adsEnabled && (
        <aside className="sidebar">
          <GoogleAdContainer
            adSlot={getAdConfig('sidebarRight').adSlot}
            adFormat="vertical"
            placement="sidebar-right"
            placementKey="sidebarRight"
          />
        </aside>
      )}
    </div>
  );
};
```

### Example 3: Footer Ad

```tsx
import { PremiumAdContainer } from '../components/GoogleAdContainer';
import useGoogleAds from '../hooks/useGoogleAds';

export const AppFooter = () => {
  const { adsEnabled, getAdConfig } = useGoogleAds();

  return (
    <footer className="app-footer">
      {adsEnabled && (
        <PremiumAdContainer
          adSlot={getAdConfig('footerSection').adSlot}
          adFormat="horizontal"
          placement="footer"
          placementKey="footerSection"
        />
      )}
      {/* Footer content */}
    </footer>
  );
};
```

## 🎛️ Admin Controls

### Master Toggle
- Turns all ads ON/OFF at once
- Useful for testing or emergency disable

### Individual Placement Toggles
- Control each placement separately
- Even if master is ON, can disable specific placements
- Example: Turn OFF sidebar ads but keep footer ads

### Current Status
- Shows ✅ or ❌ for each placement
- Updates in real-time as you toggle

## 📊 Files Modified/Created

```
frontend/src/
├── components/
│   ├── GoogleAdContainer.tsx         # Main ad component (respects flags)
│   ├── GoogleAdContainer.css         # Styling
│   ├── GoogleAdContainer.example.tsx # Usage examples
│   └── admin/
│       ├── AdSettingsPanel.tsx       # Admin control panel
│       └── AdSettingsPanel.css       # Panel styling
├── config/
│   └── adConfiguration.ts            # Ad config & placement definitions
├── hooks/
│   └── useGoogleAds.ts              # Hook for checking flags
└── contexts/
    └── FeatureFlagsContext.tsx       # Updated with ad flags
```

## 🔍 Verification

### Test If Ads Are Working

1. **Check console** - no errors about undefined adsbygoogle
2. **Check network tab** - ads script loaded from pagead2.googlesyndication.com
3. **Visual check** - ad containers visible in search results
4. **Admin check** - Can toggle flags in admin panel

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Ads not showing | Check env variables, verify AdSense script in index.html |
| "adsbygoogle not defined" | Make sure script loads before components mount |
| Toggles don't work | Check FeatureFlagsContext is updated, backend sync enabled |
| Ads show in header/nav | Verify CSS has `.header .google-ad-container { display: none; }` |
| Responsive issues | Ads auto-resize for mobile, check CSS media queries |

## 🛡️ Compliance & Best Practices

✅ **DO:**
- Only show ads in allocated spaces
- Label ads clearly ("Advertisement" label included)
- Provide toggle to disable (via admin panel)
- Maintain user privacy
- Follow AdSense policies

❌ **DON'T:**
- Show ads in header/navigation (CSS prevents this)
- Auto-play sounds in ads
- Deceive users about ad content
- Violate AdSense policies

## 💰 Revenue Sharing (If Applicable)

If using local business partnerships alongside AdSense:
- Ads: Google AdSense revenue
- Partnerships: Direct business sponsor revenue
- Both can coexist in different placements

## 📚 Files Reference

### To Enable Ads
1. Update `.env` with actual slot IDs
2. Admin panel: Toggle "Enable Google AdSense"
3. Choose which placements to show

### To Add New Placement
1. Add to `adConfiguration.ts` placements
2. Add feature flag to `FeatureFlagsContext.tsx`
3. Add toggle to `AdSettingsPanel.tsx`
4. Use in component with `useGoogleAds()` hook

### To Disable Ads Entirely
Admin panel → Toggle OFF, or comment out component usage

## 🆘 Support Links

- [Google AdSense Help](https://support.google.com/adsense)
- [Ad Sizes Reference](https://support.google.com/adsense/answer/6002621)
- [AdSense Policies](https://support.google.com/adsense/answer/48182)

---

**Status**: ✅ Ready to Use  
**Last Updated**: January 15, 2026  
**Version**: 1.0
