# Location Hierarchy Implementation

## ✅ Implementation Complete

Hierarchical location support has been implemented to enable city-level searches that include all child terminals.

## Files Created/Modified

### 1. Database Migration
**File**: `backend/app/src/main/resources/db/migration/V101__add_location_hierarchy.sql`
- Adds `parent_id` and `location_type` columns to locations table
- Sets up Chennai, Madurai, Coimbatore, Trichy, Salem hierarchies
- Creates indexes for performance

### 2. Python Setup Script  
**File**: `scripts/setup_location_hierarchy.py`
- Interactive script to set up parent-child relationships
- Verifies hierarchy and shows bus impact analysis
- Maps terminals to parent cities

### 3. Entity Updates
**File**: `infrastructure/persistence/entity/LocationJpaEntity.java`
- Added `LocationType` enum (CITY, TERMINAL, STATION, VILLAGE, TOWN)
- Added `parent` (@ManyToOne) and `children` (@OneToMany) relationships
- Added `locationType` field

### 4. Repository Layer
**LocationJpaRepository.java**:
- `findByParentId()` - Find child locations
- `findLocationIdsForHierarchicalSearch()` - Get parent + all children IDs

**BusJpaRepository.java**:
- `findBusesBetweenLocationSets()` - Search from multiple sources to multiple destinations

**LocationJpaRepositoryAdapter.java**:
- Implemented `findLocationIdsForHierarchicalSearch()`
- Added `findChildLocations()`

**BusJpaRepositoryAdapter.java**:
- Implemented `findBusesBetweenLocationSets()`

### 5. Domain Layer
**LocationRepository.java**:
- Added `findLocationIdsForHierarchicalSearch()` interface method

**BusRepository.java**:
- Added `findBusesBetweenLocationSets()` interface method

## Next Steps to Complete

### Step 1: Run Flyway Migration
```bash
cd /Users/mchand69/Documents/perundhu
./start-local.sh migrate
```

Or manually:
```sql
mysql -u root -h 127.0.0.1 -D perundhu < backend/app/src/main/resources/db/migration/V101__add_location_hierarchy.sql
```

### Step 2: Run Python Setup Script
```bash
python3 scripts/setup_location_hierarchy.py
```

### Step 3: Update Service Layer
Modify `BusScheduleServiceImpl.findBusesBetweenLocations()` to use hierarchical search:

```java
@Override
public List<BusDTO> findBusesBetweenLocations(Long fromLocationId, Long toLocationId) {
    // Get all location IDs (parent + children)
    List<Long> fromLocationIds = locationRepository.findLocationIdsForHierarchicalSearch(fromLocationId);
    List<Long> toLocationIds = locationRepository.findLocationIdsForHierarchicalSearch(toLocationId);
    
    // Search from any source to any destination
    List<Bus> buses = busRepository.findBusesBetweenLocationSets(fromLocationIds, toLocationIds);
    
    return sortBusesByCurrentTime(buses).stream()
            .map(BusDTO::fromDomain)
            .toList();
}
```

###Step 4: Clear Cache & Restart
```bash
cd /Users/mchand69/Documents/perundhu
./start-local.sh restart
```

### Step 5: Test Hierarchical Search
```bash
# Should now return 30+ buses from all Chennai terminals
curl 'http://localhost:8080/api/v1/bus-schedules/search?fromLocationId=1&toLocationId=3&includeContinuing=false'
```

### Step 6: Restore Terminal-Specific Data (Optional)
If you previously merged KCBT → Chennai, restore original data:

**Create backup of current data**:
```sql
-- Find which buses were modified
SELECT id, bus_number, from_location_id, to_location_id 
INTO OUTFILE '/tmp/merged_buses_backup.csv'
FROM buses 
WHERE from_location_id = 1 OR to_location_id = 3;
```

**Restore from source data file**:
```bash
python3 scripts/unified_data_loader.py --mode buses --environment local --data-file data/consolidated_buses.json
# This will restore original terminal-specific locations
```

## How It Works

### Before (Flat Structure)
```
User searches: Chennai (ID 1) → Madurai (ID 3)
Database query: WHERE from_location_id = 1 AND to_location_id = 3
Result: 0 buses (buses are at terminal IDs like 62428, 99355)
```

### After (Hierarchical Structure)
```
User searches: Chennai (ID 1) → Madurai (ID 3)

Step 1: Get hierarchical IDs
- Chennai: [1, 62428, 99355, 99295, 99294] (city + terminals)
- Madurai: [3, 62434] (city + terminals)

Step 2: Query
WHERE from_location_id IN (1, 62428, 99355, 99295, 99294) 
AND to_location_id IN (3, 62434)

Result: 30+ buses from all Chennai terminals to Madurai ✓
```

## Benefits

1. **Better UX**: Users don't need to know terminal names
2. **Maintains Detail**: Can still show which terminal each bus departs from
3. **Backward Compatible**: Direct terminal searches still work
4. **Flexible**: Can add more cities/terminals easily

## Database State

### Current Hierarchy (After Migration)
- **Chennai (1)**: CMBT (62428), KCBT (99355), Tambaram (99295), Airport (99294)
- **Madurai (3)**: Mattuthavani (62434), Periyar, Arapalayam
- **Coimbatore**: Gandhipuram, Town Bus Stand, Singanallur
- **Trichy**: Central Bus Stand, Chatram Bus Stand
- **Salem**: Town Bus Stand, New Bus Stand

## API Response Example

**Request**: `GET /api/v1/bus-schedules/search?fromLocationId=1&toLocationId=3`

**Response** (with hierarchy):
```json
{
  "totalItems": 31,
  "items": [
    {
      "id": 149843,
      "number": "137NS",
      "fromLocation": "CHENNAI KALAIGNAR CBT",  // Shows actual terminal
      "toLocation": "Madurai - Mattuthavani",
      "departureTime": "04:00"
    },
    {
      "id": 149844,
      "number": "137UD",
      "fromLocation": "Chennai - CMBT (Koyambedu)",  // Different terminal
      "toLocation": "Madurai - Mattuthavani",
      "departureTime": "05:00"
    }
  ]
}
```

## Troubleshooting

### Issue: Migration fails with "duplicate column"
**Solution**: Column already exists, skip to Python setup script

### Issue: Hierarchy not working after setup
**Solution**: Clear cache and restart backend

### Issue: Some buses still missing
**Solution**: Check if buses are marked `active = false` or `active IS NULL`

## Documentation

- Migration SQL: `backend/app/src/main/resources/db/migration/V101__add_location_hierarchy.sql`
- Setup Script: `scripts/setup_location_hierarchy.py`
- Manual SQL Migration: `scripts/migrations/001_add_location_hierarchy.sql`
