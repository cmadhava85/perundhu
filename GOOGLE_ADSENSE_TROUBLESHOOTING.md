# Google AdSense Troubleshooting Guide

## Current Status: Ads Not Displaying (400 Errors)

### Issues Found:
1. ✅ Google Ad Client ID is configured: `ca-pub-9475468169056134`
2. ⚠️  CSP policy was incomplete - **FIXED**
3. ⚠️  400 errors suggest AdSense account/ad units not ready

---

## What I Fixed:

### 1. Updated CSP Policy (index.html)
Added ALL required Google AdSense domains:
- `https://partner.googleadservices.com` - Ad serving
- `https://static.doubleclick.net` - Static resources
- `https://cdn.ampproject.org` - AMP support
- `https://fundingchoicesmessages.google.com` - Consent management
- `https://securepubads.g.doubleclick.net` - Secure publisher ads
- `https://bid.g.doubleclick.net` - Real-time bidding
- `https://td.doubleclick.net` - Tag delivery

Changed `X-Frame-Options` from `DENY` to `SAMEORIGIN` to allow Google ad iframes.

---

## Why You're Still Seeing "ADVERTISEMENT" Placeholder:

The **400 errors** likely mean:

### Possible Reason 1: AdSense Account Not Approved ❌
- Your AdSense account (`ca-pub-9475468169056134`) needs Google approval
- This usually takes **1-3 days** after signup
- Check status: https://www.google.com/adsense

**How to check:**
1. Visit https://www.google.com/adsense
2. Check if account status is "Active" or "Under Review"
3. Look for any warnings/action items

### Possible Reason 2: Ad Units Not Created ❌
- You need to create specific ad units in AdSense dashboard
- Each placement needs a unique ad slot ID

**How to fix:**
1. Go to AdSense → Ads → By ad unit
2. Click "+ New ad unit"
3. Create these ad units:
   - **Between Search Results** - Display ad (300x250)
   - **Sidebar Right** - Display ad (300x600)
   - **Footer Section** - Display ad (728x90)
   - **Above Search Form** - Display ad (728x90)
4. Copy the ad slot IDs (format: ca-pub-XXXXX/YYYYYYYY)
5. Update your `.env` files (see below)

### Possible Reason 3: Site Not Added to AdSense ❌
- Your domain needs to be added to AdSense sites list
- Google needs to verify you own the domain

**How to fix:**
1. Go to AdSense → Sites
2. Click "+ Add site"
3. Enter your domain: `perundhu.com`
4. Follow verification steps

---

## Quick Test: Check If It's CSP or AdSense

Open your browser console and run:

```javascript
// Test if ad script can load
fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9475468169056134')
  .then(r => console.log('✅ Ad script reachable:', r.status))
  .catch(e => console.error('❌ Ad script blocked:', e));
```

**Expected Results:**
- ✅ **200 OK** → CSP is fine, issue is with AdSense account
- ❌ **400/403** → AdSense account issue
- ❌ **CSP error** → CSP still blocking (refresh after my fix)

---

## Step-by-Step Fix Guide

### Step 1: Verify AdSense Account Status

```bash
# Check if your account exists and is approved
# Visit: https://www.google.com/adsense
```

**Look for:**
- ✅ Account status: "Active"
- ✅ Payment details: Set up
- ✅ Site verification: Complete

### Step 2: Create Ad Units

For each ad placement, create a unit:

**Ad Unit 1: Between Search Results**
- Type: Display ad
- Size: Responsive or 300x250
- Name: "Perundhu - Between Results"
- Copy the ad slot ID → Update `VITE_AD_SLOT_RESULTS` in `.env`

**Ad Unit 2: Sidebar Right**
- Type: Display ad
- Size: Responsive or 300x600
- Name: "Perundhu - Sidebar"
- Copy the ad slot ID → Update `VITE_AD_SLOT_SIDEBAR` in `.env`

**Ad Unit 3: Footer**
- Type: Display ad
- Size: Responsive or 728x90
- Name: "Perundhu - Footer"
- Copy the ad slot ID → Update `VITE_AD_SLOT_FOOTER` in `.env`

