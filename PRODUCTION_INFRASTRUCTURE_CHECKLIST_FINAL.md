# ✅ PRODUCTION INFRASTRUCTURE CHECKLIST
**For**: Perundhu Bus Tracker - Production Deployment  
**Domain**: perundhu.com  
**Target Launch**: January 2026  
**Prepared By**: DevOps Team  
**Last Updated**: January 23, 2026

---

## PRE-DEPLOYMENT PHASE (Before Infrastructure)

### Account & Access ✓
- [ ] GCP account created and verified
- [ ] Billing account linked
- [ ] Project created: `perundhu-production-2026`
- [ ] Team members invited with proper IAM roles
- [ ] Service account created for Terraform
- [ ] Service account key downloaded and secured
- [ ] Domain access verified (perundhu.com)
- [ ] DNS admin identified and trained

### Secrets & Credentials ✓
- [ ] JWT signing secret generated (`openssl rand -base64 32`)
- [ ] Database password generated (strong, 24+ chars)
- [ ] Encryption key generated (`openssl rand -base64 32`)
- [ ] Gemini API key regenerated (old one marked as deleted)
- [ ] reCAPTCHA secret key obtained
- [ ] All secrets documented in secure location (NOT Git)
- [ ] `.secrets-production-env` file created locally
- [ ] `.secrets-production-env` added to `.gitignore`
- [ ] Password manager updated with all credentials

### Terraform Setup ✓
- [ ] Terraform version >= 1.0 installed
- [ ] `infrastructure/terraform/environments/production/` directory exists
- [ ] `terraform.tfvars.example` reviewed
- [ ] `terraform.tfvars` created with production values
- [ ] GCS bucket created for Terraform state: `perundhu-production-2026-terraform-state`
- [ ] GCS bucket versioning enabled
- [ ] Backend configuration tested

---

## INFRASTRUCTURE DEPLOYMENT PHASE

### Google Cloud APIs ✓
```bash
Verify these APIs are enabled:
```

- [ ] compute.googleapis.com
- [ ] sql.googleapis.com
- [ ] run.googleapis.com
- [ ] containerregistry.googleapis.com
- [ ] storage-api.googleapis.com
- [ ] secret.googleapis.com
- [ ] cloudresourcemanager.googleapis.com
- [ ] iam.googleapis.com
- [ ] monitoring.googleapis.com
- [ ] logging.googleapis.com
- [ ] cloudkms.googleapis.com (for secrets)
- [ ] servicenetworking.googleapis.com (for VPC)

**Verification Command**:
```bash
gcloud services list --enabled --project=perundhu-production-2026
```

### VPC & Networking ✓

- [ ] VPC network created: `perundhu-vpc`
- [ ] Subnet created: `perundhu-subnet` (CIDR: 10.0.0.0/24)
- [ ] Cloud Router created
- [ ] Cloud NAT configured for egress
- [ ] VPC Service Controls enabled (optional but recommended)
- [ ] Firewall rules configured:
  - [ ] Allow internal traffic (10.0.0.0/24)
  - [ ] Allow Cloud SQL access
  - [ ] Allow Cloud Run ingress (port 443, 80)
  - [ ] Deny all inbound by default
- [ ] VPC peering to Google-managed services configured
- [ ] Network tests completed successfully

**Verification**:
```bash
gcloud compute networks list
gcloud compute networks subnets list
gcloud compute firewall-rules list
```

### Cloud SQL Database ✓

- [ ] Cloud SQL instance created: `perundhu-prod-mysql`
- [ ] MySQL version: 8.0.x
- [ ] Machine tier: `db-n1-standard-1` (or higher)
- [ ] Storage: 100 GB SSD
- [ ] Storage auto-growth enabled (max: 500 GB)
- [ ] Backup configuration:
  - [ ] Automated backups enabled
  - [ ] Backup window: 02:00 - 03:00 UTC
  - [ ] Retention: 30 days
  - [ ] Point-in-time recovery: enabled
- [ ] High Availability (HA) configured:
  - [ ] Regional HA: enabled
  - [ ] Replica zone: `asia-south1-b`
- [ ] Private IP assigned
- [ ] Public IP: **DISABLED** (security best practice)
- [ ] Cloud SQL Auth proxy configured
- [ ] Database created: `perundhu`
- [ ] Application user created: `prod_user`
- [ ] Backup user created: `backup_user`
- [ ] Privileges granted appropriately
- [ ] SSL/TLS encryption: enabled
- [ ] Database flags configured:
  - [ ] `cloudsql_iam_authentication=on`
  - [ ] `require_secure_transport=on`
  - [ ] `max_connections=200`
  - [ ] `character_set_server=utf8mb4`

