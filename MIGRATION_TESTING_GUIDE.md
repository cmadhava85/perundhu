# Migration Testing and Validation Guide

## Quick Cleanup Commands

### 1. Reset Database Completely (LOCAL ONLY)
```bash
# WARNING: This will DELETE all data!
mysql -h localhost -u root -proot -e "DROP DATABASE IF EXISTS perundhu; CREATE DATABASE perundhu;"
```

### 2. Reset Migration History
```bash
# Clear Flyway migration history
mysql -h localhost -u root -proot -D perundhu -e "TRUNCATE TABLE flyway_schema_history;"
```

### 3. Remove Specific Migration History
```bash
# Remove a specific migration from history (if it's broken)
mysql -h localhost -u root -proot -D perundhu -e "DELETE FROM flyway_schema_history WHERE version='34';"
```

### 4. Repair Flyway (if migrations fail)
```bash
cd /Users/mchand69/Documents/perundhu/backend
./gradlew bootRun
# Spring will automatically run `flyway:repair` to fix failed migrations
```

## Full Migration Validation Steps

### Step 1: Clean Start (LOCAL)
```bash
# Kill any running backend
pkill -9 java

# Reset database
mysql -h localhost -u root -proot -e "DROP DATABASE IF EXISTS perundhu; CREATE DATABASE perundhu;"

# Start backend
cd /Users/mchand69/Documents/perundhu/backend
./gradlew bootRun

# Wait for startup (watch logs)
tail -f ../logs/backend.log | grep -E "migration|Migration|Started"
```

### Step 2: Verify All Tables Created
```bash
# Check all tables exist
mysql -h localhost -u root -proot -D perundhu -e "
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'perundhu' 
ORDER BY TABLE_NAME;
"
```

Expected tables:
- announcements
- buses
- connecting_routes
- extracted_bus_timings
- image_contributions
- locations
- osm_bus_stops
- osm_route_stops
- reviews
- route_contributions
- route_issues
- skipped_timing_records
- social_media_posts
- stops
- system_settings
- timing_image_contributions
- translations
- user_feedback
- user_tracking_sessions
- bus_timing_records
- flyway_schema_history

### Step 3: Verify Data Integrity
```bash
# Count locations (should be ~110+)
mysql -h localhost -u root -proot -D perundhu -e "SELECT COUNT(*) as total_locations FROM locations;"

# Check for duplicate location names (should be 0)
mysql -h localhost -u root -proot -D perundhu -e "
SELECT name, district, COUNT(*) as count 
FROM locations 
GROUP BY name, district 
HAVING count > 1;
"

# Verify bus stands per major city
mysql -h localhost -u root -proot -D perundhu -e "
SELECT nearby_city, COUNT(*) as count 
FROM locations 
WHERE name LIKE '%Bus Stand%' OR name LIKE '%Bus Stop%'
GROUP BY nearby_city 
ORDER BY count DESC;
"

# Check for NULL or empty city names
mysql -h localhost -u root -proot -D perundhu -e "
SELECT COUNT(*) as empty_cities 
FROM locations 
WHERE nearby_city IS NULL OR nearby_city = '';
"
```

### Step 4: Verify Foreign Keys
```bash
# Check buses table (should have proper foreign keys)
mysql -h localhost -u root -proot -D perundhu -e "
SELECT b.id, b.name, 
  l1.name as from_location, 
  l2.name as to_location
FROM buses b
LEFT JOIN locations l1 ON b.from_location_id = l1.id
LEFT JOIN locations l2 ON b.to_location_id = l2.id
LIMIT 5;
"

# Verify no NULL foreign keys
mysql -h localhost -u root -proot -D perundhu -e "
SELECT COUNT(*) as invalid_foreign_keys 
FROM buses 
WHERE from_location_id IS NULL 
  OR to_location_id IS NULL;
"
```

### Step 5: Check Migration Status
```bash
# View all executed migrations
mysql -h localhost -u root -proot -D perundhu -e "
SELECT version, description, type, installed_on, execution_time 
FROM flyway_schema_history 
ORDER BY version;
"

# Look for FAILED status
mysql -h localhost -u root -proot -D perundhu -e "
SELECT version, description, success 
FROM flyway_schema_history 
WHERE success = 0;
"
```

## Common Issues and Solutions

### Issue 1: Migration Fails on Unique Constraint
```
Error: Duplicate entry 'Madurai - Mattuthavani-Madurai' for key 'uk_location_name_district'
```

**Solution:**
1. Check for duplicates:
   ```bash
   mysql -h localhost -u root -proot -D perundhu -e "
   SELECT name, district, COUNT(*) 
   FROM locations 
   GROUP BY name, district 
   HAVING COUNT(*) > 1;
   "
   ```

2. Remove duplicates:
   ```bash
   mysql -h localhost -u root -proot -D perundhu -e "
   DELETE l1 FROM locations l1
   JOIN (
     SELECT name, district, MAX(id) as max_id
     FROM locations
     GROUP BY name, district
     HAVING COUNT(*) > 1
   ) l2 ON l1.name = l2.name 
     AND l1.district = l2.district
     AND l1.id < l2.max_id;
   "
   ```

