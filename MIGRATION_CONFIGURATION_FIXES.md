# Comprehensive Flyway Migration Configuration Fixes

## Root Cause Analysis

The migrations (V58-V63) were **not being discovered or executed** due to misaligned configuration across three critical locations. This document details all issues found and fixed.

---

## Issue #1: CD Pipeline Missing Critical Flyway Parameters

### Problem
The CD pipeline's `run-migrations` job was missing essential Flyway parameters that are configured in `build.gradle`:

**Missing Parameters:**
- `-Pflyway.schemas=perundhu` - Flyway didn't know which schema to target
- `-Pflyway.cleanDisabled=true` - Missing from Flyway protect settings
- `-Pflyway.connectRetries=5` - Connection resilience settings
- `-Pflyway.connectRetriesInterval=1`
- `-Pflyway.lockRetryCount=50`

### Impact
Without these parameters, Flyway might:
- Connect to wrong schema or create issues
- Fail silently on first connection attempt
- Not retry on transient network failures

### Fix Applied
Updated `.github/workflows/cd-preprod.yml` to add all parameters to:
1. Initial `flywayMigrate` command
2. `flywayRepair` fallback command
3. `flywayMigrate` retry after repair

**Before:**
```yaml
./gradlew flywayMigrate \
  -Pflyway.url="$FLYWAY_URL" \
  -Pflyway.user="$FLYWAY_USER" \
  -Pflyway.password="$FLYWAY_PASSWORD" \
  -Pflyway.driver="com.mysql.cj.jdbc.Driver" \
  # ... missing schemas, cleanDisabled, connectRetries
```

**After:**
```yaml
./gradlew flywayMigrate \
  -Pflyway.url="$FLYWAY_URL" \
  -Pflyway.user="$FLYWAY_USER" \
  -Pflyway.password="$FLYWAY_PASSWORD" \
  -Pflyway.driver="com.mysql.cj.jdbc.Driver" \
  -Pflyway.baselineOnMigrate=true \
  -Pflyway.baselineVersion=57 \
  -Pflyway.baselineDescription="Baseline at V57 - multistate locations" \
  -Pflyway.outOfOrder=true \
  -Pflyway.validateOnMigrate=false \
  -Pflyway.cleanDisabled=true \
  -Pflyway.locations="filesystem:app/src/main/resources/db/migration" \
  -Pflyway.schemas=perundhu \
  -Pflyway.connectRetries=5 \
  -Pflyway.connectRetriesInterval=1 \
  -Pflyway.lockRetryCount=50 \
```

---

## Issue #2: Application-Preprod Properties Locations Misconfigured

### Problem
File: `/backend/app/src/main/resources/application-preprod.properties`

```properties
spring.flyway.locations=classpath:db/migration  # ❌ WRONG!
spring.flyway.out-of-order=false                # ❌ WRONG!
spring.flyway.validate-on-migrate=true          # ❌ WRONG!
```

**Issues:**
1. `classpath:db/migration` - Classpath location points to wrong directory structure (expects migrations in root `src/main/resources`, not in `app` submodule)
2. `out-of-order=false` - Prevents V58-V63 from running after baseline V57
3. Missing `baseline-version`, `baseline-description`, `clean-disabled`, `schemas`, and connection retry settings

### Impact
- Flyway can't find migration files when enabled
- Out-of-order=false prevents pending migrations from running
- If application starts with Flyway enabled, migrations won't execute

### Fix Applied
```properties
# Before
spring.flyway.locations=classpath:db/migration
spring.flyway.baseline-on-migrate=true
spring.flyway.clean-disabled=true
spring.flyway.validate-on-migrate=true
spring.flyway.out-of-order=false

# After
spring.flyway.locations=filesystem:app/src/main/resources/db/migration
spring.flyway.baseline-on-migrate=true
spring.flyway.baseline-version=57
spring.flyway.baseline-description=Baseline at V57 - multistate locations
spring.flyway.clean-disabled=true
spring.flyway.validate-on-migrate=false
spring.flyway.out-of-order=true
spring.flyway.connect-retries=5
spring.flyway.schemas=perundhu
```

---

## Issue #3: Build.gradle Locations Configuration

### Problem
File: `/backend/build.gradle` lines 299-320

```gradle
// Duplicate connectRetries definition (line 313 and 320)
connectRetries = 3
connectRetriesInterval = 1
// ... later ...
connectRetries = 5  // Overwrites the previous value

// Missing baseline configuration
// Missing cleanDisabled
```

### Impact
- Duplicate property causes confusion in maintenance
- Path resolution only works from specific directories
- Missing baseline version metadata

