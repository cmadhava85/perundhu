# 🚀 Quick Deployment Verification Checklist

Use this checklist to quickly verify your production deployment after pushing the changes.

---

## ✅ Pre-Deployment: Build & Test Locally

### Backend Build
```bash
cd backend
./gradlew clean build

# Should complete without errors
# Look for: BUILD SUCCESSFUL
```

### Frontend Build
```bash
cd frontend
npm run build

# Should complete without errors
# Creates: dist/ folder
```

### Local Testing
```bash
# Start backend
cd backend
./gradlew bootRun

# In another terminal, start frontend
cd frontend  
npm run dev

# Open: http://localhost:5173
```

---

## 🔍 Feature Verification - Local

### 1. Search Results Page
**Navigate to:** Search for any route (e.g., "Chennai to Coimbatore")

**Verify:**
- [ ] ✅ Bus cards display correctly
- [ ] ❌ NO "Add Stops" button visible
- [ ] ❌ NO "Share" button visible
- [ ] ❌ NO "Report Issue" button visible
- [ ] ✅ Can click bus to see details

**Expected Result:**
```
Bus cards show:
- Bus name & number
- Departure time
- Arrival time
- Duration
- "View Details" button only
```

---

### 2. Contribution Page
**Navigate to:** Bottom nav → Contribute

**Verify:**
- [ ] ✅ "Text" contribution option available
- [ ] ❌ NO "Image" option visible
- [ ] ❌ NO "Voice" option visible
- [ ] ❌ NO "Paste" option visible
- [ ] ✅ Can fill form and submit

**Expected Result:**
```
Contribution page shows:
- Only "Text" (✍️) chip active
- Manual entry form visible
- No other contribution method buttons
```

---

### 3. Backend API Check
```bash
# Test feature flags endpoint
curl http://localhost:8080/api/v1/settings/feature-flags

# Expected response:
{
  "enableManualContribution": true,
  "enableShareRoute": false,
  "enableAddStops": false,
  "enableReportIssue": false,
  "enableImageContribution": false,
  "enablePasteContribution": false,
  "enableVoiceContribution": false,
  ...
}
```

**Verify:**
- [ ] `enableShareRoute`: `false`
- [ ] `enableAddStops`: `false`
- [ ] `enableReportIssue`: `false`
- [ ] `enableImageContribution`: `false`
- [ ] `enablePasteContribution`: `false`
- [ ] `enableVoiceContribution`: `false`
- [ ] `enableManualContribution`: `true`

---

## 🌐 Production Deployment

### Deploy Backend
```bash
# Commit changes
git add .
git commit -m "feat: disable advanced features for initial launch"
git push origin master

# Build production JAR
cd backend
./gradlew clean bootJar

# Copy to server (adjust your deployment method)
scp build/libs/app-*.jar user@your-server:/path/to/deploy/

# On server: Restart application
ssh user@your-server
sudo systemctl restart perundhu-backend
# OR
java -jar /path/to/app.jar
```

### Deploy Frontend
```bash
# Build production bundle
cd frontend
npm run build

# Deploy dist/ folder to your hosting
# For Firebase:
firebase deploy

# For Netlify:
netlify deploy --prod

# For custom server:
scp -r dist/* user@your-server:/var/www/perundhu/
```

---

## 🔍 Post-Deployment Verification - Production

### 1. Backend Health Check
```bash
# Check if backend is up
curl https://your-domain.com/api/health

# Expected: 200 OK
```

### 2. Feature Flags API (Production)
```bash
curl https://your-domain.com/api/v1/settings/feature-flags

# Verify same response as local:
# - enableShareRoute: false
# - enableAddStops: false
# - enableReportIssue: false
# etc.
```

### 3. Frontend - Search Page
**Open:** https://your-domain.com

**Test:**
1. Search for "Chennai to Madurai"
2. Wait for results
3. Inspect bus cards

**Verify:**
- [ ] ❌ NO "Add Stops" button
- [ ] ❌ NO "Share" button
- [ ] ❌ NO "Report Issue" button
- [ ] ✅ Only "View Details" button

**Visual Check:**
```
Each bus card should show:

┌─────────────────────────────────┐
│ Chennai Express (138A)          │
│ 🕐 06:00 → 12:30 (6h 30m)      │
│ Chennai → Madurai               │
│                                 │
│ [View Details →]                │  ← Only this button
│                                 │
└─────────────────────────────────┘
```

---

### 4. Frontend - Contribution Page
**Navigate to:** Click "Contribute" in bottom nav

**Verify:**
- [ ] ✅ Only "Text" chip visible
- [ ] ❌ NO Image/Voice/Paste chips
- [ ] ✅ Form accepts input
- [ ] ✅ Can submit successfully