3. Repair and restart:
   ```bash
   pkill -9 java
   cd backend && ./gradlew bootRun
   ```

### Issue 2: Foreign Key Constraint Violation
```
Error: Cannot add or update a child row: a foreign key constraint fails
```

**Solution:**
1. Check orphaned records:
   ```bash
   mysql -h localhost -u root -proot -D perundhu -e "
   SELECT * FROM buses 
   WHERE from_location_id NOT IN (SELECT id FROM locations)
      OR to_location_id NOT IN (SELECT id FROM locations);
   "
   ```

2. Remove orphaned records:
   ```bash
   mysql -h localhost -u root -proot -D perundhu -e "
   DELETE FROM buses 
   WHERE from_location_id NOT IN (SELECT id FROM locations)
      OR to_location_id NOT IN (SELECT id FROM locations);
   "
   ```

### Issue 3: Flyway History Out of Sync
```
Error: Migration checksum mismatch or history corrupted
```

**Solution:**
```bash
# Mark migration as successful (use ONLY if you verified the migration worked)
mysql -h localhost -u root -proot -D perundhu -e "
UPDATE flyway_schema_history 
SET success = 1 
WHERE version = '34' AND success = 0;
"

# Or fully reset (DEVELOPMENT ONLY)
mysql -h localhost -u root -proot -D perundhu -e "TRUNCATE TABLE flyway_schema_history;"
```

## Preprod Deployment Checklist

- [ ] Tested V1.1 deletion doesn't break anything
- [ ] Tested V34 replacement on clean database
- [ ] Verified V38 (new constraints) works without errors
- [ ] Confirmed all migration files exist and are valid SQL
- [ ] Tested with database backup before deploying
- [ ] Verified record counts match expected values
- [ ] Checked for duplicate locations
- [ ] Validated foreign key relationships
- [ ] Reviewed migration logs for errors
- [ ] Performed smoke test on preprod after deployment

## Migration Files Summary

| Version | File | Status | Notes |
|---------|------|--------|-------|
| V1 | V1__init.sql | ✅ Safe | Core schema |
| V1.1 | DELETED | ✅ Fixed | Was duplicate |
| V23 | V23__create_social_media_posts_table.sql | ✅ Safe | Social posts |
| V26 | V26__create_system_settings_table.sql | ✅ Safe | Settings |
| V27 | V27__make_bus_number_nullable.sql | ✅ Safe | Schema modification |
| V28 | V28__create_reviews_table.sql | ✅ Safe | Reviews |
| V29 | V29__create_announcements_table.sql | ✅ Safe | Announcements |
| V30 | V30__add_bus_stands_with_coordinates.sql | ✅ Safe | Bus stand data |
| V31 | V31__add_village_bus_stops.sql | ✅ Safe | Village stops |
| V32 | V32__fix_image_contributions_id_column.sql | ✅ Safe | ID fix |
| V33 | V33__expand_status_column.sql | ✅ Safe | Status expansion |
| V34 | V34__cleanup_and_populate_bus_stops.sql | ✅ Fixed | Removed hardcoded IDs |
| V35 | V35__create_missing_tracking_and_timing_tables.sql | ✅ Safe | Tracking tables |
| V36 | V36__create_user_feedback_table.sql | ✅ Safe | Feedback table |
| V37 | V37__add_osm_fields_to_locations.sql | ✅ Safe | OSM integration |
| V38 | V38__add_location_constraints_and_indexes.sql | ✅ New | Added constraints |

## Running Migrations on Preprod

### Option 1: Via Backend Startup (Automatic)
```bash
# Flyway runs automatically on Spring Boot startup
./gradlew bootRun

# Check logs for migration status
tail -f logs/backend.log | grep -i "migration\|flyway"
```

### Option 2: Dry Run (Validate Only)
```bash
# Validate migrations without executing
./gradlew flywayInfo

# Expected output shows all versions and their status
```

### Option 3: Manual Control
```bash
# Run specific migration
./gradlew flywayMigrate

# Repair failed migrations
./gradlew flywayRepair

# Clean and start over (DEVELOPMENT ONLY!)
./gradlew flywayClean
```

## Monitoring in Preprod

Monitor these metrics after deployment:
1. **Migration execution time** - Should be <5 seconds total
2. **Error rate** - Should be 0
3. **Record count** - Locations should be 110+
4. **Duplicate count** - Should be 0
5. **Foreign key violations** - Should be 0

## Troubleshooting Commands

```bash
# View migration details
mysql -h localhost -u root -proot -D perundhu -e "
SELECT version, description, installed_on, execution_time, success 
FROM flyway_schema_history ORDER BY version;
"

# Find slow migrations
mysql -h localhost -u root -proot -D perundhu -e "
SELECT version, execution_time 
FROM flyway_schema_history 
WHERE execution_time > 1000 
ORDER BY execution_time DESC;
"

# Check database size
mysql -h localhost -u root -proot -e "
SELECT SUM(data_length + index_length) / 1024 / 1024 as 'Size (MB)'
FROM information_schema.TABLES 
WHERE table_schema = 'perundhu';
"
```
