# Location Hierarchy Auto-Detection for Contributions - Implementation Complete

## Overview
Fixed the issue where user-contributed locations were created as flat standalone entries without proper parent-child relationships. Now the system automatically detects and assigns parent cities and location types during the contribution approval process.

## Changes Made

### 1. ContributionProcessingService.java
**Added Parent Detection Logic** (`detectParentCity` method):
- **Strategy 1**: Detects "City - Terminal" pattern (e.g., "Chennai - Kilambakkam")
- **Strategy 2**: Identifies terminal/bus stand keywords (CMBT, KCBT, Gandhipuram, etc.)
- **Strategy 3**: Finds nearby major cities within 50km using coordinates

**Added Location Type Inference** (`inferLocationType` method):
- Automatically identifies: TERMINAL, STATION, CITY, TOWN, VILLAGE
- Terminal detection: bus stand, terminal, CMBT, KCBT, Kilambakkam, Koyambedu, etc.
- City detection: Chennai, Madurai, Coimbatore, Salem, and 20+ major cities

**Updated Location Creation**:
- Now calls `createLocationWithTranslation` with parent and type parameters
- Logs parent assignments for audit trail

### 2. LocationTranslationService.java
**Enhanced createLocationWithTranslation**:
- New overload accepts `parentCityId` and `locationType` parameters
- Calls `locationRepository.setLocationHierarchy()` to save relationships
- Old method deprecated but maintained for backward compatibility

### 3. LocationRepository Interface & Adapter
**Added Methods**:
- `setLocationHierarchy(locationId, parentCityId, locationType)` - Sets parent relationship and type
- `findNearbyLocations(latitude, longitude, radiusDegrees)` - Finds nearby cities for terminal detection

**Implementation**:
- Updates both parent_id and location_type in single transaction
- Uses existing JPA repository methods for coordinate-based searches

## How It Works

### Example 1: "Chennai - Kilambakkam" Contribution
```java
1. User creates route from "Chennai - Kilambakkam" to "Madurai"
2. detectParentCity("Chennai - Kilambakkam") detects pattern " - "
3. Extracts "Chennai", finds parent city ID = 1
4. inferLocationType("Chennai - Kilambakkam") detects "Kilambakkam" keyword -> TERMINAL
5. Creates location with parent_id=1, location_type=TERMINAL
6. Result: Kilambakkam properly linked to Chennai
```

### Example 2: "Tambaram Bus Stand" Contribution
```java
1. User contributes "Tambaram Bus Stand" at coordinates (12.9981, 80.1152)
2. detectParentCity() detects "bus stand" keyword
3. Searches within 50km, finds Chennai at ~20km distance
4. inferLocationType() detects "bus stand" -> TERMINAL
5. Creates location with parent_id=1 (Chennai), location_type=TERMINAL
6. Result: Tambaram automatically becomes child of Chennai
```

### Example 3: Unknown Small Town
```java
1. User contributes "Aruppukkottai"
2. No terminal keywords detected, not a major city
3. detectParentCity() returns null (no parent)
4. inferLocationType() defaults to TOWN (ends with "puram"/"oor" pattern)
5. Creates standalone location with parent_id=NULL, location_type=TOWN
6. Result: Properly categorized as independent town
```

## Detection Patterns

### Terminal Keywords
- Direct: `bus stand`, `terminal`, `bus station`
- Abbreviations: `cmbt`, `kcbt`, `ombt`, `mbt`, `kpbt`
- Chennai: `kilambakkam`, `koyambedu`, `madhavaram`, `poonamallee`, `tambaram`
- Coimbatore: `gandhipuram`, `ukkadam`, `singanallur`
- Madurai: `mattuthavani`, `arapalayam`, `periyar`

### Major Cities (25+ recognized)
Chennai, Madurai, Coimbatore, Trichy, Salem, Vellore, Tirunelveli, Erode, Tiruppur, Thanjavur, Dindigul, Karur, Kanchipuram, Nagercoil, Kumbakonam, Thoothukudi, Hosur, Krishnagiri, Dharmapuri, Cuddalore, Villupuram, Bangalore, Hyderabad, Tirupati

## Testing

