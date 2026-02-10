# Production Deployment Guide - February 2026

## 📋 Overview

This guide covers the initial production deployment with a phased feature rollout strategy. We're launching with core features first and enabling additional features based on user feedback and system stability.

---

## ✅ Features Disabled for Initial Launch

### Search Results - Disabled Actions
The following buttons will **NOT appear** in bus search results initially:

- ❌ **Add Stops** button
- ❌ **Share Route** button  
- ❌ **Report Issue** button
- ❌ **Reviews** button (if enabled)

✅ **What Users CAN do:**
- Search for bus routes
- View bus details (timings, stops, route information)
- Select buses to see full details
- Navigate between screens

### Contribution Page - Limited to Text Only
Only **Text/Manual Contribution** will be available initially:

- ✅ **Manual Entry** (Text form) - ENABLED
- ❌ **Image Upload** - DISABLED
- ❌ **Voice Recording** - DISABLED
- ❌ **Paste Contribution** - DISABLED
- ❌ **Route Verification** - DISABLED (already disabled by default)

---

## 🔧 Changes Made

### Backend Configuration
**File:** `backend/app/src/main/java/com/perundhu/application/service/SystemSettingsService.java`

```java
// UI action toggles - ALL DISABLED for initial launch
DEFAULT_SETTINGS.put("feature.share.enabled",
    new SettingDefault("false", "features", "Enable share route functionality"));
DEFAULT_SETTINGS.put("feature.addStops.enabled",
    new SettingDefault("false", "features", "Enable add stops functionality"));
DEFAULT_SETTINGS.put("feature.reportIssue.enabled",
    new SettingDefault("false", "features", "Enable report issue functionality"));

// Contribution methods - ONLY MANUAL ENABLED
DEFAULT_SETTINGS.put("feature.contribution.manual.enabled",
    new SettingDefault("true", "features", "Enable manual route contribution"));
DEFAULT_SETTINGS.put("feature.contribution.image.enabled",
    new SettingDefault("false", "features", "Enable image-based route contribution"));
DEFAULT_SETTINGS.put("feature.contribution.paste.enabled",
    new SettingDefault("false", "features", "Enable paste text contribution"));
DEFAULT_SETTINGS.put("feature.contribution.voice.enabled",
    new SettingDefault("false", "features", "Enable voice input contribution"));
```

---

## 🚀 Deployment Steps

### 1. Pre-Deployment Checklist
- [x] Backend feature flags updated
- [ ] Database migrations run (if any pending)
- [ ] Environment variables verified
- [ ] Build and test locally
- [ ] Review disabled features in UI

### 2. Build & Deploy Backend
```bash
cd backend
./gradlew clean build
# Deploy to production server
# Restart backend service
```

### 3. Build & Deploy Frontend
```bash
cd frontend
npm run build
# Deploy built files to production
```

### 4. Post-Deployment Verification

**Test the following:**

✅ **Search Functionality:**
- [ ] Search for routes works
- [ ] Bus cards display correctly
- [ ] NO "Add Stops" button appears
- [ ] NO "Share" button appears
- [ ] NO "Report Issue" button appears

✅ **Contribution Page:**
- [ ] Only "Text" contribution option appears
- [ ] Manual form works correctly
- [ ] Submission works and returns success
- [ ] NO image/voice/paste options visible

✅ **System Health:**
- [ ] Backend logs show no errors
- [ ] Database connections stable
- [ ] API responses < 2s
- [ ] No console errors in browser

---

## 🎥 Social Media Video Guide

### Video Strategy for Instagram & Facebook

Create **3 short videos** (15-30 seconds each) showcasing different features:

---

### Video 1: Search & Results Demo
**Duration:** 20-25 seconds  
**Platform:** Instagram Reels, Facebook Stories/Reels

#### 📱 Recording Steps:

1. **Screen Recording Setup:**
   - Use iOS screen recording or Android screen recording
   - Enable microphone for voiceover (optional)
   - Hold phone vertically (9:16 aspect ratio)
   - Clean background, good lighting

2. **What to Show:**
   ```
   00:00-00:05  → Open app, show home screen with search
   00:05-00:10  → Type "Chennai to Coimbatore" (or Tamil Nadu cities)
   00:10-00:15  → Search results appear with bus cards
   00:15-00:20  → Tap a bus to show detailed route
   00:20-00:25  → Show stops and timings
   ```

3. **Key Features to Highlight:**
   - Clean, simple search interface
   - Fast results
   - Tamil & English support
   - Detailed bus information (timings, stops)
   - Easy-to-read bus cards