**Verification**:
```bash
gcloud sql instances describe perundhu-prod-mysql --project=perundhu-production-2026

# Should show:
# - State: RUNNABLE
# - Region: asia-south1
# - Tier: db-n1-standard-1
# - Backup retention: 30 days
# - HA: Enabled
```

### Cloud Storage ✓

- [ ] Storage bucket created: `perundhu-prod-images`
- [ ] Bucket location: `ASIA` (for compliance & performance)
- [ ] Versioning: enabled
- [ ] Lifecycle policies configured:
  - [ ] Delete old versions after 90 days
  - [ ] Archive to Coldline after 180 days
- [ ] Encryption: GCP-managed keys (default)
- [ ] Access control:
  - [ ] Uniform bucket-level access: enabled
  - [ ] Public access: blocked
- [ ] CORS configured for frontend
- [ ] CDN integration: enabled (for image delivery)
- [ ] Logging: enabled (logs to separate bucket)
- [ ] Bucket policies reviewed and applied
- [ ] Service account permissions configured

**Verification**:
```bash
gsutil ls -b gs://perundhu-prod-images
gsutil versioning get gs://perundhu-prod-images
gsutil lifecycle get gs://perundhu-prod-images
```

### Cloud Secret Manager ✓

- [ ] Secrets created in Secret Manager:
  - [ ] `db-password`
  - [ ] `jwt-signing-secret`
  - [ ] `app-encryption-key`
  - [ ] `gemini-api-key`
  - [ ] `recaptcha-secret-key`
- [ ] Secret versions created and labeled
- [ ] Access control configured (least privilege)
- [ ] Service accounts granted `Secret Accessor` role
- [ ] Rotation policies documented
- [ ] Audit logging enabled

**Verification**:
```bash
gcloud secrets list --project=perundhu-production-2026
gcloud secrets versions list db-password
```

### Service Accounts & IAM ✓

**Backend Service Account**:
- [ ] `perundhu-backend-sa` created
- [ ] Roles assigned:
  - [ ] `roles/cloudsql.client` (database access)
  - [ ] `roles/storage.objectViewer` (image access)
  - [ ] `roles/secretmanager.secretAccessor` (secrets)
  - [ ] `roles/monitoring.metricWriter` (metrics)
  - [ ] `roles/logging.logWriter` (logs)
- [ ] Service account key created (if needed)

**Frontend Service Account**:
- [ ] `perundhu-frontend-sa` created
- [ ] Roles assigned:
  - [ ] `roles/storage.objectViewer` (CDN access)
  - [ ] `roles/monitoring.metricWriter`
  - [ ] `roles/logging.logWriter`

**Deployment Service Account**:
- [ ] `perundhu-deploy-sa` created
- [ ] Roles assigned:
  - [ ] `roles/run.admin` (deploy to Cloud Run)
  - [ ] `roles/iam.serviceAccountUser`
  - [ ] `roles/container.developer` (image access)

**Verification**:
```bash
gcloud iam service-accounts list --project=perundhu-production-2026
gcloud iam service-accounts get-iam-policy perundhu-backend-sa
```

### Cloud Run Services ✓

**Backend Service**:
- [ ] Service name: `perundhu-backend`
- [ ] Region: `asia-south1`
- [ ] Image: `gcr.io/perundhu-production-2026/perundhu-backend:1.0.0`
- [ ] Memory: 2 Gi
- [ ] CPU: 2
- [ ] Timeout: 60 seconds
- [ ] Max instances: 50
- [ ] Min instances: 1 (for cost optimization)
- [ ] VPC connector configured (if using Cloud SQL private IP)
- [ ] Environment variables configured
- [ ] Health check endpoint: `/actuator/health`
- [ ] Startup probe configured
- [ ] Liveness probe configured
- [ ] Service account: `perundhu-backend-sa`
- [ ] Ingress: Allow all traffic
- [ ] Authentication: Public (unauthenticated)

**Frontend Service**:
- [ ] Service name: `perundhu-frontend`
- [ ] Region: `asia-south1`
- [ ] Image: `gcr.io/perundhu-production-2026/perundhu-frontend:1.0.0`
- [ ] Memory: 512 Mi
- [ ] CPU: 1
- [ ] Timeout: 60 seconds
- [ ] Max instances: 50
- [ ] Min instances: 1
- [ ] Service account: `perundhu-frontend-sa`
- [ ] Ingress: Allow all traffic
- [ ] Authentication: Public (unauthenticated)

