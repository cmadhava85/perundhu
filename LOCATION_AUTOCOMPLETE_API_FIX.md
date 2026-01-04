# Location Autocomplete API Call Fix

## Problem
The location autocomplete API calls were not being triggered when typing in the location field, even when the query length was sufficient (e.g., "Trichy" - 6 characters).

## Root Cause
In the `getDebouncedSuggestions()` method in `locationAutocompleteService.ts`, the minimum query length check (< 2 characters) was happening AFTER the debounce timer was set up. This meant:

1. The debounce timer would start even for very short queries
2. There was no immediate feedback that the query was too short
3. The API request would be queued without showing that it's waiting for more characters

## Solution
Modified the `getDebouncedSuggestions()` method to:

1. **Check minimum query length IMMEDIATELY** before setting up the debounce timer
2. **Return empty results immediately** if query is less than 2 characters (without debounce delay)
3. **Add debug logging** to track when API calls are queued and executed
4. **Enhanced logging in the component** to show when API calls are being made

### Changes Made

#### File: `frontend/src/services/locationAutocompleteService.ts`
- Added early return for queries < 2 characters
- Added debug logging to track:
  - When queries are too short (immediate return)
  - When searches are queued for debouncing
  - When debounced searches actually execute
  - How many suggestions were returned

#### File: `frontend/src/components/contribution/AddStopsToRoute.tsx`
- Enhanced `fetchDynamicSuggestions` function with console logging to track:
  - Query length for each search
  - Type of search (from/to/stop)
  - Number of suggestions returned
  - Loading states

## How to Verify

### Browser DevTools
Open the browser's Developer Console (F12) and look for these logs when typing in location fields:

**For queries < 2 characters:**
```
⏭️ Query too short (1 chars) - skipping API call
```

**For valid queries (2+ characters):**
```
🔄 Debounced search queued for "Tri" (3 chars)
📡 Executing debounced search for "Tri" after 50ms delay
✅ Debounced search returned 5 suggestions
```

### Network Inspector
Open DevTools → Network tab and filter for API calls:
- Look for `/api/v1/bus-schedules/locations/autocomplete` calls
- These should appear when typing 2+ characters
- Watch the debounce delays: 50ms for ≤3 chars, 100ms for >3 chars

### Expected Behavior
When typing in location fields:
1. **1 character:** No API call, no loading indicator
2. **2 characters:** API call after 100ms debounce
3. **3 characters:** API call after 50ms debounce (faster)
4. **4+ characters:** API call after 100ms debounce with suggestions populated

## Debounce Delays
- **Queries ≤3 characters:** 50ms (instant suggestions)
- **Queries >3 characters:** 100ms (standard debounce)

This ensures fast responses for short queries while avoiding excessive API calls for longer queries during fast typing.