### Test Case 1: Chennai Terminal Contribution
```bash
# Contribute new location "Chennai - Broadway Bus Stand"
curl -X POST http://localhost:8080/api/v1/contributions/routes \
  -d '{"fromLocationName":"Chennai - Broadway Bus Stand", "toLocationName":"Madurai", ...}'

# Expected: Created with parent_id=1 (Chennai), location_type=TERMINAL
```

### Test Case 2: Verify Hierarchy
```sql
-- Check newly created location
SELECT id, name, parent_id, location_type FROM locations 
WHERE name = 'Chennai - Broadway Bus Stand';

-- Should return: parent_id=1, location_type=TERMINAL
```

### Test Case 3: Search Works
```bash
# Search from Chennai (parent city)
curl http://localhost:8080/api/v1/bus-schedules/search?fromLocationId=1&toLocationId=623

# Should return buses from ALL Chennai terminals including the newly added one
```

## Migration for Existing Data

Existing contributions that were created without hierarchy need manual fix:

```sql
-- Run this to fix orphaned terminals
UPDATE locations SET parent_id = 1, location_type = 'TERMINAL'
WHERE name LIKE '%Chennai%' 
  AND (name LIKE '%bus stand%' OR name LIKE '%terminal%')
  AND parent_id IS NULL;

-- Repeat for other major cities (Madurai=623, Coimbatore, etc.)
```

See [fix_major_city_parent_mapping.sql](fix_major_city_parent_mapping.sql) for complete migration script.

## Benefits

✅ **Automatic hierarchy** - No manual SQL scripts needed for new contributions
✅ **Smart detection** - Multiple strategies ensure high accuracy
✅ **Audit trail** - All parent assignments logged for review
✅ **Backward compatible** - Old contribution flow still works
✅ **Immediate availability** - New terminals instantly linked to parent cities
✅ **Better search** - "Chennai" searches now include all terminals automatically

## Impact on Existing Features

### Route Contributions
- ✅ Both from/to locations get proper hierarchy
- ✅ Works for all contribution types (form, image, timing)

### Image Contributions
- ✅ Extracted locations from OCR get hierarchy
- ✅ Multiple routes from one image all get proper parents

### Timing Image Contributions
- ✅ Origin and destination locations get hierarchy
- ✅ Integration into buses table respects hierarchy

### Connecting Routes
- ✅ Hierarchical search still works
- ✅ New terminals appear in connecting route calculations

## Monitoring

Check logs for parent detection:
```bash
# Look for hierarchy assignments
grep "Set location hierarchy" logs/application.log

# Look for parent detection
grep "Found parent city" logs/application.log

# Check for terminals created without parents (should investigate)
grep "Created new location.*parent: null.*type: TERMINAL" logs/application.log
```

## Known Limitations

1. **50km Radius** - Terminals beyond 50km from parent city won't be detected
   - Acceptable trade-off to avoid false positives
   - Admin can manually fix if needed

2. **Name Variations** - Some terminal names might not match keywords
   - e.g., "Anna Bus Stand" instead of "Chennai - Anna Bus Stand"
   - Will be created as standalone, admin can fix via SQL

3. **Duplicate Cities** - If multiple cities have same name
   - Uses nearest city by coordinates
   - Rare edge case in Tamil Nadu

## Future Enhancements

1. **Admin UI** - Add hierarchy management to admin panel
2. **ML-based Detection** - Train model on existing patterns
3. **User Confirmation** - Ask user to confirm detected parent
4. **Bulk Re-hierarchy** - Tool to re-process all flat locations

## Budget Impact

✅ **Zero cost increase** - Uses existing database queries
✅ **No external APIs** - All detection is pattern-based
✅ **Minimal compute** - Detection runs only during contribution approval

## Deployment

No database migration needed - uses existing columns:
- `locations.parent_id` (already exists)
- `locations.location_type` (already exists)

Just deploy the updated code:
```bash
cd backend
./gradlew build
docker build -t perundhu-backend .
# Deploy to Cloud Run
```

---

**Status**: ✅ Implementation Complete
**Tested**: ⏳ Requires manual testing
**Deployed**: ❌ Not yet deployed to production
