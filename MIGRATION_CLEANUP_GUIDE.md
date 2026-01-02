# Flyway Migration Cleanup - Complete Guide

## Summary of Changes

All migration files have been **consolidated and cleaned up** to eliminate conflicts:

### What Was Deleted
- ❌ V1.1 through V6 (all problematic migrations)
- These migrations had conflicting table definitions, indices, and MySQL syntax issues
- They were causing "Duplicate key name" errors in preprod

### What Remains
- ✅ **V1__init.sql** - Comprehensive base schema (consolidated all V1.1-V6 definitions)
- ✅ **V23-V29** - New features added later (social media, reviews, announcements, etc.)

## Migration Structure

**New and Clean:**
```
V1__init.sql (everything needed for base schema)
├── Tables: locations, buses, stops, connecting_routes, translations
├── Contribution tables: route_contributions, image_contributions
├── OSM integration: osm_bus_stops, osm_route_stops
├── Issues tracking: route_issues
└── All indices and base data

V23__create_social_media_posts_table.sql (new features)
V26__create_system_settings_table.sql
V27__make_bus_number_nullable.sql
V28__create_reviews_table.sql
V29__create_announcements_table.sql
```

## Preprod Recovery Steps

### Step 1: Clean Up Preprod Database
Run the cleanup script to remove failed migration records:

```bash
mysql -h your-preprod-host -u root -p perundhu < scripts/fix-preprod-migration-state.sql
```

OR manually:
```bash
mysql -h your-preprod-host -u root -p perundhu << 'EOF'
DELETE FROM flyway_schema_history WHERE success = 0;
SELECT * FROM flyway_schema_history ORDER BY installed_rank;
EOF
```

### Step 2: Deploy New Code
```bash
# Build the backend with new migrations
./gradlew clean build -x test

# Push to preprod
git push origin master
```

### Step 3: Run Migrations
When the preprod application starts with Spring Boot, Flyway will:
1. Check the schema_history table
2. See that V1 is the baseline
3. Apply V23-V29 as new migrations
4. Everything should work cleanly

## Why This Works

### Old Problem (V1.1-V6):
- V1.1 tried to create route_contributions table
- V2.1-2.3 tried to modify it repeatedly
- All migrations modified the same tables causing conflicts
- Each migration couldn't handle pre-existing state

### New Solution (Consolidated V1):
- **V1** creates the complete, final schema in one shot
- No subsequent migrations modify the core tables
- V23+ only ADD new tables (safe operation)
- Fully idempotent - can be re-run without errors

## Local Testing

Test on your local machine first:

```bash
# Reset local database
mysql -h localhost -u root -proot -e "DROP DATABASE perundhu; CREATE DATABASE perundhu;"

# Run migrations
cd backend
./gradlew flywayMigrate

# Verify
mysql -h localhost -u root -proot perundhu -e \
  "SELECT COUNT(*) as total, COUNT(CASE WHEN success=1 THEN 1 END) as successful FROM flyway_schema_history;"

# Should show: 6 total, 6 successful
# (V1 baseline + V23 + V26 + V27 + V28 + V29)
```

## Key Advantages

1. **No More Conflicts** - Single consolidated base schema
2. **Easy to Maintain** - Only 6 migration files vs 26
3. **Idempotent** - Safe to re-run on any environment
4. **Fast Deployments** - Fewer migrations to apply
5. **Clear History** - Easy to trace what changed

## If Preprod Still Fails

1. **Check flyway_schema_history**:
```sql
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;
```

2. **Look for failed migrations** (success = 0):
```sql
DELETE FROM flyway_schema_history WHERE success = 0;
```

3. **Check application logs** for specific error messages

4. **Verify tables exist**:
```sql
SHOW TABLES;
DESCRIBE locations;
DESCRIBE buses;
```

## Next Steps

1. Test locally with `./gradlew flywayMigrate`
2. Run `./gradlew bootRun` to verify app starts
3. Apply cleanup script to preprod
4. Deploy new code
5. Verify migrations applied: `SELECT * FROM flyway_schema_history;`
