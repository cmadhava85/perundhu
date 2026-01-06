# Data Loading & Deployment Strategy for Multi-State Locations

**Purpose:** Define how V57 migration and location data loads in local, preprod, and production environments

---

## 🎯 Overview

**Current State:**
- V57 migration exists with 35 representative locations (testing data)
- Python script ready to generate 28K+ locations from Overpass API
- Flyway handles automatic migration on startup
- Production needs reliable, tested data loading strategy

**Challenges:**
1. V57 currently has representative data (35 locations) - not production-ready
2. Full data from Overpass (28K+) needs validation before production
3. Zero-downtime deployment required for production
4. Data consistency across multiple environments

**Solution:** Three-tier approach with environment-specific handling

---

## 📋 Strategy Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    ENVIRONMENT PROGRESSION                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  LOCAL DEV                  PREPROD               PRODUCTION │
│  ┌────────────┐            ┌──────────┐         ┌─────────┐ │
│  │ V57 Applied│            │ Full Data│         │ Validated
  │ │
│  │ 35 records│            │ 28K+ recs│         │ 28K+ recs│ │
│  │ (Quick)   │            │ (Tested) │         │ (Verified
  │ │
│  │ Testing   │            │ QA/Stats │         │ Live     │ │
│  └────────────┘            └──────────┘         └─────────┘ │
│       ↓                         ↓                     ↓       │
│   Verify                   Validate Data           Deploy    │
│   Indexes                  Check Quality           Safe      │
│                            Performance Tests        Tested    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 Phase 1: Local Development (Already Done ✅)

### Current State
- V57 migration auto-applies on backend startup
- Contains 35 representative locations
- Quick for testing API without full data

### Process
```bash
1. Backend starts → Spring Boot initialized
2. Flyway executes migrations in order
3. V57 applies INSERT statements
4. Indexes created
5. 35 locations ready in ~2 seconds
```

### Benefits
- ✅ Fast startup for development
- ✅ Test API endpoints immediately
- ✅ Verify service logic works
- ✅ Zero external dependencies

### Verification
```bash
# Check local database
mysql -u root -p perundhu -e "SELECT COUNT(*) as total_locations FROM locations;"
# Expected: 35 (if only V57 runs) or more (if other migrations exist)

# Check by state
mysql -u root -p perundhu -e "SELECT state, COUNT(*) FROM locations GROUP BY state;"
```

---

## 🎪 Phase 2: Preprod Environment

### Objective
Load full 28K+ location data from Overpass API with validation

### Two-Step Data Loading Strategy

#### Option A: Full Data via Updated Migration (Recommended)

**Step 1: Generate Complete SQL in Local Environment**
```bash
# When Overpass API is available
cd /Users/mchand69/Documents/perundhu/scripts
python3 fetch-multistate-locations-from-overpass.py

# Output: multistate_locations.sql (~2-3 MB)
# Expected: 28,000+ INSERT statements
```

**Step 2: Create V58 Migration with Full Data**
```bash
# Copy generated SQL as new migration (keep V57 as is)
cp scripts/multistate_locations.sql \
   backend/app/src/main/resources/db/migration/V58__add_complete_multistate_locations.sql

# Edit to add Flyway header
cat > backend/app/src/main/resources/db/migration/V58__add_complete_multistate_locations.sql << 'EOF'
-- Flyway Migration V58: Complete Multi-State Location Data
-- Source: Overpass API (OpenStreetMap data)
-- Generated: $(date)
-- Records: 28,000+
-- States: Tamil Nadu, Kerala, Karnataka, Andhra Pradesh

-- Insert complete location data (28K+ records)
[... contents of multistate_locations.sql ...]

-- Verify data load
SELECT COUNT(*) as total_locations FROM locations;
EOF
```

**Step 3: Deploy to Preprod**
```bash
# Preprod deployment with new migration
1. Code push to preprod branch
2. CI/CD pipeline builds Docker image
3. Database backup (automated)
4. New version deployed
5. Spring Boot startup → Flyway applies V57, V58
6. Data validation runs (see below)
```

#### Option B: Manual Data Load via Script (For Safety)

If you prefer more control, use this approach:

**Step 1: Deploy V57 Only (Just Indexes & Schema)**
```bash
# Keep V57 but remove INSERT statements
-- Create indexes without data
ALTER TABLE locations ADD INDEX idx_state (state);
ALTER TABLE locations ADD INDEX idx_state_district (state, district);
ALTER TABLE locations ADD INDEX idx_coordinates (latitude, longitude);
```

**Step 2: Load Data via Admin Script After Deployment**
```bash
# After application starts successfully
python3 /scripts/bulk_load_locations.py \
  --environment=preprod \
  --input-file=multistate_locations.sql \
  --batch-size=1000 \
  --skip-duplicates=true
```

**Benefits:**
- ✅ Control over data loading timing
- ✅ Can validate before bulk insert
- ✅ Easier to retry if issues
- ✅ Gradual data loading (less database load)

### Preprod Data Validation

After data loads, run validation tests:

```bash
#!/bin/bash
# Preprod validation script

echo "=== PREPROD DATA VALIDATION ==="

# 1. Count records by state
mysql -u $DB_USER -p$DB_PASS perundhu -e "
SELECT state, COUNT(*) as count 
FROM locations 
GROUP BY state 
ORDER BY count DESC;"

# Expected output:
# tamil_nadu      | 25000+
# karnataka       |  1200+
# kerala          |   750+
# andhra_pradesh  |   650+

# 2. Check for duplicates
mysql -u $DB_USER -p$DB_PASS perundhu -e "
SELECT name, latitude, longitude, COUNT(*) 
FROM locations 
GROUP BY name, latitude, longitude 
HAVING COUNT(*) > 1 
LIMIT 10;"

# Expected: 0 duplicates (or acceptable duplicates in different districts)

# 3. Verify indexes exist
mysql -u $DB_USER -p$DB_PASS perundhu -e "SHOW INDEX FROM locations;"

# 4. Performance test
mysql -u $DB_USER -p$DB_PASS perundhu -e "
SELECT * FROM locations 
WHERE state = 'karnataka' AND name LIKE '%Bangalore%' 
LIMIT 5;"

# Should return in < 50ms

# 5. API health check
curl http://preprod-api.example.com/actuator/health

# Should return: {"status":"UP"}
```

### Preprod Deployment Timeline

| Phase | Time | Task |
|-------|------|------|
| 1. Prepare | 15 min | Generate SQL, create V58 migration, review |
| 2. Build | 10 min | CI/CD builds Docker image with V58 |
| 3. Backup | 5 min | Automated backup of preprod database |
| 4. Deploy | 5 min | Rolling deployment to preprod instances |
| 5. Migrate | 2 min | Flyway applies V57, V58 migrations |
| 6. Validate | 10 min | Run validation tests, check data |
| 7. Smoke Test | 5 min | Test key endpoints with new data |
| **Total** | **~45 min** | Full deployment with validation |

---

## 🚀 Phase 3: Production Deployment

### Strategy: Zero-Downtime with Validation

#### Pre-Production Checklist
- [ ] V57 migration tested in local (✅ done)
- [ ] V58 migration generated from Overpass data (⏳ pending)
- [ ] V58 tested in preprod with validation passing (⏳ pending)
- [ ] Performance tests show < 200ms query time (⏳ pending)
- [ ] Rollback plan documented (✅ below)
- [ ] Data backup automated (⏳ confirm with DevOps)
- [ ] Communication to stakeholders (⏳ schedule)

#### Production Deployment Process

**Option 1: Blue-Green Deployment (Recommended)**

```
CURRENT (Blue)          NEW (Green)
┌────────────┐         ┌────────────┐
│ Production │         │ Production │
│ v1.0       │         │ v1.1       │
│ 35 records │         │ 28K records│
└────────────┘         └────────────┘
     ↑                       ↑
     │ (Current traffic)     │ (No traffic yet)
     │                       │
Load Balancer (100% → Blue)  (0% → Green)
     │
     └─────────────────────────────────┘
          Ready for cutover?

  Step 1: Deploy Green with new data
  Step 2: Run validation tests on Green
  Step 3: Warm-up Green with test traffic (5-10%)
  Step 4: Gradually shift traffic Blue → Green (25%, 50%, 75%, 100%)
  Step 5: Monitor metrics (latency, errors, data)
  Step 6: Complete cutover or rollback if issues

  Timeline: 30-60 minutes with gradual shifting
```

**Option 2: Scheduled Maintenance Deployment**

```
During scheduled maintenance window (off-peak):
1. Announcement: "Location data upgrade, ~5-10 min downtime"
2. Stop: Graceful shutdown of current instances
3. Backup: Final backup before changes
4. Migrate: Flyway applies V57, V58
5. Validate: Quick validation check
6. Restart: Bring up instances
7. Verify: Smoke tests pass
8. Announce: "Service restored with 28K+ location data"

Timeline: 10-15 minutes total downtime
```

#### Production Migration Script

```bash
#!/bin/bash
# Production safe deployment

set -e  # Exit on error

echo "=== PRODUCTION MIGRATION CHECKLIST ==="

# 1. Verify database connection
mysql -u $PROD_DB_USER -p$PROD_DB_PASS -e "SELECT 1;" > /dev/null
echo "✅ Database connection OK"

# 2. Create backup before migration
BACKUP_FILE="locations_backup_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -u $PROD_DB_USER -p$PROD_DB_PASS perundhu locations > /backups/$BACKUP_FILE
echo "✅ Backup created: $BACKUP_FILE"

# 3. Get current record count
BEFORE_COUNT=$(mysql -u $PROD_DB_USER -p$PROD_DB_PASS perundhu -N -e "SELECT COUNT(*) FROM locations;")
echo "ℹ️  Records before: $BEFORE_COUNT"

# 4. Deploy new version (triggers Flyway on startup)
docker pull registry.example.com/perundhu:v1.1
docker stop perundhu-prod || true
docker run -d \
  --name perundhu-prod \
  -e SPRING_PROFILES_ACTIVE=production \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://prod-db:3306/perundhu \
  -e SPRING_DATASOURCE_USERNAME=$PROD_DB_USER \
  -e SPRING_DATASOURCE_PASSWORD=$PROD_DB_PASS \
  registry.example.com/perundhu:v1.1

echo "ℹ️  Deployment started, waiting for migrations..."
sleep 30

# 5. Verify migrations applied
AFTER_COUNT=$(mysql -u $PROD_DB_USER -p$PROD_DB_PASS perundhu -N -e "SELECT COUNT(*) FROM locations;")
echo "ℹ️  Records after: $AFTER_COUNT"

# 6. Check health endpoint
for i in {1..10}; do
  HEALTH=$(curl -s http://localhost:8080/actuator/health | grep -o '"status":"[^"]*"' || echo 'DOWN')
  if [[ "$HEALTH" == *"UP"* ]]; then
    echo "✅ Application health: UP"
    break
  fi
  echo "⏳ Waiting for application... attempt $i/10"
  sleep 3
done

# 7. Validate data
echo "=== DATA VALIDATION ==="
mysql -u $PROD_DB_USER -p$PROD_DB_PASS perundhu << 'SQL'
-- Check state distribution
SELECT 'State Distribution:' as check_name;
SELECT state, COUNT(*) FROM locations GROUP BY state;

-- Check for duplicates
SELECT 'Duplicate Check:' as check_name;
SELECT COUNT(*) as duplicate_count 
FROM (
  SELECT name, latitude, longitude, COUNT(*) 
  FROM locations 
  GROUP BY name, latitude, longitude 
  HAVING COUNT(*) > 1
) AS dups;

-- Sample records
SELECT 'Sample Records:' as check_name;
SELECT name, state, district FROM locations LIMIT 5;
SQL

echo "✅ Validation complete"

# 8. Performance smoke test
echo "=== PERFORMANCE TEST ==="
START=$(date +%s%N)
mysql -u $PROD_DB_USER -p$PROD_DB_PASS perundhu -e "SELECT * FROM locations WHERE state = 'karnataka' LIMIT 10;" > /dev/null
END=$(date +%s%N)
DURATION=$((($END - $START) / 1000000))
echo "Query time: ${DURATION}ms"

if [ $DURATION -lt 200 ]; then
  echo "✅ Performance OK"
else
  echo "⚠️  Performance warning: Query took ${DURATION}ms (expected < 200ms)"
fi

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo "Backup location: /backups/$BACKUP_FILE"
echo "Records before: $BEFORE_COUNT"
echo "Records after: $AFTER_COUNT"
echo "Status: ✅ READY"
```

#### Production Rollback Plan

**If issues occur after deployment:**

```bash
#!/bin/bash
# Rollback to previous version

echo "=== INITIATING ROLLBACK ==="

# 1. Stop current version
docker stop perundhu-prod
docker rm perundhu-prod

# 2. Restore from backup
BACKUP_FILE="/backups/locations_backup_20260106_120000.sql"
mysql -u $PROD_DB_USER -p$PROD_DB_PASS perundhu < $BACKUP_FILE
echo "✅ Database restored from backup"

# 3. Deploy previous stable version
docker pull registry.example.com/perundhu:v1.0
docker run -d \
  --name perundhu-prod \
  -e SPRING_PROFILES_ACTIVE=production \
  registry.example.com/perundhu:v1.0

echo "✅ Previous version deployed"
echo "ℹ️  Manual verification required before next deployment attempt"
```

**When to Rollback:**
- ⚠️ API response time > 500ms
- ⚠️ Error rate > 1% on production traffic
- ⚠️ Database connection pool exhausted
- ⚠️ Duplicate location data found
- ⚠️ State mapping corrupted

---

## 📊 Environment Comparison

| Aspect | Local | Preprod | Production |
|--------|-------|---------|-----------|
| **Migration** | V57 only | V57 + V58 | V57 + V58 |
| **Records** | 35 (test) | 28K+ | 28K+ |
| **Database** | Local MySQL | Cloud SQL | Cloud SQL |
| **Data Validation** | Manual | Automated | Automated + manual |
| **Load Testing** | N/A | Yes | Smoke tests |
| **Downtime** | None | <5 min | 0 min (blue-green) |
| **Backup** | Optional | Automated | Automated |
| **Rollback Time** | <1 min | <5 min | <5 min |

---

## 🔍 Data Validation Queries

### For All Environments

```sql
-- 1. Total locations
SELECT COUNT(*) as total FROM locations;

-- 2. By state
SELECT state, COUNT(*) FROM locations GROUP BY state ORDER BY COUNT(*) DESC;

-- 3. By priority (hub importance)
SELECT priority, COUNT(*) FROM locations GROUP BY priority;

-- 4. By type (city/town/village)
SELECT type, COUNT(*) FROM locations GROUP BY type;

-- 5. Invalid coordinates (outside India)
SELECT COUNT(*) FROM locations 
WHERE latitude < 8 OR latitude > 35 OR longitude < 68 OR longitude > 97;

-- 6. Missing required fields
SELECT COUNT(*) FROM locations 
WHERE name IS NULL OR latitude IS NULL OR longitude IS NULL OR state IS NULL;

-- 7. Check indexes exist
SHOW INDEX FROM locations;

-- 8. Performance test (should be < 100ms)
SELECT * FROM locations WHERE state = 'tamil_nadu' AND name LIKE '%Chennai%';

-- 9. Multi-state query performance
SELECT * FROM locations 
WHERE state IN ('tamil_nadu', 'karnataka', 'kerala', 'andhra_pradesh')
AND priority = 1
LIMIT 20;
```

---

## 🚨 Monitoring & Alerts

### Post-Deployment Monitoring (First 24 Hours)

```yaml
Metrics to Monitor:
  - API Response Time: Should be < 200ms (query + serialize)
  - Error Rate: Should be < 0.1%
  - Database CPU: Should be < 30%
  - Database Memory: Should be stable
  - Cache Hit Rate: Should be > 80% (if caching enabled)

Alerts:
  - Response time > 500ms → Investigate query
  - Error rate > 1% → Check error logs
  - Database CPU > 50% → Check for missing indexes
  - Duplicate locations inserted → Investigate data load
```

### Long-term Monitoring

```bash
# Weekly data quality check
SELECT COUNT(DISTINCT name) as unique_locations,
       COUNT(*) as total_locations
FROM locations;

# Monthly state distribution review
SELECT state, COUNT(*) as count, 
       ROUND(100*COUNT(*)/(SELECT COUNT(*) FROM locations), 2) as percentage
FROM locations 
GROUP BY state;

# Quarterly performance analysis
SELECT 'Query Performance Report', MIN(query_time_ms), AVG(query_time_ms), MAX(query_time_ms);
```

---

## 📝 Deployment Checklist

### Before Preprod Deployment
- [ ] V57 tested locally ✅
- [ ] Python script generates valid SQL
- [ ] V58 migration created with full data
- [ ] Data validation queries reviewed
- [ ] Rollback plan documented
- [ ] Team communication done

### Before Production Deployment
- [ ] Preprod deployment successful ✅
- [ ] Preprod validation tests passed ✅
- [ ] Performance tests show acceptable times
- [ ] Backup automation verified
- [ ] Blue-green environment ready
- [ ] Monitoring alerts configured
- [ ] Runbook documented
- [ ] On-call team notified

### Post-Deployment (First 24 Hours)
- [ ] Monitor API latency
- [ ] Check error rates
- [ ] Verify database health
- [ ] Review application logs
- [ ] User feedback monitored
- [ ] No escalations reported

---

## 🎯 Timeline Summary

| Environment | Setup Time | Data Size | Downtime | Validation |
|-------------|-----------|-----------|----------|-----------|
| Local | < 1 min | 35 records | N/A | Manual |
| Preprod | 45 min | 28K+ records | < 5 min | Automated |
| Production | 15-60 min | 28K+ records | 0 min (blue-green) | Automated + manual |

---

## 🔗 Related Documents

- **[MULTISTATE_QUICK_START.md](MULTISTATE_QUICK_START.md)** - Quick implementation guide
- **[MULTISTATE_ROUTE_SUPPORT_GUIDE.md](MULTISTATE_ROUTE_SUPPORT_GUIDE.md)** - Complete feature guide
- **[PHASE4_API_INTEGRATION_GUIDE.md](PHASE4_API_INTEGRATION_GUIDE.md)** - API changes needed
- **[V57__add_multistate_locations.sql](backend/app/src/main/resources/db/migration/V57__add_multistate_locations.sql)** - Current migration

---

**Status:** 📋 Comprehensive deployment strategy ready for implementation  
**Next Step:** Execute data loading in preprod environment after Overpass API availability confirmed