**Visual Check:**
```
Contribution Method Selector:

┌─────────────────────────────────┐
│ [✍️ Text] ← Only this chip     │
└─────────────────────────────────┘

NOT:
│ [📸 Image] [🎤 Voice] [📋 Paste]│
```

---

### 5. Console Error Check
**Browser DevTools:** F12 → Console

**Verify:**
- [ ] No JavaScript errors
- [ ] No 404s
- [ ] No CORS errors
- [ ] API calls return 200

**What to look for:**
```
✅ Good:
GET /api/v1/locations - 200 OK
GET /api/v1/settings/feature-flags - 200 OK
POST /api/v1/contributions/route - 201 Created

❌ Bad:
Error: Cannot read property 'enableShareRoute'
404 Not Found: /api/v1/...
CORS policy blocked...
```

---

### 6. Mobile Responsive Check
**Test on:**
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Tablet (iPad/Android)

**Verify:**
- [ ] Layout looks good
- [ ] Buttons clickable
- [ ] No overlapping text
- [ ] Bottom nav visible

---

### 7. Network Performance Check
**Chrome DevTools:** Network tab

**Verify:**
- [ ] API response time < 2s
- [ ] Page load time < 3s
- [ ] All assets loaded
- [ ] No failed requests

**Acceptable metrics:**
```
Search API: < 1.5s
Locations API: < 1s
Static assets: < 500ms
Total page load: < 3s
```

---

## 📊 Database Verification

### Check Settings Table
```sql
-- Connect to your production database
-- MySQL/PostgreSQL:

SELECT * FROM system_settings 
WHERE setting_key LIKE 'feature.%'
ORDER BY setting_key;

-- Expected results:
┌────────────────────────────────────────┬────────────┐
│ setting_key                            │ value      │
├────────────────────────────────────────┼────────────┤
│ feature.addStops.enabled               │ false      │
│ feature.contribution.image.enabled     │ false      │
│ feature.contribution.manual.enabled    │ true       │
│ feature.contribution.paste.enabled     │ false      │
│ feature.contribution.voice.enabled     │ false      │
│ feature.reportIssue.enabled            │ false      │
│ feature.share.enabled                  │ false      │
└────────────────────────────────────────┴────────────┘
```

### Verify Settings Initialized
```sql
-- Check if settings exist
SELECT COUNT(*) FROM system_settings 
WHERE setting_key LIKE 'feature.%';

-- Should return 10+ rows
```

---

## 🎯 Functional Testing Checklist

### Search Functionality
- [ ] Can search for routes
- [ ] Results load within 2 seconds
- [ ] Bus cards display correctly
- [ ] Stops show in modal/detail page
- [ ] Timings display correctly
- [ ] No "Add Stops" button visible
- [ ] No "Share" button visible
- [ ] No "Report Issue" button visible

### Contribution Functionality
- [ ] Contribute page loads
- [ ] Only "Text" option visible
- [ ] Can type bus number
- [ ] Can type route (from/to)
- [ ] Can add stops
- [ ] Submit works
- [ ] Success message appears
- [ ] Form clears after submit

### Navigation
- [ ] Bottom nav works
- [ ] All tabs accessible
- [ ] Back button works
- [ ] No broken links

### Language Support
- [ ] Tamil language works
- [ ] English language works
- [ ] Language toggle works
- [ ] No missing translations

---

## 🚨 Common Issues & Fixes

### Issue 1: Features still showing
**Symptom:** "Add Stops" button still visible

**Fix:**
```bash
# Clear browser cache
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)

# OR redeploy frontend
cd frontend
npm run build
# Deploy again
```

---

### Issue 2: API returns 500 error
**Symptom:** Feature flags endpoint fails

**Fix:**
```bash
# Check backend logs
tail -f /var/log/perundhu/backend.log

# Restart backend
sudo systemctl restart perundhu-backend

# Verify database settings
# Run SQL query from "Database Verification" section
```

---

### Issue 3: Database settings not initialized
**Symptom:** Empty feature flags response

**Fix:**
```bash
# Backend logs should show:
"Initializing default system settings"
"System settings initialization complete"

# If not, manually insert:
INSERT INTO system_settings (setting_key, setting_value, category, description)
VALUES 
  ('feature.share.enabled', 'false', 'features', 'Enable share route'),
  ('feature.addStops.enabled', 'false', 'features', 'Enable add stops'),
  ('feature.reportIssue.enabled', 'false', 'features', 'Enable report issue'),
  ...
```

---

### Issue 4: CORS errors in production
**Symptom:** API calls blocked by browser