**Ad Unit 4: Above Search**
- Type: Display ad
- Size: Responsive or 728x90
- Name: "Perundhu - Above Search"
- Copy the ad slot ID → Update `VITE_AD_SLOT_ABOVE_SEARCH` in `.env`

### Step 3: Update Environment Variables

Edit `/frontend/.env.development`:

```bash
# Google AdSense Configuration
VITE_GOOGLE_AD_CLIENT=ca-pub-9475468169056134

# Ad Slot IDs (get these from AdSense dashboard after creating ad units)
VITE_AD_SLOT_RESULTS=1234567890      # Replace with actual slot ID
VITE_AD_SLOT_SIDEBAR=1234567891      # Replace with actual slot ID
VITE_AD_SLOT_FOOTER=1234567892       # Replace with actual slot ID
VITE_AD_SLOT_ABOVE_SEARCH=1234567893 # Replace with actual slot ID
```

Do the same for `.env.production` and `.env.preprod`.

### Step 4: Enable Feature Flags

Check if ads are enabled in your admin panel:

1. Go to Admin Dashboard → Settings
2. Find "Google AdSense Features" section
3. Enable:
   - ✅ Enable Ads (master switch)
   - ✅ Enable Ad Between Search Results
   - ✅ Enable Ad Sidebar Right
   - ✅ Enable Ad Footer Section
   - ✅ Enable Ad Above Search Form

### Step 5: Test Locally

```bash
# Rebuild frontend with new CSP and env vars
cd frontend
npm run dev

# Visit http://localhost:5173
# Check browser console for ad loading logs
```

### Step 6: Deploy to Production

```bash
# Build production
npm run build

# Deploy
# (Your usual deployment process)
```

---

## Verification Checklist

After completing the steps above:

- [ ] AdSense account status is "Active"
- [ ] Site `perundhu.com` is verified in AdSense
- [ ] 4 ad units are created in AdSense dashboard
- [ ] Ad slot IDs are copied to `.env` files
- [ ] Feature flags are enabled in admin panel
- [ ] CSP policy is updated (done automatically)
- [ ] Frontend is rebuilt and deployed
- [ ] No CSP errors in browser console
- [ ] No 400 errors for ad requests
- [ ] Ads are displaying (or test ads visible)

---

## Testing with Test Ads

While waiting for approval, you can test with AdSense test mode:

```javascript
// In your browser console (on your site)
(adsbygoogle = window.adsbygoogle || []).push({
  google_ad_client: "ca-pub-9475468169056134",
  enable_page_level_ads: true,
  overlays: {bottom: true},
  // Add test mode
  adtest: "on"
});
```

---

## Common Issues & Solutions

### Issue: "Ad slot not found"
**Solution:** Check ad slot IDs in `.env` match AdSense dashboard

### Issue: "This ad unit is not approved"
**Solution:** Wait for AdSense approval (1-3 days typically)

###Issue: "Ads.txt file missing"
**Solution:** Add this to your domain root (`/public/ads.txt`):
```
google.com, pub-9475468169056134, DIRECT, f08c47fec0942fa0
```

### Issue: Ads show but no revenue
**Solution:** AdSense needs traffic (100+ visitors) before serving paid ads

### Issue: "Blank space where ad should be"
**Solution:** 
1. Check feature flags are enabled
2. Verify ad slot IDs are correct
3. Check browser console for errors
4. Try different ad format/size

---

## Next Steps

1. **Immediate:** Rebuild frontend to apply CSP fix
2. **Today:** Check AdSense account status and create ad units
3. **This week:** Monitor ad delivery after approval
4. **Ongoing:** Check AdSense dashboard for performance metrics

---

## Support Resources

- **AdSense Help:** https://support.google.com/adsense
- **AdSense Forum:** https://support.google.com/adsense/community
- **Ad Policy:** https://support.google.com/adsense/answer/48182

---

**Last Updated:** April 1, 2026  
**Status:** CSP Fixed ✅ | Waiting on AdSense Account Approval ⏳
