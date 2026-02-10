# 🎬 Automated Video Creation Guide

Complete guide to automatically create your promotional videos using Playwright.

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install FFmpeg (for video conversion)
```bash
brew install ffmpeg
```

### Step 2: Make scripts executable
```bash
cd /Users/mchand69/Documents/perundhu
chmod +x record-demo-videos.sh
chmod +x convert-videos-to-mp4.sh
```

### Step 3: Record all videos
```bash
cd frontend
../record-demo-videos.sh
```

**✅ Videos are automatically converted to MP4 format for social media!**

That's it! MP4 videos will be created in `demo-videos/mp4/` directory.

---

## 📋 What Gets Created

The script automatically records videos and converts them to MP4 format.

### Generated Files:

**Source Videos (WebM - raw recordings):**
- `demo-videos/01-search-and-results.webm`
- `demo-videos/02-stop-details.webm`
- `demo-videos/03-contribution.webm`

**Social Media Ready (MP4 - automatically converted):**
- `demo-videos/mp4/01-search-and-results.mp4` ✅ Instagram/Facebook/TikTok ready
- `demo-videos/mp4/02-stop-details.mp4` ✅ Instagram/Facebook/TikTok ready
- `demo-videos/mp4/03-contribution.mp4` ✅ Instagram/Facebook/TikTok ready

**Video Specifications:**
- Format: MP4 (H.264)
- Resolution: 1080x1920 (9:16 vertical)
- Quality: High (CRF 18)
- Audio: AAC 192kbps
- Compatible: Instagram Reels, Facebook Reels, TikTok, Stories

---

## 🎥 Detailed Setup

### Prerequisites

1. **FFmpeg** (for video conversion)
   ```bash
   # macOS
   brew install ffmpeg
   
   # Ubuntu/Debian
   sudo apt install ffmpeg
   
   # Windows (using Chocolatey)
   choco install ffmpeg
   ```

2. **Node.js & npm** (already installed)

3. **Playwright** (already installed in your project)

---

## 📝 Recording Process

### Full Process:

```bash
# 1. Navigate to frontend directory
cd /Users/mchand69/Documents/perundhu/frontend

# 2. Ensure backend is running (in another terminal)
cd ../backend
./gradlew bootRun
# OR if already running in Docker/production, skip this

# 3. Record videos (frontend terminal)
../record-demo-videos.sh

# Wait 2-3 minutes while it records all 3 videos...
# Videos are automatically converted to MP4 format!

# 4. Find your videos
ls -lh demo-videos/mp4/
```

### What Happens During Recording:

```
🎬 Starting Recording Process
├── Starting dev server (http://localhost:5173)
├── Installing Playwright browsers (if needed)
├── Recording Video 1: Search Demo (~60 seconds)
├── Recording Video 2: Stops Demo (~60 seconds)
├── Recording Video 3: Contribution Demo (~60 seconds)
├── Saving videos to demo-videos/ (WebM format)
├── 🎬 Converting to MP4 for social media...
└── ✅ MP4 videos ready in demo-videos/mp4/
```

---

## ⚙️ Customization

### Adjust Video Speed

Edit the test files in `frontend/e2e/video-demos/`:

```typescript
// Make actions slower (more time between steps)
await page.waitForTimeout(3000); // Increase from 2000 to 3000

// Make typing slower
await input.pressSequentially('Chennai', { delay: 200 }); // Increase delay

// Make scrolling smoother
await page.mouse.wheel(0, 150); // Reduce scroll distance
await page.waitForTimeout(2000); // More pause between scrolls
```

### Change Video Resolution

Edit `frontend/playwright.config.video.ts`:

```typescript
video: {
  mode: 'on',
  size: { 
    width: 1080,  // Change resolution
    height: 1920  // 9:16 for Instagram/Facebook
  }
}
```

### Modify Search Locations

Edit `frontend/e2e/video-demos/search-demo.spec.ts`:

```typescript
// Change from "Chennai to Coimbatore"
await searchFrom.pressSequentially('Madurai', { delay: 150 });
await searchTo.pressSequentially('Salem', { delay: 150 });
```

**⚠️ Important: Use exact bus stand names**

Some locations have multiple entries (city vs. bus stand). For best results in videos, use the full bus stand name:

```typescript
// ✅ GOOD - Uses exact bus stand name
await searchFrom.pressSequentially('KCBT KILAMBAKKAM', { delay: 150 });
await searchTo.pressSequentially('Madurai - Mattuthavani', { delay: 150 });

// ❌ AVOID - Might show village/neighborhood instead
await searchFrom.pressSequentially('kilambakkam', { delay: 150 }); // Shows "Kilambakkam" village
await searchTo.pressSequentially('Mattuthavani', { delay: 150 });  // Shows "MGR Mattuthavani"
```

**Common Bus Stand Names:**
- Chennai: `CMBT`, `KCBT KILAMBAKKAM`, `Chennai - Broadway`, `Chennai - Madhavaram`
- Madurai: `Madurai - Mattuthavani`, `Madurai - Periyar`
- Coimbatore: `Coimbatore - Gandhipuram`, `Coimbatore - Ukkadam`
- Salem: `Salem - New Bus Stand`, `Salem - Old Bus Stand`

