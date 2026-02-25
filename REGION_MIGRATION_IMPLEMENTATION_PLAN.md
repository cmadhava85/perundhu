# Region Migration Implementation Plan: asia-south1 → us-central1

**Objective**: Migrate from asia-south1 (Mumbai) to us-central1 (Iowa) to enable Cloud Run domain mappings  
**Cost Target**: $20-30/month (remove $18-25/month load balancer)  
**Trade-off**: +100-200ms latency for India users  
**Date**: February 24, 2026

---

## 🎯 Why us-central1?

**us-central1 (Iowa, USA)** is the best choice because:
- ✅ Cloud Run domain mappings fully supported
- ✅ Cheapest GCP region (pricing tier 1)
- ✅ Most mature region with all features
- ✅ Better global average latency than europe-west1
- ✅ High availability (multiple zones)

**Latency Impact**:
- India → Mumbai: ~10-30ms (current)
- India → Iowa: ~120-180ms (estimated +100-150ms)
- USA → Iowa: ~10-50ms (improves USA traffic)
- Europe → Iowa: ~80-120ms (acceptable)

**Alternative**: europe-west1 (Belgium) has similar latency to India (~100-130ms) but higher pricing.

---

## 📋 Migration Checklist

### Phase 1: Pre-Migration Preparation (30 minutes)

- [ ] **1.1** Verify Cloud Run domain mapping support in us-central1
- [ ] **1.2** Create database backup (export SQL dump)
- [ ] **1.3** Document current configuration
- [ ] **1.4** Review and update Terraform for new region
- [ ] **1.5** Set maintenance window for migration

### Phase 2: Create New Infrastructure (60 minutes)

- [ ] **2.1** Create Cloud SQL instance in us-central1
- [ ] **2.2** Import database backup
- [ ] **2.3** Configure HikariCP connection pool settings
- [ ] **2.4** Create Artifact Registry repository (us-central1)
- [ ] **2.5** Build and push Docker images to new region

### Phase 3: Deploy Services (30 minutes)

- [ ] **3.1** Deploy backend Cloud Run to us-central1
- [ ] **3.2** Deploy frontend Cloud Run to us-central1
- [ ] **3.3** Test services with direct Cloud Run URLs
- [ ] **3.4** Verify database connectivity
- [ ] **3.5** Run smoke tests

### Phase 4: Domain Mapping (15 minutes)

- [ ] **4.1** Create domain mapping for www.perundhu.com
- [ ] **4.2** Create domain mapping for api.perundhu.com
- [ ] **4.3** Verify Google-managed SSL certificates
- [ ] **4.4** Test domain mappings

### Phase 5: DNS Cutover (10 minutes)

- [ ] **5.1** Lower DNS TTL to 60 seconds (1 hour before cutover)
- [ ] **5.2** Update Cloud DNS A records to point to new IPs
- [ ] **5.3** Monitor DNS propagation
- [ ] **5.4** Test domains from multiple locations

### Phase 6: Cleanup (20 minutes)

- [ ] **6.1** Delete load balancer components
- [ ] **6.2** Delete old Cloud Run services (asia-south1)
- [ ] **6.3** Delete old Cloud SQL instance (after 7 days backup)
- [ ] **6.4** Delete old Artifact Registry (asia-south1)
- [ ] **6.5** Release static IP address

### Phase 7: Post-Migration (ongoing)

- [ ] **7.1** Monitor latency metrics for 48 hours
- [ ] **7.2** Update Terraform state
- [ ] **7.3** Verify cost savings ($18-25/month)
- [ ] **7.4** Update documentation

---

## 🛠️ Detailed Implementation Steps

---

### **Phase 1: Pre-Migration Preparation**

#### 1.1 Verify Cloud Run Domain Mapping Support

```bash
# Check if domain mappings are available in us-central1
gcloud beta run domain-mappings list \
  --region=us-central1 \
  --project=perundhu-prod-001

# Should work (even if empty list) - if error, region doesn't support it
```

#### 1.2 Create Database Backup

```bash
# Export current database
gcloud sql export sql perundhu-production-mysql \
  gs://perundhu-production-mysql-backups/migration-backup-$(date +%Y%m%d-%H%M%S).sql \
  --database=perundhu_prod \
  --project=perundhu-prod-001

# Verify backup exists
gsutil ls gs://perundhu-production-mysql-backups/

# Download backup locally for safety
gsutil cp gs://perundhu-production-mysql-backups/migration-backup-*.sql /tmp/
```

