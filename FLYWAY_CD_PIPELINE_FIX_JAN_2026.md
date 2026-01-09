# 🔧 Flyway CD Pipeline Fix - January 2026

## Problem Identified

Your CD pipeline failed at the Flyway migration step with the following root causes:

### Issue 1: Baseline Version Mismatch ❌
```
Migration V56 is your actual baseline migration file:
- File: V56__baseline_complete_schema.sql
- Purpose: Complete schema after consolidation

But the CD pipeline was configured with:
- baselineVersion=57  ← WRONG!
```

**Impact**: Flyway couldn't determine which migrations had already been applied, causing the migration history table to become inconsistent.

### Issue 2: Aggressive Migration Strategy ❌
```gradle
// Always attempting flywayRepair first
./gradlew flywayRepair  // Could fail on first deployment
./gradlew flywayMigrate // Then try to migrate
```

**Impact**: On a clean database, `flywayRepair` with no history table would fail, blocking the entire deployment.

---

## Solution Implemented ✅

### Change 1: Fixed Baseline Version
```diff
- baselineVersion=57 \
- baselineDescription="Baseline after manual V56-57"
+ baselineVersion=56 \
+ baselineDescription="Baseline complete schema"
```

Now correctly matches your actual V56 migration file.

### Change 2: Smarter Migration Strategy
```bash
# New strategy: Try migration first, repair only if needed
if migration succeeds:
  ✅ Done
else:
  ⚠️  Repair migration history table
  🔄 Retry migration
```

---

## Migration Files
Your current migration sequence:

| Version | File | Purpose |
|---------|------|---------|
| V56 | `V56__baseline_complete_schema.sql` | **BASELINE** - Complete schema |
| V57 | `V57__add_multistate_locations.sql` | Add multi-state support |
| V58 | `V58__add_missing_route_contributions_columns.sql` | Route contributions |
| V59 | `V59__fix_system_settings_and_locations_tables.sql` | Bug fixes |
| V60 | `V60__add_missing_announcement_columns.sql` | Announcements |
| V61 | `V61__add_missing_locations_columns.sql` | Location improvements |

---

## What Changed in CD Pipeline

**File**: `.github/workflows/cd-preprod.yml`

### Step 1: Install Cloud SQL Proxy ✅
```bash
curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64
chmod +x cloud_sql_proxy
sudo mv cloud_sql_proxy /usr/local/bin/
```

### Step 2: Run Flyway Migrations (IMPROVED) ✅
```bash
# Step 1: Try direct migration
./gradlew flywayMigrate \
  -Pflyway.baselineVersion=56 \
  -Pflyway.baselineDescription="Baseline complete schema"

# Step 2: If fails, repair and retry
if failed:
  ./gradlew flywayRepair
  ./gradlew flywayMigrate
```

---

## How to Verify the Fix

### Before Next Deployment
1. ✅ Check Cloud SQL instance is running
2. ✅ Verify database credentials in GCP Secrets Manager
3. ✅ Ensure no locks on `flyway_schema_history` table

### Monitor the Workflow
1. Push code to trigger CD pipeline
2. Watch "Run Migrations" job
3. Look for: `✅ Flyway migrations completed successfully`

### If Still Failing
1. Check job logs for specific error message
2. Verify GCP credentials are correct
3. Ensure Cloud SQL Proxy starts on port 3306
4. Check migration SQL files for syntax errors

---

## Technical Details

### Baseline Concept in Flyway
```
A "baseline" migration is the starting point when using Flyway.
It marks: "Everything from V1 to this version already exists in the database"

Example:
- Baseline Version = 56
- Means: V1 through V56 are already applied
- Only V57, V58, V59, V60, V61 need to run

If you set baseline=57:
- Means: V1 through V57 are already applied
- But V56 is the actual schema baseline file
- Conflict! → Migration fails
```

### Why Repair Only on Demand
```
flywayRepair:
- Fixes corrupted migration history table
- SHOULD NOT run on clean databases
- Best used only when history table is broken

Solution:
- Try migration first (works on clean DB)
- Only repair if needed (works on corrupted DB)
- Better reliability across different scenarios
```

---

## Files Changed
- `.github/workflows/cd-preprod.yml` - Migration strategy updated

## Commit
- **Hash**: `29d0b7b`
- **Message**: "Fix: Correct Flyway baselineVersion from 57 to 56 and improve migration error handling"

---

## Next Steps

1. **Next Deployment**: Trigger CD pipeline with this fix
2. **Monitor**: Watch Flyway migration step - should complete without errors
3. **Verify**: Backend service should start and be accessible
4. **Success**: Migrations apply V57-V61 without issues

---

**Status**: ✅ **READY FOR DEPLOYMENT**

The CD pipeline fix is ready. Next push to master or manual trigger of the CD pipeline will use the corrected baseline version and improved error handling strategy.
