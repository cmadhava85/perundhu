# Preprod Migration to us-central1

**Project**: astute-strategy-406601  
**Current Region**: asia-south1  
**Target Region**: us-central1  
**Goal**: Reduce costs + enable Cloud Run domain mappings  
**Date**: February 24, 2026

---

## 🎯 Benefits of Migration

1. **Cost Savings**: ~30-40% cheaper in us-central1
   - Cloud SQL: ~$1-2/month cheaper
   - Cloud Run: ~20% cheaper pricing
   - Storage/networking: ~15% cheaper

2. **Cloud Run Domain Mappings**: Enabled in us-central1
   - Can use custom domains without load balancer
   - Consistent with production setup

3. **Environment Consistency**: Both prod and preprod in same region
   - Simplified management
   - Predictable behavior

---

## 📊 Current Preprod Setup (asia-south1)

### Resources to Migrate:
- **Cloud SQL**: `perundhu-preprod-mysql` (asia-south1)
- **Cloud Run Backend**: `perundhu-backend-preprod` (asia-south1)
- **Cloud Run Frontend**: `perundhu-frontend-preprod` (asia-south1)
- **Artifact Registry**: asia-south1-docker.pkg.dev
- **Cloud Storage**: Various buckets

---

## 📋 Migration Plan (Faster than Production)

Since preprod is not customer-facing, we can:
- ✅ Allow brief downtime (5-10 minutes)
- ✅ Skip parallel running (simpler cutover)
- ✅ Move faster (less testing required)

### Time Estimate: 1-2 hours total

---

## 🛠️ Migration Steps

### Phase 1: Backup Current Preprod (15 minutes)

```bash
# 1. Export preprod database
gsutil mb -p astute-strategy-406601 -l us-central1 gs://preprod-backups-us

# Grant Cloud SQL service account permissions
PREPROD_SA=$(gcloud sql instances describe perundhu-preprod-mysql \
  --project=astute-strategy-406601 \
  --format="value(serviceAccountEmailAddress)")

gsutil iam ch serviceAccount:${PREPROD_SA}:objectAdmin gs://preprod-backups-us

# Export database
gcloud sql export sql perundhu-preprod-mysql \
  gs://preprod-backups-us/preprod-backup-$(date +%Y%m%d-%H%M%S).sql \
  --database=perundhu \
  --project=astute-strategy-406601
```

### Phase 2: Create New Infrastructure in us-central1 (20 minutes)

```bash
# 1. Create Cloud SQL instance in us-central1
gcloud sql instances create perundhu-preprod-mysql-us \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --backup-start-time=02:00 \
  --retained-backups-count=3 \
  --database-flags=character_set_server=utf8mb4,max_connections=100 \
  --availability-type=zonal \
  --storage-type=HDD \
  --storage-size=10GB \
  --storage-auto-increase \
  --project=astute-strategy-406601

# 2. Create Artifact Registry in us-central1
gcloud artifacts repositories create perundhu-preprod-us \
  --repository-format=docker \
  --location=us-central1 \
  --description="Preprod Docker images (us-central1)" \
  --project=astute-strategy-406601

# 3. Configure Docker auth
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### Phase 3: Import Database (10 minutes)

```bash
# Set root password
gcloud sql users set-password root \
  --host=% \
  --instance=perundhu-preprod-mysql-us \
  --password='YOUR_ROOT_PASSWORD' \
  --project=astute-strategy-406601

# Import database
gcloud sql import sql perundhu-preprod-mysql-us \
  gs://preprod-backups-us/preprod-backup-*.sql \
  --database=perundhu \
  --project=astute-strategy-406601

# Verify import
gcloud sql operations list \
  --instance=perundhu-preprod-mysql-us \
  --project=astute-strategy-406601 \
  --limit=5
```

### Phase 4: Update Application Configuration (5 minutes)

Update `backend/app/src/main/resources/application-preprod.properties`:

```properties
# OLD (asia-south1):
spring.datasource.url=jdbc:mysql:///perundhu?socketFactory=com.google.cloud.sql.mysql.SocketFactory&cloudSqlInstance=astute-strategy-406601:asia-south1:perundhu-preprod-mysql&connectTimeout=60000&socketTimeout=120000&autocommit=false

# NEW (us-central1):
spring.datasource.url=jdbc:mysql:///perundhu?socketFactory=com.google.cloud.sql.mysql.SocketFactory&cloudSqlInstance=astute-strategy-406601:us-central1:perundhu-preprod-mysql-us&connectTimeout=60000&socketTimeout=120000&autocommit=false
```

Update `scripts/unified_data_loader.py`:

```python
# OLD:
cloud_sql_instance = "astute-strategy-406601:asia-south1:perundhu-preprod-mysql"

# NEW:
cloud_sql_instance = "astute-strategy-406601:us-central1:perundhu-preprod-mysql-us"
```

### Phase 5: Build and Deploy Services (30 minutes)

```bash
# Get new Cloud SQL connection name
NEW_DB_CONN=$(gcloud sql instances describe perundhu-preprod-mysql-us \
  --project=astute-strategy-406601 \
  --format="value(connectionName)")

# Build backend image for us-central1
cd /Users/mchand69/Documents/perundhu/backend
docker build \
  -t us-central1-docker.pkg.dev/astute-strategy-406601/perundhu-preprod-us/backend:latest \
  --platform linux/amd64 .

docker push us-central1-docker.pkg.dev/astute-strategy-406601/perundhu-preprod-us/backend:latest

