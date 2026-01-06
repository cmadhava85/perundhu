# Configuration Audit Report - Preprod vs Production

**Date**: January 5, 2025  
**Status**: ⚠️ CRITICAL ISSUES FOUND

## Executive Summary
✅ **GCP Project Isolation**: Correct - Preprod uses `astute-strategy-406601`, Production uses `perundhu-prod-001`  
✅ **Artifact Registry Region**: Correct - Both preprod and prod use `asia-south1`  
✅ **Cloud Run Deployment Region**: Correct - Both preprod and prod use `asia-south1`  
❌ **CRITICAL**: Cloud SQL Database Region Mismatch - Preprod database in `us-central1`, should be `asia-south1`

---

## Detailed Configuration Comparison

### 1. GitHub Workflows

#### `.github/workflows/cd-preprod-auto.yml`
```yaml
env:
  GCP_PROJECT_ID: astute-strategy-406601  ✅ CORRECT (Dev Project)
  GCP_REGION: asia-south1                 ✅ CORRECT (Aligned with Production)
  ARTIFACT_REGISTRY: asia-south1-docker.pkg.dev  ✅ CORRECT
```

**Issue Found - Cloud SQL Connection**:
- Line 280: `../cloud_sql_proxy -instances=astute-strategy-406601:us-central1:perundhu-preprod-mysql=tcp:3306`
  - Project: ✅ `astute-strategy-406601` (correct)
  - **Region: ❌ `us-central1` (WRONG - should be `asia-south1`)**
  - Instance: ✅ `perundhu-preprod-mysql` (correct)

- Line 368: `--set-env-vars="...GCP_INSTANCE_CONNECTION_NAME=astute-strategy-406601:us-central1:perundhu-preprod-mysql..."`
  - **Region: ❌ `us-central1` (WRONG - should be `asia-south1`)**

- Line 370: `--add-cloudsql-instances=astute-strategy-406601:us-central1:perundhu-preprod-mysql`
  - **Region: ❌ `us-central1` (WRONG - should be `asia-south1`)**

#### `.github/workflows/cd-production.yml`
```yaml
env:
  GCP_PROJECT_ID: perundhu-prod-001       ✅ CORRECT (Production Project)
  GCP_REGION: asia-south1                 ✅ CORRECT
  ARTIFACT_REGISTRY: asia-south1-docker.pkg.dev  ✅ CORRECT
```
✅ **Production deployment region is correct**

#### `.github/workflows/cd-staging.yml`
```yaml
env:
  GCP_PROJECT_ID: astute-strategy-406601  ✅ CORRECT (Dev Project)
  GCP_REGION: asia-south1                 ✅ CORRECT
  ARTIFACT_REGISTRY: asia-south1-docker.pkg.dev  ✅ CORRECT
```
✅ **Staging configuration is correct** (disabled but configured properly)

---

### 2. Backend Application Configuration

#### `backend/app/src/main/resources/application-preprod.properties`
```properties
recaptcha.project-id=${GCP_PROJECT_ID:perundhu-prod-001}
```
❌ **Issue**: Hardcoded fallback to `perundhu-prod-001`. Should use `${GCP_PROJECT_ID}` or fallback to `astute-strategy-406601`

---

### 3. Terraform Configuration

#### `infrastructure/terraform/environments/preprod/variables.tf`
```terraform
variable "region" {
  default = "asia-south1"  ✅ CORRECT
}
```

#### `infrastructure/terraform/environments/preprod/main.tf`
```terraform
provider "google" {
  project = var.project_id
  region  = var.region  # This uses asia-south1
```
✅ **Terraform provider configured for asia-south1**

---

### 4. Deployment Scripts

#### `redeploy-backend-preprod.sh`
```bash
PROJECT_ID="astute-strategy-406601"         ✅ CORRECT
GCP_REGION="asia-south1"                    ✅ CORRECT
ARTIFACT_REGISTRY="asia-south1-docker.pkg.dev"  ✅ CORRECT

# BUT:
--set-env-vars="...GCP_INSTANCE_CONNECTION_NAME=astute-strategy-406601:us-central1:perundhu-preprod-mysql..."
# ❌ us-central1 (WRONG)

--add-cloudsql-instances=astute-strategy-406601:us-central1:perundhu-preprod-mysql
# ❌ us-central1 (WRONG)
```

#### `redeploy-backend-gcloud.sh`
Same issues as above.

---

### 5. Frontend Configuration

#### `frontend/.env.preprod`
```
VITE_API_URL=https://perundhu-backend-preprod-1032721240281.asia-south1.run.app  ✅ CORRECT
```

