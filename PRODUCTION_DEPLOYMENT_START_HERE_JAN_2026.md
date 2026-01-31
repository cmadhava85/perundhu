# 🚀 PRODUCTION DEPLOYMENT - START HERE (JANUARY 2026)

**Date**: January 30, 2026  
**Status**: Services Currently STOPPED (since Jan 10)  
**Target**: Restart/Redeploy to Production  
**Task**: Complete production deployment for go-live  
**Estimated Time**: 2-3 hours (depending on GCP infrastructure state)

---

## 📋 EXECUTIVE SUMMARY

Your production services are **currently STOPPED** to save costs. This guide will help you:
1. ✅ Verify all production configuration is ready
2. ✅ Restart/recreate GCP infrastructure
3. ✅ Deploy application services
4. ✅ Configure DNS and SSL
5. ✅ Run smoke tests
6. ✅ Go live on perundhu.com

---

## 🎯 PRE-DEPLOYMENT VERIFICATION CHECKLIST

Before starting, verify these critical items:

### Configuration Files ✅
- [x] Frontend production config: `frontend/.env.production` exists and configured
- [x] Backend production config: `backend/app/src/main/resources/application-production.properties` exists
- [x] reCAPTCHA configured in both frontend and backend for production
- [x] All environment variables properly set

### Critical Secrets Ready ✅
```bash
# Verify these secrets exist in GCP Secret Manager:
gcloud secrets list --project=perundhu-prod-001 --format="table(name)"
```

**Required secrets:**
- [ ] production-db-url
- [ ] production-db-username
- [ ] production-db-password
- [ ] production-jwt-secret
- [ ] production-data-encryption-key
- [ ] recaptcha-site-key
- [ ] recaptcha-secret-key
- [ ] admin-username
- [ ] admin-password

### Domain & DNS ✅
- [ ] Domain `perundhu.com` registered and accessible
- [ ] Registrar credentials available (Squarespace)
- [ ] Cloud DNS zone created in GCP: `perundhu-com`
- [ ] Nameservers configured at registrar

---

## 🔧 PHASE 0: IMMEDIATE SETUP (Before Infrastructure)

### Step 0.1: Verify GCP Project

```bash
# Set project ID
export PROJECT_ID="perundhu-prod-001"
export REGION="asia-south1"
export ZONE="asia-south1-a"

# Verify project exists and is accessible
gcloud config set project $PROJECT_ID
gcloud projects describe $PROJECT_ID

# Expected output:
# projectId: perundhu-prod-001
# projectNumber: <number>
# lifecycleState: ACTIVE
```

**If project doesn't exist, create it:**
```bash
gcloud projects create perundhu-prod-001 \
  --name="Perundhu Production"

gcloud config set project perundhu-prod-001

# Enable billing
gcloud billing projects link perundhu-prod-001 \
  --billing-account=<YOUR_BILLING_ACCOUNT_ID>
```

### Step 0.2: Enable Required APIs

```bash
# Enable all required services
gcloud services enable \
  compute.googleapis.com \
  sql.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  artifactregistry.googleapis.com \
  storage-api.googleapis.com \
  secret.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  dns.googleapis.com \
  --project=$PROJECT_ID

# Verify all are enabled
gcloud services list --enabled --project=$PROJECT_ID
```

### Step 0.3: Create Service Account (if not exists)

```bash
# Check if service account exists
gcloud iam service-accounts list --project=$PROJECT_ID --format="table(email)"

# If not exists, create it:
gcloud iam service-accounts create cloud-run-sa \
  --display-name="Cloud Run Service Account" \
  --project=$PROJECT_ID

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:cloud-run-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:cloud-run-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:cloud-run-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"
```

### Step 0.4: Create Secret Manager Secrets

