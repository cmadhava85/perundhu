# GCP Cost Optimization Setup Guide - January 2026

## Overview
Automated GitHub Actions workflow to stop and start GCP services (Cloud Run + Cloud SQL) between 10 PM - 8 AM IST daily to reduce preprod environment costs.

**Expected Monthly Savings:** ~$47/month (~42% reduction)

## Components Managed

| Service | Current Estimate | Daily Downtime | Savings |
|---------|------------------|-----------------|----------|
| Cloud Run Backend | ~$15/month | 10 hours | ~$6.50 |
| Cloud Run Frontend | ~$15/month | 10 hours | ~$6.50 |
| Cloud SQL MySQL | ~$80/month | 10 hours | ~$34 |
| **Total** | **~$110/month** | **10 hours** | **~$47/month** |

## Setup Steps

### Step 1: Create GCP Service Account

1. **Go to GCP Console:**
   ```
   https://console.cloud.google.com/iam-admin/serviceaccounts?project=astute-strategy-406601
   ```

2. **Create Service Account:**
   - Click "Create Service Account"
   - Name: `github-actions-cost-optimization`
   - Description: "GitHub Actions automation for cost optimization"
   - Click "Create and Continue"

3. **Grant IAM Roles:**
   - Select the service account
   - Go to "Permissions" tab
   - Grant these roles:
     - `Cloud Run Admin` - for managing Cloud Run services
     - `Cloud SQL Admin` - for managing Cloud SQL instances
   
   **Minimal roles:**
   ```
   roles/run.admin
   roles/cloudsql.admin
   ```

4. **Enable Workload Identity Federation:**
   
   This is the secure way to authenticate from GitHub Actions without storing keys.

   ```bash
   # Set project ID
   PROJECT_ID="astute-strategy-406601"
   WORKLOAD_IDENTITY_POOL="github-actions-pool"
   WORKLOAD_IDENTITY_PROVIDER="github-provider"
   
   # Create workload identity pool
   gcloud iam workload-identity-pools create "${WORKLOAD_IDENTITY_POOL}" \
     --project="${PROJECT_ID}" \
     --location=global \
     --display-name="GitHub Actions Pool"
   
   # Create workload identity provider
   gcloud iam workload-identity-pools providers create-oidc "${WORKLOAD_IDENTITY_PROVIDER}" \
     --project="${PROJECT_ID}" \
     --location=global \
     --workload-identity-pool="${WORKLOAD_IDENTITY_POOL}" \
     --display-name="GitHub Provider" \
     --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
     --issuer-uri="https://token.actions.githubusercontent.com" \
     --attribute-condition="assertion.repository_owner == 'cmadhava85'"
   
   # Create service account
   gcloud iam service-accounts create github-actions-cost-optimization \
     --project="${PROJECT_ID}" \
     --display-name="GitHub Actions Cost Optimization"
   
   # Get service account email
   SERVICE_ACCOUNT_EMAIL="github-actions-cost-optimization@${PROJECT_ID}.iam.gserviceaccount.com"
   
   # Grant roles
   gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
     --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
     --role="roles/run.admin" \
     --condition=None
   
   gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
     --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
     --role="roles/cloudsql.admin" \
     --condition=None
   
   # Configure Workload Identity
   WORKLOAD_IDENTITY_POOL_ID=$(gcloud iam workload-identity-pools describe "${WORKLOAD_IDENTITY_POOL}" \
     --project="${PROJECT_ID}" \
     --location=global \
     --format='value(name)')
   
   gcloud iam service-accounts add-iam-policy-binding "${SERVICE_ACCOUNT_EMAIL}" \
     --project="${PROJECT_ID}" \
     --role="roles/iam.workloadIdentityUser" \
     --principal="principalSet://iam.googleapis.com/projects/${PROJECT_ID}/locations/global/workloadIdentityPools/${WORKLOAD_IDENTITY_POOL}/attribute.repository/cmadhava85/perundhu"
   ```

### Step 2: Get Workload Identity Provider

```bash
PROJECT_ID="astute-strategy-406601"
gcloud iam workload-identity-pools providers describe github-provider \
  --project="${PROJECT_ID}" \
  --location=global \
  --workload-identity-pool=github-actions-pool \
  --format="value(name)"
```

Output will look like:
```
projects/123456789/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider
```

### Step 3: Add GitHub Secrets

1. **Go to GitHub Repository Settings:**
   ```
   https://github.com/cmadhava85/perundhu/settings/secrets/actions
   ```

2. **Create New Repository Secrets:**

   **Secret Name:** `WIF_PROVIDER`
   ```
   projects/123456789/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider
   ```
   (Replace `123456789` with actual project number)

   **Secret Name:** `WIF_SERVICE_ACCOUNT`
   ```
   github-actions-cost-optimization@astute-strategy-406601.iam.gserviceaccount.com
   ```

## Schedule Configuration

The workflow runs automatically at:

### Stop Services
- **Time:** 10:00 PM IST
- **UTC:** 4:30 PM (16:30)
- **Cron:** `30 16 * * *`
- **Effect:** Cloud Run traffic stops, Cloud SQL pauses

### Start Services
- **Time:** 8:00 AM IST
- **UTC:** 2:30 AM (02:30)
- **Cron:** `30 02 * * *`
- **Effect:** Cloud SQL resumes, Cloud Run traffic enables

**Timezone:** All times in UTC (adjust cron based on IST offset)

## Manual Trigger

To manually control services without waiting for scheduled time:

1. **Go to Actions tab** in GitHub
2. **Select "GCP Cost Optimization - Stop/Start Services"**
3. **Click "Run workflow"**
4. **Select action:**
   - `stop` - Stop all services immediately
   - `start` - Start all services immediately
   - `status` - Check current status

## Workflow Behavior

### Stop Process
1. Sets Cloud Run services to `--no-traffic` (stops ingress)
2. Sets Cloud SQL to `NEVER` activation policy (pauses instance)
3. **Downtime:** Immediate
4. **Cost:** Minimal (storage charges only)

### Start Process
1. Sets Cloud SQL to `ALWAYS` activation policy first
2. Waits up to 5 minutes for Cloud SQL to be ready
3. Enables traffic on Cloud Run services
4. **Downtime:** ~2-3 minutes max
5. **Cost:** Full billing resumes

## Monitoring

### View Workflow Runs

```
https://github.com/cmadhava85/perundhu/actions/workflows/gcp-cost-optimization.yml
```

### Check Service Status

Workflow provides detailed status report in GitHub Actions summary showing:
- ✅ Services that were stopped/started
- Current state of each service
- Estimated cost savings

### Alert on Failures

GitHub Actions will notify on workflow failures. Monitor the Actions tab for any issues.

## Costs Breakdown

### Current Monthly Costs (Preprod)
- **Cloud Run:** ~$0.50/day × 2 services = ~$30/month
- **Cloud SQL:** ~$2.50/day = ~$75/month
- **Total:** ~$110/month

### With Cost Optimization (10-hour downtime)
- **Cloud Run:** ~$0.29/day × 2 = ~$17/month
- **Cloud SQL:** ~$1.46/day = ~$44/month
- **Total:** ~$61/month

### **Monthly Savings: ~$49/month (44% reduction)**

## Important Notes

⚠️ **Preprod Service Disruption:**
- Services will be **unavailable** from 10 PM - 8 AM IST
- This is a dev/preprod environment, not production
- Plan testing accordingly

⚠️ **Cloud SQL Warm-up:**
- Cloud SQL takes 30-60 seconds to become operational
- Workflow waits up to 5 minutes for readiness
- Initial connection after startup may take a few seconds

⚠️ **No Data Loss:**
- Stopping services does NOT delete data
- All data persists in Cloud SQL
- All configurations remain intact

## Troubleshooting

### Workflow Fails with Auth Error
- Verify `WIF_PROVIDER` and `WIF_SERVICE_ACCOUNT` secrets are correct
- Check service account has required IAM roles
- Verify Workload Identity Federation configuration

### Services Not Stopping
- Check GitHub Actions logs for error details
- Verify service account has `Cloud Run Admin` role
- Ensure service names match (check in Cloud Run console)

### Cloud SQL Not Starting
- Check Cloud SQL quota and resource limits
- Verify instance hasn't been deleted
- Check service account has `Cloud SQL Admin` role

### Manual Verification

```bash
# List Cloud Run services
gcloud run services list --region=asia-south1

# Check Cloud Run service status
gcloud run services describe perundhu-backend-preprod --region=asia-south1

# Check Cloud SQL status
gcloud sql instances describe perundhu-preprod-mysql
```

## Rollback / Disable

To disable the cost optimization:

1. **Disable workflow:** Go to Actions tab → select workflow → "Disable workflow"
2. **Or delete:** Delete `.github/workflows/gcp-cost-optimization.yml` file
3. **Manual start:** Use `workflow_dispatch` with `start` action to restart services

## Related Documentation

- [Admin Login reCAPTCHA Fix](ADMIN_LOGIN_RECAPTCHA_FIX_JAN_2026.md)
- [Form Reset Fix](FORM_RESET_FIX_JAN_2026.md)
- [Production Services Stopped](PRODUCTION_SERVICES_STOPPED_JAN_2026.md)

## Cost Optimization Timeline

| Date | Action | Reason |
|------|--------|--------|
| Jan 10, 2026 | Stopped production services | Manual cost reduction |
| Jan 10, 2026 | Created preprod shutdown workflow | Automated cost savings |
| Ongoing | Auto stop/start 10 PM - 8 AM | Daily cost optimization |

---

**Created:** January 10, 2026  
**Status:** ✅ Ready for Deployment  
**Estimated Savings:** ~$47/month  
**Environment:** Preprod only  
**Service Account:** `github-actions-cost-optimization@astute-strategy-406601.iam.gserviceaccount.com`