4. **Caption for Social Media:**
   ```
   🚌 Find your bus in seconds! 
   
   Search routes across Tamil Nadu with Perundhu
   ✅ Real-time bus information
   ✅ Tamil & English support
   ✅ Easy-to-use interface
   
   Download now 👉 [link]
   
   #TamilNaduBus #PublicTransport #BusRoute #TravelSmart
   #Chennai #Coimbatore #Madurai #TamilNadu
   ```

---

### Video 2: Stop Details & Route Information
**Duration:** 20-25 seconds  
**Platform:** Instagram Reels, Facebook Reels

#### 📱 Recording Steps:

1. **What to Show:**
   ```
   00:00-00:05  → Open a bus detail from search results
   00:05-00:12  → Scroll through stop list showing times
   00:12-00:18  → Show departure/arrival times clearly
   00:18-00:25  → Highlight key stops (origin, destination)
   ```

2. **Key Features:**
   - Comprehensive stop information
   - Arrival/departure times for each stop
   - Route visualization
   - Distance/duration display

3. **Caption:**
   ```
   🕐 Never miss your stop again!
   
   Get detailed timing for every bus stop
   ✅ Arrival & departure times
   ✅ All major stops covered
   ✅ Plan your journey better
   
   Start using Perundhu today!
   
   #BusTimings #TamilNaduTransport #PublicTransport
   #CommuteSmart #TravelTamil
   ```

---

### Video 3: Contribution Feature
**Duration:** 25-30 seconds  
**Platform:** Instagram Reels, Facebook Reels

#### 📱 Recording Steps:

1. **What to Show:**
   ```
   00:00-00:05  → Navigate to Contribute page (bottom nav)
   00:05-00:10  → Show contribution form (Text option)
   00:10-00:15  → Fill in bus number and route
   00:15-00:20  → Add a few stops
   00:20-00:25  → Submit contribution
   00:25-00:30  → Show success message
   ```

2. **Key Features:**
   - Community-driven database
   - Easy contribution process
   - Help other travelers
   - Simple text entry

3. **Caption:**
   ```
   🤝 Help build Tamil Nadu's bus database!
   
   Know a bus route? Share it with others
   ✅ Simple form to fill
   ✅ Help fellow travelers
   ✅ Build a better community
   
   Your contribution matters! 🙏
   
   #CommunityDriven #CrowdSourced #PublicGood
   #TamilNaduBuses #ShareKnowledge #HelpOthers
   ```

---

## 🎬 Video Production Tips

### Recording Best Practices:

1. **Device Preparation:**
   - Fully charged phone
   - Clear all notifications (DND mode)
   - Clean screen (no smudges)
   - Close unnecessary apps
   - Use latest app version

2. **Screen Recording Settings:**
   - **iOS:** Settings → Control Center → Screen Recording
   - **Android:** Quick Settings → Screen Recording
   - Enable microphone for voiceover
   - Record in HD quality

3. **Lighting & Environment:**
   - Good natural light or ring light
   - Stable hand or tripod
   - Quiet background (for voiceover)
   - No glare on screen

4. **Demonstration Tips:**
   - Slow, deliberate actions
   - Pause on important screens (2-3 seconds)
   - Show key information clearly
   - Keep under 30 seconds
   - Use real/relevant locations

### Editing Guidelines:

1. **Video Editing:**
   - Trim unnecessary parts
   - Add title overlay at start (2s): "Perundhu - Tamil Nadu Bus Routes"
   - Add text highlights for key features
   - Speed up slow parts (1.2-1.5x)
   - Add background music (royalty-free, upbeat)
   - Keep final video 20-30 seconds

2. **Recommended Editing Apps:**
   - **Mobile:** InShot, CapCut, Adobe Premiere Rush
   - **Desktop:** DaVinci Resolve (free), Adobe Premiere Pro
   - **Simple:** iMovie (iOS), Google Photos (Android)

3. **Export Settings:**
   - **Resolution:** 1080x1920 (vertical)
   - **Format:** MP4 (H.264)
   - **Frame Rate:** 30fps
   - **Bitrate:** High quality

### Text Overlays to Add:

```
Video 1:
- "Find Your Bus" (00:02-00:05)
- "Search Routes Instantly" (00:10-00:15)
- "Tamil & English Support" (00:20-00:23)

Video 2:
- "Detailed Stop Info" (00:05-00:10)
- "Arrival & Departure Times" (00:15-00:18)

Video 3:
- "Contribute & Help" (00:05-00:08)
- "Build Together" (00:20-00:25)
```

---

## 📊 Social Media Strategy

### Posting Schedule:

**Week 1 (Launch Week):**
- **Day 1:** Video 1 (Search & Results) - Instagram Reels + Facebook Reels
- **Day 3:** Video 2 (Stop Details) - Instagram + Facebook
- **Day 5:** Video 3 (Contribution) - Instagram + Facebook
- **Daily:** Create stories showing user feedback/stats

