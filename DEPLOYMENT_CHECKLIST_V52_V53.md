# TAMIL MIGRATION DEPLOYMENT CHECKLIST

**Date**: January 6, 2026  
**Migrations**: V52 (optimized) & V53 (optimized)  
**Status**: READY FOR PREPROD DEPLOYMENT  

---

## Pre-Deployment Phase (Before Deployment)

### Database Preparation
- [ ] Run migration pre-deployment check:
  ```bash
  bash migration-pre-deployment-check.sh
  ```
- [ ] All checks must PASS (0 failures)
- [ ] Address any warnings before proceeding
- [ ] Backup database:
  ```bash
  mysqldump -u root -proot perundhu > /backup/perundhu_pre_v52_v53_$(date +%Y%m%d_%H%M%S).sql
  ```

### Team Notification
- [ ] Notify QA team about migration
- [ ] Brief backend team about rollback procedure
- [ ] Have DBA available for 10 minutes during deployment
- [ ] Set monitoring dashboard visible to team

### Verification Files Ready
- [ ] V52_OPTIMIZED__populate_tamil_translations.sql exists
- [ ] V53_OPTIMIZED__comprehensive_tamil_translations.sql exists
- [ ] migration-pre-deployment-check.sh ready
- [ ] migration-monitor.sh ready
- [ ] MIGRATION_DEPLOYMENT_SAFETY_GUIDE.md available

---

## Deployment Phase (During Deployment)

### Step 1: Backend Deployment Start (T+0min)
- [ ] Backend deployment initiated
- [ ] Flyway starts migration process
- [ ] Monitor console logs for migration startup

### Step 2: V52 Execution Monitoring (T+0-1min)
Expected behavior:
- [ ] INSERT INTO translations starting
- [ ] Query visible in PROCESSLIST
- [ ] No errors in logs

Start monitoring:
```bash
bash migration-monitor.sh
# Select option 1: Continuous monitoring
```

**Success Criteria**:
- [ ] V52 execution time: <1 second
- [ ] Query completes without timeout
- [ ] No "Max execution time exceeded" errors

### Step 3: V53 Execution Monitoring (T+1-3min)
Expected behavior:
- [ ] V52 marked as completed
- [ ] V53 INSERT begins
- [ ] 3-phase execution:
  1. Safe DELETE (old empty translations)
  2. Batch INSERT with LIMIT 50000
  3. Verification logging

**Success Criteria**:
- [ ] V53 execution time: 2-3 seconds
- [ ] No timeout errors
- [ ] No memory exhaustion warnings
- [ ] Translation count increases to 21,588+

### Step 4: Migration Completion Check (T+3-5min)
```bash
# Verify in terminal
mysql -u root -proot perundhu -e "SELECT version, success, execution_time FROM flyway_schema_history WHERE version IN ('52', '53');"
```

Expected output:
```
version  success  execution_time
52       1        618ms
53       1        2847ms
```

- [ ] V52 marked successful (success=1)
- [ ] V53 marked successful (success=1)
- [ ] Execution times reasonable

### Step 5: Data Validation (T+5-10min)
```bash
# Check translation coverage
mysql -u root -proot perundhu -e "
SELECT 
  COUNT(*) as total_locations,
  (SELECT COUNT(*) FROM translations WHERE entity_type='location' AND language_code='ta') as tamil_translations,
  ROUND((SELECT COUNT(*) FROM translations WHERE entity_type='location' AND language_code='ta') * 100.0 / COUNT(*), 2) as coverage_percent
FROM locations;
"
```

- [ ] total_locations = 21,528 (or close)
- [ ] tamil_translations = 21,588+ (100%+ coverage)
- [ ] coverage_percent ≥ 100.00%

### Step 6: API Validation (T+10-15min)
```bash
# Test autocomplete endpoint
curl -s "http://localhost:8080/api/v1/locations/autocomplete?q=chen&lang=en" | python3 -m json.tool | head -20
curl -s "http://localhost:8080/api/v1/locations/autocomplete?q=chen&lang=ta" | python3 -m json.tool | head -20

# Both should return locations successfully
# If lang=ta returns translatedName, excellent!
# If lang=ta returns English names, that's still OK (frontend can override)
```

- [ ] English endpoint returns 200 status
- [ ] Tamil endpoint returns 200 status
- [ ] Response contains location data
- [ ] No 5xx errors in logs

---

## Post-Deployment Phase (After Deployment)

### Immediate Verification (First 15 minutes)
- [ ] Backend running without errors
- [ ] No Flyway migration errors in logs
- [ ] Database connectivity stable
- [ ] Query response times normal (<500ms)

