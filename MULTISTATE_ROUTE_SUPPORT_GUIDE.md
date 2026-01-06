# Multi-State Bus Route Support (Tamil Nadu + Neighboring States)

**Goal:** Extend bus route coverage to include routes from Tamil Nadu to neighboring states (Kerala, Karnataka, Andhra Pradesh)

**Status:** Ready for implementation

## Overview

Tamil Nadu buses operate beyond state boundaries to neighboring states:
- **Kerala:** Kanyakumari → Thiruvananthapuram, Kochi routes
- **Karnataka:** Chennai/Coimbatore → Bangalore, Mysore routes
- **Andhra Pradesh:** Tirupati, Nellore, Chittoor routes

## Implementation Roadmap

### Phase 1: Location Data Collection ✅ (Ready)

**Script:** `scripts/fetch-multistate-locations-from-overpass.py`

**Purpose:** Fetch all bus route destination cities/towns from neighboring states using Overpass API

**Features:**
- Fetches locations from 4 state regions:
  - **Tamil Nadu** (priority 1): Complete coverage
  - **Kerala** (priority 2): Southern border towns
  - **Karnataka** (priority 2): Bangalore, Mysore, etc.
  - **Andhra Pradesh** (priority 2): Tirupati, Nellore, etc.
- Uses Overpass QL queries with place type filtering
- Removes duplicate locations automatically
- Generates SQL INSERT statements

**How to Use:**
```bash
cd /Users/mchand69/Documents/perundhu/scripts

# Install dependencies (if not already installed)
pip install requests

# Run the script
python3 fetch-multistate-locations-from-overpass.py

# Output: multistate_locations.sql
```

**Expected Output:**
- SQL file with ~2,000-3,000 new location records
- Organized by state with comments
- Ready to import into database

### Phase 2: Database Migration ✅ (Ready)

**Action:** Create Flyway migration to load multi-state locations

**File to create:** `backend/app/src/main/resources/db/migration/V57__add_multistate_locations.sql`

**Steps:**
1. Run the Python script (Phase 1)
2. Copy generated SQL into V57 migration
3. Commit to git:
   ```bash
   git add -A
   git commit -m "feat: add multi-state bus route locations (Kerala, Karnataka, Andhra Pradesh)"
   ```

### Phase 3: Service Enhancement ✅ (Ready)

**File Updated:** `OverpassGeocodingService.java`

**New Methods Added:**

1. **`searchMultiStateLocations(query, limit)`**
   - Search across all 4 states
   - Returns consolidated results with duplicates removed
   - Priority: Tamil Nadu first, then neighboring states

2. **`searchMultiStateLocations(query, limit, language)`**
   - Multi-state search with language support (en/ta)

3. **`fetchLocationsFromState(...)`**
   - Internal helper to query specific state regions
   - Implements state-specific bounding boxes

4. **`removeDuplicatesByName(...)`**
   - Deduplication by location name
   - Ensures clean results

**Fallback Handling:**
- New fallback method: `searchMultiStateLocationsFallback`
- If multi-state service unavailable, falls back to Tamil Nadu-only search

### Phase 4: API Integration (Next)

**Controllers to Update:**
1. **LocationAutoCompleteController**
   - Add endpoint: `GET /api/locations/search-multistate`
   - Optional parameter: `includeNeighboringStates=true`

2. **RouteContributionController**
   - Support multi-state route submissions
   - Validate destination within allowed states

3. **BusScheduleController**
   - Search considers multi-state locations
   - Display location source/state info

### Phase 5: Frontend Integration (Future)

**Frontend Changes:**
1. Update location autocomplete to use multi-state search
2. Add state badge/indicator in dropdown
3. Display route coverage information

## Technical Specifications

### State Bounding Boxes

| State | South | West | North | East | Focus |
|-------|-------|------|-------|------|-------|
| Tamil Nadu | 8.0 | 76.0 | 13.5 | 80.5 | Full state |
| Kerala | 8.0 | 76.0 | 12.5 | 77.5 | Southern border |
| Karnataka | 13.0 | 74.0 | 18.0 | 78.5 | West & NW |
| Andhra Pradesh | 13.5 | 77.0 | 19.5 | 84.5 | Northern |

### Overpass Query Pattern

```
[timeout:60s][bbox:south,west,north,east];
(
  node[name~"query",i][place~"city|town|village|hamlet|..."];
  way[name~"query",i][place~"city|town|village|hamlet|..."];
  relation[name~"query",i][place~"city|town|village|hamlet|..."];
);
out geom center;
```

**Key Features:**
- Regex matching with case-insensitive flag (`~"...",i`)
- Place type filtering (eliminates non-location results)
- Bounding box constrained (faster, accurate)
- Both coordinates and center geometry

### Data Model

**locations table** (existing):
```sql
CREATE TABLE locations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  latitude DOUBLE,
  longitude DOUBLE,
  district VARCHAR(100),
  state VARCHAR(50),  -- NEW: Track source state
  nearby_city VARCHAR(100),
  osm_id BIGINT,
  osm_type VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Optional Enhancement:** Add `state` column to track source state for reporting

## Implementation Steps

### Step 1: Generate Location Data
```bash
cd /Users/mchand69/Documents/perundhu/scripts
python3 fetch-multistate-locations-from-overpass.py
```

Expected output:
- `multistate_locations.sql` (~2-3MB)
- 2,000-3,000 new locations

### Step 2: Create Flyway Migration
```bash
cd /Users/mchand69/Documents/perundhu/backend/app/src/main/resources/db/migration