**Week 2:**
- Repost best-performing video
- Create carousel post with screenshots
- Share user testimonials (if any)

### Hashtag Strategy:

**Primary (Use in every post):**
```
#TamilNaduBus #PublicTransport #BusRoute
#TamilNadu #Perundhu
```

**City-Specific (Rotate based on content):**
```
#Chennai #Coimbatore #Madurai #Salem #Trichy
#Erode #Tiruppur #Kanyakumari #Vellore
```

**Engagement:**
```
#TravelSmart #CommuteSmart #PublicGood
#TravelTamil #ExploreTamilNadu
```

**Keep to 10-15 hashtags max per post**

### Engagement Tips:

1. **Best Posting Times:**
   - Morning: 7-9 AM (commute time)
   - Evening: 5-7 PM (return commute)
   - Weekend: 10 AM - 12 PM

2. **Respond to Comments:**
   - Reply within 1 hour
   - Thank users for feedback
   - Answer questions promptly

3. **Create Stories:**
   - Behind-the-scenes of development
   - Feature teasers
   - User testimonials
   - Daily usage stats

---

## 📈 Metrics to Track

### App Analytics:
- Daily active users (DAU)
- Search queries per day
- Successful route searches
- Contribution submissions
- User retention (D1, D7, D30)

### Social Media Analytics:
- Views per video
- Engagement rate (likes, comments, shares)
- Profile visits from posts
- Link clicks to download
- Follower growth

### Performance Metrics:
- API response times
- Error rates
- Database query performance
- System uptime

---

## 🔜 Phase 2 Features (Enable Later)

**When to Enable Additional Features:**
- ✅ Stable user base (1000+ active users)
- ✅ Low error rates (<1%)
- ✅ Positive user feedback
- ✅ Sufficient moderation capacity

**Features to Enable in Phase 2:**
1. **Add Stops** - Let users add intermediate stops
2. **Share Route** - Allow sharing via WhatsApp, social media
3. **Report Issue** - Enable issue reporting
4. **Image Contribution** - Allow image uploads
5. **Reviews** - Enable bus reviews

**How to Enable:**
Use Admin Settings Panel in production:
```
1. Login as admin
2. Go to Settings → Feature Flags
3. Toggle desired features ON
4. Features activate immediately (no redeployment needed)
```

---

## 🆘 Troubleshooting

### Issue: Features still showing
**Solution:** Clear browser cache or hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

### Issue: Database errors on first launch
**Solution:** Check that SystemSettingsService initialization completed successfully in logs

### Issue: Feature flags not updating
**Solution:** 
1. Check database for system_settings table
2. Verify settings exist: `SELECT * FROM system_settings WHERE setting_key LIKE 'feature.%';`
3. Restart backend service

---

## 📞 Support & Feedback

- **Email:** support@perundhu.com
- **Social Media:** Monitor comments and DMs daily
- **Issue Tracking:** GitHub Issues (for technical problems)

---

## 📝 Launch Checklist

### Pre-Launch:
- [ ] All features verified disabled in production
- [ ] Social media accounts ready
- [ ] Videos recorded and edited
- [ ] Captions and hashtags prepared
- [ ] Monitoring dashboard set up

### Launch Day:
- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Run smoke tests
- [ ] Post first video on social media
- [ ] Monitor logs and analytics
- [ ] Be ready to respond to feedback

### Post-Launch (Week 1):
- [ ] Post remaining videos (Day 3, Day 5)
- [ ] Respond to all comments/messages
- [ ] Track metrics daily
- [ ] Document issues/feedback
- [ ] Plan Phase 2 based on feedback

---

## 🎉 Success Criteria

**Week 1 Goals:**
- ✅ 100+ app opens
- ✅ 50+ successful searches
- ✅ 10+ contributions
- ✅ Zero critical errors
- ✅ 1000+ video views on social media

**Month 1 Goals:**
- ✅ 500+ active users
- ✅ 200+ contributions
- ✅ 5000+ searches
- ✅ 99.9% uptime
- ✅ 5000+ social media reach

---

## 📚 Additional Resources

### For Video Creation:
- **Music:** YouTube Audio Library (royalty-free)
- **Icons:** Use app's native icons
- **Fonts:** Keep readable (minimum 40pt for mobile)

### For Social Media:
- **Instagram Insights:** Track video performance
- **Facebook Analytics:** Monitor engagement
- **Later.com / Buffer:** Schedule posts
- **Canva:** Create graphics for carousel posts

---

**Good luck with your launch! 🚀**

Remember: Start simple, gather feedback, iterate quickly!

---

*Last Updated: February 9, 2026*
*Version: 1.0 - Initial Launch Configuration*
