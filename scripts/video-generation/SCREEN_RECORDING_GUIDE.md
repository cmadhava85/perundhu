# Screen Recording Guide for Perundhu App Walkthrough

This guide will help you record your app screens for the promotional video.

## 🎯 What You Need to Record

6 separate screen recordings showing:

1. **App Launch** (5 seconds) - Logo, splash screen, home screen
2. **Search Page** (10 seconds) - Typing Chennai → Madurai, autocomplete
3. **Results Page** (13 seconds) - Bus list, filters, sorting
4. **Stops Detail** (12 seconds) - Bus details, stops timeline
5. **Contribution** (12 seconds) - Adding new bus information
6. **Call to Action** (8 seconds) - App overview, logo

---

## 📱 iOS Screen Recording (Recommended)

### Setup (One-time)
1. Open **Settings** → **Control Center**
2. Tap **Customize Controls**
3. Add **Screen Recording** (green + button)

### Recording Steps

1. **Open your app** and navigate to the starting screen
2. **Swipe down from top-right** to open Control Center
3. **Long-press the record button** (circle icon)
4. **Select "Perundhu"** from app list (to record audio too)
5. **Tap "Start Recording"** - wait for 3-second countdown
6. **Perform the actions** listed below for each scene
7. **Swipe down** and **tap the red status bar** to stop
8. **Video automatically saved to Photos app**

### Example: Scene 2 (Search Page)

```
Action Timeline:
0:00 - Start on home screen
0:01 - Tap "From Location" field
0:02 - Type "Chennai" (show autocomplete dropdown)
0:04 - Select "Chennai" from list
0:05 - Tap "To Location" field
0:06 - Type "Madurai" (show autocomplete)
0:08 - Select "Madurai"
0:09 - Tap "Search Buses" button
0:10 - End (transition to results)
```

---

## 🤖 Android Screen Recording

### Built-in Screen Recorder (Android 11+)

1. **Swipe down** notification panel twice
2. **Tap "Screen record"** icon
3. **Select audio** → "Device audio" or "Microphone"
4. **Tap "Start"**
5. **Perform actions** for the scene
6. **Swipe down** and **tap "Stop"**
7. **Video saved to Gallery**

### Using AZ Screen Recorder (Alternative)

1. **Install AZ Screen Recorder** from Play Store
2. **Open app** and grant permissions
3. **Tap floating record button**
4. **Select "Record"**
5. **Perform actions**
6. **Tap floating stop button**
7. **Video saved to Gallery → AZ Screen Recorder folder**

---

## 💻 Desktop Recording (iOS Simulator / Android Emulator)

### iOS Simulator (macOS)

```bash
# Start simulator
open -a Simulator

# Start your app in simulator
# Then in terminal:

# Start recording
xcrun simctl io booted recordVideo --codec=h264 scene2_search.mov

# Perform actions in simulator
# Press Ctrl+C in terminal to stop recording

# Video saved to current directory
```

### Android Emulator

```bash
# Start emulator with your app
# Then in terminal:

# Start recording (max 180 seconds)
adb shell screenrecord /sdcard/scene2_search.mp4

# Perform actions in emulator
# Press Ctrl+C in terminal to stop

# Pull video to computer
adb pull /sdcard/scene2_search.mp4 ./scene2_search.mp4
```

---

## 📋 Scene-by-Scene Recording Checklist

### Scene 1: App Launch (5 seconds)

**What to show:**
- [ ] Initial splash screen with Perundhu logo
- [ ] Smooth transition to home screen
- [ ] Home screen with search inputs visible

**Recording tips:**
- Close and reopen app for fresh start
- Hold steady for logo to be visible
- End on homepage

---

### Scene 2: Search Page (10 seconds)

**What to show:**
- [ ] Tap "From Location" field
- [ ] Type "Chennai" with autocomplete appearing
- [ ] Select "Chennai" from dropdown
- [ ] Tap "To Location" field
- [ ] Type "Madurai" with autocomplete
- [ ] Select "Madurai"
- [ ] Tap "Search Buses" button
- [ ] Loading indicator (if any)

**Recording tips:**
- Type slowly so autocomplete is visible
- Wait 1 second after each selection
- Ensure keyboard is visible during typing

---

### Scene 3: Search Results (13 seconds)

**What to show:**
- [ ] Results loading → display full bus list
- [ ] Scroll through 3-4 buses
- [ ] Show quick stats bar (if visible)
- [ ] Tap "Morning" filter button
- [ ] Results update to filtered list
- [ ] Tap "Shortest Duration" sort button
- [ ] Results re-sort
- [ ] Scroll through filtered results

**Recording tips:**
- Scroll smoothly, not too fast
- Pause briefly on each filter/sort action
- Show at least 3-4 different bus cards

---

### Scene 4: Bus Stops Detail (12 seconds)

**What to show:**
- [ ] Tap on a specific bus card
- [ ] Bus detail modal/page opens
- [ ] Show bus number, type, timing clearly
- [ ] Scroll through stops timeline
- [ ] Highlight departure and arrival stops
- [ ] Show intermediate stops with timings
- [ ] Optional: show connecting routes

**Recording tips:**
- Choose a bus with 5-7 stops
- Scroll slowly through stops
- Ensure all stop names and times are visible

