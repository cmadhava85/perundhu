# 📱 Mobile Testing Checklist for Perundhu App

## 🚀 Quick Start Guide

### Step 1: Open Browser Developer Tools
1. **Open** http://localhost:3000 in Chrome, Firefox, or Safari
2. **Press F12** (or Cmd+Option+I on Mac) to open Developer Tools
3. **Click the mobile device icon** 📱 to enable responsive mode
4. **Set viewport to iPhone SE**: 375 x 667 pixels

### Step 2: Test Homepage
- [ ] **Header is visible** and properly sized
- [ ] **From/To inputs** are fully visible and tappable
- [ ] **Search button** is accessible (at least 44px touch target)
- [ ] **Language switcher** is visible
- [ ] **No horizontal scrolling** required

### Step 3: Test Search Functionality
1. **Fill "From" field** with "Chennai"
2. **Fill "To" field** with "Coimbatore" 
3. **Tap "Find Buses"** button
4. **Wait for results** to load

### Step 4: Test Bus Results Page
- [ ] **"Available Buses" title** shows complete text (with 's')
- [ ] **Bus count badge** is visible
- [ ] **All sort buttons visible**: Departure ✓ Arrival ✓ Duration ✓ **Price ✓**
- [ ] **Sort controls** scroll horizontally if needed
- [ ] **Search input** is accessible for filtering
- [ ] **Filter toggle** button is visible and tappable
- [ ] **Bus items** display properly

### Step 5: Test Bus Item Layout (Critical!)
- [ ] **Bus information** displays on **single horizontal line**
- [ ] **Bus icons/images** are fully displayed (not cut off)
- [ ] **Info items** (fare, capacity, rating, etc.) don't wrap to multiple lines
- [ ] **Tap functionality** works on bus items
- [ ] **Expansion** shows route details when tapped

## 🐛 Critical Fixes to Verify

### 1. "Available Buses" Text Issue ✅
- **Before**: "Available Buse" (missing 's')
- **After**: "Available Buses" (complete text)
- **Check**: Title element shows full text

### 2. Bus Image Cut-off Issue ✅
- **Before**: Bus icons were partially hidden
- **After**: Full icon/image visible
- **Check**: All bus visual elements fully displayed

### 3. Hidden Price Sort Button ✅
- **Before**: Price button was hidden on mobile
- **After**: All sort buttons accessible
- **Check**: Price button visible and tappable

### 4. Multi-line Information Display ✅
- **Before**: Bus info wrapped to multiple lines
- **After**: All info on single horizontal line
- **Check**: Horizontal scrolling for overflow

## 🔧 Browser Developer Tools Testing

### Run This in Console (F12 > Console):
```javascript
// Copy the contents of mobile-test-console.js and paste in console
// Or visit http://localhost:3000 and paste the script

// This will automatically:
// 1. Check all mobile elements
// 2. Verify layout alignment
// 3. Test for overflow issues
// 4. Provide detailed results
```

### Manual Console Commands:
```javascript
// Check mobile layout
runMobileCheck()

// Simulate search (if on homepage)
simulateSearch()

// Check viewport size
console.log(`Viewport: ${window.innerWidth}x${window.innerHeight}`)

// Check for horizontal overflow
console.log(`Body width: ${document.body.scrollWidth}px`)
```

## 📏 Multiple Device Testing

### Test These Viewports:
1. **iPhone SE**: 375 x 667 (Portrait)
2. **iPhone SE**: 667 x 375 (Landscape)  
3. **iPhone 12**: 390 x 844
4. **Samsung Galaxy S20**: 360 x 800
5. **iPad**: 768 x 1024

### For Each Device:
- [ ] **Homepage** loads correctly
- [ ] **Search** functionality works
- [ ] **Results page** displays properly
- [ ] **No horizontal scrolling** unless intended
- [ ] **Touch targets** are appropriately sized
- [ ] **Text is readable** at device resolution

## 📸 Screenshots to Take

### Recommended Screenshots:
1. **Homepage - Mobile Portrait** (375x667)
2. **Search Results - Mobile Portrait** (375x667)
3. **Expanded Bus Item - Mobile** (with route details)
4. **Homepage - Mobile Landscape** (667x375)
5. **Search Results - iPad** (768x1024)

### How to Take Screenshots:
- **Chrome**: Right-click > "Capture screenshot" in DevTools
- **Firefox**: DevTools > Settings > "Take a screenshot"
- **Safari**: Develop > "Capture Screenshot"

## ⚠️ Common Issues to Check

### Layout Issues:
- [ ] **Text overflow** or truncation
- [ ] **Elements extending** beyond screen width
- [ ] **Touch targets too small** (< 44px)
- [ ] **Overlapping elements**
- [ ] **Poor contrast** on mobile screens

### Functionality Issues:
- [ ] **Buttons not responding** to touch
- [ ] **Forms difficult to fill** on mobile
- [ ] **Scrolling not smooth**
- [ ] **Loading states** not visible
- [ ] **Error messages** not displayed properly

### Performance Issues:
- [ ] **Slow loading** on mobile network
- [ ] **Large images** not optimized
- [ ] **JavaScript errors** in console
- [ ] **Memory usage** excessive

## ✅ Success Criteria

### Homepage Success:
- ✅ All elements visible and accessible
- ✅ Search form easy to use on mobile
- ✅ No horizontal scrolling required
- ✅ Loading time < 3 seconds

### Results Page Success:
- ✅ "Available Buses" text complete
- ✅ All sort buttons accessible
- ✅ Bus items display in single-line format
- ✅ Images/icons fully visible
- ✅ Tap interactions work smoothly

### Overall Success:
- ✅ 100% mobile viewport coverage
- ✅ All critical user journeys functional
- ✅ Touch-friendly interface
- ✅ Fast performance on mobile

## 🚨 If Issues Found

### Report Format:
```
Issue: [Brief description]
Device: [e.g., iPhone SE 375x667]
Browser: [e.g., Chrome mobile]
Steps: [How to reproduce]
Expected: [What should happen]
Actual: [What actually happens]
Screenshot: [If applicable]
```

### Quick Fixes:
1. **Check CSS**: Look for missing mobile media queries
2. **Verify viewport**: Ensure proper viewport meta tag
3. **Test touch targets**: Increase size if needed
4. **Check overflow**: Add proper scrolling behavior
5. **Validate HTML**: Ensure semantic structure

## 🎯 Final Checklist

Before declaring mobile testing complete:

- [ ] **All viewports tested** (Portrait + Landscape)
- [ ] **All browsers tested** (Chrome, Firefox, Safari)
- [ ] **All user journeys work** (Search → Results → Details)
- [ ] **All critical fixes verified** (Text, Images, Buttons, Layout)
- [ ] **Performance acceptable** (< 3s load time)
- [ ] **No console errors** in any browser
- [ ] **Screenshots captured** for documentation
- [ ] **Issues documented** with reproduction steps

---

## 🔗 Quick Links

- **App URL**: http://localhost:3000
- **DevTools**: F12 or Cmd+Option+I
- **Mobile Test Script**: `mobile-test-console.js`
- **CSS Overrides**: `src/styles/MobileOverrides.css`

**Happy Mobile Testing!** 🚀📱