# Copy the generated SQL
cp /Users/mchand69/Documents/perundhu/scripts/multistate_locations.sql \
   V57__add_multistate_locations.sql

# Edit to add Flyway header
# Add: -- Flyway migration: Add multi-state locations
```

### Step 3: Deploy Migration
```bash
cd /Users/mchand69/Documents/perundhu/backend

# Compile and run
./gradlew clean build
./gradlew bootRun

# Flyway applies V57 automatically on startup
```

### Step 4: Verify Database
```sql
-- Check total locations by state
SELECT state, COUNT(*) FROM locations GROUP BY state;

-- Expected output:
-- tamil_nadu: 25,000+ existing + new consolidated
-- kerala: 500-800
-- karnataka: 1000-1500
-- andhra_pradesh: 500-800
```

### Step 5: Test Service (Optional)
```bash
# Test multi-state search
curl -X GET 'http://localhost:8080/api/locations/search?query=Bangalore&limit=5'

# Should return:
# - Bangalore, Karnataka (primary)
# - Nearby towns (Bengaluru urban, etc.)
```

## Supported Bus Routes After Implementation

### Tamil Nadu to Kerala
- Kanyakumari ↔ Thiruvananthapuram
- Nagercoil ↔ Kochi
- Madurai ↔ Thiruvananthapuram
- Tirunelveli ↔ Kochi

### Tamil Nadu to Karnataka
- Chennai ↔ Bangalore (Bengaluru)
- Coimbatore ↔ Bangalore
- Salem ↔ Bangalore
- Mysore ↔ Chennai
- Ooty ↔ Bangalore/Mysore

### Tamil Nadu to Andhra Pradesh
- Chittoor ↔ Chennai
- Tirupati ↔ Vellore
- Nellore ↔ Chennai
- Kavali ↔ Tirupati

## File Changes Summary

| File | Type | Status | Changes |
|------|------|--------|---------|
| `fetch-multistate-locations-from-overpass.py` | Script | ✅ Created | Multistate location fetching |
| `OverpassGeocodingService.java` | Java Service | ✅ Enhanced | Multi-state search methods |
| `V57__add_multistate_locations.sql` | Migration | ⏳ Ready | Database schema update |
| Location Autocomplete | Frontend | ⏳ Next Phase | UI updates |

## Performance Considerations

### Overpass API Limits
- Free tier: Sufficient for this use case
- Rate limiting: 1 request per second recommended
- Timeout: 60s per request
- Response size: ~2-5MB per state

### Database Impact
- Additional locations: ~2,500-3,500
- Storage: ~500KB additional
- Index impact: Minimal (existing indices cover)
- Query performance: No degradation (locations table already optimized)

### Caching Strategy
- Cache multi-state search results (5 min TTL)
- Invalidate on location updates
- Pre-warm cache for common routes

## Monitoring & Logging

**Service Logs to Watch:**
```
[INFO] Multi-state search for 'Bangalore' returned 5 results
[WARN] Overpass circuit breaker triggered for multi-state location search
[DEBUG] Querying karnataka with: [bbox:13.0,74.0,...]
```

**Metrics to Track:**
- Multi-state search response time
- Hit rate by state
- Fallback invocation count
- Overpass API error rate

## Future Enhancements

1. **State Display in UI**
   - Show state badge next to location names
   - Filter by state in dropdown

2. **Route Validation**
   - Warn if destination is in different state
   - Suggest popular inter-state routes

3. **Analytics**
   - Track most popular inter-state routes
   - Generate state-wise route reports

4. **Admin Controls**
   - Enable/disable multi-state search
   - Configure allowed states per instance

5. **Translations**
   - Add Tamil translations for neighboring state locations
   - Similar to V52/V53 Tamil translation migrations

## Testing Checklist

- [ ] Python script runs without errors
- [ ] SQL file has correct structure (INSERT statements)
- [ ] Flyway migration applies successfully
- [ ] Multi-state search returns results
- [ ] No duplicate locations in results
- [ ] Fallback works when service unavailable
- [ ] Database doesn't exceed reasonable size
- [ ] Performance acceptable (<100ms for search)

## Troubleshooting

### Issue: No results from multi-state search
**Cause:** Overpass API timeout or rate limiting  
**Solution:** Increase timeout, add delay between state queries

### Issue: Duplicate locations in results
**Cause:** Same location exists in multiple states' data  
**Solution:** Deduplication already implemented; verify it's working

### Issue: Migration fails to apply
**Cause:** SQL syntax error in generated file  
**Solution:** Validate SQL file before applying; check for special characters

## References

- Overpass API Documentation: https://wiki.openstreetmap.org/wiki/Overpass_API
- OpenStreetMap Data: https://www.openstreetmap.org/
- State Boundaries: https://osm.org (administrative boundaries)

---

**Status:** Ready for implementation  
**Estimated Time:** 2-3 hours for Phases 1-3  
**Priority:** Medium (enhances route coverage, not critical for MVP)