#### 1.3 Document Current Configuration

```bash
# Get current Cloud Run configs
gcloud run services describe perundhu-production-backend \
  --region=asia-south1 \
  --project=perundhu-prod-001 \
  --format=yaml > /tmp/backend-config-backup.yaml

gcloud run services describe perundhu-production-frontend \
  --region=asia-south1 \
  --project=perundhu-prod-001 \
  --format=yaml > /tmp/frontend-config-backup.yaml

# Get current Cloud SQL config
gcloud sql instances describe perundhu-production-mysql \
  --project=perundhu-prod-001 \
  --format=yaml > /tmp/cloudsql-config-backup.yaml
```

---

### **Phase 2: Create New Infrastructure**

#### 2.1 Create Cloud SQL Instance in us-central1

```bash
# Create Cloud SQL instance (same tier: db-f1-micro)
gcloud sql instances create perundhu-production-mysql-us \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --backup-start-time=02:00 \
  --retained-backups-count=3 \
  --retained-transaction-log-days=3 \
  --no-backup-enable-bin-log \
  --database-flags=character_set_server=utf8mb4,max_connections=100 \
  --availability-type=zonal \
  --storage-type=HDD \
  --storage-size=10GB \
  --storage-auto-increase \
  --storage-auto-increase-limit=20GB \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=3 \
  --maintenance-release-channel=production \
  --network=projects/perundhu-prod-001/global/networks/default \
  --project=perundhu-prod-001

# Wait for instance to be ready (5-10 minutes)
gcloud sql operations list \
  --instance=perundhu-production-mysql-us \
  --project=perundhu-prod-001

# Set root password
gcloud sql users set-password root \
  --host=% \
  --instance=perundhu-production-mysql-us \
  --password='YOUR_ROOT_PASSWORD' \
  --project=perundhu-prod-001

# Create application database user
gcloud sql users create perundhu_app \
  --instance=perundhu-production-mysql-us \
  --password='YOUR_APP_PASSWORD' \
  --project=perundhu-prod-001
```

#### 2.2 Import Database Backup

```bash
# Import database from backup
gcloud sql import sql perundhu-production-mysql-us \
  gs://perundhu-production-mysql-backups/migration-backup-*.sql \
  --database=perundhu_prod \
  --project=perundhu-prod-001

# Wait for import to complete
gcloud sql operations list \
  --instance=perundhu-production-mysql-us \
  --project=perundhu-prod-001 \
  --limit=5

# Verify database
gcloud sql connect perundhu-production-mysql-us \
  --user=root \
  --project=perundhu-prod-001

# In MySQL:
# USE perundhu_prod;
# SHOW TABLES;
# SELECT COUNT(*) FROM locations;
# EXIT;
```

#### 2.3 Get New Database Connection Details

```bash
# Get connection name for new instance
gcloud sql instances describe perundhu-production-mysql-us \
  --project=perundhu-prod-001 \
  --format="value(connectionName)"

# Output: perundhu-prod-001:us-central1:perundhu-production-mysql-us
```

#### 2.4 Create Artifact Registry in us-central1

```bash
# Create new repository in us-central1
gcloud artifacts repositories create perundhu-images-us \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker images for Perundhu (us-central1)" \
  --project=perundhu-prod-001

# Configure Docker auth
gcloud auth configure-docker us-central1-docker.pkg.dev
```

#### 2.5 Build and Push Docker Images to New Region

```bash
# Backend
cd /Users/mchand69/Documents/perundhu/backend
docker build -t us-central1-docker.pkg.dev/perundhu-prod-001/perundhu-images-us/backend:1.0.7 \
  --platform linux/amd64 .
docker push us-central1-docker.pkg.dev/perundhu-prod-001/perundhu-images-us/backend:1.0.7

# Frontend
cd /Users/mchand69/Documents/perundhu/frontend
docker build -t us-central1-docker.pkg.dev/perundhu-prod-001/perundhu-images-us/frontend:1.0.7 \
  --platform linux/amd64 .
docker push us-central1-docker.pkg.dev/perundhu-prod-001/perundhu-images-us/frontend:1.0.7
```

---

### **Phase 3: Deploy Services to us-central1**

