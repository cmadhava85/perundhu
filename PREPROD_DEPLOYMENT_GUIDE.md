# 🚀 PREPROD DEPLOYMENT GUIDE

## Overview

This guide will help you deploy the Perundhu application to the preprod environment on Google Cloud Platform (GCP).

**Environment Details:**
- **Project**: astute-strategy-406601
- **Region**: asia-south1 (Mumbai)
- **Backend Service**: Cloud Run - `perundhu-preprod-backend`
- **Frontend Service**: Cloud Run - `perundhu-frontend-preprod`
- **Database**: Cloud SQL MySQL - `perundhu-preprod-mysql-asia`

---

## Prerequisites ✅

- [x] GCP account with active project (astute-strategy-406601)
- [x] Cloud infrastructure deployed via Terraform
- [x] GCP credentials configured (`GCPSECRET` in GitHub)
- [x] Docker configured for artifact registry
- [x] Service accounts with proper IAM roles

---

## Deployment Methods

### **Method 1: Automatic CI/CD Pipeline (Recommended)**

This is the easiest method - push changes to master branch and the pipeline handles everything.

#### Step 1: Make a Code Change
```bash
cd /Users/mchand69/Documents/perundhu

# Make your changes to backend or frontend
# For example, update a file
echo "# Updated" >> README.md

# Commit and push
git add .
git commit -m "feat: Update for preprod deployment"
git push origin master
```

#### Step 2: GitHub Actions Triggers Automatically
- **CI Pipeline** runs tests (automatically)
- **CD Pipeline** starts after CI succeeds
- Builds Docker images
- Pushes to Artifact Registry
- Deploys to Cloud Run
- Runs smoke tests

**Timeline**: ~30-40 minutes total

---

### **Method 2: Manual Workflow Dispatch**

Trigger deployment without code changes.

#### Via GitHub CLI:
```bash
# Trigger with all services (frontend + backend)
gh workflow run cd-preprod-auto.yml \
  --ref master \
  -f deploy_frontend=true \
  -f deploy_backend=true \
  -f deploy_all=true
```

#### Via GitHub Web UI:
1. Go to: https://github.com/cmadhava85/perundhu/actions
2. Select: "CD - Auto Deploy to Pre-Production"
3. Click: "Run workflow" (right side)
4. Select branch: `master`
5. Configure inputs:
   - Deploy Frontend: ✅
   - Deploy Backend: ✅
   - Deploy All Services: ✅
6. Click: "Run workflow"

**Timeline**: ~20-30 minutes

---

### **Method 3: Manual Deployment Commands**

For advanced users or troubleshooting.

#### 3a. Build and Push Docker Images

**Backend:**
```bash
cd /Users/mchand69/Documents/perundhu/backend

# Authenticate
gcloud auth configure-docker asia-south1-docker.pkg.dev

# Build
COMMIT_SHA=$(git rev-parse --short HEAD)
TAG="$(date +%Y%m%d-%H%M%S)-${COMMIT_SHA}"
IMAGE="asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:${TAG}"

docker build --no-cache -t $IMAGE -t asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-latest .

# Push
docker push $IMAGE
docker push asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-latest

echo "✅ Backend image: $IMAGE"
```

**Frontend:**
```bash
cd /Users/mchand69/Documents/perundhu/frontend

# Set backend URL for preprod
BACKEND_URL="https://perundhu-preprod-backend-1032721240281.asia-south1.run.app"

# Create env files
echo "VITE_API_URL=${BACKEND_URL}" > .env.local
echo "VITE_API_BASE_URL=${BACKEND_URL}" >> .env.local

# Get API key if needed
GOOGLE_MAPS_API_KEY=$(gcloud secrets versions access latest --secret=google-maps-api-key 2>/dev/null || echo "")
echo "VITE_GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}" >> .env.local

# Build and push
COMMIT_SHA=$(git rev-parse --short HEAD)
TAG="$(date +%Y%m%d-%H%M%S)-${COMMIT_SHA}"
IMAGE="asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/frontend:${TAG}"

docker build --no-cache -t $IMAGE -t asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/frontend:preprod-latest .

docker push $IMAGE
docker push asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/frontend:preprod-latest

echo "✅ Frontend image: $IMAGE"
```