**Verification**:
```bash
gcloud run services list --region=asia-south1 --project=perundhu-production-2026
gcloud run services describe perundhu-backend --region=asia-south1
gcloud run services describe perundhu-frontend --region=asia-south1
```

### Load Balancer & SSL Certificates ✓

- [ ] Global HTTP(S) load balancer created
- [ ] Backend services configured:
  - [ ] NEG (Network Endpoint Group) for backend
  - [ ] NEG for frontend
- [ ] URL maps configured:
  - [ ] `/api/*` → backend service
  - [ ] `/*` → frontend service
- [ ] SSL certificate created: `perundhu-prod-cert`
  - [ ] Domains: `perundhu.com`, `api.perundhu.com`, `www.perundhu.com`
  - [ ] Status: ACTIVE
  - [ ] Certificate type: Google-managed
- [ ] Health checks configured:
  - [ ] Backend: `/actuator/health` (port 8080)
  - [ ] Frontend: `/` (port 8080)
  - [ ] Check interval: 10s
  - [ ] Timeout: 5s
  - [ ] Unhealthy threshold: 3
- [ ] Session affinity: configured (if needed)
- [ ] CDN caching configured (for static assets)
- [ ] Cloud Armor policies configured (DDoS protection)

**Verification**:
```bash
gcloud compute backend-services list --global
gcloud compute ssl-certificates describe perundhu-prod-cert --global
```

---

## NETWORK CONNECTIVITY & SECURITY

### VPC Connectivity ✓

- [ ] VPC Service Connection created (for Cloud SQL)
- [ ] Private service connection enabled
- [ ] Cloud Run services can reach Cloud SQL via private IP
- [ ] NAT gateway configured for egress traffic
- [ ] Outbound IP documented

**Verification**:
```bash
# Test from Cloud Run (via SSH)
gcloud compute ssh [VM] -- mysql -h [PRIVATE_IP] -u prod_user -p
```

### Security & Compliance ✓

- [ ] VPC Flow Logs: enabled
- [ ] Cloud Audit Logs: enabled
- [ ] Cloud SQL Audit Logs: enabled
- [ ] IAM Policy audit trail: configured
- [ ] Encryption at rest: enabled (GCP-managed)
- [ ] Encryption in transit: TLS 1.2+ enforced
- [ ] Secret rotation policy: documented
- [ ] Backup encryption: verified
- [ ] Data residency: verified (asia-south1)
- [ ] GDPR compliance: reviewed
- [ ] DDoS protection (Cloud Armor): enabled
- [ ] Web Application Firewall rules: configured

---

## MONITORING, LOGGING & ALERTING

### Cloud Monitoring ✓

- [ ] Monitoring workspace created
- [ ] Dashboard created: "Perundhu Production"
- [ ] Key metrics displayed:
  - [ ] Request rate
  - [ ] Error rate
  - [ ] Latency (p50, p95, p99)
  - [ ] CPU utilization
  - [ ] Memory utilization
  - [ ] Database connections
  - [ ] Storage usage
- [ ] Custom metrics configured (if needed)
- [ ] Uptime checks configured:
  - [ ] `https://perundhu.com` (frontend)
  - [ ] `https://api.perundhu.com/actuator/health` (backend)
  - [ ] Check frequency: 1 minute
  - [ ] Locations: multiple regions

### Cloud Logging ✓

- [ ] Log sink created for long-term storage
- [ ] Log retention: 30 days (Cloud Logging)
- [ ] Archived logs: Google Cloud Storage
- [ ] Log-based metrics created:
  - [ ] Error count
  - [ ] Warning count
  - [ ] API latency
- [ ] Application logs: configured to Cloud Logging
- [ ] Structured logging: enabled
- [ ] Log severity levels: properly set

### Alert Policies ✓

- [ ] Alert: High error rate (> 5%)
  - [ ] Threshold: 5 percent
  - [ ] Duration: 5 minutes
- [ ] Alert: High latency (> 2 seconds)
  - [ ] Threshold: 2000 ms (p99)
  - [ ] Duration: 5 minutes
- [ ] Alert: Low availability (< 99%)
  - [ ] Threshold: 99 percent
  - [ ] Duration: 10 minutes
- [ ] Alert: Database connection pool exhausted
  - [ ] Threshold: > 90 connections
  - [ ] Duration: 2 minutes
- [ ] Alert: Storage quota exceeded
  - [ ] Threshold: 80 GB
  - [ ] Duration: immediate
- [ ] Alert: Budget alert
  - [ ] Monthly budget: $50 (example)
  - [ ] Threshold: 80%, 100%
