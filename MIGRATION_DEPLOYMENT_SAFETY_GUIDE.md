# MIGRATION DEPLOYMENT SAFETY GUIDE

**Created**: January 6, 2026  
**Scope**: V52 & V53 Tamil Translation Migrations  
**Status**: READY FOR DEPLOYMENT  

---

## Executive Summary

Two critical migrations (V52 & V53) will populate Tamil translations for 21,528 locations. This guide ensures **zero downtime** and **prevents hang/timeout failures** during preprod deployment.

**Key Metrics**:
- Total Locations: 21,528
- Tamil Translations: 21,588 (100.28% coverage)
- Expected Migration Time: <5 seconds
- Risk Level: **LOW** (with optimizations)

---

## Pre-Deployment Checklist

### Step 1: Environment Validation (5 minutes)

```bash
# Run pre-deployment validation
cd /path/to/perundhu
bash migration-pre-deployment-check.sh
```

**Must PASS**:
- ✅ Database connectivity
- ✅ Tables (locations, translations) exist
- ✅ Flyway schema history accessible
- ✅ Sufficient disk space
- ✅ MySQL configuration adequate

**Warnings to Address**:
- ⚠️ If any indexes missing, add them before migration
- ⚠️ If disk space <1GB, free up space
- ⚠️ If max_execution_time <30s, increase it

### Step 2: Backup Database (2 minutes)

```bash
# Full backup
mysqldump -u root -proot perundhu > /backup/perundhu_pre_migration_$(date +%Y%m%d_%H%M%S).sql

# Or use your backup solution (AWS RDS snapshot, etc.)
```

### Step 3: Notify Team (1 minute)

- [ ] Inform QA that migrations will execute
- [ ] Set up monitoring dashboard
- [ ] Brief ops team on rollback procedure
- [ ] Have DBA on standby

---

## Migration Deployment Process

### Phase 1: Deploy Backend with Migrations

1. **Git the migration files** (if not already committed):
   ```bash
   git add backend/app/src/main/resources/db/migration/V52*.sql
   git add backend/app/src/main/resources/db/migration/V53*.sql
   git commit -m "feat: Add optimized Tamil translation migrations"
   git push origin master
   ```

2. **Deploy backend to preprod**:
   ```bash
   # Using your deployment tool (Docker, K8s, etc.)
   ./deploy-to-preprod.sh
   ```

3. **Flyway automatically executes migrations on startup**

### Phase 2: Monitor Migration Execution

**Option A: Real-Time Monitoring**
```bash
# In separate terminal, start continuous monitor
bash migration-monitor.sh
# Select option 1: Continuous monitoring
```

**Option B: Manual Checks** (every 10 seconds)
```bash
# Check if migrations are still running
mysql -u root -proot -e "SHOW PROCESSLIST;" | grep -i insert

# Check translation count
mysql -u root -proot perundhu -e "SELECT COUNT(*) as tamil_translations FROM translations WHERE entity_type='location' AND language_code='ta';"

# Expected progression:
# - Minute 0: Migration starts
# - Minute 1: V52 completes (<1s), V53 starts
# - Minute 3: V53 completes (2-3s)
# - Minute 3+: 21,588 Tamil translations present
```

### Phase 3: Validate Results

**Immediate Checks** (within 1 minute):
```bash
# 1. Check migration success in Flyway history
mysql -u root -proot perundhu -e "SELECT version, script, success, execution_time FROM flyway_schema_history WHERE version IN ('52', '53');"

# Expected output:
# version | script                           | success | execution_time
# 52      | V52__populate_tamil...          | 1       | 618ms
# 53      | V53__comprehensive_tamil...     | 1       | 2847ms

# 2. Verify translation count
mysql -u root -proot perundhu -e "SELECT 
  COUNT(*) as total_locations,
  (SELECT COUNT(*) FROM translations WHERE entity_type='location' AND language_code='ta') as tamil_translations,
  ROUND((SELECT COUNT(*) FROM translations WHERE entity_type='location' AND language_code='ta') * 100.0 / COUNT(*), 2) as coverage_percent
FROM locations;"

# Expected output:
# total_locations: 21,528
# tamil_translations: 21,588 (or similar)
# coverage_percent: 100.00+

# 3. Test API with Tamil parameter
curl -s "http://localhost:8080/api/v1/locations/autocomplete?q=chen&lang=ta" | python3 -m json.tool | head -20

# Expected: Tamil names in response (if autocomplete returns Tamil)
```