#### 3.1 Deploy Backend Cloud Run

```bash
# Deploy backend to us-central1
gcloud run deploy perundhu-production-backend-us \
  --image=us-central1-docker.pkg.dev/perundhu-prod-001/perundhu-images-us/backend:1.0.7 \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="SPRING_PROFILES_ACTIVE=production" \
  --set-env-vars="SPRING_DATASOURCE_URL=jdbc:mysql:///perundhu_prod?cloudSqlInstance=perundhu-prod-001:us-central1:perundhu-production-mysql-us&socketFactory=com.google.cloud.sql.mysql.SocketFactory&user=perundhu_app&password=YOUR_APP_PASSWORD" \
  --set-env-vars="SPRING_JPA_HIBERNATE_DDL_AUTO=validate" \
  --cpu=1 \
  --memory=1Gi \
  --min-instances=0 \
  --max-instances=5 \
  --timeout=300 \
  --concurrency=80 \
  --cpu-throttling \
  --project=perundhu-prod-001

# Get backend URL
gcloud run services describe perundhu-production-backend-us \
  --region=us-central1 \
  --project=perundhu-prod-001 \
  --format="value(status.url)"
```

#### 3.2 Deploy Frontend Cloud Run

```bash
# Update frontend .env.production with new backend URL
# Edit: frontend/.env.production
# VITE_API_BASE_URL=https://perundhu-production-backend-us-XXXXXXX.run.app

# Rebuild frontend with new backend URL
cd /Users/mchand69/Documents/perundhu/frontend
docker build -t us-central1-docker.pkg.dev/perundhu-prod-001/perundhu-images-us/frontend:1.0.7 \
  --platform linux/amd64 .
docker push us-central1-docker.pkg.dev/perundhu-prod-001/perundhu-images-us/frontend:1.0.7

# Deploy frontend to us-central1
gcloud run deploy perundhu-production-frontend-us \
  --image=us-central1-docker.pkg.dev/perundhu-prod-001/perundhu-images-us/frontend:1.0.7 \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=60 \
  --concurrency=80 \
  --cpu-throttling \
  --project=perundhu-prod-001

# Get frontend URL
gcloud run services describe perundhu-production-frontend-us \
  --region=us-central1 \
  --project=perundhu-prod-001 \
  --format="value(status.url)"
```

#### 3.3 Test Services with Direct URLs

```bash
# Test backend health
BACKEND_URL=$(gcloud run services describe perundhu-production-backend-us \
  --region=us-central1 \
  --project=perundhu-prod-001 \
  --format="value(status.url)")

curl $BACKEND_URL/v1/health

# Test frontend
FRONTEND_URL=$(gcloud run services describe perundhu-production-frontend-us \
  --region=us-central1 \
  --project=perundhu-prod-001 \
  --format="value(status.url)")

curl -I $FRONTEND_URL
```

---

### **Phase 4: Create Cloud Run Domain Mappings**

#### 4.1 Create Domain Mapping for Frontend (www.perundhu.com)

```bash
# Create domain mapping for www.perundhu.com
gcloud beta run domain-mappings create \
  --service=perundhu-production-frontend-us \
  --domain=www.perundhu.com \
  --region=us-central1 \
  --project=perundhu-prod-001

# This should work in us-central1!

# Get DNS records to configure
gcloud beta run domain-mappings describe www.perundhu.com \
  --region=us-central1 \
  --project=perundhu-prod-001
```

#### 4.2 Create Domain Mapping for Backend (api.perundhu.com)

```bash
# Create domain mapping for api.perundhu.com
gcloud beta run domain-mappings create \
  --service=perundhu-production-backend-us \
  --domain=api.perundhu.com \
  --region=us-central1 \
  --project=perundhu-prod-001

# Get DNS records
gcloud beta run domain-mappings describe api.perundhu.com \
  --region=us-central1 \
  --project=perundhu-prod-001
```

#### 4.3 List All Domain Mappings

```bash
# Verify domain mappings created
gcloud beta run domain-mappings list \
  --region=us-central1 \
  --project=perundhu-prod-001
```

---

### **Phase 5: DNS Cutover**

#### 5.1 Lower DNS TTL (Do this 1 hour before cutover)

