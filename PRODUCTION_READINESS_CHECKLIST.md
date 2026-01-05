# 🚀 PRODUCTION DEPLOYMENT READINESS CHECKLIST
**Target Deployment**: 1 Week (January 12, 2026)  
**Status**: Ready with Action Items  
**Last Updated**: January 5, 2026

---

## 📋 EXECUTIVE SUMMARY

Your application has **solid infrastructure and CI/CD foundations** in place. You're approximately **80% ready** for production deployment. The remaining 20% involves configuration, testing, and security hardening.

### Quick Status
- ✅ **Infrastructure**: Terraform (GCP) configured for production
- ✅ **CI/CD Pipeline**: GitHub Actions fully automated
- ✅ **Database**: Migrations and schema ready
- ⚠️ **Configuration**: Needs environment-specific tuning
- ⚠️ **Testing**: Need manual validation before go-live
- ⚠️ **Monitoring**: Need production dashboards configured
- ⚠️ **Security**: Need security review and hardening

---

## 🔧 PHASE 1: INFRASTRUCTURE READINESS (2-3 Days)

### 1.1 Terraform Configuration
- [ ] **Create Production Terraform Variables**
  ```bash
  cd infrastructure/terraform/environments/production
  cp terraform.tfvars.example terraform.tfvars
  ```
  - [ ] Set `project_id` to your production GCP project
  - [ ] Set `region` (currently: `asia-south1`)
  - [ ] Set `db_instance_tier` to appropriate size (e.g., `db-n1-standard-1` for production)
  - [ ] Verify `domain_name` is correct (e.g., `perundhu.app`)
  - [ ] Review and update all variables

- [ ] **Create GCS Terraform State Bucket**
  ```bash
  gsutil mb -p YOUR_PROJECT_ID -l asia-south1 \
    gs://YOUR_PROJECT_ID-terraform-state-production
  gsutil versioning set on gs://YOUR_PROJECT_ID-terraform-state-production
  ```

- [ ] **Initialize & Plan Production Infrastructure**
  ```bash
  cd infrastructure/terraform/environments/production
  terraform init -backend-config="bucket=YOUR_PROJECT_ID-terraform-state-production"
  terraform plan -var="project_id=YOUR_PROJECT_ID" -var="region=asia-south1"
  ```

- [ ] **Review Plan Output**
  - Verify all resources (Cloud SQL, Cloud Run, VPC, Storage, Secrets)
  - Check database tier and size
  - Verify region and zones
  - Review security group rules

- [ ] **Apply Infrastructure** (After approval)
  ```bash
  terraform apply -var="project_id=YOUR_PROJECT_ID" -var="region=asia-south1"
  ```

### 1.2 Database Setup
- [ ] **Cloud SQL MySQL Configuration**
  - [ ] Verify instance created in production environment
  - [ ] Check backup configuration (daily backups enabled)
  - [ ] Configure automated backups with retention policy
  - [ ] Set up point-in-time recovery (PITR)
  - [ ] Test backup/restore process

- [ ] **Database Migration**
  ```bash
  # Ensure all migrations are applied
  export MYSQL_HOST=<CLOUD_SQL_IP>
  export MYSQL_USER=perundhu_user
  ./gradlew flywayMigrate -Dspring.profiles.active=production
  ```
  - [ ] Verify all migration files V1 through V47 are applied
  - [ ] Check migration status: `flywayInfo`
  - [ ] Test database connectivity
  - [ ] Verify schema integrity

- [ ] **Database Security**
  - [ ] Enable SSL for connections
  - [ ] Configure private IP (no public IP access)
  - [ ] Set up Cloud SQL Auth proxy for secure connections
  - [ ] Configure IAM roles for service account
  - [ ] Test with service account

### 1.3 Secret Manager Configuration
- [ ] **Create Production Secrets**
  ```bash
  gcloud secrets create production-db-url --data-file=- --replication-policy="automatic"
  gcloud secrets create production-db-username --data-file=- --replication-policy="automatic"
  gcloud secrets create production-db-password --data-file=- --replication-policy="automatic"
  gcloud secrets create production-jwt-secret --data-file=- --replication-policy="automatic"
  gcloud secrets create production-data-encryption-key --data-file=- --replication-policy="automatic"
  gcloud secrets create production-recaptcha-secret --data-file=- --replication-policy="automatic"
  gcloud secrets create production-gemini-api-key --data-file=- --replication-policy="automatic"
  ```