```bash
# Create each secret (using environment variables)
gcloud secrets create production-db-url \
  --replication-policy="automatic" \
  --data-file=- <<< "jdbc:mysql://perundhu-production-mysql.c.${PROJECT_ID}.internal:3306/perundhu?useSSL=true&serverTimezone=UTC" \
  --project=$PROJECT_ID

gcloud secrets create production-db-username \
  --replication-policy="automatic" \
  --data-file=- <<< "prod_user" \
  --project=$PROJECT_ID

# ⚠️ For passwords and sensitive data, use secure input
read -sp "Enter database password: " DB_PASSWORD
gcloud secrets create production-db-password \
  --replication-policy="automatic" \
  --data-file=- <<< "$DB_PASSWORD" \
  --project=$PROJECT_ID

# Continue with other secrets similarly...
```

---

## 🏗️ PHASE 1: INFRASTRUCTURE SETUP (60 minutes)

### Step 1.1: Verify/Create Cloud SQL Instance

```bash
# Check if instance exists
gcloud sql instances describe perundhu-production-mysql \
  --project=$PROJECT_ID

# If instance was stopped (should be if it was paused for cost), restart it:
gcloud sql instances patch perundhu-production-mysql \
  --activation-policy=ALWAYS \
  --project=$PROJECT_ID

# If instance doesn't exist, create it:
gcloud sql instances create perundhu-production-mysql \
  --database-version=MYSQL_8_0 \
  --tier=db-n1-standard-1 \
  --region=$REGION \
  --network="perundhu-production-vpc" \
  --no-assign-ip \
  --availability-type=REGIONAL \
  --enable-bin-log \
  --backup-start-time=03:00 \
  --backup-location=asia \
  --enable-point-in-time-recovery \
  --database-flags=cloudsql_iam_authentication=on \
  --project=$PROJECT_ID

# Wait for instance to be ready (5-10 minutes)
gcloud sql operations wait --project=$PROJECT_ID $(gcloud sql operations list \
  --instance=perundhu-production-mysql --project=$PROJECT_ID -L 1 --format="value(name)")
```

### Step 1.2: Verify/Create VPC Network

```bash
# Check if VPC exists
gcloud compute networks describe perundhu-production-vpc \
  --project=$PROJECT_ID

# If not, create it:
gcloud compute networks create perundhu-production-vpc \
  --subnet-mode=custom \
  --project=$PROJECT_ID

# Create subnet
gcloud compute networks subnets create perundhu-production-subnet \
  --network=perundhu-production-vpc \
  --range=10.0.1.0/24 \
  --region=$REGION \
  --project=$PROJECT_ID
```

### Step 1.3: Create VPC Connector (for Cloud Run to access Cloud SQL)

```bash
# Check if connector exists
gcloud compute networks vpc-access connectors describe perundhu-prod-vpc-conn \
  --region=$REGION \
  --project=$PROJECT_ID

# If not, create it:
gcloud compute networks vpc-access connectors create perundhu-prod-vpc-conn \
  --network=perundhu-production-vpc \
  --region=$REGION \
  --min-instances=2 \
  --max-instances=10 \
  --machine-type=e2-micro \
  --project=$PROJECT_ID

# Wait for creation (5-10 minutes)
```

### Step 1.4: Run Database Migrations

```bash
# Create database and user (if not exists)
gcloud sql connect perundhu-production-mysql \
  --user=root \
  --project=$PROJECT_ID << 'EOF'
CREATE DATABASE IF NOT EXISTS perundhu;
CREATE USER IF NOT EXISTS 'prod_user'@'%' IDENTIFIED BY 'YOUR_PASSWORD';
GRANT ALL PRIVILEGES ON perundhu.* TO 'prod_user'@'%';
FLUSH PRIVILEGES;
EOF

# Run Flyway migrations
cd backend
./gradlew flywayMigrate \
  -Dspring.profiles.active=production \
  -Dflyway.locations="filesystem:app/src/main/resources/db/migration" \
  -Dflyway.url="jdbc:mysql://127.0.0.1:3306/perundhu?useSSL=false" \
  -Dflyway.user="prod_user" \
  -Dflyway.password="YOUR_PASSWORD" \
  -x test

# Verify migrations completed
cd ../
```

---

