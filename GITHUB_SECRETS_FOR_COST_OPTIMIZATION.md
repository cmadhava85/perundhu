# GitHub Secrets Configuration for Cost Optimization

## ✅ GCP Setup Complete!

All GCP resources have been created:
- ✅ Service Account: `gh-actions-cost-opt@astute-strategy-406601.iam.gserviceaccount.com`
- ✅ IAM Roles: Cloud Run Admin + Cloud SQL Admin
- ✅ Workload Identity Pool: `github-actions-pool`
- ✅ OIDC Provider: `github-provider`
- ✅ Binding to repository: `cmadhava85/perundhu`

## 🔐 Add These Secrets to GitHub

Go to: **https://github.com/cmadhava85/perundhu/settings/secrets/actions**

### Secret #1: WIF_PROVIDER
```
projects/1032721240281/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider
```

### Secret #2: WIF_SERVICE_ACCOUNT
```
gh-actions-cost-opt@astute-strategy-406601.iam.gserviceaccount.com
```

## 📋 Step-by-Step Instructions

1. **Open GitHub Secrets Page**
   - Go to: https://github.com/cmadhava85/perundhu/settings/secrets/actions
   - (You must be logged in as the repository owner)

2. **Add First Secret (WIF_PROVIDER)**
   - Click **"New repository secret"**
   - Name: `WIF_PROVIDER`
   - Value: Copy and paste the full path from Secret #1 above
   - Click **"Add secret"**

3. **Add Second Secret (WIF_SERVICE_ACCOUNT)**
   - Click **"New repository secret"** again
   - Name: `WIF_SERVICE_ACCOUNT`
   - Value: Copy and paste the email from Secret #2 above
   - Click **"Add secret"**

4. **Verify Secrets Added**
   - You should now see both secrets listed on the page
   - The values will be masked with `***`

## 🧪 Test the Workflow

Once secrets are added, test the automation:

### Test 1: Check Status
1. Go to: https://github.com/cmadhava85/perundhu/actions
2. Click: **"GCP Cost Optimization - Stop/Start Services"**
3. Click: **"Run workflow"** (dropdown button on the right)
4. Select branch: `master`
5. Action: `status`
6. Click: **"Run workflow"**
7. Wait ~30 seconds and click on the workflow run to see results

**Expected Output:** Should show current state of all services

### Test 2: Stop Services (Optional)
1. Run workflow with action: `stop`
2. Verify services are stopped in GCP Console

### Test 3: Start Services (Optional)
1. Run workflow with action: `start`
2. Verify services are running in GCP Console

## 🎯 What Happens Next

### Automatic Schedule
Once secrets are configured, the workflow will run automatically:

| Time | Action | What Happens |
|------|--------|--------------|
| **10:00 PM IST** (4:30 PM UTC) | **STOP** | All preprod services stop, minimal cost |
| **8:00 AM IST** (2:30 AM UTC) | **START** | All preprod services start, ready for use |

### Expected Savings
- **Before:** ~$110/month
- **After:** ~$61/month
- **Savings:** ~$49/month (44% reduction)

## 📊 Monitoring

### View Workflow Runs
- https://github.com/cmadhava85/perundhu/actions/workflows/gcp-cost-optimization.yml
- Each run shows:
  - ✅/❌ Success/failure status
  - Service states (stopped/running)
  - Cost savings estimates

### Check Service Status in GCP
```bash
# Cloud Run services
gcloud run services list --region=asia-south1 --project=astute-strategy-406601

# Cloud SQL instance
gcloud sql instances describe perundhu-preprod-mysql --project=astute-strategy-406601
```

## 🔧 Troubleshooting

### If Workflow Fails

**Authentication Error:**
- Verify both secrets are added correctly
- Check for typos in secret names (case-sensitive)
- Ensure no extra spaces in secret values

**Permission Error:**
- Service account has required roles (already granted)
- Workload Identity binding is correct (already configured)

**Service Not Found Error:**
- Verify service names in workflow match GCP:
  - `perundhu-backend-preprod`
  - `perundhu-frontend-preprod`
  - `perundhu-preprod-mysql`

## ✨ Quick Links

- **Add Secrets:** https://github.com/cmadhava85/perundhu/settings/secrets/actions
- **Test Workflow:** https://github.com/cmadhava85/perundhu/actions
- **Workflow File:** `.github/workflows/gcp-cost-optimization.yml`
- **GCP Console:** https://console.cloud.google.com/
- **Setup Guide:** `GCP_COST_OPTIMIZATION_SETUP_JAN_2026.md`
- **Checklist:** `GCP_COST_OPTIMIZATION_SETUP_CHECKLIST.md`

## ⚠️ Important Notes

- **Preprod Only:** This affects only preprod environment (astute-strategy-406601)
- **No Data Loss:** Stopping services doesn't delete any data
- **Downtime:** Services unavailable 10 PM - 8 AM IST (14 hours daily)
- **Manual Override:** You can always run the workflow manually to start/stop services outside the schedule

---

**Status:** GCP configuration complete ✅  
**Next:** Add GitHub secrets (2-3 minutes)  
**Created:** January 10, 2026