- [ ] Notification channels configured:
  - [ ] Email: ops-team@company.com
  - [ ] PagerDuty (if integrated)
  - [ ] Slack (if integrated)

**Verification**:
```bash
gcloud alpha monitoring policies list --project=perundhu-production-2026
```

---

## DATABASE SETUP

### Schema & Migrations ✓

- [ ] Database user created: `prod_user`
- [ ] Privileges granted: SELECT, INSERT, UPDATE, DELETE
- [ ] Backup user created: `backup_user` (read-only)
- [ ] All migrations applied (V1-V47):
  - [ ] User tables
  - [ ] Bus tables
  - [ ] Location tables
  - [ ] Route tables
  - [ ] Schedule tables
  - [ ] Language support tables
  - [ ] Booking/payment tables
  - [ ] Analytics tables
- [ ] Indexes created and optimized
- [ ] Foreign keys verified
- [ ] Sample data loaded (if applicable)
- [ ] Data validation completed

**Verification**:
```bash
mysql -h [PRIVATE_IP] -u prod_user -p perundhu -e "SHOW TABLES;"
mysql -h [PRIVATE_IP] -u prod_user -p perundhu -e "SELECT * FROM flyway_schema_history ORDER BY version DESC;"
```

### Backup & Recovery ✓

- [ ] Automated backups: configured (daily at 02:00 UTC)
- [ ] Backup retention: 30 days
- [ ] Point-in-time recovery window: 30 days
- [ ] Manual backup created: [TIMESTAMP]
- [ ] Backup tested: restore to staging environment successful
- [ ] Backup location documented
- [ ] Recovery procedure documented
- [ ] RTO (Recovery Time Objective): defined
- [ ] RPO (Recovery Point Objective): defined

---

## CONTAINER REGISTRY & IMAGES

### Docker Images ✓

**Backend Image**:
- [ ] Image name: `gcr.io/perundhu-production-2026/perundhu-backend:1.0.0`
- [ ] Image scanning: completed (Trivy scan passed)
- [ ] Image size: documented
- [ ] Base image: verified (secure, up-to-date)
- [ ] Secrets: NOT embedded in image
- [ ] Environment variables: configured
- [ ] Health check: implemented

**Frontend Image**:
- [ ] Image name: `gcr.io/perundhu-production-2026/perundhu-frontend:1.0.0`
- [ ] Image scanning: completed (passed)
- [ ] Image size: optimized
- [ ] CDN caching: configured
- [ ] Environment: production (.env.production)

**Verification**:
```bash
gcloud container images list --project=perundhu-production-2026
gcloud container images describe gcr.io/perundhu-production-2026/perundhu-backend:1.0.0
```

---

## DOMAIN & DNS CONFIGURATION

### Domain Setup ✓

- [ ] Domain: `perundhu.com`
- [ ] Registrar: [Document registrar name]
- [ ] Registrar access: verified
- [ ] Domain auto-renewal: enabled
- [ ] Domain privacy: configured
- [ ] Contact info: updated

### DNS Configuration ✓

**DNS Provider**: [Cloud DNS / External Provider]

- [ ] Nameservers updated at registrar (if external DNS)
- [ ] A record created: `perundhu.com` → [Load Balancer IP]
- [ ] A record created: `api.perundhu.com` → [Load Balancer IP]
- [ ] CNAME record created: `www.perundhu.com` → `perundhu.com`
- [ ] MX records: configured (if using email)
- [ ] SPF record: configured (if using email)
- [ ] DKIM record: configured (if using email)
- [ ] TTL set to 300 (5 minutes) for faster updates
- [ ] DNS propagation checked globally
- [ ] DNS A/AAAA records verified

**Verification**:
```bash
# Global DNS resolution
nslookup perundhu.com
nslookup api.perundhu.com
dig +trace perundhu.com

# Should resolve to Load Balancer IP (34.x.x.x or similar GCP range)
```

### SSL/TLS Certificates ✓

- [ ] SSL certificate: `perundhu-prod-cert` created
- [ ] Certificate type: Google-managed
- [ ] Domains in certificate:
  - [ ] perundhu.com
  - [ ] api.perundhu.com
  - [ ] www.perundhu.com
- [ ] Certificate status: ACTIVE
- [ ] Certificate expiry: documented
- [ ] Auto-renewal: enabled
- [ ] Certificate chain: valid
- [ ] HTTPS redirect: configured (HTTP → HTTPS)

**Verification**:
```bash
# Check certificate
openssl s_client -connect perundhu.com:443

# Should show certificate details without errors
```

---

## APPLICATION CONFIGURATION

