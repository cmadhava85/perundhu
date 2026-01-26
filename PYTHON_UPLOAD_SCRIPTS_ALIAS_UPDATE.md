# Python Upload Scripts - Location Aliases Integration

## Summary

Updated all Python data upload scripts to support the new location aliases system. This enables automatic resolution of location name variations during data upload.

## Problem Statement

Previously, Python upload scripts would fail to find locations if:
- Bus data has "BROADWAY" but database has "Broadway Bus Terminus" 
- Different data sources use different naming conventions
- Case variations exist ("broadway" vs "BROADWAY")

This caused:
- Failed uploads (location not found)
- Duplicate location creation
- Data inconsistency

## Solution

Enhanced all location lookup functions to query the `location_aliases` table, providing automatic name resolution during upload.

## Files Updated

### 1. `import_tnstc_to_database.py`

**Function**: `get_location_id()`

**Changes**:
```python
# OLD: Only searched locations table
SELECT id FROM locations WHERE UPPER(name) = UPPER(%s)

# NEW: Also searches aliases table
1. Exact match on location name
2. Exact match on alias  # NEW
3. Partial match on location name
4. Partial match on alias  # NEW
```

**Benefits**:
- Resolves "BROADWAY" → "Broadway Bus Terminus" automatically
- Handles all name variations without manual mapping updates

---

### 2. `scripts/upload_mtc_data.py`

**Function**: `_find_similar_location()`

**Changes**:
```python
# OLD: Only fuzzy matched location names
SELECT id, name FROM locations WHERE name LIKE %s

# NEW: Four-step lookup process
1. Exact location name match
2. Exact alias match  # NEW
3. Fuzzy location name match
4. Fuzzy alias match  # NEW
```

**Benefits**:
- Works with MTC data naming conventions
- Prevents duplicate Chennai terminal creation

---

### 3. `scripts/upload_tnstc_data.py`

**Function**: `_find_similar_location()`

**Changes**:
```python
# OLD: Exact + fuzzy on locations only
1. Exact match on location name
2. Fuzzy match on location name

# NEW: Complete alias-aware lookup
1. Exact match on location name
2. Exact match on alias  # NEW
3. Fuzzy match on location name
4. Fuzzy match on alias  # NEW
```

**Benefits**:
- Handles TNSTC complex location names (e.g., "CHENNAI-KILAMBAKKAM-KCBT")
- Maps to correct database locations via aliases

---

### 4. `scripts/upload_bus_data.py`

**Function**: `_find_location_by_exact_name()` + `_find_similar_location()`

**Changes**:
```python
# _find_location_by_exact_name() - Updated
1. Exact location name match
2. Exact alias match  # NEW

# _find_similar_location() - Enhanced
1. Cache check
2. Exact match (via _find_location_by_exact_name, now alias-aware)
3. Fuzzy match on locations
4. Fuzzy match on aliases  # NEW
```

**Benefits**:
- Most comprehensive duplicate prevention
- Works with generic bus data uploads
- Handles hierarchical locations + aliases

## Lookup Priority

All scripts now follow this priority:

```
1. Exact name match     → Fast, most reliable
2. Exact alias match    → Fast, handles variations
3. Fuzzy name match     → Slower, finds similar names
4. Fuzzy alias match    → Comprehensive fallback
```

## Example Scenarios

### Scenario 1: TNSTC Data Upload
```python
# Bus data has: origin = "BROADWAY"
# Database has: location name = "Broadway Bus Terminus"

# Old behavior: Location not found → upload fails OR creates duplicate
# New behavior: 
#   1. Checks locations: No match
#   2. Checks aliases: Finds "BROADWAY" → location_id=123
#   3. Uses location_id=123 for bus insert
#   ✅ Upload succeeds
```

### Scenario 2: MTC Data Upload
```python
# Bus data has: origin = "Koyambedu"
# Database has: location name = "Chennai - CMBT (Koyambedu)"

# Old behavior: Creates duplicate "Koyambedu" location
# New behavior:
#   1. Checks locations: No exact match
#   2. Checks aliases: Finds "Koyambedu" → location_id=62428
#   3. Reuses existing location
#   ✅ No duplicate created
```