- [ ] **Verify Secrets Grant IAM Access**
  ```bash
  gcloud secrets add-iam-policy-binding production-db-password \
    --member=serviceAccount:perundhu-backend-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com \
    --role=roles/secretmanager.secretAccessor
  ```

### 1.4 Network & Security
- [ ] **VPC Configuration**
  - [ ] Verify private VPC created
  - [ ] Check subnet configuration
  - [ ] Verify VPC connector for Cloud Run
  - [ ] Test private IP connectivity

- [ ] **Firewall Rules**
  - [ ] Verify only necessary ports open (443 for HTTPS)
  - [ ] Block public access to database
  - [ ] Configure Cloud Armor (optional but recommended)

---

## 📦 PHASE 2: APPLICATION CONFIGURATION (2-3 Days)

### 2.1 Backend Configuration
- [ ] **Update Production Properties**
  ```properties
  # File: backend/app/src/main/resources/application-production.properties
  
  # Database
  spring.datasource.url=jdbc:mysql://CLOUD_SQL_IP:3306/perundhu?useSSL=true
  spring.datasource.username=${MYSQL_USER}
  spring.datasource.password=${MYSQL_PASSWORD}
  
  # JPA/Hibernate
  spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
  spring.jpa.show-sql=false
  spring.jpa.hibernate.ddl-auto=validate
  spring.jpa.properties.hibernate.format_sql=false
  
  # Flyway (if auto-migration enabled)
  spring.flyway.enabled=true
  spring.flyway.locations=classpath:db/migration
  
  # Security
  security.require-ssl=true
  server.ssl.enabled=true
  spring.security.oauth2.resourceserver.jwt.issuer-uri=${JWT_ISSUER}
  
  # Logging
  logging.level.root=INFO
  logging.level.com.perundhu=INFO
  
  # Actuator
  management.endpoints.web.exposure.include=health,metrics,prometheus
  management.endpoint.health.show-details=when-authorized
  
  # Performance
  spring.servlet.multipart.max-file-size=10MB
  spring.servlet.multipart.max-request-size=10MB
  ```

- [ ] **Environment Variables Configuration**
  - [ ] `GCP_PROJECT_ID=YOUR_PROD_PROJECT`
  - [ ] `SPRING_PROFILES_ACTIVE=production`
  - [ ] `MYSQL_HOST=CLOUD_SQL_IP`
  - [ ] `MYSQL_DATABASE=perundhu`
  - [ ] All secrets referenced from Secret Manager

- [ ] **Java Version & Dependencies**
  - [ ] Verify Java 17+ compatibility
  - [ ] Run `./gradlew dependencyCheck` to verify no critical vulnerabilities
  - [ ] Update any critical dependencies

### 2.2 Frontend Configuration
- [ ] **Create Production Environment File**
  ```bash
  # File: frontend/.env.production
  VITE_API_URL=https://api.perundhu.app
  VITE_API_BASE_URL=https://api.perundhu.app
  VITE_MOCK_API=false
  VITE_ENVIRONMENT=production
  VITE_RECAPTCHA_ENABLED=true
  VITE_RECAPTCHA_SITE_KEY=<your_production_key>
  VITE_LOG_LEVEL=error
  ```

- [ ] **Build Frontend for Production**
  ```bash
  cd frontend
  npm run build
  ```
  - [ ] Verify no console errors
  - [ ] Check bundle size
  - [ ] Verify dist/ folder created

- [ ] **Frontend Optimizations**
  - [ ] Enable gzip compression in nginx
  - [ ] Configure browser caching headers
  - [ ] Enable CORS for production domain only
  - [ ] Set up CSP (Content Security Policy) headers

### 2.3 Container Images
- [ ] **Build Production Images**
  ```bash
  # Backend
  docker build -t gcr.io/YOUR_PROJECT/perundhu-backend:1.0.0 \
    --build-arg ENVIRONMENT=production ./backend
  
  # Frontend
  docker build -t gcr.io/YOUR_PROJECT/perundhu-frontend:1.0.0 \
    --build-arg ENVIRONMENT=production ./frontend
  ```