---

## 🎨 Adding Text Overlays

The automated videos are **raw footage** without text overlays. You have 2 options:

### Option 1: Use Editing Apps (Recommended)

**Best Apps:**
- **CapCut** (Free, easy) - [Download](https://www.capcut.com)
- **InShot** (Free with watermark)
- **DaVinci Resolve** (Free, professional)

**Steps:**
1. Import MP4 video from `demo-videos/mp4/`
2. Add text overlays at timestamps (from VIDEO_RECORDING_SCRIPT.md)
3. Add background music (optional)
4. Export as 1080x1920 MP4

### Option 2: Programmatic Overlays (Advanced)

Use FFmpeg to add text programmatically:

```bash
ffmpeg -i input.mp4 \
  -vf "drawtext=text='Find Your Bus 🚌':fontfile=/Library/Fonts/Arial.ttf:fontsize=60:fontcolor=white:x=(w-text_w)/2:y=100:enable='between(t,2,5)'" \
  -codec:a copy \
  output.mp4
```

*This requires FFmpeg expertise. Editing apps are easier.*

---

## 🔧 Troubleshooting

### Issue 1: "ffmpeg: command not found"

**Solution:**
```bash
# Install FFmpeg
brew install ffmpeg

# Verify installation
ffmpeg -version
```

---

### Issue 2: Backend not running

**Error:** "Test failed: ERR_CONNECTION_REFUSED"

**Solution:**
```bash
# Start backend in separate terminal
cd backend
./gradlew bootRun

# Then run recording script
```

---

### Issue 3: Videos are too fast

**Solution:** Edit test files and increase wait times:

```typescript
// In frontend/e2e/video-demos/*.spec.ts
await page.waitForTimeout(2000); // Increase to 3000 or 4000
```

---

### Issue 4: App looks different in video

**Solution:** The script uses iPhone 13 Pro viewport. To change:

```typescript
// In playwright.config.video.ts
use: {
  ...devices['Pixel 5'], // Try different device
  viewport: { width: 1080, height: 1920 },
}
```

---

### Issue 5: Video quality is poor

**Solution:** Increase FFmpeg quality:

```bash
# Edit convert-videos-to-mp4.sh
# Change CRF value (lower = better quality, larger file)
-crf 15 \  # Instead of 18
```

---

### Issue 6: Wrong location shows in autocomplete

**Problem:** 
- Typing "kilambakkam" shows "Kilambakkam" instead of "KCBT KILAMBAKKAM"
- Typing "Mattuthavani" shows "M.G.R Mattuthavani" instead of "Madurai - Mattuthavani"

**Solution A: Type the full bus stand name**
```typescript
// In search-demo.spec.ts, use full names:
await searchFrom.pressSequentially('KCBT KILAMBAKKAM', { delay: 150 });
await searchTo.pressSequentially('Madurai - Mattuthavani', { delay: 150 });
```

**Solution B: Click the correct option**
```typescript
// After typing, wait and click specific result
await searchFrom.pressSequentially('kilambakkam', { delay: 150 });
await page.waitForTimeout(1000);
await page.locator('text=KCBT KILAMBAKKAM').first().click();
```

**Solution C: Rename locations temporarily (database)**
```sql
-- Run before recording video:
UPDATE locations SET name = 'Kilambakkam (Village)' WHERE id = 14813;
UPDATE locations SET name = 'Madurai - MGR Mattuthavani Bus Stand' WHERE id = 580;

-- This makes "KCBT KILAMBAKKAM" and "Madurai - Mattuthavani" show up first
-- Revert after video if needed
```

---

## 📊 Video Specifications

### Raw Videos (WebM)
- **Format:** WebM (intermediate format)
- **Codec:** VP9
- **Resolution:** 720x1280
- **Quality:** High
- **Size:** ~5-10 MB per video
- **Location:** `demo-videos/*.webm`
- **Note:** Automatically converted to MP4

### Social Media Ready (MP4) ✅ **AUTOMATICALLY CREATED**
- **Format:** MP4
- **Codec:** H.264 (best compatibility)
- **Resolution:** 1080x1920 (9:16 upscaled)
- **Quality:** High (CRF 18)
- **Audio:** AAC, 192kbps
- **Size:** ~3-8 MB per video
- **Location:** `demo-videos/mp4/*.mp4`
- **Ready for:** Instagram, Facebook, TikTok, Stories

### Platform Compatibility

✅ **Instagram Reels:**
- Resolution: 1080x1920 ✅
- Format: MP4 ✅
- Duration: 15-90s (ours: 20-30s) ✅
- Max size: 4GB (ours: ~5MB) ✅

✅ **Facebook Reels:**
- Resolution: 1080x1920 ✅
- Format: MP4 ✅
- Duration: 15-60s ✅
- Max size: 4GB ✅

✅ **Instagram/Facebook Stories:**
- Resolution: 1080x1920 ✅
- Format: MP4 ✅
- Duration: 15s-60s ✅

---

## 🎯 Advanced Options

### Record Single Video

```bash
cd frontend

# Record only search demo
npx playwright test search-demo.spec.ts --config=playwright.config.video.ts

# Record only stops demo
npx playwright test stops-demo.spec.ts --config=playwright.config.video.ts

# Record only contribution demo
npx playwright test contribution-demo.spec.ts --config=playwright.config.video.ts
```

### Watch Recording in Real-Time

```bash
# Run with headed mode to see browser
npx playwright test search-demo.spec.ts \
  --config=playwright.config.video.ts \
  --headed
```

### Debug a Recording

```bash
# Run with debug mode
npx playwright test search-demo.spec.ts \
  --config=playwright.config.video.ts \
  --debug
```

---

## 📁 File Structure

```
perundhu/
├── frontend/
│   ├── e2e/
│   │   └── video-demos/
│   │       ├── search-demo.spec.ts       # Video 1 script
│   │       ├── stops-demo.spec.ts        # Video 2 script
│   │       └── contribution-demo.spec.ts # Video 3 script
│   ├── playwright.config.video.ts        # Video recording config
│   └── test-results/                     # Temporary test output
│
├── demo-videos/                          # Your videos here!
│   ├── 01-search-and-results.webm        # Raw video 1
│   ├── 02-stop-details.webm              # Raw video 2
│   ├── 03-contribution.webm              # Raw video 3
│   └── mp4/                              # Converted videos
│       ├── 01-search-and-results.mp4     # Ready for Instagram
│       ├── 02-stop-details.mp4           # Ready for Instagram
│       └── 03-contribution.mp4           # Ready for Instagram
│
├── record-demo-videos.sh                 # Main recording script
├── convert-videos-to-mp4.sh              # Conversion script
└── VIDEO_AUTOMATION_GUIDE.md             # This file
```

---

## ✅ Quality Checklist

Before uploading to social media:

### Video Quality ✅
- [ ] Resolution is 1080x1920 (vertical)
- [ ] Duration is 20-30 seconds
- [ ] Video is smooth (no lag)
- [ ] Actions are visible and clear
- [ ] UI elements are readable

### Content ✅
- [ ] Shows the intended feature
- [ ] Flows naturally
- [ ] No errors visible
- [ ] Loading states look good
- [ ] Text is readable

### Technical ✅
- [ ] Format is MP4
- [ ] File size < 50MB (ours are ~5MB)
- [ ] Audio track exists (even if silent)
- [ ] Compatible with Instagram/Facebook

---

## 🎬 Post-Production Workflow

### Recommended Workflow:

1. **Record Raw Videos**
   ```bash
   cd frontend
   ../record-demo-videos.sh
   ```

2. **Convert to MP4**
   ```bash
   cd ..
   ./convert-videos-to-mp4.sh
   ```

3. **Edit in CapCut/InShot** (Optional but recommended)
   - Import MP4 from `demo-videos/mp4/`
   - Add text overlays (see VIDEO_RECORDING_SCRIPT.md for text & timings)
   - Add background music (YouTube Audio Library)
   - Adjust speed if needed
   - Export as 1080x1920 MP4

4. **Upload to Social Media**
   - Use captions from VIDEO_RECORDING_SCRIPT.md
   - Add hashtags
   - Post at optimal times (7-9 AM, 5-7 PM)

---

## 💡 Pro Tips

### 1. Test Before Recording
```bash
# Run a quick test to ensure everything works
cd frontend
npm run dev

# In browser: http://localhost:5173
# Manually test the flows before automating
```

### 2. Record Multiple Takes
```bash
# Record multiple times and pick the best one
for i in {1..3}; do
  echo "Recording take $i..."
  ../record-demo-videos.sh
  mv demo-videos demo-videos-take-$i
done
```

### 3. Speed Up/Slow Down
Use video editing apps to adjust speed:
- **Slow down:** 0.8x for more detailed view
- **Speed up:** 1.2x to keep under time limit

### 4. Background Music
Add subtle background music in editing app:
- Keep volume low (don't overpower)
- Use upbeat, modern tracks
- Source from YouTube Audio Library (free)

---

## 📞 Need Help?

### Common Questions

**Q: Do I need a real phone?**  
A: No! Playwright simulates a mobile browser. Everything is automated.

**Q: Can I customize the demo?**  
A: Yes! Edit the `.spec.ts` files in `frontend/e2e/video-demos/`

**Q: Videos are too long, can I trim?**  
A: Yes, reduce wait times in the test files or trim in editing app.

**Q: Can I add my own actions?**  
A: Yes! Add more steps to the test files. See [Playwright docs](https://playwright.dev).

---

## 🎉 You're Ready!

Run these commands to create your videos:

```bash
cd /Users/mchand69/Documents/perundhu/frontend
../record-demo-videos.sh
```

Then convert to MP4:
```bash
cd ..
./convert-videos-to-mp4.sh
```

**Your social media-ready videos will be in:** `demo-videos/mp4/`

---

**Happy recording! 🎬**

*Last Updated: February 9, 2026*  
*For Perundhu Production Launch*