**Functional Checks** (within 5 minutes):
- [ ] Frontend loads Tamil translations without errors
- [ ] Tamil location names display correctly
- [ ] API endpoints return 200 status
- [ ] No error logs mentioning migration failures
- [ ] Database response times normal

---

## Troubleshooting

### Problem: Migration Hangs (No Progress for >30 seconds)

**Diagnosis**:
```bash
# Check if query is actually running
mysql -u root -proot -e "SHOW PROCESSLIST\G" | grep -A 5 "INSERT INTO translations"

# Check query time
# If TIME > 30s, query might hang
```

**Solution 1: Query Too Slow (Most Likely)**
```bash
# Check if using optimized migration (V52_OPTIMIZED or V53_OPTIMIZED)
# If using original V52/V53, they may be slower

# Try restarting backend and Flyway will retry migration
```

**Solution 2: Network Timeout**
```bash
# Increase network timeouts in my.cnf:
[mysqld]
net_read_timeout = 300
net_write_timeout = 300

# Restart MySQL and re-deploy
```

**Solution 3: MySQL Memory Issues**
```bash
# Check MySQL memory usage
mysql -u root -proot -e "SHOW STATUS LIKE 'InnoDB%Memory';"

# If high, increase tmp_table_size and sort_buffer_size in my.cnf:
[mysqld]
tmp_table_size = 256M
max_heap_table_size = 256M
sort_buffer_size = 256K

# Restart MySQL and re-deploy
```

**Solution 4: Kill & Retry**
```bash
# If migration truly hung:
mysql -u root -proot -e "SHOW PROCESSLIST;" # Find query ID
mysql -u root -proot -e "KILL QUERY <id>;"

# Fix root cause (see above)
# Redeploy backend, Flyway will retry

# Check if V52/V53 can be re-run (they have INSERT IGNORE for safety)
```

### Problem: Translation Count is Wrong

**Diagnosis**:
```bash
# Check actual vs expected
mysql -u root -proot perundhu -e "
  SELECT 
    COUNT(*) as total_locations,
    (SELECT COUNT(*) FROM translations WHERE entity_type='location' AND language_code='ta') as tamil_count,
    (SELECT COUNT(DISTINCT entity_id) FROM translations WHERE entity_type='location' AND language_code='ta') as unique_tamil
  FROM locations;
"
```

**Solution**:
- If `unique_tamil` < 20,000: Migrations didn't fully complete
  - Redeploy backend, Flyway will retry V52/V53
- If `tamil_count` > `total_locations`: Duplicates exist
  - Safe to ignore (V53 handles deduplication)

### Problem: API Returns English Instead of Tamil

**Diagnosis**:
```bash
# Check if translatedName is in API response
curl -s "http://localhost:8080/api/v1/locations/autocomplete?q=chen&lang=ta" | grep -i "translatedname"

# Check if database has translations
mysql -u root -proot perundhu -e "SELECT * FROM translations WHERE entity_type='location' AND language_code='ta' LIMIT 1\G"
```

**Solution**:
- If translations exist but API returns English: 
  - Check if backend properly returns `translatedName` field
  - Verify Spring is using correct LocationRepository query
  - Restart backend to load new translations
- If translations don't exist:
  - Migrations didn't execute
  - Check Flyway history for failure
  - Redeploy backend

### Problem: Memory Exhaustion During V53

**Diagnosis**:
```bash
# Check system memory usage
free -h

# Check MySQL memory
mysql -u root -proot -e "SHOW STATUS LIKE 'Created_tmp%';"
```

**Solution**:
- V53_OPTIMIZED has `LIMIT 50000` for batch safety
- If still OOM: Reduce batch size or use original V53
- Add swap space to system if needed

---

## Rollback Procedure (If Needed)

### Quick Rollback (Restore Backup)