# Deploy backend to us-central1
gcloud run deploy perundhu-backend-preprod-us \
  --image=us-central1-docker.pkg.dev/astute-strategy-406601/perundhu-preprod-us/backend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="SPRING_PROFILES_ACTIVE=preprod" \
  --set-cloudsql-instances=${NEW_DB_CONN} \
  --cpu=1 \
  --memory=1Gi \
  --min-instances=0 \
  --max-instances=5 \
  --timeout=300 \
  --project=astute-strategy-406601

# Build frontend image
cd /Users/mchand69/Documents/perundhu/frontend

# Update .env.preprod with new backend URL first
# VITE_API_BASE_URL=https://perundhu-backend-preprod-us-XXXXXX.run.app

docker build \
  -t us-central1-docker.pkg.dev/astute-strategy-406601/perundhu-preprod-us/frontend:latest \
  --platform linux/amd64 .

docker push us-central1-docker.pkg.dev/astute-strategy-406601/perundhu-preprod-us/frontend:latest

# Deploy frontend
gcloud run deploy perundhu-frontend-preprod-us \
  --image=us-central1-docker.pkg.dev/astute-strategy-406601/perundhu-preprod-us/frontend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=0 \
  --max-instances=5 \
  --timeout=60 \
  --project=astute-strategy-406601
```

### Phase 6: Test Services (10 minutes)

```bash
# Get service URLs
BACKEND_URL=$(gcloud run services describe perundhu-backend-preprod-us \
  --region=us-central1 \
  --project=astute-strategy-406601 \
  --format="value(status.url)")

FRONTEND_URL=$(gcloud run services describe perundhu-frontend-preprod-us \
  --region=us-central1 \
  --project=astute-strategy-406601 \
  --format="value(status.url)")

# Test backend
curl ${BACKEND_URL}/v1/health

# Test frontend
curl -I ${FRONTEND_URL}

# Test database connectivity
curl ${BACKEND_URL}/v1/locations?limit=5
```

### Phase 7: Cleanup Old Resources (Optional - Do After 7 Days)

```bash
# Delete old Cloud Run services (asia-south1)
gcloud run services delete perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --quiet

gcloud run services delete perundhu-frontend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --quiet

# Delete old Cloud SQL instance (after verifying new one works)
gcloud sql instances delete perundhu-preprod-mysql \
  --project=astute-strategy-406601 \
  --quiet

# Delete old Artifact Registry
gcloud artifacts repositories delete perundhu-images \
  --location=asia-south1 \
  --project=astute-strategy-406601 \
  --quiet
```

---

## 💰 Expected Cost Savings

### Before Migration (asia-south1):
| Component | Cost |
|-----------|------|
| Cloud SQL (db-f1-micro) | $8-9/month |
| Cloud Run (backend) | $3-5/month |
| Cloud Run (frontend) | $3-5/month |
| Storage/Networking | $2-3/month |
| **Total** | **$16-22/month** |

### After Migration (us-central1):
| Component | Cost |
|-----------|------|
| Cloud SQL (db-f1-micro) | $7-8/month |
| Cloud Run (backend) | $2-4/month |
| Cloud Run (frontend) | $2-4/month |
| Storage/Networking | $2-3/month |
| **Total** | **$13-19/month** |

**Savings**: $3-6/month (19-27% reduction)

---

## ⚠️ Risks & Considerations

### Low Risk (Preprod Environment):
- ✅ Not customer-facing
- ✅ Can tolerate 5-10 minute downtime
- ✅ Easy to rollback if needed

### Mitigations:
- Keep old instances running for 7 days
- Test thoroughly before cleanup
- Document rollback procedure

---

## 🔄 Rollback Plan

If migration fails:

1. **Keep old services running** (already deployed)
2. **Revert application-preprod.properties** to old Cloud SQL connection
3. **Redeploy with old configuration**
4. **Investigate root cause**

---

## ✅ Post-Migration Tasks

1. Update documentation with new URLs
2. Update CI/CD pipelines (if any)
3. Monitor for 24-48 hours
4. Delete old resources after verification
5. Update team on new preprod URLs

---

## 📝 Commands Summary

**Quick Migration Script**:

```bash
#!/bin/bash
PROJECT_ID="astute-strategy-406601"
REGION_NEW="us-central1"
REGION_OLD="asia-south1"

# Export database
gcloud sql export sql perundhu-preprod-mysql \
  gs://preprod-backups-us/backup-$(date +%Y%m%d-%H%M%S).sql \
  --database=perundhu \
  --project=$PROJECT_ID

# Create new Cloud SQL
gcloud sql instances create perundhu-preprod-mysql-us \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=$REGION_NEW \
  --backup-start-time=02:00 \
  --retained-backups-count=3 \
  --database-flags=character_set_server=utf8mb4,max_connections=100 \
  --availability-type=zonal \
  --storage-type=HDD \
  --storage-size=10GB \
  --storage-auto-increase \
  --project=$PROJECT_ID

# Wait for SQL instance to be ready (check every 30 seconds)
while [ "$(gcloud sql instances describe perundhu-preprod-mysql-us --project=$PROJECT_ID --format='value(state)')" != "RUNNABLE" ]; do
  echo "Waiting for Cloud SQL instance..."
  sleep 30
done

# Import database
gcloud sql import sql perundhu-preprod-mysql-us \
  gs://preprod-backups-us/backup-*.sql \
  --database=perundhu \
  --project=$PROJECT_ID

echo "✅ Preprod migrated to us-central1!"
```

---

## 🚀 Next Steps

**Ready to migrate preprod?**

1. Backup current preprod database ✓
2. Create new infrastructure in us-central1
3. Update application configs
4. Deploy and test
5. Cleanup old resources (after 7 days)

**Estimated Time**: 1-2 hours  
**Risk Level**: Low (preprod environment)  
**Cost Savings**: $3-6/month

Would you like me to start the preprod migration now?