```bash
# Update TTL to 60 seconds for faster propagation
gcloud dns record-sets update www.perundhu.com. \
  --type=A \
  --zone=perundhu-zone \
  --ttl=60 \
  --rrdatas=34.36.97.68 \
  --project=perundhu-prod-001

gcloud dns record-sets update api.perundhu.com. \
  --type=A \
  --zone=perundhu-zone \
  --ttl=60 \
  --rrdatas=34.36.97.68 \
  --project=perundhu-prod-001
```

#### 5.2 Update DNS Records to Cloud Run IPs

```bash
# Get the IP addresses from domain mapping describe commands
# Cloud Run will provide CNAME or A records

# Option 1: If Cloud Run provides CNAME records
gcloud dns record-sets delete www.perundhu.com. \
  --type=A \
  --zone=perundhu-zone \
  --project=perundhu-prod-001

gcloud dns record-sets create www.perundhu.com. \
  --type=CNAME \
  --zone=perundhu-zone \
  --ttl=300 \
  --rrdatas="ghs.googlehosted.com." \
  --project=perundhu-prod-001

# Repeat for api.perundhu.com

# Option 2: If Cloud Run provides A records (IP addresses)
# Update existing A records with new IPs from domain mapping
```

#### 5.3 Monitor DNS Propagation

```bash
# Check DNS from multiple locations
dig www.perundhu.com +short
dig api.perundhu.com +short

# Test from different DNS servers
dig @8.8.8.8 www.perundhu.com +short
dig @1.1.1.1 www.perundhu.com +short
```

#### 5.4 Test Domains

```bash
# Test frontend
curl -I https://www.perundhu.com

# Test backend
curl https://api.perundhu.com/v1/health

# Test from browser
# Visit: https://www.perundhu.com
# Check: All functionality works
```

---

### **Phase 6: Cleanup Old Resources**

#### 6.1 Delete Load Balancer

```bash
#!/bin/bash
PROJECT_ID="perundhu-prod-001"

echo "Deleting Load Balancer components..."

# Forwarding rules
gcloud compute forwarding-rules delete perundhu-https-rule --global --quiet --project=$PROJECT_ID
gcloud compute forwarding-rules delete perundhu-http-rule --global --quiet --project=$PROJECT_ID

# Target proxies
gcloud compute target-https-proxies delete perundhu-https-proxy --global --quiet --project=$PROJECT_ID
gcloud compute target-http-proxies delete perundhu-http-proxy --global --quiet --project=$PROJECT_ID

# URL map
gcloud compute url-maps delete perundhu-frontend-lb --global --quiet --project=$PROJECT_ID

# Backend services
gcloud compute backend-services delete perundhu-frontend-backend --global --quiet --project=$PROJECT_ID
gcloud compute backend-services delete perundhu-backend-backend --global --quiet --project=$PROJECT_ID

# Network Endpoint Groups
gcloud compute network-endpoint-groups delete perundhu-frontend-neg --region=asia-south1 --quiet --project=$PROJECT_ID
gcloud compute network-endpoint-groups delete perundhu-backend-neg --region=asia-south1 --quiet --project=$PROJECT_ID

# Static IP
gcloud compute addresses delete perundhu-frontend-ip --global --quiet --project=$PROJECT_ID

# SSL certificates
gcloud compute ssl-certificates delete perundhu-ssl-cert --global --quiet --project=$PROJECT_ID 2>/dev/null || true
gcloud compute ssl-certificates delete perundhu-api-ssl-cert --global --quiet --project=$PROJECT_ID 2>/dev/null || true

echo "✅ Load Balancer deleted - Saving $18-25/month"
```

#### 6.2 Delete Old Cloud Run Services (asia-south1)

```bash
# After confirming new services work (wait 24-48 hours)
gcloud run services delete perundhu-production-backend \
  --region=asia-south1 \
  --project=perundhu-prod-001 \
  --quiet

gcloud run services delete perundhu-production-frontend \
  --region=asia-south1 \
  --project=perundhu-prod-001 \
  --quiet
```

#### 6.3 Delete Old Cloud SQL Instance

```bash
# WAIT 7 DAYS before deleting (safety period)
# Verify new database is working perfectly

gcloud sql instances delete perundhu-production-mysql \
  --project=perundhu-prod-001 \
  --quiet
```

#### 6.4 Delete Old Artifact Registry

```bash
# Clean up old asia-south1 repository
gcloud artifacts repositories delete perundhu-images \
  --location=asia-south1 \
  --project=perundhu-prod-001 \
  --quiet
```

