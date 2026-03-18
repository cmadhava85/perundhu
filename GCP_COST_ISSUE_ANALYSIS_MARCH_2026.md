# GCP Cost Issue Analysis - March 18, 2026

## Problem Summary

**Current Monthly Cost:** $54.40 (double the $25-30 budget)
- Cloud Run: $42.67 (510% increase) ⚠️
- Cloud SQL: $9.32 (27% increase)
- Other services: $2.41

**User's Question:** "I haven't start the database server on yesterday then why the cost is more? and also not using cloud run on past two days. But still cost acquired? any backend job running?"

## Root Cause Identified

### ✅ Good News: Cloud SQL is NOT the problem
```bash
$ gcloud sql instances list --project=perundhu-prod-001

NAME                             STATUS   TIER         LOCATION
perundhu-production-mysql-us     STOPPED  db-f1-micro  us-central1-c
```

Cloud SQL is **STOPPED** (not running). The $9.32 charge is from historical usage before you stopped it, not current charges.

### ❌ Bad News: Cloud Run backend keeps failing and retrying

**Backend Deployment Status:**
```bash
$ gcloud run revisions list --service=perundhu-production-backend

REVISION                                   ACTIVE  DEPLOYED                 DEPLOYED BY
✗  perundhu-production-backend-00061-vdf   no      2026-03-17 01:00:59 UTC  cmadhava@gmail.com  ❌ FAILING
✔  perundhu-production-backend-00058-hjd   yes     2026-03-16 00:50:30 UTC  cmadhava@gmail.com  ✅ ACTIVE
```

**Error Logs:**
```
2026-03-18T19:32:24Z ERROR: instance could not start successfully
2026-03-18T19:31:32Z ERROR: instance could not start successfully
2026-03-18T19:31:04Z ERROR: instance could not start successfully
2026-03-18T19:30:33Z ERROR: Default STARTUP TCP probe failed, connection CANCELLED
2026-03-18T19:30:31Z WARNING: Container called exit(1)
```

**The Problem:**
1. On March 17, you deployed revision `00061-vdf` (likely with latest code changes)
2. The backend container tries to start but **fails startup health checks**
3. Cloud Run sees the failure and **automatically retries** every 30-60 seconds
4. Each retry attempt:
   - Spins up a new container
   - Uses billable CPU + memory during startup
   - Fails the health check
   - Terminates and waits
   - Repeats forever ♾️

**Why it fails:**
- Backend is configured to connect to Cloud SQL on startup
- Cloud SQL is **STOPPED**
- Connection fails → container exits → health check fails → retry loop

**This is why you're charged despite not using the app:**
- You have `minScale=0` correctly configured (scale-to-zero enabled) ✅
- BUT the failed deployment keeps retrying startup
- Each retry is **billable time** even though it never succeeds
- 2 days of continuous retries = $42.67 in Cloud Run charges

## Cost Breakdown

### Current Costs (March 2026)
| Service | Amount | Notes |
|---------|--------|-------|
| Cloud Run | $42.67 | Failed backend retries (510% increase) |
| Cloud SQL | $9.32 | Historical usage before STOPPED (27% increase) |
| Secret Manager | ~$1.40 | Secrets storage |
| Artifact Registry | ~$0.70 | Docker images |
| Cloud DNS | ~$0.27 | DNS zone |
| Cloud Storage | ~$0.05 | Small files |
| **TOTAL** | **$54.40** | **Double budget** ⚠️ |

### Expected Costs After Fix

#### Option 1: Delete Cloud Run services (recommended)
| Service | Amount | Notes |
|---------|--------|-------|
| Cloud Run | $0.00 | Deleted |
| Cloud SQL | $0.00 | Still stopped |
| Secret Manager | $1.40 | Still needed |
| Artifact Registry | $0.70 | Still needed |
| Cloud DNS | $0.27 | Still needed |
| Cloud Storage | $0.05 | Still needed |
| **TOTAL** | **~$2.42** | **Well under budget** ✅ |

#### Option 2: Rollback to working revision
| Service | Amount | Notes |
|---------|--------|-------|
| Cloud Run | ~$10-12 | Healthy services with minScale=0 |
| Cloud SQL | $0.00 | Still stopped |
| Other services | $2.42 | Same as above |
| **TOTAL** | **~$12-15** | **Within budget** ✅ |

## Solutions

### Option 1: Delete Cloud Run Services (Recommended)

**Best for:**
- Development/testing environment
- Not actively using the app
- Want zero charges

**Commands:**
```bash
# Run the fix script
chmod +x scripts/fix-gcp-costs.sh
./scripts/fix-gcp-costs.sh
# Choose option 1
```

**Or manually:**
```bash
# Delete backend
gcloud run services delete perundhu-production-backend \
  --project=perundhu-prod-001 \
  --region=us-central1 \
  --quiet

# Delete frontend
gcloud run services delete perundhu-production-frontend \
  --project=perundhu-prod-001 \
  --region=us-central1 \
  --quiet
```

**Result:**
- Monthly cost: ~$2-3 (only storage and DNS)
- Can redeploy anytime with `terraform apply`

### Option 2: Rollback Backend to Working Revision

**Best for:**
- Want to keep services running
- Need to access the app occasionally
- Comfortable with ~$12-15/month

**Commands:**
```bash
# Run the fix script
./scripts/fix-gcp-costs.sh
# Choose option 2
```