- [ ] **Push to Container Registry**
  ```bash
  docker push gcr.io/YOUR_PROJECT/perundhu-backend:1.0.0
  docker push gcr.io/YOUR_PROJECT/perundhu-frontend:1.0.0
  ```

- [ ] **Security Scanning**
  ```bash
  # Install Trivy if not already installed
  gcloud container images scan IMAGE_URL
  # Review and fix any critical vulnerabilities
  ```

---

## 🚀 PHASE 3: DEPLOYMENT (1-2 Days)

### 3.1 Cloud Run Deployment
- [ ] **Deploy Backend to Production**
  ```bash
  gcloud run deploy perundhu-backend \
    --image gcr.io/YOUR_PROJECT/perundhu-backend:1.0.0 \
    --platform managed \
    --region asia-south1 \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300s \
    --max-instances 10 \
    --set-env-vars SPRING_PROFILES_ACTIVE=production \
    --vpc-connector YOUR_CONNECTOR \
    --clear-routes \
    --no-allow-unauthenticated
  ```

- [ ] **Deploy Frontend to Production**
  ```bash
  gcloud run deploy perundhu-frontend \
    --image gcr.io/YOUR_PROJECT/perundhu-frontend:1.0.0 \
    --platform managed \
    --region asia-south1 \
    --memory 256Mi \
    --cpu 1 \
    --allow-unauthenticated
  ```

- [ ] **Configure Domain Mapping**
  ```bash
  # Backend
  gcloud run domain-mappings create \
    --service perundhu-backend \
    --domain api.perundhu.app \
    --region asia-south1
  
  # Frontend
  gcloud run domain-mappings create \
    --service perundhu-frontend \
    --domain perundhu.app \
    --region asia-south1
  ```

- [ ] **SSL Certificate**
  - [ ] Verify SSL certificates auto-provisioned by Google
  - [ ] Wait for DNS propagation (may take 10-30 minutes)
  - [ ] Test HTTPS connectivity

### 3.2 Health Checks & Smoke Tests
- [ ] **Backend Health Checks**
  ```bash
  curl https://api.perundhu.app/actuator/health
  ```
  - [ ] Returns 200 OK
  - [ ] Database connected
  - [ ] All components healthy

- [ ] **Frontend Accessibility**
  ```bash
  curl https://perundhu.app
  ```
  - [ ] Returns 200 OK
  - [ ] HTML loads correctly
  - [ ] Assets load properly

- [ ] **Run Smoke Tests**
  ```bash
  # Test critical user journeys
  - [ ] Home page loads
  - [ ] Search functionality works
  - [ ] API endpoints respond
  - [ ] Database queries execute
  - [ ] Authentication works
  ```

---

## 🧪 PHASE 4: TESTING & VALIDATION (2-3 Days)

### 4.1 Functional Testing
- [ ] **Core Features**
  - [ ] Bus tracking works correctly
  - [ ] Location search returns results
  - [ ] Form submissions process correctly
  - [ ] File uploads work (if applicable)
  - [ ] Authentication/authorization functions

- [ ] **API Testing**
  ```bash
  # Run Postman collection or curl tests
  curl -H "Authorization: Bearer $TOKEN" https://api.perundhu.app/buses
  ```
  - [ ] All endpoints accessible
  - [ ] Response times acceptable (<500ms)
  - [ ] Error handling appropriate

- [ ] **Database Testing**
  - [ ] Data persists correctly
  - [ ] Transactions work properly
  - [ ] Constraints enforced
  - [ ] Backup/restore tested

### 4.2 Performance Testing
- [ ] **Load Testing**
  ```bash
  # Use Cloud Load Testing or locally with Apache JMeter
  # Test at 1000 concurrent users minimum
  ```
  - [ ] Response times acceptable under load
  - [ ] No memory leaks
  - [ ] Database connections pooled properly
  - [ ] Scaling works if configured

- [ ] **Lighthouse Audit**
  - [ ] Performance score > 80
  - [ ] Accessibility score > 90
  - [ ] Best practices score > 90
  - [ ] SEO score > 90