### Backend Configuration ✓

- [ ] `application-production.properties` created with:
  - [ ] Database connection details
  - [ ] JWT signing secret
  - [ ] Encryption keys
  - [ ] API endpoints
  - [ ] CORS configuration
  - [ ] Logging levels
  - [ ] Cache settings
  - [ ] Connection pools
  - [ ] Spring profile: production

### Frontend Configuration ✓

- [ ] `.env.production` created with:
  - [ ] `VITE_API_BASE_URL=https://api.perundhu.com`
  - [ ] API endpoints
  - [ ] Feature flags
  - [ ] Analytics settings
  - [ ] Gemini API settings
  - [ ] reCAPTCHA site key

### Environment Variables ✓

All required environment variables configured in Cloud Run:
- [ ] `SPRING_PROFILES_ACTIVE=production`
- [ ] `DB_HOST=[PRIVATE_IP]`
- [ ] `DB_NAME=perundhu`
- [ ] `DB_USER=prod_user`
- [ ] Database connection via Secret Manager reference
- [ ] JWT secret via Secret Manager reference
- [ ] Encryption keys via Secret Manager reference

---

## TESTING & VERIFICATION

### Health Checks ✓

- [ ] Backend health endpoint: `/actuator/health` → HTTP 200
- [ ] Frontend accessibility: `https://perundhu.com/` → HTTP 200
- [ ] Database connectivity: verified
- [ ] Cloud SQL proxy connectivity: verified
- [ ] Network connectivity: ping internal services
- [ ] SSL certificate: valid, no warnings

### Functional Testing ✓

- [ ] API endpoints responding correctly
- [ ] Database queries executing successfully
- [ ] Authentication flow working
- [ ] Search functionality operational
- [ ] Image upload/retrieval working
- [ ] Frontend UI rendering correctly
- [ ] Responsive design verified (mobile, tablet, desktop)

### Performance Testing ✓

- [ ] Load test completed (100+ concurrent users)
- [ ] Response time p99: < 2 seconds
- [ ] Error rate under load: < 1%
- [ ] Database query performance: acceptable
- [ ] Memory usage: stable
- [ ] CPU utilization: < 80% under normal load

### Security Testing ✓

- [ ] OWASP Top 10 vulnerabilities: scanned
- [ ] SQL injection: tested
- [ ] XSS vulnerabilities: tested
- [ ] CSRF protection: verified
- [ ] Dependency vulnerabilities: scanned (npm audit, gradle)
- [ ] SSL/TLS configuration: tested (A+ rating on ssllabs.com)
- [ ] Secret exposure: verified none in code/logs

---

## GO-LIVE CHECKLIST

### 24 Hours Before ✓

- [ ] All infrastructure verified and running
- [ ] All tests passing
- [ ] Backups successful and verified
- [ ] Monitoring and alerts configured
- [ ] Team trained and ready
- [ ] Communication plan confirmed
- [ ] Rollback procedures tested
- [ ] On-call schedule activated

### At Go-Live ✓

- [ ] DNS updated to production Load Balancer IP
- [ ] Monitor error rates (should be ~0%)
- [ ] Monitor response times (should be normal)
- [ ] Monitor database connections
- [ ] Test key user flows
- [ ] Verify backup creation
- [ ] Check monitoring dashboard
- [ ] Confirm alerts working

### Post Go-Live ✓

- [ ] 24/7 monitoring activated
- [ ] On-call rotation started
- [ ] Incident response team ready
- [ ] Daily health checks for first week
- [ ] Weekly performance review first month
- [ ] Document any issues and resolutions

---

## SIGN-OFF

**Infrastructure Deployment Sign-Off**:

- [ ] **Infrastructure Lead**: `_________________ Date: _______`
- [ ] **Security Review**: `_________________ Date: _______`
- [ ] **QA Lead**: `_________________ Date: _______`
- [ ] **Product Owner**: `_________________ Date: _______`

---

## HANDOVER TO OPERATIONS

**Operations team receives**:
- [ ] Terraform state files (backed up)
- [ ] Infrastructure documentation
- [ ] Runbooks (deployment, troubleshooting)
- [ ] Contact information for support
- [ ] Password manager access
- [ ] Monitoring dashboard access
- [ ] Backup verification procedures
- [ ] Disaster recovery procedures
- [ ] On-call rotation schedule
- [ ] SLA definitions

---

**Document Version**: 1.0  
**Created**: January 23, 2026  
**Review Cycle**: Every 3 months or after major changes  
**Owner**: Infrastructure/DevOps Team

✅ **Ready for production deployment!**
