# Location Autocomplete in Stop Entry Wizard - Fix

## Problem
The location autocomplete API calls were not happening in the "Add Stop" wizard modal (the step-by-step dialog that appears after selecting a bus). The text input for stop name was just a plain text field without autocomplete functionality.

## Root Cause
The `StopEntryWizard` component was using a simple text input field without any location autocomplete integration. Only the inline stop editing in the main form had autocomplete support.

## Solution
Added full location autocomplete support to the `StopEntryWizard` component's stop name input field:

### Changes Made

#### File: `frontend/src/components/contribution/StopEntryWizard.tsx`

**1. Added imports:**
- `useCallback`, `useRef` from React
- `createPortal` from React DOM
- `locationAutocompleteService` and `LocationSuggestion` type

**2. Added autocomplete state:**
```typescript
const [stopLocationQuery, setStopLocationQuery] = useState(formData.locationName);
const [dynamicStopSuggestions, setDynamicStopSuggestions] = useState<LocationSuggestion[]>([]);
const [showStopSuggestions, setShowStopSuggestions] = useState(false);
const [isLoadingStopSuggestions, setIsLoadingStopSuggestions] = useState(false);
const [highlightedIndex, setHighlightedIndex] = useState(-1);
const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
const stopInputRef = useRef<HTMLInputElement>(null);
const isSelectingRef = useRef(false);
```

**3. Added helper functions:**
- `fetchDynamicSuggestions()` - Fetches location suggestions using the debounced service
- `getLocationDisplayName()` - Returns display name based on current language
- `handleSelectStopLocation()` - Handles selection of a suggestion
- `useEffect` for updating dropdown position

**4. Enhanced the name input field:**
- Replaced simple `<input>` with autocomplete-enabled version
- Added suggestion dropdown using `createPortal`
- Added keyboard navigation (arrow keys, Enter, Escape)
- Added loading indicator while fetching suggestions
- Integrated with location autocomplete service

## How It Works

### When User Types in Stop Name Field:

1. **1 character:** No API call
   - Console: `⏭️ Query too short`

2. **2+ characters:** API call triggered
   - Console: `📡 Starting API call for "XXX"`
   - After debounce: `✅ Got N suggestions for "XXX"`
   - Dropdown appears with location suggestions

3. **Selection:** Click or press Enter to select a suggestion
   - The selected location name is populated in the field
   - Dropdown closes automatically

## Testing

### Test Steps:
1. Open the Perundhu app
2. Search for a bus route
3. Click on a bus to select it
4. Click "Add Stop" button
5. The wizard modal appears with "Enter stop name" step
6. Start typing a location name (e.g., "Central Metro")
7. Open browser console (F12)

### Expected Behavior:
- When typing **1 character**: No API call, no suggestions
- When typing **2+ characters**: 
  - Console shows: `🔍 fetchDynamicSuggestions called for "XXX" (length: N)`
  - Console shows: `📡 Starting API call for "XXX"`
  - Loading spinner appears (⏳)
  - After 50-100ms: `✅ Got X suggestions for "XXX"`
  - Dropdown appears with location suggestions
- Can navigate with arrow keys and select with Enter
- Can click on a suggestion to select it

## Network Verification
In DevTools → Network tab:
- Look for `/api/v1/bus-schedules/locations/autocomplete` requests
- They should appear when typing 2+ characters
- Response should contain array of location suggestions

## Files Modified
- `frontend/src/components/contribution/StopEntryWizard.tsx`

## Build Status
✅ Build successful - ready for testing

## Integration Points
The wizard now uses the same location autocomplete service as the main form:
- Same debounce behavior (50ms for ≤3 chars, 100ms for >3 chars)
- Same suggestion sources (database + OSM)
- Same language support (English/Tamil)
- Consistent UX across the application