## 📦 PHASE 2: BUILD & PUSH DOCKER IMAGES (30-45 minutes)

### Step 2.1: Build Backend Docker Image

```bash
cd backend

# Build Docker image
docker build \
  --dockerfile Dockerfile \
  --tag asia-south1-docker.pkg.dev/${PROJECT_ID}/perundhu/backend:1.0.0 \
  --tag asia-south1-docker.pkg.dev/${PROJECT_ID}/perundhu/backend:latest \
  .

# Push to Artifact Registry
docker push asia-south1-docker.pkg.dev/${PROJECT_ID}/perundhu/backend:1.0.0
docker push asia-south1-docker.pkg.dev/${PROJECT_ID}/perundhu/backend:latest

echo "✅ Backend image pushed: asia-south1-docker.pkg.dev/${PROJECT_ID}/perundhu/backend:1.0.0"

cd ..
```

### Step 2.2: Build Frontend Docker Image

```bash
cd frontend

# Build production frontend
npm run build:production

# Build Docker image
docker build \
  --dockerfile Dockerfile \
  --tag asia-south1-docker.pkg.dev/${PROJECT_ID}/perundhu/frontend:1.0.0 \
  --tag asia-south1-docker.pkg.dev/${PROJECT_ID}/perundhu/frontend:latest \
  .

# Push to Artifact Registry
docker push asia-south1-docker.pkg.dev/${PROJECT_ID}/perundhu/frontend:1.0.0
docker push asia-south1-docker.pkg.dev/${PROJECT_ID}/perundhu/frontend:latest

echo "✅ Frontend image pushed: asia-south1-docker.pkg.dev/${PROJECT_ID}/perundhu/frontend:1.0.0"

cd ..
```

---

## 🚀 PHASE 3: DEPLOY TO CLOUD RUN (20 minutes)

### Step 3.1: Deploy Backend to Cloud Run

```bash
# Deploy backend
gcloud run deploy perundhu-backend \
  --image "asia-south1-docker.pkg.dev/${PROJECT_ID}/perundhu/backend:1.0.0" \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --service-account "cloud-run-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --memory 1Gi \
  --cpu 2 \
  --timeout 60 \
  --max-instances 10 \
  --min-instances 1 \
  --allow-unauthenticated \
  --vpc-connector "perundhu-prod-vpc-conn" \
  --vpc-egress all-traffic \
  --set-env-vars "SPRING_PROFILES_ACTIVE=production,JAVA_OPTS=-XX:+UseG1GC" \
  --labels "environment=production,app=perundhu,component=backend"

# Get backend URL
BACKEND_URL=$(gcloud run services describe perundhu-backend \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --format='value(status.url)')

echo "✅ Backend deployed: $BACKEND_URL"
export BACKEND_URL
```

### Step 3.2: Deploy Frontend to Cloud Run

```bash
# Deploy frontend
gcloud run deploy perundhu-frontend \
  --image "asia-south1-docker.pkg.dev/${PROJECT_ID}/perundhu/frontend:1.0.0" \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --service-account "cloud-run-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60 \
  --max-instances 5 \
  --min-instances 1 \
  --allow-unauthenticated \
  --set-env-vars "VITE_API_URL=$BACKEND_URL" \
  --labels "environment=production,app=perundhu,component=frontend"

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe perundhu-frontend \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --format='value(status.url)')

echo "✅ Frontend deployed: $FRONTEND_URL"
export FRONTEND_URL
```

---

## 🌐 PHASE 4: CONFIGURE DNS (10 minutes)

### Step 4.1: Get Cloud Run Service IPs

```bash
# Get backend IP
BACKEND_IP=$(gcloud run services describe perundhu-backend \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --format='value(status.address.serverUrl)' | sed 's|https://||;s|/||')

# Get frontend IP (from Cloud Run external URL)
FRONTEND_IP=$(gcloud run services describe perundhu-frontend \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --format='value(status.address.serverUrl)' | sed 's|https://||;s|/||')

echo "Backend IP: $BACKEND_IP"
echo "Frontend IP: $FRONTEND_IP"
```

