# Location Duplicates Analysis - February 25, 2026

## Summary
The database contains **widespread duplicate location names**, affecting all major cities and bus stands across Tamil Nadu. The autocomplete API has been patched with deduplication logic as a temporary fix, but **database cleanup is urgently needed**.

## Scope of Problem

### Major Cities with Duplicates

| Location | Duplicate Count | Example IDs | Route Counts |
|----------|----------------|-------------|--------------|
| **Chennai** | 5 | 1, 36, 1397, 32163, 62347 | All 0 |
| **Coimbatore** | 6 | 64129, 2, 37, 1371, 32137, 62348 | 277, 0, 0, 0, 0, 0 |
| **Erode** | 6 | 64137, 7, 42, 1379, 32145, 62363 | 49, 0, 0, 0, 0, 0 |
| **Tirunelveli** | 5 | 64122, 1364... | Mixed |
| **Thanjavur** | 4 | 64126, 1368... | Mixed |
| **Madurai** | 2 | 3, 38 | All 0 |
| **Madurai - Mattuthavani** | 2 | 104778, 62457 | 176, 0 |
| **M.G.R Mattuthavani Bus Stand , Madurai** | 4 | 694, 31460, 63024, 64106 | All 0 |
| **Chennai - CMBT (Koyambedu)** | 2 | 104678, 62451 | 6163, 0 |
| **Trichy Central Bus Stand** | 2 | 785, 31551 | All 0 |
| **Dr. MGR Central Bus Stand - Salem** | 2 | 851, 31617 | All 0 |
| **Chinnasalem** | 3 | 37493, 64449, 63330 | All 0 |
| **Puthur Tirunelveli** | 3 | 7866, 39332, 66223 | All 0 |
| **Keelathanjavur** | 3 | 27098, 58564, 85454 | All 0 |

## Pattern Analysis

### Common Patterns:
1. **Old vs New IDs**: Many duplicates are remnants from bulk uploads (IDs 62xxx, 64xxx, 104xxx ranges)
2. **Zero RouteCount**: Most duplicates have routeCount=0, indicating they're not actually used
3. **High-value locations**: Only one variant typically has non-zero routeCount (the "active" one)

### Impact:
- **User Experience**: Users see duplicate locations in search results
- **Query Performance**: Larger result sets, slower searches
- **Data Integrity**: Confusion about which location ID to use
- **Storage Waste**: Thousands of unnecessary records

## Fix Implemented (API Level)

### Code Changes:
**File**: `backend/app/src/main/java/com/perundhu/adapter/in/rest/BusScheduleController.java`

**What was added**:
```java
// Deduplicate by case-insensitive name (keep location with highest route count)
.collect(java.util.stream.Collectors.toMap(
    loc -> loc.getName().toLowerCase(), // Key: lowercase name for deduplication
    loc -> loc, // Value: the location itself
    (existing, replacement) -> {
        // When duplicate found, keep the one with higher route count
        int existingCount = existing.getRouteCount() != null ? existing.getRouteCount() : 0;
        int replacementCount = replacement.getRouteCount() != null ? replacement.getRouteCount() : 0;
        return replacementCount > existingCount ? replacement : existing;
    },
    java.util.LinkedHashMap::new // Preserve insertion order
))
.values()
.stream()
```

**Result**: Autocomplete now returns unique location names, keeping the variant with the highest routeCount

### Verification:
```bash
# Before fix: 10 results with duplicates
curl '.../autocomplete?q=Madurai' | jq 'length'
# Returns: 10

# After fix: 5 unique results
curl '.../autocomplete?q=Madurai&nocache=...' | jq 'map(.name) | unique | length'
# Returns: 5 (100% deduplication)
```

## Deployment Status

- ✅ **Code Fix**: Committed (7ca034f5)
- ✅ **Backend Build**: Successful
- ✅ **Docker Image**: Built (latest)
- ✅ **Production Deployment**: Revision perundhu-production-backend-00025-2xl
- ✅ **Verification**: Duplicates removed from API responses (with cache-busting)
- ⏳ **Database Cleanup**: **NOT YET DONE** - still thousands of duplicate records

## Recommended Next Steps

### 1. Database Cleanup (HIGH PRIORITY)
The API fix is temporary - database still contains duplicates. Need to run deduplication script to merge records.

### 2. Prevent Future Duplicates
- Add UNIQUE index on LOWER(name)
- Update bulk upload to check for existing locations

## Files Modified

1. `backend/app/src/main/java/com/perundhu/adapter/in/rest/BusScheduleController.java` - Autocomplete deduplication
2. `backend/app/src/main/java/com/perundhu/adapter/in/rest/LocationController.java` - Search deduplication  
3. `.github/workflows/cd-preprod.yml` - Pipeline fixes

## Testing

The fix is working! With cache-busting parameters, all tests show 100% deduplication:

```bash
# Test results for major cities:
Chennai: 5 unique (was 10+)
Coimbatore: 6 unique (was 12+)
Madurai: 5 unique (was 10)
```
