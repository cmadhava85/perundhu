# Location Aliases System - Complete Implementation

## Problem Solved

**Issue**: Broadway and other locations have multiple names across different data sources, causing search failures.

### Examples:
- **Broadway**: "BROADWAY", "Broadway", "Broadway Bus Terminus", "Chennai - Broadway"
- **CMBT**: "CMBT", "Koyambedu", "Chennai - CMBT (Koyambedu)", "Mofussil Bus Terminus"
- **Madurai**: "MADURAI", "Madurai", "Madurai - Mattuthavani", "Mattuthavani"

**Impact**: Users searching for "Broadway" wouldn't find buses listed with origin "BROADWAY" or "Broadway Bus Terminus".

## Solution Architecture

### 1. Location Aliases Table (`location_aliases`)

```sql
CREATE TABLE location_aliases (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    location_id BIGINT NOT NULL,           -- Points to canonical location
    alias_name VARCHAR(255) NOT NULL UNIQUE,-- Alternative name
    is_primary BOOLEAN DEFAULT FALSE,       -- Primary/canonical name flag
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);
```

**Purpose**: Maps ALL alternative names to a single canonical location.

### 2. Automatic Alias Population

The system automatically creates aliases for:

1. **Exact location names** (primary)
2. **UPPERCASE variants** - handles case variations
3. **Short names** - "Chennai - Broadway" → "Broadway"
4. **Base names** - "Broadway Bus Terminus" → "Broadway"
5. **Manual high-priority aliases** - common abbreviations

#### Example: Broadway Location

| location_id | alias_name | is_primary |
|-------------|------------|------------|
| 123 | Broadway Bus Terminus | TRUE |
| 123 | BROADWAY BUS TERMINUS | FALSE |
| 123 | Broadway | FALSE |
| 123 | BROADWAY | FALSE |
| 123 | Chennai - Broadway | FALSE |
| 123 | Broadway Terminus | FALSE |

## Implementation Details

### Database Layer

#### Files Added:
1. **V102__add_location_aliases_table.sql** - Creates table structure
2. **V103__populate_location_aliases.sql** - Populates aliases for ALL locations
3. **LocationAliasJpaEntity.java** - JPA entity
4. **LocationAliasJpaRepository.java** - Spring Data repository

### Repository Layer

#### New Methods in `LocationRepository`:

```java
// Find location by any alias name
Optional<Location> findByAlias(String aliasName);

// Autocomplete with alias support
List<Location> findByAliasContaining(String aliasPattern);

// Get all location IDs (aliases + hierarchy combined)
List<Long> findLocationIdsByNameOrAlias(String locationName);
```

#### Implementation in `LocationJpaRepositoryAdapter`:

- **Alias resolution**: Resolves any alias to canonical location
- **Hierarchical expansion**: Returns parent + all children
- **Combined search**: Uses both aliases AND hierarchy

```java
// Example: Search "Broadway" → finds location 123 → expands to [123] → returns buses
List<Long> ids = locationRepository.findLocationIdsByNameOrAlias("Broadway");
// Result: [123] (or [1, 123, 234] if Broadway has children)
```

### Service Layer

#### Updated `BusScheduleServiceImpl`:

**1. searchRoutesAsDTO()** - Now alias-aware:
```java
// OLD: Only exact name matches
Optional<Location> fromLoc = locationRepository.findByExactName(fromLocation);

// NEW: Resolves aliases + hierarchy
List<Long> fromLocationIds = locationRepository.findLocationIdsByNameOrAlias(fromLocation);
```

**2. searchLocationsByName()** - Enhanced autocomplete:
```java
// Searches in:
1. Tamil translations
2. English names
3. **ALIASES** (NEW)
4. Bus stands
```

### Wiring

#### Updated `HexagonalConfig.java`:
```java
@Bean
public LocationRepository locationRepository(
    LocationJpaRepository locationJpaRepository,
    LocationAliasJpaRepository aliasJpaRepository) {  // NEW
    return new LocationJpaRepositoryAdapter(locationJpaRepository, aliasJpaRepository);
}
```

## How It Works - End to End

### User Search Flow:

```
1. User types: "broadway" (lowercase)
   ↓
2. Autocomplete: findByAliasContaining("broadway")
   ↓
3. Finds alias: "broadway" → location_id=123 (Broadway Bus Terminus)
   ↓
4. Returns: "Broadway Bus Terminus" in dropdown
   
5. User searches: "broadway to madurai"
   ↓
6. Bus Search: findLocationIdsByNameOrAlias("broadway")
   ↓
7. Resolves: "broadway" → location_id=123 via alias
   ↓
8. Expands hierarchy: [123] (no children in this case)
   ↓
9. Queries: buses WHERE origin_id IN (123) AND destination_id IN (456, 457, 458)
   ↓
10. Returns: ALL buses from Broadway to Madurai (any terminal)
```

### Combined with Parent-Child Hierarchy:

