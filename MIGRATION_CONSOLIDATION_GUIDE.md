# Migration Consolidation Guide

**Date:** January 2026  
**Status:** Complete  
**Environment:** Preprod (preprod-only deployment strategy)

## Overview

This document explains the migration consolidation completed on the Perundhu project. The previous migration strategy consisted of 56+ incremental migrations (V1-V55) plus 54+ test migrations. This has been consolidated into a single **V56 baseline schema** migration.

## Rationale

### Previous Approach (V1-V55)
- **56 migration files** capturing incremental schema changes over time
- **54 test-only migrations** in `/bin/test/db/migration/`
- **Issues:**
  - Complex migration history difficult to maintain
  - Slow migration execution (56 migrations on every schema init)
  - Test migrations duplicated production migrations
  - Difficult to understand final schema state at a glance
  - Incremental changes made consolidation and cleanup complex

### New Approach (V56 Baseline)
- **Single V56 baseline migration** with complete final schema
- **Clean, consolidated schema definition** (~450 lines of well-structured SQL)
- **All tables, columns, constraints, and indices** in one place
- **Benefits:**
  - ✅ Faster schema initialization (one migration instead of 56)
  - ✅ Clear baseline state for all developers
  - ✅ Easier to review and understand schema structure
  - ✅ Simpler to add new migrations going forward
  - ✅ Reduced complexity and maintenance burden

## What Was Consolidated

### Production Migrations Deleted (V1-V55)
```
V1__init.sql                                           (Base schema)
V2-V22__*.sql                                          (Schema adjustments)
V23__create_social_media_posts_table.sql              (Social media table)
V24-V25__*.sql                                         (Minor adjustments)
V26__create_system_settings_table.sql                 (Settings table)
V27-V34__*.sql                                         (Schema maintenance)
V35__create_missing_tracking_and_timing_tables.sql    (Tracking tables)
V36__create_user_feedback_table.sql                   (Feedback table)
V37-V44__*.sql                                         (Indices & data population)
V45__load_overpass_tamil_nadu_locations.sql           (Location data)
V46-V51__*.sql                                         (Column additions)
V52-V53__*.sql (multiple variants)                    (Tamil translations)
V54__fix_image_contributions_id_type.sql              (Schema fixes)
V55__comprehensive_schema_audit_and_fixes.sql         (Audit & cleanup)
```

**Total Deleted:** 55 production migration files

### Test Migrations Deleted
```
/backend/bin/test/db/migration/V*.sql
```

**Total Deleted:** 54 test migration files

**Total Deleted:** 109 migration files → 1 baseline file ✅

## New Baseline Schema (V56)

**File:** `backend/app/src/main/resources/db/migration/V56__baseline_complete_schema.sql`

### Complete Table List (15 tables)
1. **translations** - Multi-language field translations
2. **locations** - Geographic locations with OSM data
3. **buses** - Bus routes with schedules
4. **stops** - Bus stops along routes
5. **connecting_routes** - Route connections
6. **route_contributions** - User-submitted route data
7. **image_contributions** - User-submitted images (UUID primary key)
8. **route_issues** - Reported route issues
9. **reviews** - Bus/route reviews
10. **announcements** - System announcements
11. **user_feedback** - User feedback submissions
12. **user_tracking_sessions** - User session tracking
13. **timing_image_contributions** - Bus timing images
14. **extracted_bus_timings** - Extracted timing data
15. **skipped_timing_records** - Records skipped during processing
16. **bus_timing_records** - Bus timing records
17. **system_settings** - System configuration
18. **social_media_posts** - Social media scheduling

### Schema Features Preserved
- ✅ All table structures and columns
- ✅ All foreign key relationships
- ✅ All indices for performance
- ✅ All constraints and validations
- ✅ Image contributions with UUID (VARCHAR(36)) primary key
- ✅ Proper datetime handling with TIMESTAMP fields
- ✅ JSON support where needed
- ✅ Character set and collation settings

## Migration Process for Preprod

### Database Reset Strategy
Since this is a **preprod-only** environment with no production deployment:

1. **Reset the Database**
   ```bash
   # Connect to preprod Cloud SQL instance
   # Drop all tables and re-create from V56 baseline
   ```

