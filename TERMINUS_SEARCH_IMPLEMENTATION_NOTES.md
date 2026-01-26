# Terminus/Stand Location Search - Implementation Status

## What Was Implemented

### Backend Location Normalization
✅ **COMPLETED**: Updated `findDuplicateLocationIds()` method in `BusScheduleServiceImpl.java` to:
- Normalize location names by removing terminus/stand suffixes (e.g., "Besant Nagar MTC Terminus" → "Besant Nagar")
- Support operators: MTC, TNSTC, SETC, KSRTC, KSDC, DTC
- Find all locations with the same base city name
- Search buses across all matching location variants

### Frontend Location Normalization
✅ **COMPLETED**: 
- `locationNormalizer.ts` - Utility functions for normalizing location names
- `TransitSearchForm.tsx` - Updated to use normalized location matching
- `locationAutocompleteService.ts` - Enhanced deduplication to recognize terminus variants

## Current Limitation: No Bus Data for Local Locations

### Root Cause
The database contains **only intercity routes** from major terminals:
- ✅ CHENNAI KALAIGNAR CBT → TRICHY KKBT (102 buses)
- ✅ SALEM → COIMBATORE (multiple buses)
- ❌ Besant Nagar → Vadapalani (0 buses - local MTC routes not loaded)
- ❌ Broadway → Thiruvanmiyur (0 buses - local MTC routes not loaded)

### Locations Affected (No Bus Data)
| Location | ID | Type | Bus Count |
|----------|----|----|-----------|
| Besant Nagar MTC Terminus | 613 | Terminus | 0 |
| Vadapalani Bus Terminus | 710 | Terminus | 0 |
| Vadapalani | 62410 | Local | 0 |
| Besant Nagar | 62388 | Local | 0 |
| Broadway Bus Terminus | 684 | Terminus | 0 |
| Thiruvanmiyur MTC Terminus | 718 | Terminus | 0 |

## How the Normalization Works

When user searches from "Besant Nagar MTC Terminus" (ID 613):

1. **Frontend**: Normalizes input to "Besant Nagar" for autocomplete matching
2. **Backend `findDuplicateLocationIds(613)`**:
   - Gets location: "Besant Nagar MTC Terminus"
   - Normalizes to: "Besant Nagar"
   - Finds all locations with normalized name "Besant Nagar":
     - ID 613: "Besant Nagar MTC Terminus"
     - ID 62388: "Besant Nagar"
   - Returns: [613, 62388]
3. **Search**: Attempts to find buses from these location IDs
   - Result: 0 buses (no routes loaded for either location)

## Solution: Load MTC Local Route Data

To fix this, we need to:

### Option 1: Load MTC Routes from mtc_bus_timings_merged.json
- File exists: `/Users/mchand69/Documents/perundhu/data/mtc_bus_timings_merged.json`
- Contains ~300+ MTC bus routes with stops
- Script needed to:
  - Parse the JSON file
  - Extract route information (origin → destination → stops)
  - Map locations to existing location IDs
  - Insert buses and stops into database

### Option 2: Fetch MTC Routes from Overpass API
- Use existing Overpass scripts to fetch MTC stop data
- Fetch from OpenStreetMap relations tagged with MTC routes

### Option 3: Manual Data Entry
- Manually add MTC routes for testing/demo purposes

## Backend Code Changes Made

### File: BusScheduleServiceImpl.java

**New Methods**:
```java
private List<Long> findDuplicateLocationIds(Long locationId)
private String normalizeLocationName(String locationName)
```

**Normalization Pattern**:
- Removes: "MTC Terminus", "Bus Stand", "Bus Terminus", "B.S", "BS"
- Removes: City qualifiers like "- CMBT" or "(Koyambedu)"
- Handles variations: "MTC Terminus", "TNSTC Bus Terminus", etc.

## Testing with Valid Data

To test the normalization without local route data, use these location IDs:

```bash
# Test with working routes (Chennai → Trichy)
curl 'http://localhost:8080/api/v1/bus-schedules/search?fromLocationId=62459&toLocationId=62850&page=0&size=5'

# Test with terminus locations (will return 0 until data is loaded)
curl 'http://localhost:8080/api/v1/bus-schedules/search?fromLocationId=613&toLocationId=62410&page=0&size=5'
```

## Next Steps

1. **Load MTC Route Data**: Parse `/Users/mchand69/Documents/perundhu/data/mtc_bus_timings_merged.json` and insert into database
2. **Map Locations**: Ensure terminus/local locations are properly linked to bus routes
3. **Test End-to-End**: Verify searching from Besant Nagar → Vadapalani returns buses
4. **UI Enhancement**: Show message when searching locations with no available buses

## Database Schema Notes

- `locations` table: Contains all locations (IDs: 1-26839+)
- `buses` table: Contains bus records with from_location_id and to_location_id
- `stops` table: Contains individual stops for each bus route
- Key constraint: Buses must have at least one stop at each endpoint to appear in search results
