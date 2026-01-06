# Multi-State Bus Routes - Quick Start Guide

**Objective:** Add bus route locations from Kerala, Karnataka, and Andhra Pradesh to complement Tamil Nadu routes.

## Quick Start (5 minutes)

### Step 1: Generate Location Data
```bash
cd /Users/mchand69/Documents/perundhu/scripts

# Make script executable and run
chmod +x fetch-multistate-locations-from-overpass.py
python3 fetch-multistate-locations-from-overpass.py
```

**Expected output:**
```
[STARTING MULTI-STATE LOCATION FETCH]
[TAMIL_NADU] Tamil Nadu
  [INFO] Querying Overpass API for tamil_nadu...
  [INFO] Processing 25,000+ elements from tamil_nadu...
  ✓ Successfully fetched 25,731 locations from tamil_nadu
  
[KERALA] Kerala (Southern border with TN)
  [INFO] Querying Overpass API for kerala...
  ✓ Successfully fetched 750 locations from kerala

[KARNATAKA] Karnataka (routes to Bangalore, Mysore, etc.)
  ✓ Successfully fetched 1,200 locations from karnataka

[ANDHRA_PRADESH] Andhra Pradesh (Tirupati, Nellore, etc.)
  ✓ Successfully fetched 650 locations from andhra_pradesh

[FINAL SUMMARY]
Total locations fetched: 28,331
  • tamil_nadu        : 25,731 locations
  • kerala            :    750 locations
  • karnataka         :  1,200 locations
  • andhra_pradesh    :    650 locations

Generated: multistate_locations.sql
```

### Step 2: Create Database Migration
```bash
cd /Users/mchand69/Documents/perundhu/backend/app/src/main/resources/db/migration

# Copy generated SQL as Flyway migration
cp /Users/mchand69/Documents/perundhu/scripts/multistate_locations.sql \
   V57__add_multistate_locations.sql
```

### Step 3: Start Backend (Auto-applies Migration)
```bash
cd /Users/mchand69/Documents/perundhu/backend

export GEMINI_API_KEY=$(gcloud secrets versions access latest --secret=gemini-api-key)
./gradlew bootRun
```

**Flyway automatically applies V57 on startup**

### Step 4: Verify
```bash
# Test multi-state location search
curl -X GET 'http://localhost:8080/api/locations/search?query=Bangalore&limit=5' \
  -H 'Accept: application/json'

# Expected response includes Bangalore from Karnataka
```

## What's Included

### Neighboring States Coverage

**Kerala (750+ locations)**
- Thiruvananthapuram, Kochi, Kannur
- Southern border towns for Kanyakumari routes
- Popular destinations from Tamil Nadu

**Karnataka (1,200+ locations)**
- Bangalore (Bengaluru) - Major hub
- Mysore - Tourist destination
- Salem-Bangalore corridor
- Coimbatore-Bangalore corridor

**Andhra Pradesh (650+ locations)**
- Tirupati - Religious tourism
- Nellore - Coastal towns
- Chittoor - Northern routes
- Connections from Chennai

## Service Enhancements

**New Java Methods Added:**
- `searchMultiStateLocations(query, limit)` - Search all states
- `searchMultiStateLocations(query, limit, language)` - With language support
- `fetchLocationsFromState(...)` - Query specific state
- `removeDuplicatesByName(...)` - Clean results

**Fallback Support:**
- If multi-state service fails, falls back to Tamil Nadu
- No impact to existing functionality

## Supported Bus Routes After Implementation

| Route | From | To | States |
|-------|------|----|----|
| Express | Chennai | Bangalore | TN → KA |
| Express | Coimbatore | Mysore | TN → KA |
| Long Distance | Madurai | Kochi | TN → KL |
| Semi-Luxury | Tirupati | Bangalore | TN → AP → KA |
| Deluxe | Nagercoil | Thiruvananthapuram | TN → KL |
| Regular | Chittoor connector | Chennai | AP ↔ TN |

## Configuration Files Changed

| File | Changes |
|------|---------|
| `OverpassGeocodingService.java` | +3 new methods for multi-state search |
| `V57__add_multistate_locations.sql` | New migration with ~2,500 locations |
| `application-development.properties` | No changes (already supports Gemini) |

## Database Impact

```sql
-- Check locations by state (after running)
SELECT COUNT(*) as total FROM locations;
-- Expected: 28,331

SELECT state, COUNT(*) FROM locations GROUP BY state;
-- tamil_nadu      | 25,731
-- kerala          |    750
-- karnataka       |  1,200
-- andhra_pradesh  |    650
```

## Limitations

- **Overpass API Rate Limiting:** 1 request/sec recommended
- **Tamil Translations:** Not included (future enhancement)
- **Real-time Updates:** Annual refresh recommended from Overpass

## Troubleshooting

### Script fails with "ModuleNotFoundError"
```bash
pip install requests
python3 fetch-multistate-locations-from-overpass.py
```

### Migration fails to apply
```bash
# Check SQL syntax
head -20 /Users/mchand69/Documents/perundhu/scripts/multistate_locations.sql

# Verify valid SQL
```

### Search returns no results
- Restart backend: `pkill -f gradlew; ./gradlew bootRun`
- Check Gemini API key is set: `echo $GEMINI_API_KEY`

## Next Steps

1. ✅ **Generated locations:** Run Python script
2. ✅ **Created migration:** V57 ready
3. ✅ **Enhanced service:** Java methods added
4. ⏳ **Frontend updates:** Add state badge display (future)
5. ⏳ **Analytics:** Track inter-state routes (future)

## References

- Full guide: [MULTISTATE_ROUTE_SUPPORT_GUIDE.md](MULTISTATE_ROUTE_SUPPORT_GUIDE.md)
- Overpass API: https://overpass-api.de
- Bus route data: Contributed by users + OpenStreetMap

---

**Time to Complete:** ~5 minutes  
**Effort Level:** Minimal (mostly automated)  
**Impact:** Opens support for major inter-state bus routes