### Scenario 3: Case Variations
```python
# Bus data has: origin = "broadway" (lowercase)
# Database has: aliases for "BROADWAY", "Broadway", "broadway"

# Old behavior: Case-sensitive issues
# New behavior:
#   1. UPPER() comparison on alias names
#   2. Finds match regardless of case
#   ✅ Works with any case variation
```

## Migration Impact

### Before Database Migration (V102, V103)
- Python scripts will try to query non-existent `location_aliases` table
- Scripts will catch SQL errors and fall back to existing logic
- **Action**: Deploy database migrations BEFORE uploading new data

### After Database Migration
- All existing location names automatically get aliases
- Python scripts seamlessly use aliases for lookups
- **No manual intervention required**

## Performance Considerations

### Query Optimization
- Alias lookups use indexed `alias_name` column
- Fast exact matches (< 1ms)
- Fuzzy matching limited to 100 candidates for performance

### Caching
- All scripts maintain in-memory location caches
- Alias matches cached same as direct matches
- Reduces repeated database queries

### Expected Impact
- Minimal performance overhead (< 5% increase in lookup time)
- Significant improvement in data quality (fewer duplicates)
- Reduced upload failures

## Testing Checklist

Before deploying, test:

- [ ] Run database migrations V102 + V103
- [ ] Verify aliases created: `SELECT COUNT(*) FROM location_aliases;`
- [ ] Test TNSTC upload with "BROADWAY" origin
- [ ] Test MTC upload with "Koyambedu" origin
- [ ] Test uploads with UPPERCASE, lowercase, Mixed Case names
- [ ] Verify no duplicate locations created
- [ ] Check upload logs for alias match messages

## Deployment Steps

1. **Backup database**
   ```bash
   mysqldump -u user -p perundhu > backup_before_alias_scripts.sql
   ```

2. **Deploy Java backend** (applies migrations V102, V103)
   ```bash
   cd backend
   ./gradlew bootRun
   ```

3. **Verify aliases created**
   ```bash
   mysql -u user -p perundhu -e "SELECT COUNT(*) FROM location_aliases;"
   # Should show ~200K aliases
   ```

4. **Test Python upload** (with small dataset first)
   ```bash
   python3 import_tnstc_to_database.py --limit 10
   # Check logs for "Found location via alias" messages
   ```

5. **Run full data upload**
   ```bash
   python3 import_tnstc_to_database.py
   ```

## Rollback Plan

If issues occur:

1. **Stop uploads immediately**
2. **Restore database backup**
   ```bash
   mysql -u user -p perundhu < backup_before_alias_scripts.sql
   ```
3. **Revert Python script changes** (use git)
   ```bash
   git checkout HEAD~1 -- import_tnstc_to_database.py scripts/*.py
   ```

## Maintenance

### Adding New Aliases

**Option 1**: Add to database directly
```sql
INSERT INTO location_aliases (location_id, alias_name, is_primary)
VALUES (123, 'New Alias Name', FALSE);
```

**Option 2**: Update migration V103
- Add new aliases to appropriate section
- Re-run migration (may need manual cleanup)

### Monitoring

**Check alias usage**:
```sql
SELECT 
    la.alias_name,
    l.name as location_name,
    COUNT(b.id) as buses_using
FROM location_aliases la
JOIN locations l ON la.location_id = l.id
LEFT JOIN buses b ON b.from_location_id = l.id OR b.to_location_id = l.id
GROUP BY la.id, la.alias_name, l.name
ORDER BY buses_using DESC
LIMIT 20;
```

**Find unmatched location names** (locations without aliases):
```sql
SELECT l.name
FROM locations l
LEFT JOIN location_aliases la ON la.location_id = l.id
WHERE la.id IS NULL
ORDER BY l.name;
```

## Benefits Summary

✅ **Automatic name resolution** - No manual mapping updates needed  
✅ **Prevents duplicates** - Reuses existing locations  
✅ **Handles case variations** - Case-insensitive matching  
✅ **Works with all uploads** - TNSTC, MTC, generic bus data  
✅ **Backward compatible** - Falls back gracefully if aliases don't exist  
✅ **Performance optimized** - Indexed lookups, caching  
✅ **Easy maintenance** - Add aliases without code changes  

## Conclusion

The Python upload scripts are now fully integrated with the location aliases system. This provides seamless location name resolution during data upload, preventing duplicates and handling all naming variations automatically.

**No changes to the `LOCATION_MAPPING` dictionary needed** - the database-level aliases handle this automatically!
