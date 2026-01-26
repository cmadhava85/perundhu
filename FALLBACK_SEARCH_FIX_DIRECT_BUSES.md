# Fallback Search Fix - Direct Buses ✅

## Issue Identified
The fallback search mechanism was **only implemented in `findBusesPassingThroughLocations`** but was **missing in `findBusesBetweenLocations`**. This meant:

- ❌ Searching by location name for **direct buses** did NOT trigger fallback
- ✅ Searching by location name for **buses passing through** DID trigger fallback

## Root Cause
When users search by location **names** (not IDs), the flow goes:
1. `searchBusesAcrossStands()` 
2. `fallbackToLocationSearch()` 
3. `findBusesBetweenLocations()`

But `findBusesBetweenLocations()` didn't have fallback logic, so if the exact terminus had no direct buses, no results were shown.

## Solution Implemented

### Added Fallback to `findBusesBetweenLocations()`

**File**: [BusScheduleServiceImpl.java](BusScheduleServiceImpl.java#L128)

#### Method 1 (without language code):
```java
public List<BusDTO> findBusesBetweenLocations(Long fromLocationId, Long toLocationId) {
    List<Bus> buses = busRepository.findBusesBetweenLocations(fromId.value(), toId.value());
    
    // FALLBACK ADDED: If no buses found, try by location name
    if (buses.isEmpty()) {
        buses = findBusesBetweenLocationsByName(fromLocationId, toLocationId);
    }
    
    return sortBusesByCurrentTime(buses).stream().map(BusDTO::fromDomain).toList();
}
```

#### Method 2 (with language code):
```java
public List<BusDTO> findBusesBetweenLocations(Long fromLocationId, Long toLocationId, String languageCode) {
    List<Bus> buses = busRepository.findBusesBetweenLocations(fromId.value(), toId.value());
    
    // FALLBACK ADDED: If no buses found, try by location name
    if (buses.isEmpty()) {
        buses = findBusesBetweenLocationsByName(fromLocationId, toLocationId);
    }
    
    // Continue with language handling and sorting...
}
```

### New Private Method: `findBusesBetweenLocationsByName()`

**Location**: [BusScheduleServiceImpl.java](BusScheduleServiceImpl.java#L584)

This method:
1. Gets location names from the given IDs
2. Normalizes them (strips terminus/stand suffixes)
3. Finds all locations with matching normalized names
4. Searches for direct buses through all matching locations
5. Returns results or empty list

**Example Flow**:
```
User searches direct buses:
  From: "Besant Nagar MTC Terminus" (location_id=613, has NO direct buses)
  To: "Chennai"

Step 1: Primary search with IDs
  Query: buses from location 613 to location 1
  Result: Empty ❌

Step 2: Fallback triggers
  Normalize: "Besant Nagar MTC Terminus" → "Besant Nagar"
  Find all: All locations with normalized name = "Besant Nagar"
  Result: [613 (MTC Terminus), 614 (Different terminal at same city)]

Step 3: Search all matching combinations
  Query: buses from ANY of [613, 614] to location 1
  Result: Found buses at location 614! ✅
```

## Coverage Now Complete

| Method | Without Fallback | With Fallback |
|--------|------------------|---------------|
| `findBusesBetweenLocations()` | ❌ | ✅ **FIXED** |
| `findBusesBetweenLocations(lang)` | ❌ | ✅ **FIXED** |
| `findBusesPassingThroughLocations()` | ❌ | ✅ (Already existed) |
| `findBusesPassingThroughLocations(lang)` | ❌ | ✅ (Already existed) |

## Testing Scenarios

1. **Direct Bus Search with Fallback**
   - Search: Direct buses from "Besant Nagar MTC Terminus" to "Chennai"
   - Expected: Should find buses now ✅

2. **Passing Through Search with Fallback** 
   - Search: Buses from "Besant Nagar MTC Terminus" to "Chennai" (with intermediate stops)
   - Expected: Already working (was already implemented)

3. **Search by Location Name**
   - User enters: "Besant Nagar" (base city name)
   - Path: `searchBusesAcrossStands()` → `fallbackToLocationSearch()` → `findBusesBetweenLocations()`
   - Expected: Now has double fallback! ✅

## Logs Generated

When fallback is triggered, you'll see:
```
DEBUG: No direct buses found by location ID. Trying fallback search by location name...
INFO:  Fallback search (direct) by location name: 'Besant Nagar' → 'Chennai'
DEBUG: Fallback search (direct): found 2 from locations, 1 to locations
```

## Implementation Details

- **Added methods**: 1 new private method `findBusesBetweenLocationsByName()`
- **Modified methods**: 2 methods (`findBusesBetweenLocations` with and without language code)
- **Code duplication**: Minimal - reuses `normalizeLocationName()` from existing code
- **Performance**: Fallback only triggered when primary search returns empty
- **Logging**: Comprehensive debug logs for troubleshooting

## Files Modified

- [BusScheduleServiceImpl.java](BusScheduleServiceImpl.java)
  - Lines 128-150: Added fallback to `findBusesBetweenLocations()`
  - Lines 152-182: Added fallback to `findBusesBetweenLocations(lang)`
  - Lines 584-637: Added new `findBusesBetweenLocationsByName()` method

## Consistency Achieved

Now **all four search methods** have the fallback mechanism:
- ✅ Direct buses with ID → Direct buses by name
- ✅ Direct buses with ID + language → Direct buses by name + language
- ✅ Passing through with ID → Passing through by name
- ✅ Passing through with ID + language → Passing through by name + language

This ensures users get results regardless of whether they're searching by exact terminus or by base city name!

---

**Status**: ✅ Fixed and Ready for Testing
**Last Updated**: January 23, 2026