#### 3b. Run Database Migrations

```bash
cd /Users/mchand69/Documents/perundhu/backend

# Get credentials from secrets
DB_USER=$(gcloud secrets versions access latest --secret=preprod-db-username 2>/dev/null || echo "perundhu_user")
DB_PASSWORD=$(gcloud secrets versions access latest --secret=preprod-db-password 2>/dev/null)

# Start Cloud SQL Proxy
cloud_sql_proxy \
  -instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia=tcp:3306 \
  > /tmp/sql_proxy.log 2>&1 &

PROXY_PID=$!
sleep 3

# Wait for connection
for i in {1..30}; do
  if timeout 2 bash -c "echo > /dev/tcp/127.0.0.1/3306" 2>/dev/null; then
    echo "✅ Database ready"
    break
  fi
  sleep 1
done

# Run migrations
FLYWAY_URL="jdbc:mysql://127.0.0.1:3306/perundhu?useSSL=false&allowPublicKeyRetrieval=true"
FLYWAY_USER="$DB_USER"
FLYWAY_PASSWORD="$DB_PASSWORD"

chmod +x gradlew
./gradlew flywayMigrate \
  -DFLYWAY_URL="$FLYWAY_URL" \
  -DFLYWAY_USER="$FLYWAY_USER" \
  -DFLYWAY_PASSWORD="$FLYWAY_PASSWORD"

# Cleanup
kill $PROXY_PID 2>/dev/null || true

echo "✅ Migrations complete"
```

#### 3c. Deploy to Cloud Run

**Backend:**
```bash
gcloud run deploy perundhu-preprod-backend \
  --image asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-latest \
  --platform managed \
  --region asia-south1 \
  --project astute-strategy-406601 \
  --allow-unauthenticated \
  --set-env-vars="SPRING_PROFILES_ACTIVE=preprod,GCP_PROJECT_ID=astute-strategy-406601,GCP_INSTANCE_CONNECTION_NAME=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia,MYSQL_USERNAME=perundhu_user,GEMINI_API_ENABLED=true" \
  --set-secrets="MYSQL_PASSWORD=preprod-db-password:latest,JWT_SECRET=preprod-jwt-secret:latest,DATA_ENCRYPTION_KEY=preprod-data-encryption-key:latest,GEMINI_API_KEY=gemini-api-key:latest" \
  --add-cloudsql-instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia \
  --service-account=perundhu-preprod-backend@astute-strategy-406601.iam.gserviceaccount.com \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300s

echo "✅ Backend deployed"
```

**Frontend:**
```bash
gcloud run deploy perundhu-frontend-preprod \
  --image asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/frontend:preprod-latest \
  --platform managed \
  --region asia-south1 \
  --project astute-strategy-406601 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --timeout 60s

echo "✅ Frontend deployed"
```

---

## Verification Steps

### Check Service Status
```bash
# Backend
gcloud run services describe perundhu-preprod-backend \
  --region asia-south1 \
  --project astute-strategy-406601

# Frontend  
gcloud run services describe perundhu-frontend-preprod \
  --region asia-south1 \
  --project astute-strategy-406601
```

### Get Service URLs
```bash
# Backend URL
BACKEND_URL=$(gcloud run services describe perundhu-preprod-backend \
  --region asia-south1 \
  --format 'value(status.url)' \
  --project astute-strategy-406601)
echo "Backend: $BACKEND_URL"

# Frontend URL
FRONTEND_URL=$(gcloud run services describe perundhu-frontend-preprod \
  --region asia-south1 \
  --format 'value(status.url)' \
  --project astute-strategy-406601)
echo "Frontend: $FRONTEND_URL"
```

### Run Health Checks
```bash
# Backend health check
curl -i $BACKEND_URL/actuator/health

# Frontend accessibility
curl -i -I $FRONTEND_URL
```