---

## 💰 Cost Comparison

### Before Migration (asia-south1):

| Component | Cost |
|-----------|------|
| Cloud SQL (db-f1-micro) | $8-9/month |
| Backend Cloud Run | $3-5/month |
| Frontend Cloud Run | $3-5/month |
| HTTP(S) Load Balancer | $18-25/month |
| Static IP | Included in LB |
| Storage/Networking | $2-4/month |
| **Total** | **$41.50-55.50/month** |

### After Migration (us-central1):

| Component | Cost |
|-----------|------|
| Cloud SQL (db-f1-micro) | $7-8/month (cheaper in us-central1) |
| Backend Cloud Run | $2-4/month (cheaper pricing) |
| Frontend Cloud Run | $2-4/month (cheaper pricing) |
| ~~Load Balancer~~ | **$0** (using domain mappings) |
| Storage/Networking | $2-3/month |
| **Total** | **$13-19/month** ✅ |

**Savings**: $22-36.50/month (53-66% reduction)  
**Exceeds Target**: Yes! Under $20-30/month goal

---

## 📊 Latency Impact Analysis

### Expected Latency Changes:

| User Location | Before (asia-south1) | After (us-central1) | Delta |
|---------------|----------------------|---------------------|-------|
| Mumbai, India | 10-30ms | 130-180ms | +120-150ms |
| Delhi, India | 20-40ms | 140-190ms | +120-150ms |
| Bangalore, India | 15-35ms | 135-185ms | +120-150ms |
| New York, USA | 180-230ms | 20-50ms | **-130-180ms** ✅ |
| London, UK | 120-150ms | 90-120ms | **-30ms** ✅ |
| Singapore | 30-60ms | 150-200ms | +120-140ms |

**Trade-off Summary**:
- ❌ India users: +120-150ms (noticeable but acceptable for web apps)
- ✅ USA users: -130-180ms (major improvement)
- ✅ Europe users: -30ms (slight improvement)
- ❌ Southeast Asia: +120-140ms

**Mitigation**:
- Enable Cloud CDN for static assets (if needed later)
- Optimize API responses (reduce payload size)
- Implement aggressive frontend caching
- Consider edge caching for static content

---

## ⚠️ Risks & Mitigation

### Risk 1: Database Migration Failure
**Mitigation**:
- Keep old database running for 7 days
- Test thoroughly before DNS cutover
- Have rollback plan ready

### Risk 2: DNS Propagation Issues
**Mitigation**:
- Lower TTL 1 hour before cutover
- Monitor from multiple locations
- Keep old infrastructure running 24-48 hours

### Risk 3: Domain Mapping Issues
**Mitigation**:
- Verify domain ownership in Google Search Console
- Test domain mappings before DNS change
- Keep load balancer as backup for 48 hours

### Risk 4: Application Performance
**Mitigation**:
- Run load tests in us-central1 before migration
- Monitor application metrics closely
- Have rollback procedure documented

---

## 🔄 Rollback Plan

If migration fails:

1. **Revert DNS** to load balancer IP (34.36.97.68)
2. **Keep old services running** until DNS propagates
3. **Investigate issue** with new infrastructure
4. **Try again** after fixing root cause

**Rollback Time**: 5-10 minutes (DNS change only)

---

## 📝 Timeline

**Total Time**: ~3-4 hours (excluding wait times)

- **Day 1, Hour 1-2**: Phase 1-2 (Backup & create new infrastructure)
- **Day 1, Hour 2-3**: Phase 3 (Deploy services, test)
- **Day 1, Hour 3**: Phase 4 (Domain mappings)
- **Day 1, Hour 4**: Phase 5 (DNS cutover)
- **Day 2**: Monitor for 24-48 hours
- **Day 3-7**: Phase 6 (Cleanup old resources)

---

## ✅ Next Steps

**Ready to proceed?**

1. I'll start with Phase 1: Create database backup
2. Then Phase 2: Set up new infrastructure in us-central1
3. Test everything before DNS cutover
4. Monitor closely during migration

**Estimated downtime**: 0 minutes (blue-green deployment)  
**Expected completion**: 3-4 hours  
**Cost savings**: $22-36.50/month  
**Final cost**: $13-19/month ✅

Shall I begin the migration?