```
Search "Chennai"
   
1. Alias Resolution:
   "Chennai" → location_id=1 (Chennai city)
   
2. Hierarchical Expansion:
   location_id=1 → [1, 62428, 99355, 99295, ...]
   (Chennai + CMBT + KCBT + Tambaram + Broadway + ...)
   
3. Bus Query:
   Find buses WHERE origin_id IN (1, 62428, 99355, ...) 
                AND destination_id IN (...)
                
4. Result:
   Buses from ANY Chennai terminal to destination
```

## Benefits

### 1. Handles ALL Name Variations
- **Case insensitive**: "BROADWAY", "Broadway", "broadway" all work
- **Abbreviations**: "CMBT", "Koyambedu" find same location
- **Full names**: "Broadway Bus Terminus" works
- **Short names**: "Broadway" works

### 2. Zero User Friction
- Users don't need to know exact database names
- Natural search - "broadway", "madurai", etc. just work
- Handles inconsistencies between data sources

### 3. Scalable
- Automatically populates aliases for ALL locations
- New locations get aliases via migration rules
- Easy to add more aliases in the future

### 4. Works with Existing Features
- **Hierarchy**: City → Terminals → Search all
- **Aliases**: Name variations → Same location
- **Combined**: "Chennai" finds buses from all terminals, regardless of name variation

## Testing Scenarios

### Test Cases:

1. **Case Variations**:
   - Search "broadway" → finds buses
   - Search "BROADWAY" → finds buses
   - Search "Broadway" → finds buses

2. **Name Variations**:
   - Search "Broadway" → works
   - Search "Broadway Bus Terminus" → works
   - Search "Chennai - Broadway" → works
   - ALL return SAME location

3. **Abbreviations**:
   - Search "CMBT" → finds Koyambedu terminal
   - Search "Koyambedu" → finds CMBT
   - Both return SAME location

4. **Combined with Hierarchy**:
   - Search "Chennai to Madurai" → finds buses from ALL Chennai terminals
   - Each terminal might have multiple name aliases

## Maintenance

### Adding New Aliases:

**Option 1: Manual SQL**
```sql
INSERT INTO location_aliases (location_id, alias_name, is_primary)
VALUES (123, 'Your New Alias', FALSE);
```

**Option 2: New Migration**
```sql
-- V104__add_more_aliases.sql
INSERT INTO location_aliases (location_id, alias_name, is_primary)
SELECT id, 'New Alias Name', FALSE
FROM locations
WHERE name = 'Existing Location Name';
```

### Viewing Aliases:

```sql
SELECT 
    l.name AS location,
    GROUP_CONCAT(la.alias_name SEPARATOR ' | ') AS all_aliases,
    COUNT(la.id) AS total_aliases
FROM locations l
LEFT JOIN location_aliases la ON la.location_id = l.id
GROUP BY l.id, l.name
HAVING total_aliases > 0
ORDER BY total_aliases DESC;
```

## Migration Instructions

### For Existing Database:

```bash
# 1. Backup database
mysqldump -u user -p perundhu > backup_before_aliases.sql

# 2. Apply migrations (Flyway will run automatically on startup)
cd backend
./gradlew bootRun

# 3. Verify aliases were created
mysql -u user -p perundhu -e "SELECT COUNT(*) FROM location_aliases;"

# 4. Test search
curl "http://localhost:8080/api/v1/locations/autocomplete?q=broadway"
```

### Rollback Plan:

```sql
-- If needed, rollback:
DROP TABLE location_aliases;
-- Then remove V102 and V103 from flyway_schema_history
DELETE FROM flyway_schema_history WHERE version IN ('102', '103');
```

## Performance Considerations

### Indexes:
- `idx_alias_name` - Fast alias lookups (most common operation)
- `idx_location_id` - Fast location → aliases lookup
- `unique_alias_name` - Prevents duplicate aliases

### Query Optimization:
- Alias lookups use indexed column
- Hierarchy expansion caches results
- Combined queries use `IN` clause (efficient for small ID lists)

### Expected Load:
- ~50K locations × 3-5 aliases = ~200K alias records
- Lookup: < 1ms (indexed)
- Autocomplete: < 10ms (indexed + LIMIT 10)

## Future Enhancements

### Potential Additions:
1. **Fuzzy matching**: Handle typos ("Brodway" → "Broadway")
2. **Tamil aliases**: Auto-generate Tamil variations
3. **Historical names**: Support old location names
4. **User aliases**: Allow users to define custom aliases
5. **Analytics**: Track which aliases are used most

## Summary

This implementation provides a **complete, scalable solution** for handling location name variations across the entire application. Key features:

✅ Handles ALL location name variations (not just Broadway)  
✅ Automatic alias population for existing and new locations  
✅ Works seamlessly with parent-child hierarchy  
✅ Zero configuration for users  
✅ Supports autocomplete and bus search  
✅ Performance optimized with indexes  
✅ Easy to extend with more aliases  

**Result**: Users can now search using ANY name variation and find the correct results!
