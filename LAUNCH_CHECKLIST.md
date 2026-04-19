# 🚀 Production Launch Checklist

**Status:** Ready to Deploy (95% Complete)  
**Estimated Time to 100%:** 10-20 minutes  
**Date:** March 20, 2026

---

## ✅ COMPLETED (Auto-implemented + Assets Generated)

- [x] Open Graph meta tags added to index.html
- [x] Twitter Card meta tags added to index.html
- [x] SEO keywords meta tag added
- [x] Sitemap.xml created with all routes
- [x] Sitemap reference added to robots.txt
- [x] Custom 404 error page created
- [x] Favicon references added to index.html
- [x] Google Analytics 4 code integrated (needs ID)
- [x] Comprehensive setup guide created (PRODUCTION_ASSETS_MONITORING_SETUP.md)
- [x] Email updated to perundhutn@gmail.com across all files
- [x] Report Issue section commented out in Contact page
- [x] All existing infrastructure cost-optimized ($25-30/month)
- [x] **PWA Icons & Favicons generated and deployed**
  - favicon.ico, favicon.svg
  - favicon-16x16.png, favicon-32x32.png, favicon-96x96.png
  - apple-touch-icon.png
  - icons/icon-192x192.png, icon-192x192-maskable.png
  - icons/icon-512x512.png, icon-512x512-maskable.png
- [x] **Social Media Images created and deployed**
  - og-image.jpg (1200x630px for Facebook/LinkedIn)
  - twitter-card.jpg (1200x600px for Twitter/X)
- [x] **Logo integrated with bus + people + "bus in seconds" tagline**
- [x] **Project description corrected to "bus route finder" (not "tracker")**

---

## 📋 REMAINING MANUAL ACTIONS

### 🔴 CRITICAL (Required for professional launch)

#### ~~1. Generate PWA Icons & Favicons~~ ✅ COMPLETED

**Status:** All favicon and PWA icons have been generated and deployed to `frontend/public/`

**Generated files:**
- ✅ favicon.ico, favicon.svg
- ✅ favicon-16x16.png, favicon-32x32.png, favicon-96x96.png  
- ✅ apple-touch-icon.png
- ✅ icons/icon-192x192.png, icon-192x192-maskable.png
- ✅ icons/icon-512x512.png, icon-512x512-maskable.png

---

#### ~~2. Create Social Media Images~~ ✅ COMPLETED

**Status:** Social media preview images have been generated and deployed to `frontend/public/`

**Generated files:**
- ✅ og-image.jpg (1200x630px for Facebook/LinkedIn/Open Graph)
- ✅ twitter-card.jpg (1200x600px for Twitter/X)

**Note:** These were auto-generated from your logo. If you want custom-designed social media cards with additional text or graphics, you can replace these files later using Canva or Figma.

---

#### 3. Get Google Analytics 4 Measurement ID (10 minutes)

**Steps:**
1. Go to https://analytics.google.com/
2. Sign in with your Google account
3. Click **Admin** (gear icon, bottom-left)
4. Click **Create Property**
5. Fill in:
   - Property name: **Perundhu**
   - Time zone: **Asia/Kolkata**
   - Currency: **INR**
6. Click **Next**, select category: **Travel & Transportation**
7. Click **Create**
8. Select **Web** platform
9. Enter:
   - Website URL: **https://www.perundhu.com**
   - Stream name: **Perundhu Web**
10. Click **Create stream**
11. **COPY the Measurement ID** (format: `G-XXXXXXXXXX`)

**Update the code:**
```bash
# Edit frontend/index.html and replace both instances of G-XXXXXXXXXX
# Lines 73 and 78
```

---

### 🟡 HIGH PRIORITY (Recommended within 48 hours)

#### 4. Google Search Console Setup (15 minutes)

1. Go to https://search.google.com/search-console/
2. Click **Add Property**
3. Select **URL prefix** method
4. Enter: `https://www.perundhu.com`
5. Verify ownership using **HTML tag** method:
   - Copy the meta tag provided
   - Add to `frontend/index.html` in `<head>` section
   - Deploy
   - Click **Verify**