---

### Scene 5: Contribution Page (12 seconds)

**What to show:**
- [ ] Navigate to Contribute section (button/menu)
- [ ] Contribution form opens
- [ ] Fill "From Location" (e.g., Chennai)
- [ ] Fill "To Location" (e.g., Salem)
- [ ] Fill "Bus Number" (e.g., 123)
- [ ] Select "Departure Time" (time picker)
- [ ] Select "Bus Type" (Express/Deluxe)
- [ ] Tap "Submit" button
- [ ] Show success message/confirmation

**Recording tips:**
- Don't actually submit (use test data)
- Show form validation if any
- Ensure all fields are clearly visible

---

### Scene 6: Call to Action (8 seconds)

**What to show:**
- [ ] Return to home screen
- [ ] Show full interface with all menu options
- [ ] Quick pan/scroll showing key features
- [ ] Zoom to app logo or branding
- [ ] End on clean home screen

**Recording tips:**
- Smooth transitions
- Hold final frame for 2 seconds
- Clean, uncluttered view

---

## 🎬 Post-Recording Steps

### 1. Export Videos from Phone

**iOS:**
1. Open **Photos** app
2. Select the **6 recorded videos**
3. Tap **Share** → **AirDrop** to Mac
4. OR use **iCloud Photos** to sync

**Android:**
1. Open **Gallery** or **Files** app
2. Select the **6 videos**
3. Share via **Google Drive**, **Email**, or **USB transfer**

### 2. Trim Videos (Optional)

Use QuickTime (Mac) or any video editor:
1. Open video
2. Edit → Trim
3. Set exact start/end points
4. Save trimmed version

### 3. Rename Files

Rename to match expected names:
```
scene1_launch.mp4      (5 seconds)
scene2_search.mp4      (10 seconds)
scene3_results.mp4     (13 seconds)
scene4_stops.mp4       (12 seconds)
scene5_contribute.mp4  (12 seconds)
scene6_cta.mp4         (8 seconds)
```

### 4. Move to Assets Folder

```bash
# From your downloads/videos folder
mv scene1_launch.mp4 ~/Documents/project/perundhu/scripts/video-generation/assets/screens/
mv scene2_search.mp4 ~/Documents/project/perundhu/scripts/video-generation/assets/screens/
mv scene3_results.mp4 ~/Documents/project/perundhu/scripts/video-generation/assets/screens/
mv scene4_stops.mp4 ~/Documents/project/perundhu/scripts/video-generation/assets/screens/
mv scene5_contribute.mp4 ~/Documents/project/perundhu/scripts/video-generation/assets/screens/
mv scene6_cta.mp4 ~/Documents/project/perundhu/scripts/video-generation/assets/screens/
```

### 5. Generate Final Video

```bash
cd ~/Documents/project/perundhu/scripts/video-generation

# Generate voice-overs (if not done already)
source venv/bin/activate
python generate_voiceover_v2.py

# Create final video with your screen recordings
python create_video_v2.py
```

---

## ✅ Quality Checklist

Before recording:
- [ ] **Phone in Do Not Disturb** (no notifications)
- [ ] **Clear app cache/data** (fresh state)
- [ ] **Clean up UI** (no debug info, test data visible)
- [ ] **Good lighting** (screen clearly visible if filming phone)
- [ ] **Stable setup** (use phone stand or steady hands)
- [ ] **Practice run** (do a dry run first)

During recording:
- [ ] **Smooth transitions** (no jerky movements)
- [ ] **Proper timing** (not too fast, not too slow)
- [ ] **Clear text** (all labels, buttons readable)
- [ ] **No personal data** (use sample data only)

After recording:
- [ ] **Check all 6 videos** play correctly
- [ ] **Verify durations** match requirements
- [ ] **Ensure audio is clear** (if included)
- [ ] **Test on mobile device** (how it will look to viewers)

---

## 🆘 Troubleshooting

### "Screen recording not working"
- Restart device
- Check storage space (need at least 1GB free)
- Update iOS/Android to latest version

### "Video is sideways/wrong orientation"
- Always record in portrait mode (vertical)
- Use video editing tool to rotate if needed

### "File size too large"
- Compress video using HandBrake or similar
- Target: 1080x1920 resolution, H.264 codec
- Lower bitrate if needed (5000k is good)

### "Can't transfer videos to computer"
- Use cloud storage (Google Drive, Dropbox)
- Try different USB cable
- Check file permissions

---

## 🎉 Tips for Best Results

1. **Record multiple takes** - Choose the best one
2. **Use consistent timing** - Match the script durations
3. **Show real data** - Makes it authentic
4. **Add variety** - Different bus routes, times
5. **Test on mobile first** - This is your target platform

---

## 🚀 Quick Start (5 Minutes)

**Fastest way to get started:**

1. Open app on your phone
2. Enable screen recording
3. Record ONE complete walkthrough (60 seconds):
   - Launch app → Search → View results → Check stops → Try contribute → Back to home
4. Transfer video to computer
5. Use video editor to split into 6 scenes
6. Save as scene1.mp4, scene2.mp4, etc.
7. Run `python create_video_v2.py`

You'll have a complete 60-second promo video with Tamil voice-over!
