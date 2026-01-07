# Preprod Setup - Complete Command Reference

## 🚀 ONE-COMMAND SETUP (Recommended)

**Prerequisites**: Docker Desktop MUST be running

### Step 1: Start Docker (if not running)
```bash
# Open Docker Desktop GUI manually, OR
/Applications/Docker.app/Contents/MacOS/Docker &
sleep 60  # Wait 60 seconds for daemon to start
docker ps  # Verify Docker is running
```

### Step 2: Run Complete Deployment
```bash
cd /Users/mchand69/Documents/perundhu
bash setup-preprod-all.sh
```

This single command will:
✅ Verify all prerequisites  
✅ Configure Docker authentication  
✅ Provision Terraform infrastructure (10-15 min)  
✅ Setup database and credentials  
✅ Build backend Docker image  
✅ Build frontend Docker image  
✅ Deploy backend to Cloud Run  
✅ Deploy frontend to Cloud Run  
✅ Verify everything works  

---

## 📋 MANUAL STEP-BY-STEP (If you want to see each step)

### 1. Start Docker
```bash
/Applications/Docker.app/Contents/MacOS/Docker &
sleep 60
docker ps
```

### 2. Set GCP Project
```bash
gcloud config set project astute-strategy-406601
gcloud auth list  # Verify you're logged in
```

### 3. Configure Docker Registry
```bash
gcloud auth configure-docker asia-south1-docker.pkg.dev --quiet
```

### 4. Terraform: Provision Infrastructure
```bash
cd /Users/mchand69/Documents/perundhu/infrastructure/terraform/environments/preprod

terraform init

terraform plan \
  -var="project_id=astute-strategy-406601" \
  -var="notification_email=alerts@perundhu.com" \
  -var="db_version=MYSQL_8_0" \
  -var="db_instance_tier=db-f1-micro" \
  -var="db_instance_name_suffix=-asia" \
  -out=tfplan

terraform apply tfplan
```
⏱️ **Duration**: 10-15 minutes

### 5. Setup Database
```bash
cd /Users/mchand69/Documents/perundhu

# Wait for Cloud SQL to be ready
sleep 30

# Create database and user
gcloud sql connect perundhu-preprod-mysql-asia \
  --user=root \
  --region=asia-south1 \
  --project=astute-strategy-406601 <<'SQLEOF'
CREATE DATABASE IF NOT EXISTS perundhu;
CREATE USER IF NOT EXISTS 'perundhu_user'@'%' IDENTIFIED BY 'temp_password';
GRANT ALL PRIVILEGES ON perundhu.* TO 'perundhu_user'@'%';
FLUSH PRIVILEGES;
SQLEOF

# Generate secure password and store
DB_PASSWORD=$(openssl rand -base64 32)
echo -n "${DB_PASSWORD}" | gcloud secrets create db-password \
  --data-file=- \
  --replication-policy="user-managed" \
  --locations="asia-south1" \
  --project=astute-strategy-406601

echo -n "perundhu_user" | gcloud secrets create db-username \
  --data-file=- \
  --replication-policy="user-managed" \
  --locations="asia-south1" \
  --project=astute-strategy-406601
```
⏱️ **Duration**: 2-3 minutes

### 6. Build Backend Docker Image
```bash
cd /Users/mchand69/Documents/perundhu/backend

# Build JAR
./gradlew clean build -Dspring.profiles.active=preprod -x test --no-daemon

# Build and push Docker image
docker build -t asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-latest .
docker push asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-latest
```
⏱️ **Duration**: 3-5 minutes

### 7. Build Frontend Docker Image
```bash
cd /Users/mchand69/Documents/perundhu/frontend

# Build
npm run build

# Build and push Docker image
docker build -t asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/frontend:preprod-latest .
docker push asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/frontend:preprod-latest
```
⏱️ **Duration**: 2-3 minutes

### 8. Deploy Backend to Cloud Run
```bash
cd /Users/mchand69/Documents/perundhu

# Get credentials
DB_USERNAME=$(gcloud secrets versions access latest --secret=db-username --project=astute-strategy-406601)
DB_PASSWORD=$(gcloud secrets versions access latest --secret=db-password --project=astute-strategy-406601)
GEMINI_API_KEY=$(gcloud secrets versions access latest --secret=gemini-api-key --project=astute-strategy-406601 2>/dev/null || echo "")

# Deploy
gcloud run deploy perundhu-backend-preprod \
  --image=asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-latest \
  --platform=managed \
  --region=asia-south1 \
  --allow-unauthenticated \
  --project=astute-strategy-406601 \
  --set-env-vars \
    SPRING_PROFILES_ACTIVE=preprod,\
    GCP_INSTANCE_CONNECTION_NAME=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia,\
    DB_USERNAME=${DB_USERNAME},\
    DB_PASSWORD=${DB_PASSWORD},\
    GEMINI_API_KEY=${GEMINI_API_KEY},\
    FLYWAY_ENABLED=true,\
    SERVER_PORT=8080,\
    LOG_LEVEL_ROOT=INFO,\
    LOG_LEVEL_APP=INFO \
  --add-cloudsql-instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia \
  --service-account=terraform@astute-strategy-406601.iam.gserviceaccount.com \
  --cpu=2 \
  --memory=2Gi \
  --timeout=3600s \
  --max-instances=10 \
  --min-instances=0

# Get backend URL
BACKEND_URL=$(gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --format='value(status.url)')

echo "Backend URL: ${BACKEND_URL}"
```
⏱️ **Duration**: 3-5 minutes