6. Submit sitemap:
   - Go to **Sitemaps** (left sidebar)
   - Enter: `https://www.perundhu.com/sitemap.xml`
   - Click **Submit**

---

#### 5. Setup Sentry Error Tracking (20 minutes)

1. Go to https://sentry.io/signup/
2. Sign up (use GitHub for faster setup)
3. Create project:
   - Platform: **React**
   - Name: **perundhu-frontend**
4. Copy the DSN (looks like: `https://abc123@o123456.ingest.sentry.io/123456`)
5. Install Sentry:
   ```bash
   cd frontend
   npm install @sentry/react @sentry/tracing
   ```
6. Create `frontend/src/config/sentry.ts`:
   ```typescript
   import * as Sentry from "@sentry/react";
   import { BrowserTracing } from "@sentry/tracing";

   if (import.meta.env.PROD) {
     Sentry.init({
       dsn: "YOUR_DSN_HERE",
       integrations: [new BrowserTracing()],
       environment: import.meta.env.MODE,
       tracesSampleRate: 0.1,
     });
   }
   ```
7. Import in `frontend/src/main.tsx`:
   ```typescript
   import './config/sentry';
   ```

---

#### 6. Setup UptimeRobot Monitoring (15 minutes)

1. Go to https://uptimerobot.com/
2. Sign up (free account)
3. Create 3 monitors:

**Monitor 1 - Website:**
- Type: HTTP(s)
- Name: Perundhu Website
- URL: `https://www.perundhu.com`
- Interval: 5 minutes

**Monitor 2 - API:**
- Type: HTTP(s)
- Name: Perundhu API
- URL: `https://www.perundhu.com/api/health`
- Interval: 5 minutes

**Monitor 3 - Search:**
- Type: Keyword
- Name: Perundhu Search
- URL: `https://www.perundhu.com`
- Keyword: `Search for buses`

4. Add alert contact:
   - Settings > Alert Contacts
   - Add email: `perundhutn@gmail.com`

---

### 🟢 OPTIONAL (Can do post-launch)

#### 7. Take App Screenshots (10 minutes)

```bash
# After deployment, take screenshots using browser dev tools
# Mobile view: 540x720px
# Desktop view: 1280x720px
# Save to frontend/public/screenshots/
```

#### 8. Verify Manifest Icons

Update `frontend/public/manifest.json` if needed:
- Ensure icon paths match generated files
- Remove screenshot references if not created yet

---

## 🎯 DEPLOYMENT OPTIONS

### Option A: Deploy Now with Professional Assets ✨ RECOMMENDED

**What's ready:**
- ✅ Professional logo favicon (bus + people + tagline)
- ✅ All PWA icons (16x16 to 512x512)
- ✅ Social media preview images (og-image, twitter-card)
- ✅ SEO meta tags complete
- ⚠️ GA4 placeholder (can add Measurement ID post-launch)
- ⚠️ Monitoring tools optional (can add within 24-48 hours)

**Deploy command:**
```bash
# From project root
cd /Users/mchand69/Documents/project/perundhu
./deploy-production.sh
```

**Then add GA4 Measurement ID and monitoring tools within 48 hours.**

---

### Option B: Complete GA4 First, Then Deploy (Extra 10 minutes)

**Steps:**
1. Get GA4 Measurement ID (10 minutes) - see section 3 above
2. Update `frontend/index.html` lines 73 and 78
3. Deploy with tracking enabled from day 1

**Deploy command:**
```bash
cd /Users/mchand69/Documents/project/perundhu
./deploy-production.sh
```

---

## ⚡ DEPLOYED ASSETS SUMMARY

### ✅ All Assets Generated and in Place:

```bash
frontend/public/
├── favicon.ico                         # Multi-size ICO file
├── favicon.svg                         # Vector logo (best quality)
├── favicon-16x16.png                   # Browser tab icon
├── favicon-32x32.png                   # Browser tab icon
├── favicon-96x96.png                   # HD browser icon
├── apple-touch-icon.png                # iOS home screen (180x180)
├── og-image.jpg                        # Facebook/LinkedIn preview (1200x630)
├── twitter-card.jpg                    # Twitter/X preview (1200x600)
├── web-app-manifest-192x192.png        # PWA icon source
├── web-app-manifest-512x512.png        # PWA icon source
└── icons/
    ├── icon-192x192.png                # PWA standard
    ├── icon-192x192-maskable.png       # PWA adaptive
    ├── icon-512x512.png                # PWA high-res
    └── icon-512x512-maskable.png       # PWA adaptive high-res
```

