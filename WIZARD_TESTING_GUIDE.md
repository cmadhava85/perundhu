# Stop Entry Wizard - Location Autocomplete Testing Guide

## What Was Fixed
✅ Added location autocomplete to the "Enter stop name" step in the wizard modal

## Test Scenario

### Step 1: Navigate to Add Stop Wizard
1. Open the Perundhu app
2. Search for a bus (e.g., Chennai to Madurai)
3. Click on a bus result to select it
4. The "Add Stops to Route" form loads
5. Click the **"+ Add Stop"** button
6. The wizard modal appears with "Enter stop name" screen

### Step 2: Open Browser Console
- Press **F12** (Windows/Linux) or **Cmd+Option+I** (Mac)
- Navigate to the **Console** tab
- Keep it open while typing

### Step 3: Test Typing Behavior

#### Test Case A: Single Character
**Action:** Type `C` in the "Enter stop name" field

**Expected Console Output:**
```
🔍 fetchDynamicSuggestions called for "C" (length: 1)
⏭️ Query too short (1 chars), clearing suggestions
```

**Expected UI:** 
- No loading spinner
- No dropdown
- No API call in Network tab

---

#### Test Case B: Two Characters
**Action:** Type `Ce` (full text now: "Ce")

**Expected Console Output:**
```
🔍 fetchDynamicSuggestions called for "Ce" (length: 2)
📡 Starting API call for "Ce"
⏳ Loading spinner appears
[After ~100ms debounce]
✅ Got X suggestions for "Ce"
```

**Expected UI:**
- Loading spinner (⏳) appears briefly
- Dropdown appears with suggestions below input
- Suggestions like "Central Metro Station", "Cenotaph", etc.

---

#### Test Case C: Three Characters (Faster!)
**Action:** Continue typing to `Cen` (full text: "Cen")

**Expected Console Output:**
```
🔍 fetchDynamicSuggestions called for "Cen" (length: 3)
📡 Starting API call for "Cen"
[After ~50ms debounce - faster!]
✅ Got X suggestions for "Cen"
```

**Expected UI:**
- Faster response (50ms vs 100ms for 2-char query)
- More refined suggestions (e.g., "Central Metro Station", "Cental Bus Terminal")

---

#### Test Case D: Full Name
**Action:** Type `Central Metro Station`

**Expected Console Output:**
```
🔍 fetchDynamicSuggestions called for "Central Metro Station" (length: 21)
📡 Starting API call for "Central Metro Station"
[After ~100ms debounce]
✅ Got X suggestions for "Central Metro Station"
```

**Expected UI:**
- Suggestions appear, including "Central Metro Station" if available
- Can click on suggestion to select it

---

### Step 4: Test Selection Methods

#### Method 1: Click Selection
1. Type `Trichy` in the field
2. Wait for suggestions to appear
3. **Click** on "Trichy" (or similar) in the dropdown
4. Verify the field is populated with selected location
5. Dropdown closes automatically

#### Method 2: Keyboard Selection
1. Type `Madurai` in the field
2. Press **Arrow Down** to highlight first suggestion
3. Continue pressing **Arrow Down** to navigate
4. Press **Enter** to select highlighted suggestion
5. Verify the field is populated
6. Dropdown closes automatically

#### Method 3: Clear & Retype
1. Type a location: `Chennai`
2. Delete all characters (backspace)
3. Type a new location: `Bangalore`
4. Verify suggestions update for new query

---

## Network Inspection

### To Verify API Calls:
1. Open DevTools **Network** tab
2. Filter for: `autocomplete` or `locations`
3. Type in the stop name field
4. Check that:
   - No requests appear for 1 character
   - Request appears after 2+ characters: 
     - **URL:** `/api/v1/bus-schedules/locations/autocomplete?q=Trichy`
     - **Method:** GET
     - **Status:** 200
     - **Response:** Array of location objects

### Expected Network Activity:
```
GET /api/v1/bus-schedules/locations/autocomplete?q=Ce
Status: 200
Response: [{id: 1, name: "Central Metro Station", ...}, ...]

GET /api/v1/bus-schedules/locations/autocomplete?q=Tri
Status: 200
Response: [{id: 5, name: "Trichy", ...}, ...]
```

---

## Console Log Reference

### When Typing Correctly:
```console
🔍 fetchDynamicSuggestions called for "Trichy" (length: 6)
📡 Starting API call for "Trichy"
✅ Got 8 suggestions for "Trichy"
```

### When Query Too Short:
```console
🔍 fetchDynamicSuggestions called for "T" (length: 1)
⏭️ Query too short (1 chars), clearing suggestions
```

### When API Returns No Results:
```console
🔍 fetchDynamicSuggestions called for "Nonexistent" (length: 11)
📡 Starting API call for "Nonexistent"
✅ Got 0 suggestions for "Nonexistent"
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Arrow Up/Down` | Navigate suggestions |
| `Enter` | Select highlighted suggestion |
| `Escape` | Close dropdown |
| `Tab` | Move to next field (closes dropdown) |

---

## Troubleshooting

### Issue: No suggestions appearing
**Check:**
- [ ] Are you typing 2+ characters?
- [ ] Check console for errors
- [ ] Check Network tab for API response
- [ ] Is the backend running?

### Issue: Suggestions not updating when typing
**Check:**
- [ ] Try refreshing the page
- [ ] Check if debounce is working (should see logs after ~50-100ms)
- [ ] Clear browser cache (Cmd+Shift+Delete)

### Issue: Dropdown position incorrect
**Check:**
- [ ] Scroll the page - dropdown should follow
- [ ] Resize window - dropdown should reposition
- [ ] Check browser DevTools is not covering input

### Issue: Selection not working
**Check:**
- [ ] Try clicking instead of keyboard
- [ ] Verify `onMouseDown` event fires in console
- [ ] Check that suggestion object is valid

---

## Validation Checklist

Use this checklist to verify everything works:

- [ ] 1 character: No API call
- [ ] 2 characters: API call triggered
- [ ] 3+ characters: Suggestions appear quickly (50ms)
- [ ] Dropdown appears below input field
- [ ] Can navigate with arrow keys
- [ ] Can select with Enter key
- [ ] Can click to select
- [ ] Selection updates input field
- [ ] Dropdown closes after selection
- [ ] Dropdown closes on Escape
- [ ] Dropdown closes on Tab
- [ ] Loading spinner appears while fetching
- [ ] Network requests show correct URL and response
- [ ] Console logs show correct sequence

---

## Expected Network Timing

| Query Length | Debounce Delay | Expected Response |
|--------------|----------------|-------------------|
| 1 char | N/A | No API call |
| 2 chars | 100ms | ~150-250ms |
| 3 chars | 50ms | ~100-200ms |
| 4+ chars | 100ms | ~150-250ms |

These timings include:
- Debounce wait
- Network request/response
- Browser processing
