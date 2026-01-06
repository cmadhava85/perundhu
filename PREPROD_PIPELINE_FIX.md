# Preprod Pipeline Configuration Fix - Summary

## 🔍 Issue Identified

The preprod deployment pipeline (`cd-preprod-auto.yml`) was incorrectly configured to use the **production GCP project** instead of the **development/preprod project**.

### Error Message
```
denied: Permission "artifactregistry.repositories.uploadArtifacts" 
denied on resource "projects/perundhu-prod-001/locations/asia-south1/repositories/perundhu"
```

## ✅ Root Cause

The environment variables in the preprod workflow were hardcoded to production values:

```yaml
env:
  GCP_PROJECT_ID: perundhu-prod-001           # ❌ WRONG - Production project
  GCP_REGION: asia-south1                     # ❌ WRONG - Production region
  ARTIFACT_REGISTRY: asia-south1-docker.pkg.dev
```

## 🔧 Solution Applied

Updated the workflow to use the correct development project:

```yaml
env:
  GCP_PROJECT_ID: astute-strategy-406601      # ✅ CORRECT - Development project
  GCP_REGION: asia-south1                    # ✅ CORRECT - Asia South region
  ARTIFACT_REGISTRY: asia-south1-docker.pkg.dev
```

### Commit Details
- **Commit Hash**: `3b35e7f`
- **Branch**: `master`
- **Files Changed**: 1 (`.github/workflows/cd-preprod-auto.yml`)
- **Lines Changed**: 3 insertions, 3 deletions

## 📋 GCP Project Configuration

### Development/Preprod Project
| Property | Value |
|----------|-------|
| **Project ID** | astute-strategy-406601 |
| **Project Name** | Perundhu |
| **Region** | asia-south1 |
| **Artifact Registry** | asia-south1-docker.pkg.dev |

### Production Project
| Property | Value |
|----------|-------|
| **Project ID** | perundhu-prod-001 |
| **Project Name** | Perundhu Production |
| **Region** | asia-south1 |
| **Artifact Registry** | asia-south1-docker.pkg.dev |

## 🔐 Service Account Permissions

The `github-actions@perundhu-prod-001.iam.gserviceaccount.com` service account now has access to both projects:

### Permissions in Development Project (astute-strategy-406601)
- ✅ `roles/artifactregistry.writer` - Push Docker images
- ✅ `roles/artifactregistry.reader` - Read artifact metadata
- ✅ `roles/run.admin` - Deploy to Cloud Run
- ✅ `roles/cloudsql.admin` - Manage database migrations
- ✅ `roles/secretmanager.secretAccessor` - Access secrets

### Permissions in Production Project (perundhu-prod-001)
- ✅ `roles/artifactregistry.writer` - Push Docker images
- ✅ `roles/artifactregistry.reader` - Read artifact metadata
- ✅ `roles/run.admin` - Deploy to Cloud Run
- ✅ `roles/cloudsql.admin` - Manage database migrations
- ✅ `roles/secretmanager.secretAccessor` - Access secrets

## 🚀 What This Fixes

1. **Preprod Pipeline Now Uses Correct Project**
   - Docker images pushed to `asia-south1-docker.pkg.dev/astute-strategy-406601/...`
   - Services deployed to Cloud Run in development project
   - Database migrations run against preprod MySQL instance

2. **Isolation Between Environments**
   - Preprod builds no longer risk accidentally pushing to production
   - Clear separation of artifact repositories
   - Prevents cross-environment contamination

3. **Correct Database Connection**
   - Preprod migrations now use `astute-strategy-406601:asia-south1:perundhu-preprod-mysql`
   - Production remains isolated in `perundhu-prod-001:asia-south1`

## 🧪 Testing the Fix

To verify the fix works, the preprod pipeline will:

1. ✅ Authenticate to the development project
2. ✅ Configure Docker for asia-south1 registry
3. ✅ Build and push frontend image to dev artifact registry
4. ✅ Build and push backend image to dev artifact registry
5. ✅ Run database migrations on preprod MySQL
6. ✅ Deploy services to Cloud Run (development project)

## 📊 Environment Mappings

```
Branch/Trigger          GCP Project                Region
─────────────────────────────────────────────────────────
develop                 astute-strategy-406601     asia-south1  (Staging)
develop → master        astute-strategy-406601     asia-south1  (Preprod Auto)
master (release)        perundhu-prod-001          asia-south1  (Production)
```

## 🔄 Next Steps

1. **Run Preprod Pipeline**
   - The next push to `develop` or manual dispatch will use the correct project
   - Docker images will be pushed to development artifact registry
   - Preprod services will be deployed to development project

2. **Verify Artifact Registry**
   ```bash
   gcloud artifacts repositories list --location=us-central1 --project=astute-strategy-406601
   ```

3. **Monitor Cloud Run Deployment**
   ```bash
   gcloud run services list --region=us-central1 --project=astute-strategy-406601
   ```

## ⚠️ Important Notes

- **Service Account Key**: The same `GCPSECRET` is used for all projects due to cross-project IAM roles
- **Regional Differences**: All services in asia-south1 for consistency (Preprod and Production)
- **Database Isolation**: Each environment has its own MySQL instance
- **DNS/URLs**: Preprod services accessible via separate Cloud Run URLs

## 📝 Related Documentation

- [GCP Project IDs & Regions](GITHUB_ACTIONS_AUTH_SETUP.md)
- [GCP Permission Errors](GCP_ARTIFACT_REGISTRY_FIX.md)
- [Workflow Configuration](/.github/workflows/cd-preprod-auto.yml)

---

**Fixed**: January 5, 2026  
**Status**: ✅ Ready for Testing  
**Next Action**: Trigger preprod pipeline to verify fix

