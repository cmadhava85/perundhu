# Mobile Device Emulation for Video Generation

## Current Setup

**What We Used:**
- **Device:** Android Mobile (custom viewport)
- **Resolution:** 360x800 pixels
- **User-Agent:** `Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36`
- **Method:** Manual viewport + user-agent setting

## Chrome DevTools Equivalent

Yes! Playwright has **built-in device profiles** just like Chrome DevTools:

### Popular Android Devices

| Device | Resolution | Notes |
|--------|-----------|-------|
| **Pixel 5** | 393x851 | Android flagship |
| **Pixel 4** | 353x745 | Compact Android |
| **Galaxy S9+** | 320x658 | Samsung large screen |
| **Galaxy S8** | 360x740 | Standard Android size |
| **Galaxy Note 20** | 412x915 | Large Android |

### Popular iPhone Devices

| Device | Resolution | Notes |
|--------|-----------|-------|
| **iPhone 12** | 390x844 | Modern iPhone |
| **iPhone 12 Pro** | 390x844 | Premium iPhone |
| **iPhone 11** | 414x896 | Large iPhone |
| **iPhone SE** | 375x667 | Small iPhone |
| **iPhone XR** | 414x896 | Popular iPhone |

## Video Output Resolution

The **final video** is always rendered at:
- **1080x1920** (9:16 aspect ratio)
- Perfect for Instagram Reels, YouTube Shorts, TikTok
- Mobile screenshots are scaled up to fit this resolution

## How Device Emulation Works

When you select a device (e.g., "Pixel 5"), Playwright sets:

1. **Viewport Size** - The screen dimensions
2. **User-Agent** - Browser identification string
3. **Device Scale Factor** - Pixel density (Retina display support)
4. **Touch Support** - Enables touch events
5. **Mobile Flag** - Tells websites this is a mobile device

This triggers the **same responsive layouts** you see in Chrome DevTools Device Mode.

## Using Different Devices

### With Playwright Script (when installed):

```bash
# Default: Pixel 5
python capture_android_screenshots.py

# Use iPhone 12
python capture_android_screenshots.py "iPhone 12"

# Use Galaxy S8
python capture_android_screenshots.py "Galaxy S8"
```

### With Browser Tools (current method):

```javascript
// Set viewport
await page.setViewportSize({ width: 360, height: 800 });

// Set mobile user-agent
await page.setExtraHTTPHeaders({
  'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5)...'
});
```

## Why We Used 360x800

- **Standard Android size** - Most Android phones are around 360-411px wide
- **Good coverage** - Triggers mobile layouts on most websites
- **Not too small** - Avoids ultra-compact layouts
- **Common breakpoint** - Many sites have responsive breakpoints at 360px

## Recommendation

For **Perundhu video**, stick with **360x800 or Pixel 5 (393x851)**:
- ✅ Shows mobile UI clearly
- ✅ Buttons and text are readable
- ✅ Represents majority of Android users
- ✅ Works well when scaled to 1080x1920 for video

## Files Affected

1. **Screenshots:** `assets/screens/scene*.png` (360x800)
2. **Video Segments:** `output/segment_*.mp4` (1080x1920)
3. **Final Video:** `output/perundhu_promo_final.mp4` (1080x1920)

## Technical Details

### Current Implementation:
```javascript
// What runs in browser
page.setViewportSize({ width: 360, height: 800 })
page.setExtraHTTPHeaders({
  'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5)...'
})
```

### Chrome DevTools Equivalent:
1. Open DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select "Pixel 5" or "Responsive"
4. Set dimensions to 360x800

### Playwright Equivalent (when package works):
```python
device = playwright.devices['Pixel 5']
context = browser.new_context(**device)
# Automatically sets:
# - viewport: 393x851
# - user_agent: Android Chrome mobile
# - device_scale_factor: 2.75
# - has_touch: true
# - is_mobile: true
```

## Summary

**Question:** Does the script have option to switch to mobile?
**Answer:** YES! Playwright has built-in device emulation like Chrome DevTools.

**Current Resolution:** 360x800 (custom Android size)
**Available Devices:** 20+ profiles (Pixel, Galaxy, iPhone, iPad)
**Usage:** Select device name when running script

The current video uses **proper mobile emulation** with Android user-agent and 360x800 viewport! 📱
