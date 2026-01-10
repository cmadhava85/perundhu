# GCP Cost Optimization - Quick Setup Checklist

## ✅ Implementation Status

- ✅ GitHub Actions workflow created: `.github/workflows/gcp-cost-optimization.yml`
- ✅ Complete setup guide created: `GCP_COST_OPTIMIZATION_SETUP_JAN_2026.md`
- ✅ Workflow scheduled for:
  - **Stop:** 10 PM IST daily (4:30 PM UTC) → `30 16 * * *`
  - **Start:** 8 AM IST daily (2:30 AM UTC) → `30 02 * * *`

## 📋 Setup Checklist (DO THIS NOW)

### Phase 1: GCP Configuration (5-10 minutes)

- [ ] 1. Create GCP Service Account
  - Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=astute-strategy-406601
  - Name: `github-actions-cost-optimization`
  - Note project number (you'll need it later)

- [ ] 2. Grant IAM Roles to Service Account
  - `Cloud Run Admin` (roles/run.admin)
  - `Cloud SQL Admin` (roles/cloudsql.admin)

- [ ] 3. Set up Workload Identity Federation
  - Follow commands in `GCP_COST_OPTIMIZATION_SETUP_JAN_2026.md` (lines 55-88)
  - Save the Workload Identity Provider URL (format: `projects/123456789/locations/...`)

### Phase 2: GitHub Secrets (2-3 minutes)

- [ ] 4. Add GitHub Repository Secrets
  - Go to: https://github.com/cmadhava85/perundhu/settings/secrets/actions

  **Secret 1 - WIF_PROVIDER:**
  ```
  projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider
  ```

  **Secret 2 - WIF_SERVICE_ACCOUNT:**
  ```
  github-actions-cost-optimization@astute-strategy-406601.iam.gserviceaccount.com
  ```

### Phase 3: Testing (5 minutes)

- [ ] 5. Test the Workflow Manually
  - Go to: https://github.com/cmadhava85/perundhu/actions
  - Select: "GCP Cost Optimization - Stop/Start Services"
  - Click: "Run workflow"
  - Choose action: `status`
  - Verify it successfully retrieves service status

- [ ] 6. Test Stop Action
  - Run workflow with action: `stop`
  - Verify in GCP Console:
    - Cloud Run services show "Traffic: 0%"
    - Cloud SQL shows activation policy: "Never"

- [ ] 7. Test Start Action
  - Run workflow with action: `start`
  - Verify in GCP Console:
    - Cloud SQL becomes "Runnable" (may take 1-2 min)
    - Cloud Run services show "Traffic: 100%"

- [ ] 8. Monitor First Scheduled Run
  - Scheduled runs start immediately after setup
  - Check Actions tab at ~4:30 PM UTC / 10 PM IST
  - Verify workflow completed successfully

## 🎯 Expected Behavior

### Daily Schedule (Automatic)
| Time | Action | Expected State |
|------|--------|-----------------|
| 10:00 PM IST | Stop services | Services unavailable, minimal cost |
| 8:00 AM IST | Start services | Services operational, normal cost |

### Cost Impact
| Before | After | Savings |
|--------|-------|---------|
| $110/month | $61/month | **$49/month** (44% reduction) |

## 🔍 Monitoring

### View Workflow Runs
```
https://github.com/cmadhava85/perundhu/actions/workflows/gcp-cost-optimization.yml
```

### Check Service Status
```bash
# Cloud Run services
gcloud run services list --region=asia-south1

# Cloud SQL instance
gcloud sql instances describe perundhu-preprod-mysql
```

### Workflow Run Report Includes
- ✅/❌ Status of each service operation
- Current service state (running/stopped)
- Cost savings estimate

## ⚠️ Important Notes

### Downtime
- Services will be **unavailable** 10 PM - 8 AM IST (14 hours)
- This is **preprod only** - no production impact
- Plan testing outside these hours

### No Data Loss
- Stopping services does **NOT** delete anything
- All data persists in Cloud SQL
- All configurations remain intact

### Warm-up Time
- Cloud SQL takes 30-60 seconds to start
- Cloud Run services available immediately after
- Initial connection may take a few seconds

## ❓ Troubleshooting

### Workflow Fails with Auth Error
- Verify `WIF_PROVIDER` secret is correct (full URL)
- Verify `WIF_SERVICE_ACCOUNT` secret is exact email
- Check service account has required IAM roles

### Services Not Stopping/Starting
- Verify service names in GCP match workflow env vars
  - Backend: `perundhu-backend-preprod`
  - Frontend: `perundhu-frontend-preprod`
  - SQL: `perundhu-preprod-mysql`
- Check service account has correct IAM roles

### Can't Access Workflow
- Ensure you have push access to repository
- Visit: https://github.com/cmadhava85/perundhu/actions

## 📚 Related Documentation

- **Workflow File:** `.github/workflows/gcp-cost-optimization.yml`
- **Setup Guide:** `GCP_COST_OPTIMIZATION_SETUP_JAN_2026.md`
- **Previous Fixes:**
  - `ADMIN_LOGIN_RECAPTCHA_FIX_JAN_2026.md`
  - `FORM_RESET_FIX_JAN_2026.md`
  - `PRODUCTION_SERVICES_STOPPED_JAN_2026.md`

## 🎓 Additional Resources

### GCP Documentation
- [Workload Identity Federation](https://cloud.google.com/docs/authentication/workload-identity-federation)
- [Cloud Run Admin Role](https://cloud.google.com/run/docs/deploying)
- [Cloud SQL Admin Role](https://cloud.google.com/sql/docs/mysql/grant-permissions)

### GitHub Actions
- [OIDC Integration](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [Using Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [Scheduled Workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)

## ✨ Quick Links

- Repository: https://github.com/cmadhava85/perundhu
- GCP Console: https://console.cloud.google.com/
- GitHub Actions: https://github.com/cmadhava85/perundhu/actions
- GitHub Secrets: https://github.com/cmadhava85/perundhu/settings/secrets/actions

---

**Estimated Setup Time:** 15-20 minutes  
**Estimated Monthly Savings:** $47-49  
**Status:** Ready for setup  
**Created:** January 10, 2026