### Fix Applied
```gradle
// Before
locations = ["filesystem:${project(':app').projectDir.absolutePath}/src/main/resources/db/migration"]
baselineOnMigrate = true
validateOnMigrate = false
outOfOrder = true
// ... duplicate connectRetries ...
connectRetries = 3
// ...
connectRetries = 5

// After
def migrationPath = project.findProperty('flyway.locations') ?:
                    (file('app/src/main/resources/db/migration').exists() ?
                     "filesystem:${projectDir.absolutePath}/app/src/main/resources/db/migration" :
                     "filesystem:${project(':app').projectDir.absolutePath}/src/main/resources/db/migration")
locations = [migrationPath]
baselineOnMigrate = true
baselineVersion = '57'
baselineDescription = 'Baseline at V57 - multistate locations'
validateOnMigrate = false
outOfOrder = true
cleanDisabled = true
schemas = ['perundhu']

// Single definition
connectRetries = 5
connectRetriesInterval = 1
lockRetryCount = 50
```

---

## Issue #4: Transaction Management Configuration

### Problem
File: `/backend/app/src/main/resources/application-preprod.properties`

```properties
spring.datasource.hikari.auto-commit=true                              # ❌ WRONG
spring.jpa.properties.hibernate.connection.provider_disables_autocommit=true  # ❌ CONFLICTS!
```

**Conflict:**
- HikariCP configured with `auto-commit=true`
- But Hibernate configured with `provider_disables_autocommit=true`
- Result: "Can't call commit when autocommit=true" error

### Fix Applied
```properties
# Before
spring.datasource.hikari.auto-commit=true
spring.jpa.properties.hibernate.connection.provider_disables_autocommit=true

# After
spring.datasource.hikari.auto-commit=false
spring.jpa.properties.hibernate.connection.provider_disables_autocommit=false
```

This allows Hibernate to properly manage transaction boundaries.

---

## Summary of Fixes

| Component | Issue | Severity | Status |
|-----------|-------|----------|--------|
| CD Pipeline | Missing Flyway parameters (schemas, connectRetries, etc.) | **CRITICAL** | ✅ Fixed |
| Application-Preprod Properties | Wrong locations path, out-of-order=false | **CRITICAL** | ✅ Fixed |
| Build.gradle | Duplicate properties, missing baseline config | **HIGH** | ✅ Fixed |
| Application-Preprod Properties | Transaction management conflict (autocommit) | **CRITICAL** | ✅ Fixed |

---

## Verification Checklist

After the CD pipeline next runs (triggered by commit `58f645c`), verify:

- [ ] Cloud Run revision deployed successfully
- [ ] Migrations run before application deployment (job ordering correct)
- [ ] V57-V63 migrations execute in order
- [ ] announcements table has `announcement_category` column
- [ ] BusScheduleController.getAllLocations endpoint returns data
- [ ] AnnouncementController.getActiveAnnouncements endpoint returns data
- [ ] No "Unknown column" errors in logs

## Files Modified

1. `.github/workflows/cd-preprod.yml` - Added missing Flyway parameters
2. `backend/app/src/main/resources/application-preprod.properties` - Fixed locations, out-of-order, transaction config
3. `backend/build.gradle` - Improved path resolution, removed duplicates, added baseline config

## Commit Hashes

- `23f6704` - Fix transaction management (HikariCP autocommit=false)
- `0f0193f` - Add Pflyway.locations to CD pipeline
- `58f645c` - COMPREHENSIVE FIX (all three issues above)

---

## How This All Works Together

1. **CD Pipeline Triggers** → Checkout code → Build backend
2. **Run-Migrations Job** (before deployment):
   - Sets up Cloud SQL Proxy
   - Calls `./gradlew flywayMigrate` with **explicit parameters**
   - Parameters override application.properties since they're passed as -P flags
   - Discovers migrations from `filesystem:app/src/main/resources/db/migration`
   - Runs V58-V63 against `perundhu` schema
   - Handles retries with connectRetries=5
3. **Deploy-Backend Job** (depends on run-migrations):
   - Builds Docker image
   - Pushes to registry
   - Deploys to Cloud Run
   - Application starts with Flyway DISABLED (configured in app-preprod.properties)
   - Application connects to pre-migrated database
4. **Result**: Endpoints work because schema matches entity definitions

---

## Root Cause: Why This Happened

The multi-module Gradle project structure (`backend/` root, `backend/app/` submodule) created path resolution complexity:

- `build.gradle` correctly uses absolute path: `${project(':app').projectDir.absolutePath}`
- `application-preprod.properties` was using classpath, which doesn't work for submodule
- CD pipeline wasn't passing location parameters, relying on gradle.properties defaults
- Without explicit parameters, Flyway fell back to default locations that don't exist

**Prevention**: Always synchronize migration configuration across:
1. CD/CI Scripts
2. Application properties files  
3. Build files (gradle/maven)
4. Document the path structure in comments