### 9. Deploy Frontend to Cloud Run
```bash
# Get backend URL (from previous step)
BACKEND_URL=$(gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --format='value(status.url)')

# Deploy frontend
gcloud run deploy perundhu-frontend-preprod \
  --image=asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/frontend:preprod-latest \
  --platform=managed \
  --region=asia-south1 \
  --allow-unauthenticated \
  --project=astute-strategy-406601 \
  --set-env-vars \
    NEXT_PUBLIC_API_URL=${BACKEND_URL} \
  --cpu=1 \
  --memory=1Gi \
  --timeout=600s \
  --max-instances=10 \
  --min-instances=0

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe perundhu-frontend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --format='value(status.url)')

echo "Frontend URL: ${FRONTEND_URL}"
```
⏱️ **Duration**: 2-3 minutes

---

## ✅ VERIFICATION

### Check Services
```bash
# Backend
gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601

# Frontend
gcloud run services describe perundhu-frontend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601
```

### Test Backend Health
```bash
BACKEND_URL=$(gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --format='value(status.url)')

curl -i "${BACKEND_URL}/actuator/health"
# Expected: HTTP 200 with {"status":"UP"}
```

### Check Flyway Migrations
```bash
gcloud sql connect perundhu-preprod-mysql-asia \
  --user=root \
  --region=asia-south1 \
  --project=astute-strategy-406601

# In MySQL prompt:
SELECT COUNT(*) as migration_count FROM flyway_schema_history;
SELECT version, description, success FROM flyway_schema_history LIMIT 5;
```

### Monitor Logs
```bash
# Backend logs
gcloud run logs read perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --limit=100 | grep -E "Started|Flyway|ERROR"

# Frontend logs
gcloud run logs read perundhu-frontend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --limit=100
```

---

## 🎯 RECOMMENDED: Use the All-In-One Script

**Easiest way**:
```bash
# 1. Start Docker manually (if not already running):
#    - Open /Applications/Docker.app OR
#    - Run: /Applications/Docker.app/Contents/MacOS/Docker &
#    - Wait 60 seconds

# 2. Run deployment:
cd /Users/mchand69/Documents/perundhu
bash setup-preprod-all.sh
```

The script will handle everything automatically!

---

## ⏱️ Total Time Estimate

| Component | Duration |
|-----------|----------|
| Docker startup | 1-2 min |
| Terraform | 10-15 min |
| Database setup | 2-3 min |
| Backend build | 3-5 min |
| Frontend build | 2-3 min |
| Backend deploy | 3-5 min |
| Frontend deploy | 2-3 min |
| **TOTAL** | **30-45 min** |

---

## 🚨 Troubleshooting

### Docker won't start
```bash
# Try this:
/Applications/Docker.app/Contents/MacOS/Docker &
sleep 120  # Wait 2 minutes instead of 1
docker ps
```

### Terraform fails
```bash
cd /Users/mchand69/Documents/perundhu/infrastructure/terraform/environments/preprod
rm -rf .terraform .terraform.lock.hcl
terraform init
```

### Database connection fails
```bash
# Check instance
gcloud sql instances describe perundhu-preprod-mysql-asia --project=astute-strategy-406601

# Check secrets
gcloud secrets list --project=astute-strategy-406601 | grep db-
```

### Cloud Run deployment fails
```bash
# Check service account permissions
gcloud projects get-iam-policy astute-strategy-406601 \
  --flatten="bindings[].members" \
  --filter="bindings.members:terraform@astute-strategy-406601.iam.gserviceaccount.com"
```

---

## 📞 Next Steps After Successful Deployment

1. **Open frontend in browser** → Test the application
2. **Monitor logs** → Check for any errors
3. **Run smoke tests** → Verify core functionality
4. **Load testing** (optional) → Before production
5. **Production deployment** → When ready

---

**Created**: January 7, 2026  
**Status**: Ready to Deploy  
**Command**: `bash /Users/mchand69/Documents/perundhu/setup-preprod-all.sh`
