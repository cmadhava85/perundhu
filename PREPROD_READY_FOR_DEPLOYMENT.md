# ✅ PREPROD CONFIGURATION - READY FOR DEPLOYMENT

## Summary

Your preprod environment is **fully consolidated and ready**. All Cloud SQL instance conflicts have been resolved, and everything now uses a single, unified configuration.

## What Was Fixed

### 1. Cloud SQL Consolidation ✅
- **Deleted**: `perundhu-preprod-mysql-asia` (duplicate)
- **Active**: `perundhu-preprod-mysql` (asia-south1)
- **Status**: RUNNABLE
- **Database**: perundhu (created)
- **User**: perundhu_user (created)

### 2. Terraform Alignment ✅
- `terraform.tfvars` updated: Removed `-asia` suffix
- Database module now stores credentials in Secret Manager
- Single source of truth: `db-password` and `db-username`

### 3. Deployment Scripts ✅
All fixed to use consistent instance:
```
astute-strategy-406601:asia-south1:perundhu-preprod-mysql
```

Fixed scripts:
- `deploy-preprod-backend.sh`
- `setup-preprod-database.sh`
- `setup-preprod-all.sh`
- `deploy-preprod-complete.sh`
- `provision-preprod-terraform.sh`
- `redeploy-backend-preprod.sh`
- `redeploy-backend-gcloud.sh`

### 4. Pipeline Simplification ✅
- **Removed**: `cd-preprod-auto.yml` (too complex)
- **Created**: `cd-preprod.yml` (clean, modular)

Pipeline flow:
1. Check CI status
2. Build backend & frontend (parallel)
3. Run database migrations
4. Deploy backend
5. Deploy frontend
6. Verify health

### 5. Secret Manager Centralization ✅
- `db-password`: Stored and managed by Terraform
- `db-username`: Stored and managed by Terraform
- All deployments use Secret Manager (no hardcoded values)

## Deployment Steps

### Option 1: Automatic (Recommended)
```bash
cd /Users/mchand69/Documents/perundhu
git add .
git commit -m "feat: your changes"
git push origin master
# → CI runs automatically
# → CD triggers automatically after CI succeeds
# → Watch: https://github.com/cmadhava85/perundhu/actions
```

### Option 2: Manual Build & Deploy
```bash
# Build backend
bash build-preprod-backend.sh

# Build frontend  
bash build-preprod-frontend.sh

# Deploy
gcloud run deploy perundhu-backend-preprod \
  --image=asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-latest \
  --add-cloudsql-instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql \
  ...
```

## Quick Verification

### Check Cloud SQL
```bash
# Instance status
gcloud sql instances describe perundhu-preprod-mysql \
  --project=astute-strategy-406601

# Database exists
gcloud sql databases list --instance=perundhu-preprod-mysql \
  --project=astute-strategy-406601

# User exists
gcloud sql users list --instance=perundhu-preprod-mysql \
  --project=astute-strategy-406601
```

### Check Secrets
```bash
gcloud secrets list --project=astute-strategy-406601 \
  --filter="name:db-"
```

### Test Connection
```bash
gcloud sql connect perundhu-preprod-mysql \
  --user=perundhu_user \
  --project=astute-strategy-406601
```

## Terraform Configuration

### Location
```
infrastructure/terraform/environments/preprod/
├── main.tf           # Main configuration
├── terraform.tfvars  # Variables (NOW: no -asia suffix)
└── variables.tf      # Variable definitions
```

### Database Module
```
infrastructure/terraform/modules/database/
├── main.tf           # Creates Cloud SQL + secrets
├── variables.tf      # Input variables
└── outputs.tf        # Outputs (connection details)
```

## Application Configuration

### Backend Configuration File
```
backend/app/src/main/resources/application-preprod.properties
```

Uses:
```
spring.datasource.url=jdbc:mysql:///perundhu?socketFactory=com.google.cloud.sql.mysql.SocketFactory&cloudSqlInstance=astute-strategy-406601:asia-south1:perundhu-preprod-mysql
```

## Important Notes

1. **Migrations**: Run in CD pipeline, NOT on startup (FLYWAY_ENABLED=false)
2. **Cloud SQL Proxy**: Injected by Cloud Run when using `--add-cloudsql-instances`
3. **Secrets**: All credentials managed by Secret Manager (no env vars needed in code)
4. **Connection**: Uses Unix socket via Cloud SQL Proxy (most secure for Cloud Run)

## Troubleshooting

### Database Connection Issues
```bash
# Check Cloud SQL Proxy is running
gcloud sql operations list --instance=perundhu-preprod-mysql \
  --project=astute-strategy-406601

# Check logs
gcloud run logs read perundhu-backend-preprod --region=asia-south1

# Verify VPC connectivity
gcloud compute networks list --project=astute-strategy-406601
```

### Secret Access Issues
```bash
# Verify service account has Secret Accessor role
gcloud projects get-iam-policy astute-strategy-406601 \
  --flatten="bindings[].members" \
  --filter="bindings.role:secretmanager.secretAccessor"
```

## Git Commits

Latest changes:
```
ba97c62 fix: Consolidate to single Cloud SQL instance and sync Terraform
a57e564 fix: Lazy database initialization to defer connection
04c2d7c fix: Resolve Cloud SQL instance configuration conflicts
```

## Production Ready

✅ Single Cloud SQL instance
✅ Centralized credentials in Secret Manager
✅ Terraform and scripts aligned
✅ Clean, modular CI/CD pipeline
✅ All configurations committed to git

**You're ready for production deployment!**