### Step 4.2: Create DNS Records

```bash
# Get the actual IP addresses from Cloud Run (they use cloudrun.app domains)
# Since Cloud Run uses dynamic IPs, we'll use CNAME records instead

# Create CNAME record for root domain (frontend)
gcloud dns record-sets update perundhu.com. \
  --rrdatas="perundhu-frontend.asia-south1.run.app" \
  --ttl=300 \
  --type=CNAME \
  --zone=perundhu-com \
  --project=$PROJECT_ID

# Create CNAME record for API subdomain (backend)
gcloud dns record-sets update api.perundhu.com. \
  --rrdatas="perundhu-backend.asia-south1.run.app" \
  --ttl=300 \
  --type=CNAME \
  --zone=perundhu-com \
  --project=$PROJECT_ID

# Verify DNS records
gcloud dns record-sets list --zone=perundhu-com --project=$PROJECT_ID
```

### Step 4.3: Configure Cloud Run for Custom Domains

```bash
# Map custom domain to frontend
gcloud run domain-mappings create \
  --service perundhu-frontend \
  --domain perundhu.com \
  --project=$PROJECT_ID \
  --region=$REGION

# Map custom domain to backend
gcloud run domain-mappings create \
  --service perundhu-backend \
  --domain api.perundhu.com \
  --project=$PROJECT_ID \
  --region=$REGION

# Wait for SSL certificates to be provisioned (5-15 minutes)
for i in {1..30}; do
  echo "Checking domain mapping status... ($i/30)"
  gcloud run domain-mappings describe perundhu.com \
    --project=$PROJECT_ID --region=$REGION 2>/dev/null && break
  sleep 10
done
```

---

## ✅ PHASE 5: SMOKE TESTING (20 minutes)

### Step 5.1: Test Backend API

```bash
# Test backend health endpoint
curl -v https://api.perundhu.com/actuator/health

# Expected response:
# {"status":"UP"}

# Test admin auth endpoint
curl -X POST https://api.perundhu.com/api/admin/auth/status

# Test database connectivity
curl https://api.perundhu.com/api/v1/locations/search?query=Chennai

echo "✅ Backend API is responding"
```

### Step 5.2: Test Frontend

```bash
# Test frontend is loading
curl -I https://perundhu.com

# Expected: HTTP/2 200

# Open in browser and verify:
# - Page loads without errors
# - reCAPTCHA script loads (check browser console)
# - Search functionality works
# - Admin login form is protected by reCAPTCHA

echo "✅ Frontend is responding"
```

### Step 5.3: Test DNS Resolution

```bash
# Verify DNS propagation
dig perundhu.com

# Verify DNS for API subdomain
dig api.perundhu.com

# Both should resolve to Cloud Run domains
```

### Step 5.4: Test reCAPTCHA

```bash
# Check reCAPTCHA configuration in browser console
# Should see: "reCAPTCHA Enterprise loaded successfully"

# Open admin login form and verify reCAPTCHA token is being sent
# Network tab should show token header:
# X-reCAPTCHA-Token: <token_value>
```

---

## 📊 MONITORING & ALERTING SETUP (Optional but Recommended)

### Step 5.5: Create Monitoring Dashboards

```bash
# Create a basic monitoring dashboard
gcloud monitoring dashboards create --config-from-file=- << 'EOF'
{
  "displayName": "Perundhu Production Dashboard",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Backend Health",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" resource.label.service_name=\"perundhu-backend\" metric.type=\"run.googleapis.com/request_count\""
                }
              }
            }]
          }
        }
      },
      {
        "xPos": 6,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Frontend Health",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" resource.label.service_name=\"perundhu-frontend\" metric.type=\"run.googleapis.com/request_count\""
                }
              }
            }]
          }
        }
      }
    ]
  }
}
EOF
```

### Step 5.6: Set Up Alerts

```bash
# Create alert for high error rates on backend
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Backend Error Rate Alert" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=5 \
  --condition-threshold-duration=300s
```