**Fix:**
```java
// Check backend CORS configuration
// File: WebConfig.java or CorsConfig.java

@Configuration
public class CorsConfig {
  @Bean
  public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
      @Override
      public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
          .allowedOrigins("https://your-production-domain.com")
          .allowedMethods("GET", "POST", "PUT", "DELETE");
      }
    };
  }
}
```

---

### Issue 5: Frontend shows old content
**Symptom:** Features not updated after deployment

**Fix:**
```bash
# Add cache-busting to index.html
# Ensure build produces hashed filenames

# Clear CDN cache (if using Cloudflare/similar)
# Purge cache in hosting dashboard

# Force users to refresh:
# Update version in package.json
# Redeploy with new version
```

---

## 📝 Deployment Log Template

Use this to track your deployment:

```
═══════════════════════════════════════════════════════
PERUNDHU PRODUCTION DEPLOYMENT
Date: February 9, 2026
Version: 1.0.0 (Initial Launch)
═══════════════════════════════════════════════════════

CHANGES DEPLOYED:
✅ Disabled feature.share.enabled
✅ Disabled feature.addStops.enabled  
✅ Disabled feature.reportIssue.enabled
✅ Disabled feature.contribution.image.enabled
✅ Disabled feature.contribution.paste.enabled
✅ Disabled feature.contribution.voice.enabled
✅ Kept feature.contribution.manual.enabled = true

DEPLOYMENT STEPS:
[ ] Backend built: ./gradlew bootJar
[ ] Backend deployed: Time: ____
[ ] Backend restarted: Time: ____
[ ] Frontend built: npm run build
[ ] Frontend deployed: Time: ____

VERIFICATION RESULTS:
[ ] Search page verified: ✅/❌
[ ] Contribution page verified: ✅/❌
[ ] API health check: ✅/❌
[ ] Feature flags API: ✅/❌
[ ] Database settings: ✅/❌
[ ] Mobile responsive: ✅/❌
[ ] Console errors: None ✅ / Found: ____

PERFORMANCE METRICS:
- Search API response: ____ ms
- Page load time: ____ s
- API health: ____ ms

ISSUES ENCOUNTERED:
1. _______________________________________________
2. _______________________________________________

RESOLVED:
1. _______________________________________________
2. _______________________________________________

DEPLOYED BY: _______________
VERIFIED BY: _______________
TIME: _______________
═══════════════════════════════════════════════════════
```

---

## ✅ Sign-Off Checklist

Before announcing launch:

### Technical ✅
- [ ] Backend deployed and running
- [ ] Frontend deployed and accessible
- [ ] Database settings verified
- [ ] Feature flags confirmed disabled
- [ ] API endpoints responding < 2s
- [ ] No console errors
- [ ] Mobile responsive working
- [ ] SSL certificate valid

### Functional ✅
- [ ] Search works
- [ ] Results display correctly
- [ ] No disabled buttons showing
- [ ] Contribution page limited to text
- [ ] Form submission works
- [ ] Language toggle works

### Monitoring ✅
- [ ] Backend logs accessible
- [ ] Analytics tracking active
- [ ] Error tracking enabled (Sentry/similar)
- [ ] Uptime monitoring active
- [ ] Database backups running

### Social Media ✅
- [ ] Videos recorded
- [ ] Videos edited
- [ ] Captions written
- [ ] Hashtags prepared
- [ ] First post scheduled
- [ ] Social media accounts ready

### Documentation ✅
- [ ] Deployment guide read
- [ ] Video scripts reviewed
- [ ] Support email active
- [ ] FAQ prepared (if any)

---

## 🎉 Launch Announcement

Once all checks pass, you're ready to launch!

### Actions:
1. **Post first video** on Instagram & Facebook
2. **Share to WhatsApp Status** with download link
3. **Tweet/X post** announcing launch
4. **Email newsletter** (if you have subscribers)
5. **Post in local community groups** (with permission)

### Sample Announcement:
```
🚀 Perundhu is LIVE!

Find bus routes across Tamil Nadu in seconds!

✅ Search any route
✅ Complete timing details
✅ Tamil & English support
✅ Community-driven

Download now: [link]

#TamilNaduBus #Launch #NewApp
```

---

## 📞 Emergency Contacts

Keep these handy on launch day:

- **Backend Issues:** [Your backend developer]
- **Frontend Issues:** [Your frontend developer]
- **Database Issues:** [Your DB admin]
- **Hosting Support:** [Hosting provider support]
- **Domain/DNS:** [Domain registrar support]

---

## 🎊 You're Ready!

All checks passed? 

**Congratulations! Your app is production-ready! 🎉**

Go ahead and:
1. Deploy to production
2. Run this checklist
3. Post your videos
4. Announce your launch!

**Good luck! 🚀**

---

*Last Updated: February 9, 2026*
*Perundhu Production Launch Verification*
