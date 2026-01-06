# QUICK REFERENCE: TAMIL MIGRATION DEPLOYMENT

**Print this card & keep it handy during deployment!**

---

## TL;DR - What's Happening

**Two migrations will run automatically**:
- **V52**: Adds Tamil names for ~40 major cities (takes <1 second)
- **V53**: Adds Tamil names for all 21,528 locations (takes 2-3 seconds)
- **Total time**: <5 seconds
- **Risk**: LOW (with optimizations enabled)

---

## Pre-Deployment (5 minutes)

```bash
# 1. Validate environment
bash migration-pre-deployment-check.sh
# → Must see: "✓ ALL CHECKS PASSED"

# 2. Backup database
mysqldump -u root -proot perundhu > /backup/pre_migration_$(date +%Y%m%d_%H%M%S).sql

# 3. Deploy backend
./deploy-to-preprod.sh
# → Migrations start automatically
```

---

## During Deployment (Real-time monitoring)

```bash
# In separate terminal, monitor progress:
bash migration-monitor.sh
# Select option 1 for continuous monitoring

# OR manually check status:
mysql -u root -proot -e "SHOW PROCESSLIST;" | grep INSERT
mysql -u root -proot perundhu -e "SELECT COUNT(*) FROM translations WHERE language_code='ta';"
```

---

## What to Expect

| Time | Event | Expected Action |
|------|-------|-----------------|
| T+0s | Backend starts, Flyway begins | Watch logs for startup |
| T+1s | V52 completes (618ms typical) | Check PROCESSLIST |
| T+3s | V53 completes (2847ms typical) | Verify translation count |
| T+5s | Both done, API ready | Proceed to testing |

---

## Success Criteria

✅ **Migration History** (Check this first):
```bash
mysql -u root -proot perundhu -e "
  SELECT version, success, execution_time 
  FROM flyway_schema_history 
  WHERE version IN ('52', '53');
"
```
Expected:
```
version  success  execution_time
52       1        618ms
53       1        2847ms
```

✅ **Translation Count**:
```bash
mysql -u root -proot perundhu -e "
  SELECT COUNT(*) FROM translations 
  WHERE entity_type='location' AND language_code='ta';
"
```
Expected: **21,588** (or 21,500+)

✅ **API Test**:
```bash
curl -s "http://localhost:8080/api/v1/locations/autocomplete?q=chen&lang=ta" | head
```
Expected: **HTTP 200** with location data

---

## ⚠️ IF SOMETHING GOES WRONG

### Migration Stuck (No progress >30s)?

1. **Check running queries**:
   ```bash
   mysql -u root -proot -e "SHOW PROCESSLIST\G"
   ```

2. **If query shows TIME >30s**:
   ```bash
   mysql -u root -proot -e "KILL QUERY <query_id>;"
   docker restart backend  # or systemctl restart backend
   ```

3. **Flyway will retry automatically**

### Translation Count Wrong?

```bash
# Check what we have
mysql -u root -proot perundhu -e "
  SELECT 
    COUNT(*) as locations,
    (SELECT COUNT(*) FROM translations WHERE language_code='ta') as tamil
  FROM locations;
"

# If tamil < 20,000:
#   → Migrations incomplete, redeploy backend
# If tamil > 22,000:
#   → Duplicates expected (V53 handles it)
```

### API Returns English Instead of Tamil?

```bash
# Check database
mysql -u root -proot perundhu -e "
  SELECT * FROM translations 
  WHERE entity_type='location' AND language_code='ta' 
  LIMIT 1;
"

# If no results:
#   → Migrations didn't run, check Flyway logs
# If results exist:
#   → Backend not returning translatedName, restart it
```

---

## 🔧 Quick Fixes

| Issue | Command |
|-------|---------|
| Migration timeout | `docker restart backend` |
| API returns wrong language | `docker restart backend` |
| Database locked | `mysql -u root -proot -e "SHOW ENGINE INNODB STATUS\G"` |
| Verify translations | `mysql -u root -proot perundhu -e "SELECT COUNT(*) FROM translations WHERE language_code='ta';"` |
| Restore backup | `mysql -u root -proot < /backup/pre_migration_*.sql` |

---

## 📊 Key Metrics

| Metric | Expected | Alert If |
|--------|----------|----------|
| V52 time | <1 second | >5 seconds |
| V53 time | 2-3 seconds | >10 seconds |
| Total time | <5 seconds | >30 seconds |
| Tamil count | 21,588 | <20,000 |
| API response | <500ms | >2000ms |
| Error rate | 0% | >0% |

---

## 📞 Need Help?

**Quick checks** (do these first):
1. Are migrations listed in Flyway history as successful?
   ```bash
   mysql -u root -proot perundhu -e "SELECT * FROM flyway_schema_history WHERE version IN ('52','53');"
   ```

2. Is translation count 21,588+?
   ```bash
   mysql -u root -proot perundhu -e "SELECT COUNT(*) FROM translations WHERE language_code='ta';"
   ```

3. Does API return 200?
   ```bash
   curl -s "http://localhost:8080/api/v1/locations/1?lang=ta" -w "\n%{http_code}\n"
   ```

**If still stuck**:
- Check `MIGRATION_DEPLOYMENT_SAFETY_GUIDE.md` for detailed troubleshooting
- Review Flyway logs: `journalctl -u backend -f`
- Call DBA if needed

---

## ✅ Post-Deployment Verification

- [ ] V52 & V53 marked as successful in Flyway
- [ ] 21,588 Tamil translations in database
- [ ] API returns HTTP 200 for all endpoints
- [ ] Frontend loads without errors
- [ ] Tamil language toggle works
- [ ] No error logs with "migration" keyword

**Done? Celebrate! 🎉 Tamil support is now live!**

---

## 📋 Files Reference

- **Pre-check**: `migration-pre-deployment-check.sh`
- **Monitor**: `migration-monitor.sh`
- **Details**: `MIGRATION_DEPLOYMENT_SAFETY_GUIDE.md`
- **Checklist**: `DEPLOYMENT_CHECKLIST_V52_V53.md`
- **Migrations**: 
  - `backend/app/src/main/resources/db/migration/V52_OPTIMIZED__populate_tamil_translations.sql`
  - `backend/app/src/main/resources/db/migration/V53_OPTIMIZED__comprehensive_tamil_translations.sql`
