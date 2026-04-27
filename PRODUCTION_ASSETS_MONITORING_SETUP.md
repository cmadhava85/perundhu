# Production Launch Assets & Monitoring Setup Guide

This guide helps you complete the final assets and monitoring setup before production launch.

**Estimated Time:** 2-3 hours  
**Cost:** $0 (all use free tiers)

---

## 📋 Table of Contents

1. [PWA Icons & Favicons](#1-pwa-icons--favicons)
2. [Social Media Images](#2-social-media-images)
3. [Google Analytics 4 Setup](#3-google-analytics-4-setup)
4. [Google Search Console Setup](#4-google-search-console-setup)
5. [Error Tracking (Sentry)](#5-error-tracking-sentry)
6. [Uptime Monitoring (UptimeRobot)](#6-uptime-monitoring-uptimerobot)

---

## 1. PWA Icons & Favicons

### Required Assets

Generate the following from your logo/brand image:

```
frontend/public/
├── favicon.ico           (16x16, 32x32, 48x48 sizes in one .ico file)
├── favicon-16x16.png
├── favicon-32x32.png
├── icons/
│   ├── icon-192x192.png
│   ├── icon-192x192-maskable.png
│   ├── icon-512x512.png
│   └── icon-512x512-maskable.png
├── screenshots/
│   ├── screenshot-1.png  (540x720 - mobile view)
│   └── screenshot-2.png  (1280x720 - desktop view)
├── og-image.jpg          (1200x630 for Open Graph)
└── twitter-card.jpg      (1200x600 for Twitter)
```

### Generation Options

#### Option 1: Automated (Recommended)
Use **[Real Favicon Generator](https://realfavicongenerator.net/)**:
1. Upload your logo (minimum 512x512px)
2. Configure PWA settings (choose "I'll do it later" for iOS settings)
3. Download the package
4. Extract to `frontend/public/`

#### Option 2: Manual
Use design tools:
- **Figma/Canva**: Create icons at required sizes
- **ImageMagick** (command line):
```bash
# Convert logo to different sizes
convert logo.png -resize 192x192 icon-192x192.png
convert logo.png -resize 512x512 icon-512x512.png
convert logo.png -resize 32x32 favicon-32x32.png
convert logo.png -resize 16x16 favicon-16x16.png

# Create .ico file
convert favicon-16x16.png favicon-32x32.png favicon.ico
```

#### Option 3: Use Placeholder
For immediate deployment, use a solid color placeholder:
```bash
cd frontend/public
# Create simple colored icons (requires ImageMagick)
convert -size 192x192 xc:#0EA5E9 -gravity center \
  -pointsize 72 -fill white -annotate +0+0 "P" \
  icons/icon-192x192.png
```

### Maskable Icons
For maskable icons (safe area for Android Adaptive Icons):
- Add 20% padding around your logo
- Ensure logo is centered
- Background should be solid color

---

## 2. Social Media Images

### Open Graph Image (og-image.jpg)
- **Size:** 1200x630px
- **Format:** JPG (optimized, <200KB)
- **Content:** 
  - App name/logo
  - Tagline: "Real-time bus tracking for Tamil Nadu"
  - Bus/route visualization
  - Clean, eye-catching design

### Twitter Card Image (twitter-card.jpg)
- **Size:** 1200x600px
- **Format:** JPG (optimized, <200KB)
- **Content:** Similar to OG image, slightly taller format

### Screenshot Images
Take real screenshots:
1. **Mobile (540x720):** Home screen with search feature
2. **Desktop (1280x720):** Route search results page

Use browser dev tools to get exact dimensions.

---

## 3. Google Analytics 4 Setup

### Step 1: Create GA4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click **Admin** (gear icon bottom-left)
3. Click **Create Property**
4. Enter:
   - **Property name:** Perundhu
   - **Time zone:** Asia/Kolkata
   - **Currency:** INR (Indian Rupee)
5. Click **Next**, select business category: **Travel & Transportation**
6. Click **Create**

### Step 2: Create Data Stream

1. Select **Web** platform
2. Enter:
   - **Website URL:** https://www.perundhu.com
   - **Stream name:** Perundhu Web
3. Click **Create stream**
4. **Copy the Measurement ID** (format: G-XXXXXXXXXX)

### Step 3: Update Your Code

Edit `frontend/index.html`:
```html
<!-- Replace both instances of G-XXXXXXXXXX with your actual Measurement ID -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR-ID-HERE"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-YOUR-ID-HERE', {
    'send_page_view': true,
    'anonymize_ip': true
  });
</script>
```

### Step 4: Verify Tracking
1. Deploy your changes
2. Visit https://www.perundhu.com
3. In GA4, go to **Reports** > **Realtime**
4. You should see your visit within 30 seconds

### Recommended GA4 Events to Track
Add custom events in your React code:
```typescript
// In your tracking utility
export const trackBusSearch = (from: string, to: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'bus_search', {
      'event_category': 'engagement',
      'event_label': `${from} to ${to}`,
    });
  }
};

export const trackRouteView = (routeNumber: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'route_view', {
      'event_category': 'engagement',
      'event_label': routeNumber,
    });
  }
};
```

**Cost:** $0 (free up to 10M events/month)

---

## 4. Google Search Console Setup

### Step 1: Add Property

1. Go to [Google Search Console](https://search.google.com/search-console/)
2. Click **Add Property**
3. Select **URL prefix** method
4. Enter: `https://www.perundhu.com`

### Step 2: Verify Ownership

**Option A: HTML Tag (Easiest)**
1. GSC will provide a meta tag like:
   ```html
   <meta name="google-site-verification" content="ABC123..." />
   ```
2. Add it to `frontend/index.html` in the `<head>` section
3. Deploy
4. Click **Verify** in GSC

**Option B: DNS Verification**
1. Add TXT record to your domain DNS:
   ```
   google-site-verification=ABC123...
   ```
2. Click **Verify**

### Step 3: Submit Sitemap

1. In GSC, go to **Sitemaps** (left sidebar)
2. Enter sitemap URL: `https://www.perundhu.com/sitemap.xml`
3. Click **Submit**

### Step 4: Enable Enhanced Features

1. Go to **Settings** > **Crawl rate**
2. Leave as default (let Google decide)
3. Go to **Index** > **Pages** to see indexing status

**Cost:** $0 (completely free)

---

## 5. Error Tracking (Sentry)

Sentry provides free error tracking (5,000 errors/month).

### Step 1: Create Sentry Account

1. Go to [Sentry.io](https://sentry.io/)
2. Sign up (use GitHub for faster setup)
3. Create new project:
   - **Platform:** React
   - **Name:** perundhu-frontend

### Step 2: Install Sentry SDK

```bash
cd frontend
npm install @sentry/react @sentry/tracing
```

### Step 3: Initialize Sentry

Create `frontend/src/utils/sentry.ts`:
```typescript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: "https://YOUR-DSN@o123456.ingest.sentry.io/123456",
    integrations: [new BrowserTracing()],
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1, // 10% sampling to stay in free tier
    beforeSend(event) {
      // Don't send errors in development
      if (import.meta.env.DEV) return null;
      return event;
    },
  });
}

export default Sentry;
```

### Step 4: Wrap App with ErrorBoundary

Update `frontend/src/main.tsx`:
```typescript
import * as Sentry from "@sentry/react";
import "./utils/sentry"; // Initialize Sentry

// Wrap your app
<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</Sentry.ErrorBoundary>
```

### Step 5: Test Error Tracking

```typescript
// Test by throwing an error
throw new Error("Sentry test error - ignore");
```

### Backend Sentry Setup

For Java/Spring Boot backend:
1. Add dependency to `pom.xml`:
```xml
<dependency>
    <groupId>io.sentry</groupId>
    <artifactId>sentry-spring-boot-starter-jakarta</artifactId>
    <version>7.3.0</version>
</dependency>
```

2. Add to `application.properties`:
```properties
sentry.dsn=https://YOUR-BACKEND-DSN@o123456.ingest.sentry.io/123457
sentry.traces-sample-rate=0.1
sentry.environment=${spring.profiles.active}
```

**Cost:** $0 (free tier: 5K errors/month)

---

## 6. Uptime Monitoring (UptimeRobot)

### Step 1: Create Account

1. Go to [UptimeRobot](https://uptimerobot.com/)
2. Sign up (free account)
3. Verify email

### Step 2: Add Monitors

Create 3 monitors:

**Monitor 1: Website**
- **Monitor Type:** HTTP(s)
- **Friendly Name:** Perundhu Website
- **URL:** https://www.perundhu.com
- **Monitoring Interval:** 5 minutes
- **Monitor Timeout:** 30 seconds

**Monitor 2: API Health**
- **Monitor Type:** HTTP(s)
- **Friendly Name:** Perundhu API
- **URL:** https://www.perundhu.com/api/health
- **Monitoring Interval:** 5 minutes

**Monitor 3: Search Functionality**
- **Monitor Type:** Keyword
- **Friendly Name:** Perundhu Search
- **URL:** https://www.perundhu.com
- **Keyword:** Search for buses (must exist on homepage)

### Step 3: Configure Alert Contacts

1. Go to **My Settings** > **Alert Contacts**
2. Add your email: `perundhu@gmail.com`
3. Enable SMS alerts (optional, limited in free tier)
4. Add Slack webhook (optional)

### Step 4: Create Status Page

1. Go to **Status Pages**
2. Click **Create Status Page**
3. Configure:
   - **Name:** Perundhu Status
   - **Subdomain:** perundhu (will be perundhu.uptimerobot.com)
   - **Select monitors:** All 3 created above
4. Click **Create Status Page**
5. Share URL: https://status.perundhu.com (optional custom domain)

**Cost:** $0 (free tier: 50 monitors, 5-minute checks)

---

## 7. Performance Monitoring

### Lighthouse CI (Free)

Add to `.github/workflows/lighthouse.yml`:
```yaml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://www.perundhu.com
            https://www.perundhu.com/search
          uploadArtifacts: true
```

---

## 8. Deployment Checklist

Before going live, verify:

- [ ] All icons generated and placed in `frontend/public/icons/`
- [ ] Favicons in root: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`
- [ ] Social media images: `og-image.jpg`, `twitter-card.jpg`
- [ ] Screenshots in `frontend/public/screenshots/`
- [ ] GA4 Measurement ID updated in `index.html`
- [ ] Sentry DSN configured for frontend & backend
- [ ] UptimeRobot monitors created and alerting to correct email
- [ ] Google Search Console verified and sitemap submitted
- [ ] Test 404 page: visit https://www.perundhu.com/nonexistent-page
- [ ] Verify meta tags with [Open Graph Debugger](https://www.opengraph.xyz/)
- [ ] Test PWA install on mobile device
- [ ] Run Lighthouse audit (score >90 for all categories)

---

## 9. Post-Launch Monitoring

### Week 1: Daily Checks
- [ ] Google Analytics: Check daily active users
- [ ] Sentry: Review any new errors
- [ ] UptimeRobot: Verify 99%+ uptime
- [ ] Search Console: Monitor indexing progress

### Week 2-4: Weekly Reviews
- [ ] GA4: Analyze user behavior, popular routes
- [ ] Identify and fix top errors in Sentry
- [ ] Review API response times
- [ ] Check mobile vs desktop usage

### Monthly Reviews
- [ ] Review GCP costs (should stay $25-30/month)
- [ ] Analyze search queries in GSC
- [ ] Update sitemap if new pages added
- [ ] Review and act on user feedback

---

## Cost Summary

| Tool | Free Tier | Paid (if needed) |
|------|-----------|------------------|
| Google Analytics 4 | ✅ Free (10M events) | N/A for your scale |
| Google Search Console | ✅ Free | N/A |
| Sentry | ✅ 5K errors/month | $26/month (50K errors) |
| UptimeRobot | ✅ 50 monitors, 5-min checks | $7/month (1-min checks) |
| Lighthouse CI | ✅ Free (GitHub Actions) | N/A |
| **Total Monthly** | **$0** | $33 (optional upgrades) |

Recommendation: **Stay on free tiers for first 3-6 months**, upgrade only if you hit limits.

---

## Quick Commands

```bash
# Generate favicons with ImageMagick
convert logo.png -resize 192x192 frontend/public/icons/icon-192x192.png
convert logo.png -resize 512x512 frontend/public/icons/icon-512x512.png
convert logo.png -resize 32x32 frontend/public/favicon-32x32.png
convert logo.png -resize 16x16 frontend/public/favicon-16x16.png
convert frontend/public/favicon-{16x16,32x32}.png frontend/public/favicon.ico

# Take screenshots (requires Chrome/Chromium)
npx capture-website https://www.perundhu.com \
  --width=540 --height=720 \
  --output=frontend/public/screenshots/screenshot-1.png

npx capture-website https://www.perundhu.com \
  --width=1280 --height=720 \
  --output=frontend/public/screenshots/screenshot-2.png

# Optimize images
npx @squoosh/cli --webp '{"quality":80}' \
  frontend/public/{og-image,twitter-card}.jpg
```

---

## Support Links

- [Google Analytics Help](https://support.google.com/analytics/)
- [Sentry Documentation](https://docs.sentry.io/)
- [UptimeRobot FAQ](https://uptimerobot.com/faq/)
- [Search Console Help](https://support.google.com/webmasters/)

---

**Last Updated:** March 20, 2026  
**Next Review:** After first production deployment