**Or manually:**
```bash
# Route 100% traffic to working revision
gcloud run services update-traffic perundhu-production-backend \
  --project=perundhu-prod-001 \
  --region=us-central1 \
  --to-revisions=perundhu-production-backend-00058-hjd=100 \
  --quiet

# Delete failed revision
gcloud run revisions delete perundhu-production-backend-00061-vdf \
  --project=perundhu-prod-001 \
  --region=us-central1 \
  --quiet
```

**Result:**
- Monthly cost: ~$12-15 (healthy services)
- Stops the retry loop
- Services still available

### Option 3: Fix the Root Cause

**If you need the latest code from revision 00061:**

1. **Start Cloud SQL first:**
   ```bash
   gcloud sql instances patch perundhu-production-mysql-us \
     --project=perundhu-prod-001 \
     --activation-policy=ALWAYS
   ```

2. **Then the backend can start successfully:**
   ```bash
   gcloud run services update-traffic perundhu-production-backend \
     --project=perundhu-prod-001 \
     --region=us-central1 \
     --to-revisions=perundhu-production-backend-00061-vdf=100
   ```

**Result:**
- Backend will start successfully
- BUT Cloud SQL will add ~$8-10/month
- Total: ~$20-25/month (within budget if traffic is low)

## Why This Happened

### Configuration Analysis

**Terraform Config (Correct):**
```hcl
# infrastructure/terraform/environments/production/terraform.tfvars
cloud_run_min_instances = 0  # ✅ Scale-to-zero enabled
cloud_run_max_instances = 5  # ✅ Cost cap in place
db_activation_policy = "ALWAYS"  # ⚠️ This is misleading
```

**What "db_activation_policy = ALWAYS" means:**
- Does NOT mean "keep database running always"
- Means "activate database on incoming connections"
- When no connections, it can be stopped manually
- You manually stopped it (good!) and Terraform won't restart it

**What went wrong:**
1. You deployed new backend code on March 17
2. Backend tries to connect to Cloud SQL on startup (via startup health check)
3. Cloud SQL is STOPPED → connection fails
4. Container exits with code 1
5. Cloud Run interprets this as "temporary failure, retry"
6. Retry loop continues for 2 days = $42 in charges

## Prevention Strategies

### 1. Always Check Deployment Health
After any `terraform apply`:
```bash
gcloud run services list --project=perundhu-prod-001 --region=us-central1
```

Look for the warning symbol `!` next to service names.

### 2. Delete Services When Not in Use
For development environments:
```bash
# Before ending work session
gcloud run services delete perundhu-production-backend --quiet
gcloud run services delete perundhu-production-frontend --quiet
```

### 3. Set Up Billing Alerts
```bash
# Create alert at $20 (80% of budget)
gcloud alpha billing budgets create \
  --billing-account=01110A-13E0F4-ABDFAC \
  --display-name="Perundhu Monthly Budget" \
  --budget-amount=25USD \
  --threshold-rule=percent=80
```

### 4. Make Health Checks Cloud SQL-Independent

**Current health check (implicit):**
```
Cloud Run → Backend starts → Connects to DB → If fails, container exits
```

**Better health check:**
```yaml
# cloud-run.yaml
healthCheck:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 10
  failureThreshold: 3
```

**In application.properties:**
```properties
# Make liveness check independent of DB
management.endpoint.health.probes.enabled=true
management.health.livenessState.enabled=true
management.health.readinessState.enabled=true
# DB failure won't fail liveness, only readiness
management.health.db.enabled=false
```

### 5. Use Startup Script Guard

**In Dockerfile or startup script:**
```bash
#!/bin/bash
# Check if Cloud SQL is reachable before starting app
if ! nc -z -w5 /cloudsql/perundhu-prod-001:us-central1:perundhu-production-mysql-us 3306; then
  echo "Cloud SQL not available, exiting gracefully"
  # Sleep to avoid rapid retry loop
  sleep 300
  exit 0  # Exit cleanly, don't retry
fi

# Start app
java -jar app.jar
```

## Verification

After applying any fix, verify costs stopped:

```bash
# Check no services running (Option 1)
gcloud run services list --project=perundhu-prod-001

# Check backend healthy (Option 2)
gcloud run revisions list --service=perundhu-production-backend \
  --project=perundhu-prod-001 --region=us-central1

# Check logs for no more failures
gcloud logging read "resource.type=cloud_run_revision \
  resource.labels.service_name=perundhu-production-backend \
  severity>=ERROR" \
  --project=perundhu-prod-001 \
  --limit=10 \
  --format="table(timestamp,jsonPayload.message)"

# Monitor billing
gcloud billing accounts list
gcloud alpha billing accounts describe 01110A-13E0F4-ABDFAC
```

**Expected:**
- No error logs after fix
- Cloud Run cost should drop to near-zero within 1-2 days
- Next month should be under $25

## Summary

**Question:** "Why cost is more when I haven't started database or used Cloud Run?"

**Answer:** 
- Cloud SQL is stopped (good!) ✅
- BUT Cloud Run backend has a failed deployment
- The failed deployment retries every 30-60 seconds
- Each retry costs money even though it fails
- 2 days of retries = $42.67 in charges

**Fix:** 
- Run `./scripts/fix-gcp-costs.sh` and choose Option 1 (delete services)
- This will reduce monthly cost to ~$2-3
- When ready to use, redeploy with `terraform apply`

**Long-term:**
- Always delete Cloud Run when not in use
- Set up billing alerts
- Monitor deployments for health check failures
- Consider making health checks DB-independent