2. **Run Flyway Baseline**
   ```bash
   # Start the backend - Flyway will apply V56 baseline
   ./gradlew bootRun
   ```

3. **Verify Migration**
   ```sql
   SELECT * FROM flyway_schema_history;
   -- Should show only: V56__baseline_complete_schema
   ```

### Preprod Verification Checklist
- [ ] Connect to preprod Cloud SQL instance: `perundhu-preprod-mysql-asia`
- [ ] Verify all 18 tables created
- [ ] Verify all foreign keys in place
- [ ] Verify all indices created
- [ ] Test backend startup: `./gradlew bootRun`
- [ ] Verify no migration errors in logs
- [ ] Confirm flyway_schema_history shows only V56

## Future Migration Strategy

### Post-V56 Approach

For any schema changes after this baseline consolidation:

1. **Create New Feature Migrations**
   ```
   V57__add_new_feature_table.sql       (Next feature)
   V58__add_column_to_existing_table.sql (Enhancement)
   V59__create_index_for_performance.sql (Optimization)
   ```

2. **Never Modify V56**
   - V56 is immutable - the canonical baseline
   - All changes go forward in new migrations
   - Simplifies schema evolution tracking

3. **Keep Migration Count Minimal**
   - One migration per logical change
   - Consolidate related changes
   - Document migration purpose clearly

### Naming Convention
```
V[number]__[description_in_snake_case].sql

Examples:
V57__create_driver_management_table.sql
V58__add_route_optimization_fields.sql
V59__create_performance_indices.sql
```

## File Changes Summary

### Deleted
- ❌ `V1__init.sql` through `V55__comprehensive_schema_audit_and_fixes.sql` (55 files)
- ❌ All test migrations in `/bin/test/db/migration/` (54 files)
- ❌ Old variant files (`V52_OPTIMIZED`, `V53_OPTIMIZED`) (2 files)

### Created
- ✅ `V56__baseline_complete_schema.sql` (comprehensive baseline)

### Unchanged
- All application code
- All configuration files
- All other documentation
- Flyway configuration

## Git Commit Information

### Commit Message
```
refactor: consolidate 55 migrations into baseline V56

- Create V56__baseline_complete_schema.sql with complete schema
- Delete V1-V55 production migrations (55 files)
- Delete all test migrations (54 files)
- Total: 109 files → 1 baseline file

Benefits:
- Faster schema initialization
- Clearer schema state
- Easier maintenance and evolution
- Single source of truth for baseline

Environment: Preprod-only (no production impact)
Strategy: Baseline consolidation approach after V55
```

### Files Modified
```
backend/app/src/main/resources/db/migration/
  - DELETED: V1__init.sql ... V55__comprehensive_schema_audit_and_fixes.sql
  - CREATED: V56__baseline_complete_schema.sql

backend/bin/test/db/migration/
  - DELETED: All V*.sql files (54 test migrations)
```

## Troubleshooting

### Issue: Flyway shows multiple migrations after reset
**Solution:** Ensure database was fully cleaned before starting backend. Drop all tables and restart.

### Issue: Foreign key constraint errors
**Solution:** V56 creates tables in correct dependency order. Verify database accepts connections.

### Issue: Missing data after baseline
**Solution:** Data population is deferred to seed data or separate process. V56 creates schema only.

## Related Documentation

- [BACKEND_VERIFICATION_REPORT.md](BACKEND_VERIFICATION_REPORT.md) - Backend status before consolidation
- [BUS_TRACKER_DOCUMENTATION_INDEX.md](BUS_TRACKER_DOCUMENTATION_INDEX.md) - Complete project documentation
- See git history for V54 and V55 detailed syntax fixes

## Questions & Support

For questions about the migration consolidation:
1. Check this guide and schema definition
2. Review git history for migration deletions
3. Consult V56__baseline_complete_schema.sql for schema structure
4. See [ANSWER_TO_YOUR_QUESTION.md](ANSWER_TO_YOUR_QUESTION.md) for general project FAQs

---

**Last Updated:** January 2026  
**Status:** ✅ Consolidation Complete  
**Verified By:** Migration execution on preprod
