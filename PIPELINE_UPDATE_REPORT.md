# Pipeline & Configuration Update Report

**Status**: ⚠️ **UPDATES NEEDED**

---

## Issues Found in Current Pipelines

### 1. **Terraform Pipeline** (`terraform.yml`)
**Status**: ❌ **Outdated**

**Current Issues**:
- References old GCP project: `astute-strategy-406601` (preprod)
- Should reference production project: `perundhu-prod-001`
- Terraform state buckets are for old projects (wrong names/projects)
- Database migration references wrong service account

**What Changed**:
```diff
# OLD (in pipeline)
- project_id=astute-strategy-406601
- notification_email=alerts@perundhu.com
- BUCKET_NAME="perundhu-terraform-state-preprod" (wrong project)
- SERVICE_ACCOUNT="perundhu@astute-strategy-406601" (wrong project)

# NEW (should be)
+ project_id=perundhu-prod-001  
+ notification_email=your-email@gmail.com
+ BUCKET_NAME="perundhu-prod-001-tf-state-1767644488" ✅ (already created)
+ SERVICE_ACCOUNT="cloud-run-sa@perundhu-prod-001.iam.gserviceaccount.com"
```

### 2. **CD Production Pipeline** (`cd-production.yml`)
**Status**: ❌ **OUTDATED**

**Current Issues**:
- References wrong GCP project: `astute-strategy-406601`
- Hardcoded domain: `perundhu.app` (should be `perundhu.com`)
- Missing reCAPTCHA secret injection
- Missing JWT secret configuration
- Database migration credentials using wrong format

**What Changed**:
```diff
# OLD (in pipeline)
- GCP_PROJECT_ID: astute-strategy-406601
- url: https://perundhu.app
- PROD_DB_URL/PROD_DB_USER secrets
- No reCAPTCHA or JWT config

# NEW (should be)
+ GCP_PROJECT_ID: perundhu-prod-001 ✅
+ url: https://perundhu.com ✅
+ Use Secret Manager (sm://) references
+ Add reCAPTCHA secret injection
+ Add JWT secret configuration
```

---

## What Needs to be Updated

### Task 1: Update `terraform.yml`
**File**: `.github/workflows/terraform.yml`

Changes required:
- [ ] Replace `astute-strategy-406601` → `perundhu-prod-001` (8 occurrences)
- [ ] Replace preprod state bucket → use production bucket name
- [ ] Update service account references
- [ ] Add production environment section (currently missing production-specific jobs)

### Task 2: Update `cd-production.yml`
**File**: `.github/workflows/cd-production.yml`

Changes required:
- [ ] Replace `astute-strategy-406601` → `perundhu-prod-001`
- [ ] Replace `perundhu.app` → `perundhu.com`
- [ ] Update Cloud Run service names (remove `-production` suffix to match current Terraform)
- [ ] Add JWT and reCAPTCHA secret injection
- [ ] Update environment URL to `perundhu.com`
- [ ] Add DNS record creation logic (currently commented out)

### Task 3: Update Production `terraform.tfvars`
**File**: `infrastructure/terraform/environments/production/terraform.tfvars`

Changes required:
- [ ] Update `domain_name`: `perundhu.app` → `perundhu.com`
- [ ] Add `cloud_dns_zone_name`: `perundhu-com` (for DNS management)

---

## Current State vs Pipeline State

| Item | Current State (Actual) | Pipeline Expects |
|------|------------------------|------------------|
| GCP Project | perundhu-prod-001 ✅ | astute-strategy-406601 ❌ |
| Domain | perundhu.com ✅ | perundhu.app ❌ |
| Cloud SQL | Deployed ✅ | Not referenced ❌ |
| Terraform State | perundhu-prod-001-tf-state-* ✅ | perundhu-terraform-state-* ❌ |
| Service Account | cloud-run-sa@perundhu-prod-001 ✅ | perundhu@astute-strategy-406601 ❌ |
| reCAPTCHA Config | In Secret Manager ✅ | Not injected ❌ |
| JWT Secret | In Secret Manager ✅ | Not injected ❌ |

---

## Recommended Actions

### Option A: Quick Fix (For Friday Deployment)
**Recommended**: Just use manual `gcloud run deploy` commands (already prepared)
- **Reason**: Pipelines take time to update and test
- **Timeline**: 5 minutes to deploy
- **Risk**: Low (manual commands are battle-tested)

### Option B: Update Pipelines (For Future Deployments)
**Recommended**: Update after Friday deployment
- **Reason**: Pipelines are complex and need testing
- **Timeline**: 1-2 hours to update and test
- **Benefit**: Automated deployments for v1.0.1 and beyond

---

## Summary

**For Friday (January 12)**:
- ✅ Use manual deployment commands (no pipeline changes needed)
- ✅ All infrastructure already deployed with Terraform
- ✅ Terraform state is managed correctly

**For Next Week**:
- ⚠️ Update both pipelines to reference correct GCP project
- ⚠️ Update domain references from perundhu.app to perundhu.com
- ⚠️ Add reCAPTCHA and JWT secret injection
- ⚠️ Test pipelines before v1.0.1 release

---

## Quick Decision

**Do you want me to**:
1. **Keep it simple**: Just use manual deployment Friday (no pipeline changes)
2. **Update pipelines now**: Update for future deployments (optional, not needed Friday)
3. **Do both**: Update pipelines after Friday deployment

**Recommendation**: Option 1 for Friday, then Option 2 next week