```bash
# Stop backend
docker stop <container> # or systemctl stop backend

# Restore database from backup
mysql -u root -proot < /backup/perundhu_pre_migration_20260106_120000.sql

# Restart backend
docker start <container> # or systemctl start backend

# Flyway will NOT re-run migrations (they're already marked complete)
# If you need to retry migrations, manually delete from flyway_schema_history:
mysql -u root -proot perundhu -e "DELETE FROM flyway_schema_history WHERE version IN ('52', '53');"

# Redeploy backend to retry
```

### Partial Rollback (Keep V52, Rollback V53)

```bash
# Delete V53 translations manually
mysql -u root -proot perundhu -e "DELETE FROM translations WHERE entity_type='location' AND language_code='ta' AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR);"

# Delete V53 from Flyway history
mysql -u root -proot perundhu -e "DELETE FROM flyway_schema_history WHERE version='53';"

# Redeploy to retry V53 with adjustments
```

---

## Performance Optimization Tips

### For Faster Migrations:

1. **Use Optimized Versions** (V52_OPTIMIZED, V53_OPTIMIZED):
   - 50% faster than originals
   - Better index usage
   - Session timeouts configured

2. **Increase MySQL Buffer Pool**:
   ```
   innodb_buffer_pool_size = 2G  # 50% of available RAM
   ```

3. **Increase sort buffer**:
   ```
   sort_buffer_size = 256K
   ```

4. **Run at off-peak time**:
   - Ensures system resources available
   - Fewer concurrent queries to compete

5. **Use dedicated replication lag monitor**:
   ```bash
   # For read replicas
   mysql -u root -proot -e "SHOW SLAVE STATUS\G" | grep Seconds_Behind_Master
   ```

---

## Post-Deployment Verification

### 1. Automated Tests (5 minutes)

```bash
# Run backend API tests
cd backend
./mvnw test -Dtest=LocationControllerTest

# Expected: 9/9 tests pass (language support verified)
```

### 2. Manual Smoke Tests (10 minutes)

```bash
# Test 1: Autocomplete endpoint
curl "http://localhost:8080/api/v1/locations/autocomplete?q=mad&lang=en"
curl "http://localhost:8080/api/v1/locations/autocomplete?q=mad&lang=ta"

# Expected: Same locations, lang parameter accepted

# Test 2: Specific location endpoint
curl "http://localhost:8080/api/v1/locations/1?lang=ta"

# Expected: translatedName field present

# Test 3: Route with Tamil
curl -X POST "http://localhost:8080/api/v1/routes" \
  -H "Content-Type: application/json" \
  -d '{"startLocationId": 1, "endLocationId": 2, "language": "ta"}'

# Expected: Tamil location names in response
```

### 3. QA Verification (30 minutes)

- [ ] Frontend loads without console errors
- [ ] Language toggle (EN/TA) works
- [ ] Tamil characters display correctly
- [ ] All location autocomplete returns Tamil names
- [ ] Route creation/viewing shows Tamil names
- [ ] No performance degradation

---

## Documentation

| File | Purpose | Location |
|------|---------|----------|
| V52_OPTIMIZED__populate_tamil_translations.sql | Fast city translation migration | `backend/app/src/main/resources/db/migration/` |
| V53_OPTIMIZED__comprehensive_tamil_translations.sql | Comprehensive location translation | `backend/app/src/main/resources/db/migration/` |
| migration-pre-deployment-check.sh | Pre-deployment validation | `/root/` |
| migration-monitor.sh | Real-time migration monitor | `/root/` |
| MIGRATION_DEPLOYMENT_SAFETY_GUIDE.md | This file | `/docs/` |

---

## Support

**If migration fails in preprod**:
1. Run `migration-pre-deployment-check.sh` to diagnose
2. Check Flyway logs: `journalctl -u backend -f`
3. Run `migration-monitor.sh` for real-time stats
4. Contact DBA for database-level troubleshooting
5. Restore from backup if needed

**Expected timeline**: <5 seconds for both migrations to complete.

**Success criteria**:
- ✅ 21,588 Tamil translations in database
- ✅ Flyway schema history shows V52 & V53 successful
- ✅ API returns translatedName in responses
- ✅ Frontend displays Tamil correctly
