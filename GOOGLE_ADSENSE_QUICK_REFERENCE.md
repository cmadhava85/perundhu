# Google AdSense - Quick Reference Card

## 🚀 5-Minute Setup Checklist

- [ ] Get Publisher ID from Google AdSense
- [ ] Create 4 ad units in AdSense dashboard
- [ ] Copy slot IDs from each ad unit
- [ ] Add env variables to `frontend/.env`
- [ ] Add Google script to `frontend/public/index.html`
- [ ] Add components to SearchResults, Footer, Sidebar
- [ ] Login to admin → Toggle ads ON
- [ ] Verify ads appear in search results

## 📋 Environment Variables

```bash
REACT_APP_GOOGLE_AD_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
REACT_APP_AD_SLOT_RESULTS=ca-pub-XXXXXXXXXXXXXXXX/XXXX1
REACT_APP_AD_SLOT_SIDEBAR=ca-pub-XXXXXXXXXXXXXXXX/XXXX2
REACT_APP_AD_SLOT_FOOTER=ca-pub-XXXXXXXXXXXXXXXX/XXXX3
REACT_APP_AD_SLOT_ABOVE=ca-pub-XXXXXXXXXXXXXXXX/XXXX4
```

## 💻 Add Script to HTML

In `frontend/public/index.html` `<head>`:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"></script>
```

## 🧩 Code Template

```tsx
import { PremiumAdContainer } from '../components/GoogleAdContainer';
import useGoogleAds from '../hooks/useGoogleAds';

export const MyComponent = () => {
  const { adsEnabled, getAdConfig } = useGoogleAds();

  return (
    <>
      {adsEnabled && (
        <PremiumAdContainer
          adSlot={getAdConfig('betweenSearchResults').adSlot}
          adFormat="square"
          placement="between-routes"
          placementKey="betweenSearchResults"
        />
      )}
    </>
  );
};
```

## 🎛️ Admin Control

1. **Login** as admin
2. **Navigate** to Admin Dashboard → Settings → AdSense
3. **Toggle**:
   - Master switch (all ads)
   - Individual placements
4. **Save** - Changes apply immediately

## 📊 Placement Sizes

| Placement | Size | CSS Class |
|-----------|------|-----------|
| Between Results | 336x280 | `.google-ad-square` |
| Sidebar | 300x600 | `.google-ad-vertical` |
| Footer | 728x90 | `.google-ad-horizontal` |
| Above Form | 728x90 | `.google-ad-horizontal` |

## 🎨 CSS Classes

```css
.google-ad-container              /* Main ad wrapper */
.google-ad-horizontal             /* Horizontal ads (728x90) */
.google-ad-vertical               /* Vertical ads (300x600) */
.google-ad-square                 /* Square ads (300x250) */
.google-ad-placement-between-routes
.google-ad-placement-sidebar-right
.google-ad-placement-footer
.premium-ad-wrapper               /* With "Advertisement" label */
```

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| "adsbygoogle is undefined" | Make sure script tag is in `<head>` of index.html |
| Ads not showing | Check feature flags are ON in admin panel |
| Wrong size | Verify adFormat matches ad unit size in AdSense |
| Ads in wrong place | Check `placementKey` matches configuration |
| CSS not working | Ensure GoogleAdContainer.css is imported |

## 🔗 Files Reference

| File | What to Do |
|------|-----------|
| `GoogleAdContainer.tsx` | Use in components (don't edit) |
| `useGoogleAds.ts` | Import in components to check flags |
| `adConfiguration.ts` | Add new placements here (if needed) |
| `FeatureFlagsContext.tsx` | Feature flags (don't edit) |
| `AdSettingsPanel.tsx` | Already in admin dashboard |
| `.env` | Add your publisher ID and slot IDs |
| `GOOGLE_ADSENSE_SETUP.md` | Full setup guide |

## 🎯 Ad Placement Examples

### Example 1: Between Results (Recommended)
```tsx
{adsEnabled && (idx + 1) % 3 === 0 && (
  <PremiumAdContainer
    adSlot={getAdConfig('betweenSearchResults').adSlot}
    adFormat="square"
    placement="between-routes"
    placementKey="betweenSearchResults"
  />
)}
```

### Example 2: Sidebar
```tsx
{adsEnabled && (
  <GoogleAdContainer
    adSlot={getAdConfig('sidebarRight').adSlot}
    adFormat="vertical"
    placement="sidebar-right"
    placementKey="sidebarRight"
  />
)}
```

### Example 3: Footer
```tsx
{adsEnabled && (
  <PremiumAdContainer
    adSlot={getAdConfig('footerSection').adSlot}
    adFormat="horizontal"
    placement="footer"
    placementKey="footerSection"
  />
)}
```

## 🆘 Quick Troubleshooting

```bash
# Check if AdSense script loads
# Browser → DevTools → Network → Search for "pagead2.googlesyndication.com"

# Check if flags are enabled
# Admin Dashboard → Settings → AdSense → Verify toggles

# Check console for errors
# Browser → DevTools → Console → Look for ad-related errors

# Verify ad slots
# AdSense Dashboard → Ad Units → Copy exact slot IDs
```

## 📈 Monitoring

After enabling ads:
1. **Google AdSense Dashboard** - View earnings, impressions, CTR
2. **Admin Panel** - Check which placements are active
3. **Browser DevTools** - Verify no console errors
4. **Analytics** - Track impact on user behavior

## ✅ Checklist for Launch

- [ ] Publisher ID set in `.env`
- [ ] 4 Ad unit slot IDs set in `.env`
- [ ] Google script in `index.html`
- [ ] `GoogleAdContainer` imported in search results
- [ ] `GoogleAdContainer` imported in footer (if using)
- [ ] `GoogleAdContainer` imported in sidebar (if using)
- [ ] `useGoogleAds()` hook used to check flags
- [ ] AdSettingsPanel visible in admin dashboard
- [ ] Master flag toggled ON in admin
- [ ] Individual placements toggled ON
- [ ] Ads visible in browser
- [ ] No console errors
- [ ] Mobile responsive working
- [ ] All placements verified

---

**Need help?** See `GOOGLE_ADSENSE_SETUP.md` for detailed guide  
**Status**: ✅ Ready  
**Date**: January 15, 2026