### Logo Features:
- 🚌 Blue bus icon (community-powered transit)
- 👥 Orange people silhouettes (representing contributors)
- 🏷️ "bus in seconds" tagline
- 🎨 Brand colors: Sky blue (#0EA5E9), Orange (#F59E0B), Navy (#1E293B)
convert favicon-16x16.png favicon-32x32.png favicon.ico

# 4. Create placeholder social images:
convert -size 1200x630 xc:#0EA5E9 -gravity center -pointsize 48 -fill white \
  -annotate +0-50 "Perundhu" \
  -pointsize 24 -annotate +0+50 "Real-time Bus Tracking for Tamil Nadu" \
  og-image.jpg

convert -size 1200x600 xc:#0EA5E9 -gravity center -pointsize 48 -fill white \
  -annotate +0-50 "Perundhu" \
  -pointsize 24 -annotate +0+50 "Real-time Bus Tracking for Tamil Nadu" \
  twitter-card.jpg

# 5. Verify files created:
ls -lh icons/ *.png *.ico *.jpg

# 6. YOU'RE READY TO DEPLOY!
```

---

## 📊 PRE-DEPLOYMENT VERIFICATION

Run this checklist before deploying:

```bash
cd /Users/mchand69/Documents/project/perundhu

# 1. Check icons exist
ls frontend/public/icons/icon-*.png
ls frontend/public/favicon*.png
ls frontend/public/favicon.ico

# 2. Check social images exist (or use placeholders)
ls frontend/public/og-image.jpg
ls frontend/public/twitter-card.jpg

# 3. Verify sitemap
cat frontend/public/sitemap.xml | head -20

# 4. Check 404 page
cat frontend/public/404.html | head -20

# 5. Verify robots.txt
cat frontend/public/robots.txt

# 6. Test build
cd frontend
npm run build

# If build succeeds, you're ready to deploy!
```

---

## 🆘 TROUBLESHOOTING

### "convert: command not found"
```bash
# Install ImageMagick
brew install imagemagick  # macOS
sudo apt install imagemagick  # Ubuntu/Debian
```

### "I don't have a logo yet"
Use the placeholder generation commands above. You can replace with real logos later via hotfix deployment.

### "Should I deploy with placeholders?"
**YES!** It's better to launch with placeholders and improve iteratively than to delay launch. Real users won't notice placeholder icons on first day.

---

## 📈 POST-LAUNCH (Week 1)

After deploying, complete these within 7 days:

- [ ] Replace placeholder icons with real logo-based icons
- [ ] Replace placeholder social images with professional designs
- [ ] Verify Google Analytics is tracking visits
- [ ] Check Google Search Console for indexing progress
- [ ] Review Sentry for any errors
- [ ] Verify UptimeRobot shows 99%+ uptime
- [ ] Test Open Graph preview: https://www.opengraph.xyz/
- [ ] Run Lighthouse audit: https://pagespeed.web.dev/

---

## 💰 COST VERIFICATION

All services remain in free tiers:
- Google Analytics 4: Free (unlimited)
- Google Search Console: Free
- Sentry: Free (5K errors/month)
- UptimeRobot: Free (50 monitors)
- GCP Infrastructure: $25-30/month (unchanged)

**Total Monthly Cost: $25-30** ✅

---

## ✅ FINAL CHECKLIST

Before clicking "Deploy":

- [ ] Generated icons (real or placeholder)
- [ ] Created social images (real or placeholder)
- [ ] Updated GA4 ID in index.html (or left placeholder)
- [ ] Ran `npm run build` successfully in frontend/
- [ ] Committed all changes to git
- [ ] Ready to run deployment script

**Command to deploy:**
```bash
cd /Users/mchand69/Documents/project/perundhu
./deploy-production.sh
```

---

**Last Updated:** March 20, 2026  
**Next Review:** After first deployment
