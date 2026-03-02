# Location Dropdown - Database Only Fix

**Date:** February 27, 2026  
**Status:** ✅ COMPLETE

## Problem

Location dropdown was pulling data from:
1. Database (primary source)
2. OpenStreetMap/Nominatim API (fallback when database had insufficient results)

This caused unwanted external API calls and users couldn't type custom locations.

## Solution

Modified the system to:
✅ **Only search database** - removed all external API fallbacks  
✅ **Allow free-form text** - users can type ANY location without validation  
✅ **Suggestions optional** - users don't have to select from dropdown

## Changes Made

### 1. Backend: LocationController.java

**File:** `backend/app/src/main/java/com/perundhu/adapter/in/rest/LocationController.java`

**Endpoint:** `GET /v1/locations/autocomplete`

**Before:**
```java
if (!locations.isEmpty()) {
    // Return database results
    return ResponseEntity.ok(result);
}

// Fallback to OpenStreetMap if no database results
List<LocationDTO> osmResults = geocodingService.searchTamilNaduLocations(query.trim(), 10, language);
return ResponseEntity.ok(osmResults);
```

**After:**
```java
// Always return database results only
List<LocationDTO> result = locations.stream()
    .map(location -> LocationDTO.withTranslation(...))
    .toList();

log.info("Found {} locations in database for query '{}'", result.size(), query);
// Note: OpenStreetMap fallback disabled - only returning database results
// Users can still type their own locations in the frontend
return ResponseEntity.ok(result);
```

**Effect:** Endpoint now returns ONLY database results (can be empty list if no matches).

---

### 2. Frontend: api.ts

**File:** `frontend/src/services/api.ts`

**Function:** `searchLocations()`

**Before:**
```typescript
// First search database
const dbResults = response.data;

// If not enough results, try map API
if (dbResults.length >= limit) {
  return dbResults;
}

const mapResponse = await api.get('/v1/locations/search', {
  params: { 
    query,
    limit: limit - dbResults.length,
    source: 'map'  // External API call
  }
});

// Combine database + map results
const combinedResults = [...dbResults, ...mapResults].slice(0, limit);
return combinedResults;
```

**After:**
```typescript
// Search in database only - no external API calls
logger.debug(`searchLocations: Searching for "${query}" in database`);
const response = await api.get('/v1/locations/search', {
  params: { 
    query,
    limit
  }
});

const dbResults = response.data;
logger.debug(`searchLocations: Found ${dbResults.length} database results for "${query}"`);

return dbResults;  // Return database results only
```

**Effect:** Frontend no longer makes secondary map API calls.

---

### 3. Frontend: LocationInput.tsx

**File:** `frontend/src/components/search/LocationInput.tsx`

**Function:** `handleInputChange()`

**Before:**
```typescript
if (newValue.length >= 3) {
  onChange(null);  // Clear selection
  onSearch?.(newValue);  // Trigger search
}
```

**After:**
```typescript
if (newValue.length >= 3) {
  onSearch?.(newValue);  // Trigger search for suggestions
  // Create a free-form location object to allow search without selection
  onChange({
    id: 0,  // Free-form entry has no ID
    name: newValue,
    translatedName: null,
    state: null,
    district: null,
    nearbyCity: null,
    latitude: null,
    longitude: null
  });
}
```

**Effect:** User's typed text is immediately set as a valid location, even if not in dropdown.

---

### 4. Frontend: SmartSearchForm.tsx

**File:** `frontend/src/components/search/SmartSearchForm.tsx`

**Function:** `validateForm()`

**Before:**
```typescript
if (!fromLocation) {
  errors.from = 'Please select a departure location';
}

if (!toLocation) {
  errors.to = 'Please select a destination location';
}

if (fromLocation && toLocation && fromLocation.id === toLocation.id) {
  errors.locations = 'Departure and destination cannot be the same';
}
```

**After:**
```typescript
if (!fromLocation || !fromLocation.name) {
  errors.from = 'Please enter a departure location';
}

if (!toLocation || !toLocation.name) {
  errors.to = 'Please enter a destination location';
}

// Compare by name instead of ID (free-form entries have id=0)
if (fromLocation && toLocation && fromLocation.name.toLowerCase() === toLocation.name.toLowerCase()) {
  errors.locations = 'Departure and destination cannot be the same';
}
```

**Effect:** 
- Validation now checks for `name` instead of requiring a selected `id`
- Same-location check compares names (case-insensitive) instead of IDs
- Users can submit form with typed locations that aren't in the suggestion list

---

## User Experience Changes

### Before
1. User types "Chennai Airport"
2. System searches database → finds "Chennai" 
3. If no exact match, falls back to OpenStreetMap API
4. User MUST select from dropdown to proceed
5. Can't use custom location names

### After
1. User types "Chennai Airport"
2. System searches database → shows suggestions (if any)
3. User can either:
   - ✅ Select from suggestions (if available)
   - ✅ Keep typing and use exact text "Chennai Airport" 
   - ✅ Press Enter or Search with custom location
4. No validation required - any text is accepted
5. No external API calls made

## Deployment

### Testing Locally
```bash
# Backend
cd backend
./gradlew clean bootRun

# Frontend (new terminal)
cd frontend
npm run dev
```

### Deploy to Production
```bash
# Use your existing deployment script
bash deploy-production.sh
```

Or manually:
```bash
# Preprod
bash deploy-all-environments.sh

# Production only
bash deploy-production.sh
```

## Verification Steps

1. **Open the app** → Go to search page
2. **Type a location** → e.g., "My Custom Location 123"
3. **Verify:** No dropdown appears (because it's not in database)
4. **Click Search** → Form should accept it
5. **Check browser Network tab** → Should see:
   - ✅ `/v1/locations/autocomplete?q=My%20Custom`
   - ❌ NO OpenStreetMap/Nominatim calls
   - ❌ NO `source=map` API calls

6. **Type a known location** → e.g., "Chennai"
7. **Verify:** Dropdown appears with database results
8. **You can either:**
   - Select from dropdown, OR
   - Keep typing and use your custom text

## Notes

- Database search is **case-insensitive** and uses **partial matching** (LIKE '%query%')
- Empty results from database are OK - user can still proceed with typed text
- Free-form locations have `id: 0` - backend should handle this gracefully
- Existing database locations still work normally with valid IDs

## Rollback Plan

If issues occur, revert these 4 files:
```bash
git checkout main -- backend/app/src/main/java/com/perundhu/adapter/in/rest/LocationController.java
git checkout main -- frontend/src/services/api.ts
git checkout main -- frontend/src/components/search/LocationInput.tsx
git checkout main -- frontend/src/components/search/SmartSearchForm.tsx
```

## Related Files

Other endpoints still available but not used by autocomplete:
- `/v1/locations/search-comprehensive` - Still has OSM fallback (used elsewhere)
- `/v1/locations/search-neighborhoods` - Still has OSM (used elsewhere)

These can be cleaned up later if needed.