### 4.3 Security Testing
- [ ] **OWASP Top 10 Testing**
  - [ ] SQL Injection tests (use parameterized queries)
  - [ ] XSS prevention (output encoding)
  - [ ] CSRF protection enabled
  - [ ] Authentication/authorization tested
  - [ ] Sensitive data encrypted

- [ ] **SSL/TLS Configuration**
  ```bash
  # Use SSL Labs or testssl.sh
  testssl.sh https://api.perundhu.app
  ```
  - [ ] A+ rating on SSL Labs
  - [ ] No weak ciphers
  - [ ] HSTS enabled

- [ ] **Dependency Vulnerabilities**
  ```bash
  # Backend
  ./gradlew dependencyCheck
  
  # Frontend
  npm audit
  ```
  - [ ] No critical vulnerabilities
  - [ ] Security patches applied

### 4.4 User Acceptance Testing (UAT)
- [ ] **Internal Testing**
  - [ ] Run through complete user workflows
  - [ ] Test on multiple devices/browsers
  - [ ] Verify all business rules
  - [ ] Check localization (Tamil/English)

- [ ] **Staging Environment Test**
  - [ ] Mirror production as closely as possible
  - [ ] Test before production push
  - [ ] Get stakeholder sign-off

---

## 📊 PHASE 5: MONITORING & OPERATIONS (Before Launch)

### 5.1 Monitoring Setup
- [ ] **Google Cloud Monitoring**
  - [ ] CPU utilization alerts (threshold: >70%)
  - [ ] Memory utilization alerts (threshold: >75%)
  - [ ] Error rate alerts (threshold: >1%)
  - [ ] Response time alerts (threshold: >1000ms)

- [ ] **Application Insights (Optional)**
  - [ ] Set up error tracking
  - [ ] Configure log aggregation
  - [ ] Create dashboards for key metrics

- [ ] **Alerting Configuration**
  ```bash
  # Set up Cloud Alerts for:
  - [ ] Backend service down
  - [ ] Database errors
  - [ ] High error rates
  - [ ] Performance degradation
  ```

### 5.2 Logging Configuration
- [ ] **Cloud Logging**
  - [ ] Backend logs captured and searchable
  - [ ] Frontend errors logged
  - [ ] Audit logs enabled
  - [ ] Log retention policy set (30+ days)

- [ ] **Error Tracking**
  - [ ] Production errors visible in dashboard
  - [ ] Error notifications configured
  - [ ] Stack traces captured

### 5.3 Backup & Disaster Recovery
- [ ] **Database Backups**
  - [ ] Automated daily backups enabled
  - [ ] Backup retention: 30+ days
  - [ ] Test restore procedure
  - [ ] Document RTO/RPO

- [ ] **Disaster Recovery Plan**
  - [ ] Document failover procedures
  - [ ] Test recovery time
  - [ ] Maintain runbook for incidents

---

## 🔐 PHASE 6: SECURITY HARDENING (1-2 Days)

### 6.1 Application Security
- [ ] **Environment Secrets**
  - [ ] All secrets in Secret Manager (never in code)
  - [ ] Rotate secrets every 90 days
  - [ ] Access logs enabled for secrets

- [ ] **Authentication/Authorization**
  - [ ] JWT tokens expire appropriately
  - [ ] Refresh token rotation enabled
  - [ ] Admin accounts secured
  - [ ] MFA enabled for admin users

- [ ] **API Security**
  - [ ] Rate limiting enabled (100 requests/minute)
  - [ ] Input validation on all endpoints
  - [ ] Output encoding implemented
  - [ ] CORS properly configured

### 6.2 Infrastructure Security
- [ ] **Network Security**
  - [ ] Private database (no public IP)
  - [ ] VPC isolation enabled
  - [ ] Cloud SQL Auth proxy configured
  - [ ] DDoS protection (Cloud Armor)

- [ ] **IAM Configuration**
  - [ ] Principle of least privilege
  - [ ] Service account keys rotated
  - [ ] Audit logs enabled
  - [ ] Separate roles for backend/frontend

- [ ] **Data Protection**
  - [ ] Data encryption at rest enabled
  - [ ] Data encryption in transit (TLS)
  - [ ] PII masked in logs
  - [ ] GDPR compliance (if applicable)

