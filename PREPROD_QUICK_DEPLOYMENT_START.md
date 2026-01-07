# Preprod Complete Deployment Quick Start

**Status**: Ready for Execution  
**Date**: January 7, 2026  
**Project**: astute-strategy-406601 (PREPROD ONLY)  
**Duration**: ~30-45 minutes total

---

## ⚠️ IMPORTANT PREREQUISITE

**Docker Desktop MUST be running before starting deployment!**

Start Docker:
- On macOS: Click Docker icon in Applications
- Or run: `open /Applications/Docker.app`
- Wait 60 seconds for Docker daemon to start
- Verify: `docker ps` (should list containers, not error)

---

## Quick Start: Complete Deployment in One Command

```bash
cd /Users/mchand69/Documents/perundhu

# Start Docker first!
# Then run complete deployment:
bash deploy-preprod-complete.sh
```

This script will:
1. ✅ Provision Terraform (infrastructure)
2. ✅ Setup database with proper credentials
3. ✅ Build backend Docker image
4. ✅ Build frontend Docker image
5. ✅ Deploy backend to Cloud Run
6. ✅ Deploy frontend to Cloud Run
7. ✅ Verify health and connectivity

---

## Or: Manual Step-by-Step Deployment

### Step 1: Start Docker
```bash
# Make sure Docker is running
docker ps
```

### Step 2: Provision Terraform Infrastructure
```bash
bash /Users/mchand69/Documents/perundhu/provision-preprod-terraform.sh
```
**Expected Duration**: 10-15 minutes  
**Creates**:
- VPC and networking
- Cloud SQL MySQL instance
- Cloud Storage buckets
- Service accounts and IAM roles

### Step 3: Setup Database
```bash
bash /Users/mchand69/Documents/perundhu/setup-preprod-database.sh
```
**Expected Duration**: 2-3 minutes  
**Creates**:
- Database user: perundhu_user
- Database: perundhu
- Stores credentials in GCP Secret Manager

### Step 4: Build & Push Backend Docker Image
```bash
bash /Users/mchand69/Documents/perundhu/build-preprod-backend.sh
```
**Expected Duration**: 3-5 minutes  
**Outputs**:
- Docker image: asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-latest
- Pushed to Artifact Registry

### Step 5: Build & Push Frontend Docker Image
```bash
bash /Users/mchand69/Documents/perundhu/build-preprod-frontend.sh
```
**Expected Duration**: 2-3 minutes  
**Outputs**:
- Docker image: asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/frontend:preprod-latest
- Pushed to Artifact Registry

### Step 6: Deploy Backend to Cloud Run
```bash
bash /Users/mchand69/Documents/perundhu/deploy-preprod-backend.sh
```
**Expected Duration**: 3-5 minutes  
**Creates**:
- Cloud Run service: perundhu-backend-preprod
- Environment variables configured
- Database connectivity enabled
- Flyway migrations enabled

### Step 7: Deploy Frontend to Cloud Run
```bash
bash /Users/mchand69/Documents/perundhu/deploy-preprod-frontend.sh
```
**Expected Duration**: 2-3 minutes  
**Creates**:
- Cloud Run service: perundhu-frontend-preprod
- Connected to backend API

---

## Verification After Deployment

### Check Backend
```bash
# Get backend URL
BACKEND_URL=$(gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --format='value(status.url)')

# Test health endpoint
curl -i "${BACKEND_URL}/actuator/health"

# Expected: HTTP 200 with {"status":"UP"}
```

### Check Frontend
```bash
# Get frontend URL
FRONTEND_URL=$(gcloud run services describe perundhu-frontend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --format='value(status.url)')

# Open in browser
open "${FRONTEND_URL}"

# Expected: App loads without errors
```

### Check Database
```bash
# Connect and verify
gcloud sql connect perundhu-preprod-mysql-asia \
  --user=root \
  --region=asia-south1 \
  --project=astute-strategy-406601

# In MySQL prompt:
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema='perundhu';
SELECT * FROM flyway_schema_history LIMIT 5;
```

### Monitor Logs
```bash
# Backend logs
gcloud run logs read perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --limit=100

# Frontend logs
gcloud run logs read perundhu-frontend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --limit=100
```

---

## Troubleshooting

### Docker not starting
```bash
# Verify Docker installation
which docker

# Try manual start
/Applications/Docker.app/Contents/MacOS/Docker &
sleep 60
docker ps
```

