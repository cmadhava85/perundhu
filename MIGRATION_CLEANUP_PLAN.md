# Flyway Migration Cleanup Plan

## Problems Identified

### 1. **V1.1 - Duplicate Migration (FIXED ✅)**
- **Issue**: V1.1 is only 2 lines, stating "no changes needed"
- **Root Cause**: Should have been consolidated into V1
- **Fix**: DELETED - V1 already contains all necessary tables

### 2. **V30/V31/V34 - Data Overlap and Redundancy**
- **V30**: Adds bus stands for 18+ major cities
- **V31**: Adds village bus stops across 15+ districts
- **V34**: Cleanup and populate - deletes hardcoded IDs then re-inserts data
- **Problems**:
  - V34 has hardcoded location IDs (11, 14, 78, etc.) that won't match in preprod
  - Duplicates between V30 and V31 overlapping inserts
  - No idempotency - will fail on re-run

### 3. **Hardcoded ID References (CRITICAL)**
- **V34** references specific location IDs that are auto-generated
- These IDs differ between dev and preprod databases
- Will cause DELETE statements to fail or delete wrong records

### 4. **Missing Idempotency**
- Migrations use `INSERT ... ON DUPLICATE KEY UPDATE` but no unique constraints on some tables
- No rollback strategy if migrations fail partially

### 5. **Missing Error Handling**
- No explicit transaction control
- No error conditions or constraints

## Solution Strategy

### Phase 1: Clean Up Data Migrations
1. ✅ Remove V1.1 (duplicate)
2. Keep V30 - adds bus stands with proper naming
3. Keep V31 - adds village bus stops with proper naming
4. **REPLACE V34** - Fix to use name-based matching instead of hardcoded IDs

### Phase 2: Make Migrations Idempotent
- Use `INSERT IGNORE` or `ON DUPLICATE KEY UPDATE` with proper constraints
- Ensure all INSERTs have unique keys to prevent duplicates
- Add proper error handling

### Phase 3: Add Constraints and Indexes
- Add UNIQUE constraints where needed
- Add proper foreign key constraints
- Add beneficial indexes

## Migration Review

### Safe Migrations ✅
- V1: Core schema creation
- V23: Social media posts table
- V26: System settings table
- V27: Make bus_number nullable
- V28: Reviews table
- V29: Announcements table
- V32: Fix image contributions ID column
- V33: Expand status column
- V35: Create missing tracking and timing tables
- V36: Create user feedback table
- V37: Add OSM fields to locations

### Problematic Migrations ⚠️
- **V1.1**: DELETED ✅
- **V34**: Needs rewrite to use name-based matching

## Recommended Actions

### For Production/Preprod:
1. Delete V1.1 from all environments
2. Keep V30 and V31 as-is (working correctly)
3. Replace V34 with a safer version (see V34_REPLACEMENT below)
4. Run Flyway migration repair if needed: `flyway repair`
5. Test in staging before deploying to preprod

### For Local Development:
1. Reset database: `DROP DATABASE perundhu; CREATE DATABASE perundhu;`
2. Run migrations from scratch
3. All migrations should run cleanly

## V34 Replacement Strategy

Instead of hardcoded IDs, use:
```sql
-- Delete based on location names instead of IDs
DELETE FROM stops WHERE location_id IN (
  SELECT id FROM locations WHERE name IN (
    'Duplicate: Madurai - Mattuthavani (truncated)',
    'Duplicate: Aruppukottai - Main Bus Stand',
    ...
  )
);
```

But SAFER approach:
- Keep V30 and V31 (they add data correctly)
- Remove V34 entirely (it's just cleanup that shouldn't be needed)
- Add proper UNIQUE constraint on locations(name, district) to prevent duplicates

## Files Modified
- ✅ V1.1__create_contribution_tables.sql - DELETED
- ⏳ V34__cleanup_and_populate_bus_stops.sql - To be replaced

## Testing Plan

1. **Local Testing**:
   ```bash
   # Reset database
   mysql -u root -proot -e "DROP DATABASE IF EXISTS perundhu; CREATE DATABASE perundhu;"
   
   # Run migrations
   cd backend && ./gradlew bootRun
   
   # Verify all tables created
   mysql -u root -proot -D perundhu -e "SHOW TABLES;"
   
   # Count locations
   mysql -u root -proot -D perundhu -e "SELECT COUNT(*) FROM locations;"
   ```

2. **Preprod Validation**:
   - Run on staging first
   - Verify record counts match expected values
   - Check for duplicate locations
   - Validate foreign key relationships

## Next Steps
1. Replace V34 with safe version
2. Add UNIQUE constraints to prevent duplicates
3. Test migration on clean database
4. Deploy to preprod