### View Logs
```bash
# Backend logs (last 50 lines)
gcloud run logs read perundhu-preprod-backend \
  --region asia-south1 \
  --project astute-strategy-406601 \
  --limit 50

# Frontend logs
gcloud run logs read perundhu-frontend-preprod \
  --region asia-south1 \
  --project astute-strategy-406601 \
  --limit 50
```

---

## Troubleshooting

### Issue: Docker Build Fails
```bash
# Clear Docker cache
docker builder prune -f

# Retry build with verbose output
docker build --progress=plain -t $IMAGE .
```

### Issue: Cloud SQL Connection Fails
```bash
# Verify Cloud SQL instance is running
gcloud sql instances list --project=astute-strategy-406601

# Check if proxy can connect
cloud_sql_proxy -instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia=tcp:3306 &
mysql -h 127.0.0.1 -u perundhu_user -p -e "SELECT 1;"
```

### Issue: Deployment Hangs
```bash
# Check Cloud Run service status
gcloud run services list --project=astute-strategy-406601 --region=asia-south1

# View detailed logs
gcloud run logs read perundhu-preprod-backend --limit=100 --region=asia-south1 --project=astute-strategy-406601
```

### Issue: Service Returns 500 Error
```bash
# Check environment variables
gcloud run services describe perundhu-preprod-backend --region=asia-south1 | grep -A 20 "env:"

# Check secrets are accessible
gcloud secrets versions list preprod-db-password --project=astute-strategy-406601
```

---

## Rollback Procedure

If deployment has issues, rollback to previous version:

```bash
# Get previous revision
PREVIOUS_REVISION=$(gcloud run revisions list \
  --service=perundhu-preprod-backend \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --format='value(name)' \
  --sort-by=~ACTIVE \
  --limit=2 | tail -1)

# Route 100% traffic to previous revision
gcloud run services update-traffic perundhu-preprod-backend \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --to-revisions=$PREVIOUS_REVISION=100

echo "✅ Rolled back to: $PREVIOUS_REVISION"
```

---

## Performance Monitoring

### View Metrics
```bash
# CPU usage in last hour
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_count"' \
  --project=astute-strategy-406601
```

### Check Recent Deployments
```bash
gcloud run revisions list \
  --service=perundhu-preprod-backend \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --limit=10
```

---

## Timeline Expectations

| Phase | Time | Details |
|-------|------|---------|
| CI (tests) | 5-10 min | Run unit/integration tests |
| Build Backend | 10-15 min | Compile Java, build Docker image |
| Build Frontend | 5-10 min | Build Vite app, build Docker image |
| Migrations | 2-5 min | Run Flyway migrations |
| Deploy Backend | 5 min | Deploy to Cloud Run |
| Deploy Frontend | 5 min | Deploy to Cloud Run |
| Smoke Tests | 2-5 min | Health checks |
| **Total** | **30-50 min** | Full deployment |

---

## Success Criteria ✅

After deployment, verify:

- [ ] Backend Cloud Run service is running
- [ ] Frontend Cloud Run service is running
- [ ] Backend `/actuator/health` returns HTTP 200
- [ ] Frontend loads without errors
- [ ] Database migrations completed successfully
- [ ] No errors in Cloud Run logs
- [ ] Application responds to API requests

---

## Support & References

- **GCP Console**: https://console.cloud.google.com/run?project=astute-strategy-406601
- **Cloud Run Docs**: https://cloud.google.com/run/docs
- **GitHub Actions**: https://github.com/cmadhava85/perundhu/actions
- **Terraform**: `/infrastructure/terraform/environments/preprod/`

---

## Next Steps

Choose your deployment method:

1. **Quick** (Recommended): Push code → Auto-deploy via CI/CD
2. **Manual**: Use GitHub Actions workflow dispatch
3. **Advanced**: Use manual deployment commands

**Ready to deploy?** Pick a method above and follow the steps! 🚀