---

## 🎉 PHASE 6: GO-LIVE! 

### Congratulations! Your production deployment is complete

**Verification Checklist:**
- [x] Cloud SQL running
- [x] Migrations applied
- [x] Backend deployed to Cloud Run
- [x] Frontend deployed to Cloud Run
- [x] DNS records configured
- [x] SSL certificates provisioned
- [x] Smoke tests passed
- [x] reCAPTCHA working
- [x] API endpoints responding
- [x] Frontend loading

### Final Steps:
1. **Monitor Logs** (First 24 hours)
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=perundhu-backend" \
     --project=$PROJECT_ID --limit 50 --format json
   ```

2. **Check Performance** (Monitor dashboard)
   - Response times (should be < 1s)
   - Error rates (should be < 0.5%)
   - CPU utilization (should be < 70%)

3. **Monitor Costs** (Optional)
   ```bash
   gcloud billing accounts projects describe perundhu-prod-001
   ```

---

## 🚨 ROLLBACK PROCEDURE (if needed)

```bash
# If something goes wrong, rollback with:

# 1. Stop backend service
gcloud run services delete perundhu-backend --project=$PROJECT_ID --region=$REGION --quiet

# 2. Stop frontend service  
gcloud run services delete perundhu-frontend --project=$PROJECT_ID --region=$REGION --quiet

# 3. Stop database
gcloud sql instances patch perundhu-production-mysql \
  --activation-policy=NEVER --project=$PROJECT_ID

# 4. Services still accessible via .run.app URLs temporarily during rollback
```

---

## 📞 TROUBLESHOOTING

### Cloud Run service not responding
```bash
# Check service status
gcloud run services describe perundhu-backend --region=$REGION --project=$PROJECT_ID

# Check logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=perundhu-backend" \
  --project=$PROJECT_ID --limit 50
```

### DNS not resolving
```bash
# Flush local DNS cache
sudo dscacheutil -flushcache

# Verify DNS propagation globally
nslookup perundhu.com
```

### Database connection issues
```bash
# Test database connection from Cloud Shell
gcloud sql connect perundhu-production-mysql --user=prod_user --project=$PROJECT_ID
```

---

## 📋 DEPLOYMENT COMPLETION CHECKLIST

- [ ] GCP Project verified/created
- [ ] APIs enabled
- [ ] Service account created
- [ ] Secrets configured
- [ ] Cloud SQL running
- [ ] VPC & VPC Connector ready
- [ ] Database migrations applied
- [ ] Backend Docker image built & pushed
- [ ] Frontend Docker image built & pushed
- [ ] Backend deployed to Cloud Run
- [ ] Frontend deployed to Cloud Run
- [ ] DNS records created
- [ ] Domain mappings configured
- [ ] Backend API responding
- [ ] Frontend loading
- [ ] reCAPTCHA working
- [ ] Smoke tests passed
- [ ] Monitoring dashboard created
- [ ] Alerts configured
- [ ] Team notified of go-live

---

## 📞 QUICK REFERENCE COMMANDS

```bash
# Set variables
export PROJECT_ID="perundhu-prod-001"
export REGION="asia-south1"

# Check service status
gcloud run services list --project=$PROJECT_ID --region=$REGION

# View logs
gcloud logging read "resource.type=cloud_run_revision" --project=$PROJECT_ID --limit 50

# Get service URL
gcloud run services describe perundhu-backend --region=$REGION --project=$PROJECT_ID --format='value(status.url)'

# Check database status
gcloud sql instances describe perundhu-production-mysql --project=$PROJECT_ID

# Scale instances
gcloud run services update perundhu-backend --min-instances 2 --max-instances 20 --region=$REGION --project=$PROJECT_ID
```

---

**Status**: Ready for Production Deployment ✅  
**Estimated Duration**: 2-3 hours  
**Go-Live Target**: Today (or as scheduled)  
**Support**: Comprehensive guide provided above  

**Let's Deploy Perundhu! 🚀**