### Terraform fails
```bash
# Check project authentication
gcloud auth list
gcloud config get-value project

# Should be: astute-strategy-406601
```

### Database connection failed
```bash
# Check Cloud SQL instance
gcloud sql instances describe perundhu-preprod-mysql-asia \
  --project=astute-strategy-406601

# Check credentials in Secret Manager
gcloud secrets list --project=astute-strategy-406601 | grep db-
```

### Cloud Run deployment fails
```bash
# Check service account permissions
gcloud projects get-iam-policy astute-strategy-406601 \
  --flatten="bindings[].members" \
  --filter="bindings.members:terraform@astute-strategy-406601.iam.gserviceaccount.com"

# Should have: roles/editor or roles/run.admin
```

---

## Important Configuration Details

### Preprod Configuration Files
- **Backend**: [backend/app/src/main/resources/application-preprod.properties](backend/app/src/main/resources/application-preprod.properties)
  - Uses environment variables for database credentials
  - Flyway enabled for migrations
  - CORS configured for preprod frontend

- **Frontend**: Configured via `NEXT_PUBLIC_API_URL` env var during Cloud Run deployment

### Terraform Variables
- **File**: [infrastructure/terraform/environments/preprod/terraform.tfvars](infrastructure/terraform/environments/preprod/terraform.tfvars)
- **Project**: astute-strategy-406601 (PREPROD ONLY)
- **Region**: asia-south1
- **Database Tier**: db-f1-micro (cost-optimized for preprod)

### GCP Secrets (Auto-created)
- `db-username` - Database username
- `db-password` - Database password
- `gemini-api-key` - Gemini API key (if configured)

---

## Environment Information

**Project ID**: astute-strategy-406601  
**Region**: asia-south1 (Mumbai)  
**Services**:
- Backend: perundhu-backend-preprod
- Frontend: perundhu-frontend-preprod
- Database: perundhu-preprod-mysql-asia

**Artifact Registry**: asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/

---

## Next Steps After Successful Deployment

1. **Test the application**
   - Open frontend URL in browser
   - Test core user flows
   - Check API endpoints

2. **Monitor performance**
   - Check Cloud Run metrics
   - Review database performance
   - Monitor error rates

3. **Load testing** (optional)
   - Test with realistic load
   - Verify auto-scaling works

4. **Production deployment**
   - When preprod is validated
   - Separate production configuration
   - Different secrets and credentials

---

## Deployment Scripts Reference

All scripts are in `/Users/mchand69/Documents/perundhu/`:

| Script | Purpose | Duration |
|--------|---------|----------|
| `deploy-preprod-complete.sh` | **Master orchestrator** - runs all steps | 30-45 min |
| `provision-preprod-terraform.sh` | Terraform provisioning | 10-15 min |
| `setup-preprod-database.sh` | Database setup & credentials | 2-3 min |
| `build-preprod-backend.sh` | Build backend Docker image | 3-5 min |
| `build-preprod-frontend.sh` | Build frontend Docker image | 2-3 min |
| `deploy-preprod-backend.sh` | Deploy backend to Cloud Run | 3-5 min |
| `deploy-preprod-frontend.sh` | Deploy frontend to Cloud Run | 2-3 min |

---

## Support & Documentation

- **Comprehensive Guide**: [PREPROD_COMPREHENSIVE_SETUP_GUIDE.md](PREPROD_COMPREHENSIVE_SETUP_GUIDE.md)
- **Cloud SQL Fixes**: [CLOUD_SQL_INSTANCE_RENAME_FIX.md](CLOUD_SQL_INSTANCE_RENAME_FIX.md)
- **Preprod Database**: [PREPROD_DATABASE_FIX.md](PREPROD_DATABASE_FIX.md)
- **Configuration Audit**: [CONFIGURATION_AUDIT_REPORT.md](CONFIGURATION_AUDIT_REPORT.md)

---

## Success Indicators

✅ **All deployments complete when you see**:
- Backend Cloud Run service active
- Frontend Cloud Run service active
- Database migrations executed
- Health checks passing
- Frontend loads in browser

---

**Ready to deploy? Start with:**
```bash
bash /Users/mchand69/Documents/perundhu/deploy-preprod-complete.sh
```

Make sure Docker is running first! 🐳