---

## Critical Issues Summary

### Issue #1: Cloud SQL Database Region Mismatch (CRITICAL)
**Files Affected**:
1. `.github/workflows/cd-preprod-auto.yml` (lines 280, 368, 370)
2. `redeploy-backend-preprod.sh` (lines 105, 107)
3. `redeploy-backend-gcloud.sh` (lines 121, 123)

**Current State**:
- Cloud Run services deployed to: **asia-south1** ✅
- Cloud SQL instance in: **us-central1** ❌

**Problem**: 
- Services in asia-south1 connecting to database in us-central1 = **cross-region latency**
- Higher costs due to cross-region data transfer
- Violates deployment region alignment requirement

**Expected State**:
- Both Cloud Run services AND Cloud SQL instance should be in **asia-south1**

**Solution**: Change all instances of `us-central1` to `asia-south1` in:
- Cloud SQL Proxy connection strings
- Cloud Run environment variables
- Cloud Run cloudsql-instances flag

---

### Issue #2: Backend Project ID Fallback (MINOR)
**File**: `backend/app/src/main/resources/application-preprod.properties` (line 82)

**Current**:
```properties
recaptcha.project-id=${GCP_PROJECT_ID:perundhu-prod-001}
```

**Issue**: Falls back to production project instead of development project

**Expected**:
```properties
recaptcha.project-id=${GCP_PROJECT_ID:astute-strategy-406601}
```

---

## Configuration Checklist

### Preprod Environment
| Component | Expected | Actual | Status |
|-----------|----------|--------|--------|
| **GCP Project** | astute-strategy-406601 | astute-strategy-406601 | ✅ CORRECT |
| **Artifact Registry Region** | asia-south1 | asia-south1 | ✅ CORRECT |
| **Cloud Run Region** | asia-south1 | asia-south1 | ✅ CORRECT |
| **Cloud SQL Region** | asia-south1 | **us-central1** | ❌ WRONG |
| **Cloud SQL Instance** | perundhu-preprod-mysql | perundhu-preprod-mysql | ✅ CORRECT |
| **Terraform Region** | asia-south1 | asia-south1 | ✅ CORRECT |
| **Frontend URL Format** | asia-south1.run.app | asia-south1.run.app | ✅ CORRECT |

### Production Environment
| Component | Expected | Actual | Status |
|-----------|----------|--------|--------|
| **GCP Project** | perundhu-prod-001 | perundhu-prod-001 | ✅ CORRECT |
| **Artifact Registry Region** | asia-south1 | asia-south1 | ✅ CORRECT |
| **Cloud Run Region** | asia-south1 | asia-south1 | ✅ CORRECT |
| **Cloud SQL Region** | asia-south1 | asia-south1 | ✅ CORRECT |
| **Terraform Region** | asia-south1 | asia-south1 | ✅ CORRECT |

---

## Action Items

### HIGH PRIORITY (Must Fix)
1. **Update Cloud SQL Region in Preprod Workflows**
   - Change `astute-strategy-406601:us-central1:perundhu-preprod-mysql` 
   - To: `astute-strategy-406601:asia-south1:perundhu-preprod-mysql`
   - Files: cd-preprod-auto.yml (3 locations), redeploy scripts (2 locations each)

2. **Create/Migrate Preprod Cloud SQL Instance to asia-south1**
   - Verify instance `perundhu-preprod-mysql` exists in asia-south1
   - If not, create it via Terraform with region=asia-south1
   - Ensure proper backup/restore if migrating from us-central1

### MEDIUM PRIORITY (Should Fix)
3. **Update Backend Project ID Fallback**
   - Change application-preprod.properties line 82
   - From: `${GCP_PROJECT_ID:perundhu-prod-001}`
   - To: `${GCP_PROJECT_ID:astute-strategy-406601}`

### VERIFICATION STEPS
```bash
# Verify Cloud SQL instance region
gcloud sql instances describe perundhu-preprod-mysql --project=astute-strategy-406601

# Verify Cloud Run service region
gcloud run services list --project=astute-strategy-406601 --filter="name:perundhu*"

# Verify Artifact Registry
gcloud artifacts repositories list --location=asia-south1 --project=astute-strategy-406601
```

---

## Notes

- **User Requirement**: "we are using asia-south1 for preprod and prod"
- **Current Gap**: Preprod Cloud SQL is in us-central1 instead of asia-south1
- **Regional Consistency**: Production already has all components in asia-south1
- **Next Step**: Align preprod database to asia-south1 to match production setup

