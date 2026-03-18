# PreProd Automation Guide - Cost-Optimized

## 🎯 Overview

This guide explains how to use GitHub Actions to automate preprod deployments while staying within your **$25-30/month budget**.

### The Problem We Solved

**Before:** Cloud Run backend failed and retried continuously → $42/month in wasted charges
**After:** On-demand deployment + automatic cleanup → ~$2-3/month when idle

## 📋 New Workflows

### 1. **On-Demand Deploy** (`.github/workflows/preprod-on-demand.yml`)

Deploys preprod only when you need it, with automatic cleanup.

**Triggers:**
- ✅ Manual (via GitHub UI or CLI)
- ✅ Pull requests labeled with `deploy-preprod`

**Features:**
- ✅ Starts Cloud SQL BEFORE deploying (prevents retry-loop bug)
- ✅ Verifies backend health after deployment
- ✅ Auto-cleanup after configurable hours (1, 2, 4, 8)
- ✅ `minInstances=0` (scale-to-zero when idle)

**Usage:**

```bash
# Deploy via CLI
gh workflow run preprod-on-demand.yml

# Deploy with custom cleanup time
gh workflow run preprod-on-demand.yml \
  -f auto_cleanup_hours=4 \
  -f deploy_backend=true \
  -f deploy_frontend=true

# Deploy for a specific PR
# Just add label 'deploy-preprod' to the PR
```

**Via GitHub UI:**
1. Go to Actions tab
2. Select "PreProd - On-Demand Deploy & Auto-Cleanup"
3. Click "Run workflow"
4. Choose cleanup time and services to deploy

### 2. **Cleanup Services** (`.github/workflows/preprod-cleanup.yml`)

Deletes preprod services to stop all charges.

**Triggers:**
- ✅ Manual (when done testing)
- ⏰ Scheduled (optional - disabled by default)

**Usage:**

```bash
# Delete all services
gh workflow run preprod-cleanup.yml

# Delete only backend
gh workflow run preprod-cleanup.yml \
  -f delete_backend=true \
  -f delete_frontend=false \
  -f stop_cloud_sql=true
```

**What it does:**
1. Deletes Cloud Run backend (stops charges)
2. Deletes Cloud Run frontend (stops charges)
3. Stops Cloud SQL (keeps data, stops charges)

## 💰 Cost Comparison

### Old Workflow (Continuous Deployment)

| Scenario | Monthly Cost | Issue |
|----------|-------------|-------|
| Services running 24/7 | $15-20 | Always-on charges |
| Failed deployment retrying | **$42** | Retry loop bug |
| Total | **$54+** | Over budget |

### New Workflow (On-Demand)

| Scenario | Monthly Cost | Notes |
|----------|-------------|-------|
| Services deployed for 8 hours/day | ~$4-6 | Only when testing |
| Services deployed 2 hours/day | ~$1-2 | Typical dev usage |
| Services idle (deleted) | **$2-3** | Only storage/DNS |
| **Average** | **$5-8** | Well under budget ✅ |

## 🚀 Recommended Workflow

### Daily Development

```bash
# Morning: Deploy preprod
gh workflow run preprod-on-demand.yml -f auto_cleanup_hours=8

# Do your testing...

# Evening: Auto-cleanup happens, or run manually
gh workflow run preprod-cleanup.yml
```

### Pull Request Testing

1. Create PR
2. Add label: `deploy-preprod`
3. Wait 5-10 minutes for deployment
4. Test using the frontend URL in GitHub Actions summary
5. Remove label or merge PR → auto-cleanup after 2 hours

### Production Deployment

```bash
# Use existing production workflow
git tag v1.2.3
git push origin v1.2.3
# Triggers .github/workflows/cd-production.yml
```

## 🛡️ Safety Features

### 1. **Health Check Before Declaring Success**

The workflow waits up to 2 minutes for backend to respond to `/actuator/health`.
If it fails, the workflow fails → you know immediately, not after 2 days of retry charges.

### 2. **Cloud SQL Started First**

```yaml
start-cloud-sql → build-backend → deploy-backend
```

This prevents the exact issue you had:
- ❌ Old: Backend starts → Cloud SQL stopped → retry loop → $42 charges
- ✅ New: Cloud SQL started → Backend starts → succeeds → minimal charges

### 3. **Scale-to-Zero Configuration**

```yaml
--min-instances=0 \
--max-instances=3 \
--cpu-throttling \
```

When no traffic:
- Instance count: 0
- CPU usage: 0
- Charges: $0.00

### 4. **Clear Cleanup Reminders**

Every deployment adds a summary with cleanup instructions:

```
💡 Manual cleanup required after testing to avoid costs
   Run: gh workflow run preprod-cleanup.yml
```

## 📊 Monitoring Costs

### Check Current Services

```bash
# List all Cloud Run services
gcloud run services list \
  --project=astute-strategy-406601 \
  --region=us-central1

# Check Cloud SQL status
gcloud sql instances list \
  --project=astute-strategy-406601

# Expected when idle:
# Cloud Run: Listed 0 items.
# Cloud SQL: STATUS = STOPPED
```

