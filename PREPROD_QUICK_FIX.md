# Quick Fix Guide - Preprod Startup Timeout

## The Problem
✋ Application hangs on startup after 4 minutes → Cloud Run kills it

**Root Cause:** Large migration file (V45) with 25,731 data inserts takes 5+ minutes

---

## The Fix
✅ **Configuration Changed**

File: `backend/app/src/main/resources/application-preprod.properties`

```properties
# Before: spring.flyway.enabled=true
# After:  spring.flyway.enabled=false

# Before: spring.jpa.hibernate.ddl-auto=none
# After:  spring.jpa.hibernate.ddl-auto=validate
```

---

## Deploy It

```bash
cd /Users/mchand69/Documents/perundhu
git add backend/app/src/main/resources/application-preprod.properties
git commit -m "Fix preprod startup timeout: disable auto-migration"
git push origin master
```

Cloud Build auto-triggers → deploys new image → app starts in <5 seconds ✅

---

## Verify It Works

```bash
# Check if service is ready
gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 | grep -A2 "Status"

# Check logs (should see successful startup, not timeout)
gcloud run services logs read perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --limit=20 | tail -5

# Test the API
curl https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/health
```

---

## Details

For full analysis and migration strategy, see:
- 📄 `PREPROD_STARTUP_TIMEOUT_ANALYSIS.md` - Complete root cause analysis
- 📄 `PREPROD_MIGRATION_STRATEGY.md` - How to run migrations separately

---

## Checklist

- [x] Root cause identified (V45 migration timeout)
- [x] Configuration fixed (flyway.enabled=false, ddl-auto=validate)
- [x] Files committed and ready to push
- [ ] Push changes to master
- [ ] Monitor Cloud Build deployment
- [ ] Verify service is healthy
- [ ] Test API endpoints