### Functional Testing (Next 30 minutes)
- [ ] Frontend loads without console errors
- [ ] English language works
- [ ] Tamil language toggle works
- [ ] Location autocomplete returns results
- [ ] Route creation/viewing works

**Test Commands**:
```bash
# Test 1: Autocomplete
curl "http://localhost:8080/api/v1/locations/autocomplete?q=mad&lang=en"
curl "http://localhost:8080/api/v1/locations/autocomplete?q=mad&lang=ta"
# Both should succeed with 200 status

# Test 2: Specific location
curl "http://localhost:8080/api/v1/locations/1?lang=ta"
# Should return with translatedName field

# Test 3: Route endpoints
curl -X GET "http://localhost:8080/api/v1/routes?lang=ta"
# Should work without errors
```

Verification:
- [ ] All endpoints return 200 status
- [ ] Response times <1 second
- [ ] No database error messages
- [ ] Tamil characters display correctly

### Performance Monitoring (Continuous for 1 hour)
- [ ] Monitor query logs for slow queries
- [ ] Check database CPU/memory usage
- [ ] Monitor backend application memory
- [ ] Watch for any timeout errors

**Metrics to Track**:
- Query response times: Should stay <500ms
- Database connections: Should stay <20
- Application memory: Should stay <2GB
- Error rate: Should be 0%

---

## Troubleshooting Checklist

### If Migration Hangs (No progress for 30+ seconds)

- [ ] Kill migration: `mysql -e "SHOW PROCESSLIST;" | grep INSERT`
- [ ] Note the query ID
- [ ] Kill it: `mysql -e "KILL QUERY <id>;"`
- [ ] Check my.cnf for timeout settings
- [ ] Ensure sufficient memory available
- [ ] Restart backend, Flyway will retry
- [ ] Contact DBA if persists

### If Translation Count Wrong

- [ ] Expected: 21,588 Tamil translations
- [ ] Got less than 20,000?
  - [ ] Migrations didn't fully complete
  - [ ] Redeploy backend
  - [ ] Flyway will retry V52/V53
- [ ] Got more than 22,000?
  - [ ] Likely duplicates (expected, V53 handles it)
  - [ ] Safe to proceed

### If API Returns English Instead of Tamil

- [ ] Check database has translations:
  ```bash
  mysql -u root -proot perundhu -e "SELECT COUNT(*) FROM translations WHERE entity_type='location' AND language_code='ta' LIMIT 1;"
  ```
- [ ] If exists: Backend may not be returning translatedName field
  - [ ] Check LocationRepository query
  - [ ] Restart backend to reload translations
- [ ] If doesn't exist: Migrations didn't execute
  - [ ] Check Flyway history
  - [ ] Redeploy backend

### If Rollback Needed

```bash
# Option 1: Restore from backup
mysql -u root -proot < /backup/perundhu_pre_v52_v53_*.sql

# Option 2: Delete Tamil translations manually
mysql -u root -proot perundhu -e "DELETE FROM translations WHERE entity_type='location' AND language_code='ta';"

# Option 3: Remove from Flyway history (only if needed)
mysql -u root -proot perundhu -e "DELETE FROM flyway_schema_history WHERE version IN ('52', '53');"

# Restart backend and redeploy
```

---

## Sign-Off

### Deployment Team
- Deployer: _________________ | Date: _______ | Time: _______
- DBA Reviewer: _________________ | Date: _______ | Time: _______
- QA Approval: _________________ | Date: _______ | Time: _______

### Post-Deployment Verification
- [ ] All migrations successful
- [ ] Data integrity verified
- [ ] API endpoints working
- [ ] Performance metrics normal
- [ ] User-facing features working
- [ ] Ready for production deployment

---

## Key Files

| File | Purpose |
|------|---------|
| V52_OPTIMIZED__populate_tamil_translations.sql | 40 major cities translation |
| V53_OPTIMIZED__comprehensive_tamil_translations.sql | All 21,528 locations |
| migration-pre-deployment-check.sh | Pre-flight validation |
| migration-monitor.sh | Real-time monitoring |
| MIGRATION_DEPLOYMENT_SAFETY_GUIDE.md | Detailed procedures |

---

## Contact & Escalation

**If issues occur**:
1. **First 5 minutes**: Check PROCESSLIST for hanging queries
2. **5-15 minutes**: Review Flyway logs for errors
3. **15+ minutes**: Escalate to DBA, consider rollback
4. **Anytime**: Reference MIGRATION_DEPLOYMENT_SAFETY_GUIDE.md

**Expected outcome**: 
- ✅ <5 second total migration time
- ✅ 21,588 Tamil translations
- ✅ 100%+ location coverage
- ✅ Zero downtime deployment