### 6.3 Compliance & Policies
- [ ] **Security Policies**
  - [ ] Security incident response plan
  - [ ] Data retention policy
  - [ ] Access control policy
  - [ ] Password policy enforced

- [ ] **Documentation**
  - [ ] Security architecture documented
  - [ ] Incident response playbook
  - [ ] Change management process
  - [ ] Runbook for common issues

---

## 📋 DEPLOYMENT CHECKLIST (Final Week)

### 3 Days Before
- [ ] Final code review completed
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security scan completed with no critical issues
- [ ] Performance testing acceptable
- [ ] Monitoring dashboards configured
- [ ] Runbooks prepared
- [ ] Team trained on procedures
- [ ] Rollback plan documented

### 1 Day Before
- [ ] Staging environment tests passed
- [ ] Database backup verified
- [ ] Team on-call scheduled
- [ ] Customer communication prepared
- [ ] Go/No-Go decision meeting
- [ ] Final security review

### Day Of Deployment
- [ ] Create release tag: `git tag -a v1.0.0 -m "Production release"`
- [ ] Push tag: `git push origin v1.0.0`
- [ ] This triggers CD production workflow automatically
- [ ] Monitor deployment logs
- [ ] Verify health checks pass
- [ ] Run smoke tests
- [ ] Monitor error rates for 1 hour
- [ ] Confirm with stakeholders

### Post-Deployment (First 24-48 Hours)
- [ ] Monitor all metrics continuously
- [ ] Check logs for errors
- [ ] Respond to alerts immediately
- [ ] Test with real users
- [ ] Collect feedback
- [ ] Be ready to rollback if needed

---

## 🛠️ USEFUL COMMANDS

### Infrastructure
```bash
# View Terraform outputs
cd infrastructure/terraform/environments/production
terraform output

# View Cloud SQL instances
gcloud sql instances list --project=YOUR_PROJECT

# View Cloud Run services
gcloud run services list --platform managed --region asia-south1

# View deployments
gcloud run services describe perundhu-backend --region asia-south1
```

### Database
```bash
# Access database
gcloud sql connect perundhu-prod --user=perundhu_user

# View migrations
gcloud sql operations list --instance=perundhu-prod

# Backup database
gcloud sql backups create --instance=perundhu-prod
```

### Monitoring
```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50 --format json

# View metrics
gcloud monitoring metrics-descriptors list

# Create alert
gcloud alpha monitoring policies create --notification-channels=<CHANNEL_ID>
```

### Rollback (If Needed)
```bash
# Revert to previous version
gcloud run deploy perundhu-backend \
  --image gcr.io/YOUR_PROJECT/perundhu-backend:PREVIOUS_TAG \
  --region asia-south1
```

---

## 📞 SUPPORT & ESCALATION

### Critical Issues
1. Check Cloud Logging for errors
2. Review metrics dashboard
3. Check health endpoints
4. Review recent deployments
5. Initiate rollback if necessary

### On-Call Procedure
- Document in team wiki
- Set up Slack/PagerDuty notifications
- Schedule on-call rotation
- Maintain incident log

---

## 🎯 SUCCESS CRITERIA

### Pre-Launch
- ✅ All infrastructure provisioned and tested
- ✅ Application deployed and healthy
- ✅ All tests passing
- ✅ Security review completed
- ✅ Performance acceptable
- ✅ Monitoring configured
- ✅ Team trained

### Post-Launch (First Week)
- ✅ Error rate < 1%
- ✅ P99 latency < 1 second
- ✅ Availability > 99.5%
- ✅ No critical security issues
- ✅ Database backups working
- ✅ Alerts functioning correctly

---

## 📝 NEXT STEPS

**This Week (Week of Jan 5):**
1. Review this checklist with team
2. Create detailed implementation plan
3. Assign owners to each phase
4. Set up production GCP project
5. Configure Terraform variables

**Next Week (Week of Jan 12 - DEPLOYMENT):**
1. Execute Phase 1-3 (Infrastructure, Config, Deployment)
2. Run extensive testing (Phase 4)
3. Final security hardening (Phase 6)
4. Conduct go/no-go meeting
5. Deploy to production

---

**Last Updated**: January 5, 2026  
**Version**: 1.0  
**Owner**: DevOps Team  
**Status**: Ready for Implementation