### Set Up Billing Alerts

```bash
# Create alert at $20 (80% of your $25 budget)
gcloud alpha billing budgets create \
  --billing-account=01110A-13E0F4-ABDFAC \
  --display-name="PreProd Monthly Budget" \
  --budget-amount=25USD \
  --threshold-rule=percent=80 \
  --threshold-rule=percent=100
```

## 🔧 Advanced: Scheduled Auto-Cleanup

If you want automatic nightly cleanup (commented out by default):

Edit `.github/workflows/preprod-cleanup.yml`:

```yaml
on:
  workflow_dispatch:
    # ... inputs ...
  schedule:
    # Uncomment to enable automatic cleanup
    - cron: '0 4 * * *'  # 11 PM EST / 4 AM UTC
```

**Pros:**
- Never forget to cleanup
- Guaranteed zero charges overnight

**Cons:**
- May delete services you wanted to keep running
- Less flexible

## 🆚 Comparison with Existing Workflow

| Feature | Old (`cd-preprod.yml`) | New (`preprod-on-demand.yml`) |
|---------|------------------------|-------------------------------|
| Trigger | Every push to main | Manual or PR label |
| Cloud SQL startup | ❌ Not checked | ✅ Always started first |
| Health verification | ⚠️ Basic | ✅ Full health check |
| Auto-cleanup | ❌ None | ✅ Configurable (1-8 hours) |
| Cost per day | ~$0.50-1.50 | ~$0.15-0.50 |
| Failed deploy handling | Retries forever | Fails fast |

## 📝 Migration Steps

### Option 1: Keep Both Workflows

- Use old `cd-preprod.yml` for continuous deployment
- Use new `preprod-on-demand.yml` for cost-optimized testing

### Option 2: Replace Old Workflow (Recommended)

```bash
# Disable automatic preprod deployment
git mv .github/workflows/cd-preprod.yml .github/workflows/cd-preprod.yml.disabled

# Use only on-demand deployment
# The new workflow is already in place
```

### Option 3: Hybrid Approach

- Keep `cd-preprod.yml` but disable automatic trigger
- Only run manually when needed

Edit `cd-preprod.yml`:
```yaml
on:
  # workflow_run:  # DISABLED - comment out auto-trigger
  #   workflows: ["CI Pipeline"]
  #   types: [completed]
  #   branches: [main, master]
  workflow_dispatch:  # Keep manual trigger only
```

## 🎓 Best Practices

### 1. Always Delete After Testing
```bash
# After every manual deploy
gh workflow run preprod-cleanup.yml
```

### 2. Use PR Labels for Selective Deployment
```bash
# Only deploy important PRs, not every commit
# Add 'deploy-preprod' label only when needed
```

### 3. Monitor Your Billing Dashboard
- Check weekly: https://console.cloud.google.com/billing
- Look for unexpected spikes
- Verify services are deleted after testing

### 4. Use Production for Long-Running Tests
If you need services running for days:
- Production has `minInstances=0` already
- More stable than preprod
- Still costs ~$2-5/month when idle

### 5. Set Calendar Reminders
```bash
# If you deploy manually, set a reminder:
# "Cleanup preprod services" - 2 hours after deploy
```

## 🐛 Troubleshooting

### Services Not Cleaning Up

```bash
# Manually delete everything
./scripts/fix-gcp-costs.sh
# Choose option 1
```

### Backend Still Failing Health Checks

Check logs:
```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="perundhu-backend-preprod"' \
  --project=astute-strategy-406601 \
  --limit=20 \
  --format="table(timestamp, severity, textPayload)"
```

Common issues:
- Cloud SQL not started → workflow should start it automatically
- Environment variables missing → check workflow env vars
- Migration failed → check database migration logs

### Costs Still High

```bash
# Check what's running
gcloud run services list --project=astute-strategy-406601
gcloud sql instances list --project=astute-strategy-406601

# If anything running, delete it:
gh workflow run preprod-cleanup.yml
```

## 📞 Quick Reference

### Deploy PreProd
```bash
gh workflow run preprod-on-demand.yml
```

### Cleanup PreProd
```bash
gh workflow run preprod-cleanup.yml
```

### Check Status
```bash
gcloud run services list --project=astute-strategy-406601 --region=us-central1
```

### Estimate Current Cost
- 0 services running: ~$2-3/month
- Services with 0 traffic: ~$2-3/month (scale-to-zero)
- Services with light traffic: ~$5-8/month
- Services with failed deployment: **STOP IMMEDIATELY** → can be $40+/month

## ✅ Summary

**Before this change:**
- Preprod deployed automatically on every push
- Failed deployments retried indefinitely
- Cost: $42/month from retry loop alone

**After this change:**
- Preprod deploys only when you need it
- Automatic cleanup prevents runaway costs
- Health checks catch failures immediately
- Cost: ~$2-8/month depending on usage

**Budget compliance:** ✅ Well within $25-30/month ceiling
