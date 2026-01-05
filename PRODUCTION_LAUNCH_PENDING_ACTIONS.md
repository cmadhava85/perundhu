# 📋 PRODUCTION LAUNCH - PENDING ACTIONS & TIMELINE

**Target Launch**: January 12, 2026 (1 Week from January 5, 2026)  
**Current Status**: 80% Ready  
**Last Updated**: January 5, 2026

---

## 🎯 CRITICAL PATH TIMELINE

```
Week of Jan 5     Week of Jan 12    Week of Jan 19
|                 |                 |
TODAY          LAUNCH DAY        POST-LAUNCH
|                 |                 |
└─ Prepare        └─ Deploy        └─ Monitor
   (Days 1-3)       (Day 1)          (Days 1-7)
                    Test            Optimize
                    (Days 2-3)       (Ongoing)
```

---

## 📦 PHASE-BY-PHASE PENDING WORK

### PHASE 1: INFRASTRUCTURE SETUP (This Week - Tue-Thu)
**Estimated**: 8-10 hours of work

#### GCP Project & Billing Setup
- [ ] **Create Production GCP Project** (30 mins)
  - Go to Google Cloud Console
  - Create new project: `perundhu-prod-001` (or similar)
  - Enable billing
  - Wait 5 minutes for project to be ready

- [ ] **Grant IAM Permissions** (20 mins)
  - Add team members as Owner/Editor
  - Verify authentication with: `gcloud auth list`
  - Test access: `gcloud projects list`

#### Terraform Preparation
- [ ] **Update Terraform Variables** (20 mins)
  ```bash
  cd infrastructure/terraform/environments/production
  cp terraform.tfvars.example terraform.tfvars
  # Edit with:
  # - project_id = "YOUR_NEW_PROJECT_ID"
  # - region = "asia-south1"
  # - domain_name = "perundhu.app"
  ```

- [ ] **Create Terraform State Bucket** (15 mins)
  ```bash
  PROJECT_ID="YOUR_PROJECT_ID"
  gsutil mb -p $PROJECT_ID -l asia-south1 \
    gs://$PROJECT_ID-terraform-state-production
  gsutil versioning set on gs://$PROJECT_ID-terraform-state-production
  ```

- [ ] **Initialize & Plan Infrastructure** (30 mins)
  ```bash
  cd infrastructure/terraform/environments/production
  terraform init -backend-config="bucket=$PROJECT_ID-terraform-state-production"
  terraform plan -var="project_id=$PROJECT_ID"
  ```

- [ ] **Review & Approve Plan** (20 mins)
  - Save plan to file: `terraform show tfplan > plan.txt`
  - Tech lead reviews plan
  - Check: ~20-25 resources, correct regions, no destructive changes
  - Document approval

#### Infrastructure Deployment
- [ ] **Apply Terraform Configuration** (20-30 mins)
  ```bash
  terraform apply tfplan
  # Monitor progress, should complete without errors
  ```

- [ ] **Capture Terraform Outputs** (10 mins)
  ```bash
  terraform output -json > outputs.json
  # Save for database and application configuration
  ```

#### Database & Secrets
- [ ] **Create Secret Manager Secrets** (15 mins)
  - Database URL
  - Database username
  - Database password
  - JWT secret
  - Encryption key
  - reCAPTCHA secret (if using)
  - Gemini API key (if using)

- [ ] **Apply Database Migrations** (10 mins)
  ```bash
  cd backend
  ./gradlew flywayMigrate -Dspring.profiles.active=production
  # Verify all migrations successful
  ```

#### Verification
- [ ] **Verify All Infrastructure** (20 mins)
  - [ ] Cloud SQL instance running
  - [ ] Storage buckets created
  - [ ] VPC configured
  - [ ] Service accounts created
  - [ ] Secrets accessible
  - [ ] Network connectivity tested

**Status**: 🔴 NOT STARTED  
**Owner**: DevOps Lead  
**Estimated Effort**: 8-10 hours (1 business day)

---

### PHASE 2: APPLICATION CONFIGURATION (Wed-Thu)
**Estimated**: 6-8 hours

#### Backend Configuration
- [ ] **Create production application properties** (15 mins)
  ```bash
  # File: backend/app/src/main/resources/application-production.properties
  # Add all production-specific settings
  # Database connection, logging, security, etc.
  ```

- [ ] **Build Backend with Production Profile** (15 mins)
  ```bash
  cd backend
  ./gradlew clean build -Dspring.profiles.active=production
  ```

- [ ] **Push Backend Image to GCR** (10 mins)
  ```bash
  docker build -t gcr.io/YOUR_PROJECT/perundhu-backend:1.0.0 ./backend
  docker push gcr.io/YOUR_PROJECT/perundhu-backend:1.0.0
  ```

#### Frontend Configuration
- [ ] **Create production environment file** (10 mins)
  ```bash
  # File: frontend/.env.production
  VITE_API_URL=https://api.perundhu.app
  VITE_API_BASE_URL=https://api.perundhu.app
  VITE_MOCK_API=false
  VITE_RECAPTCHA_ENABLED=true
  ```

- [ ] **Build Frontend for Production** (15 mins)
  ```bash
  cd frontend
  npm run build
  # Verify dist/ folder with all assets
  ```

- [ ] **Push Frontend Image to GCR** (10 mins)
  ```bash
  docker build -t gcr.io/YOUR_PROJECT/perundhu-frontend:1.0.0 ./frontend
  docker push gcr.io/YOUR_PROJECT/perundhu-frontend:1.0.0
  ```

#### Docker & Security
- [ ] **Scan Images for Vulnerabilities** (10 mins)
  ```bash
  gcloud container images scan gcr.io/YOUR_PROJECT/perundhu-backend:1.0.0
  # Fix any critical vulnerabilities
  ```

- [ ] **Verify Images in Registry** (5 mins)
  ```bash
  gcloud container images list --repository=gcr.io/YOUR_PROJECT
  ```

**Status**: 🟡 PARTIALLY READY (Code exists, need to build & push)  
**Owner**: Backend Lead & Frontend Lead  
**Estimated Effort**: 6-8 hours (1 business day)

---

### PHASE 3: DEPLOYMENT (Friday)
**Estimated**: 4-6 hours

#### Cloud Run Deployment
- [ ] **Deploy Backend Service** (15 mins)
  ```bash
  gcloud run deploy perundhu-backend \
    --image gcr.io/YOUR_PROJECT/perundhu-backend:1.0.0 \
    --platform managed --region asia-south1 \
    --memory 2Gi --cpu 2 \
    --service-account SERVICE_ACCOUNT \
    --vpc-connector CONNECTOR
  ```

- [ ] **Deploy Frontend Service** (10 mins)
  ```bash
  gcloud run deploy perundhu-frontend \
    --image gcr.io/YOUR_PROJECT/perundhu-frontend:1.0.0 \
    --platform managed --region asia-south1 \
    --memory 256Mi --allow-unauthenticated
  ```

#### Domain Mapping
- [ ] **Configure Custom Domains** (10 mins)
  ```bash
  # Get DNS records from:
  gcloud run domain-mappings create \
    --service perundhu-backend --domain api.perundhu.app
  gcloud run domain-mappings create \
    --service perundhu-frontend --domain perundhu.app
  ```

- [ ] **Update DNS Records** (varies by DNS provider)
  - Contact DNS admin with CNAME records
  - Point to: `ghs.googleusercontent.com`
  - Wait 10-30 minutes for propagation

#### Smoke Testing
- [ ] **Test Backend Health** (10 mins)
  - Check: `https://api.perundhu.app/actuator/health`
  - Expected: 200 OK

- [ ] **Test Frontend Accessibility** (10 mins)
  - Check: `https://perundhu.app`
  - Expected: HTML loads, no console errors

- [ ] **Test Core API Endpoints** (15 mins)
  - Bus routes endpoint
  - Search functionality
  - Database connectivity
  - Authentication if applicable

#### Monitoring Setup
- [ ] **Configure Cloud Monitoring Dashboard** (20 mins)
  - CPU usage
  - Memory usage
  - Error rates
  - Response times
  - Request volume

- [ ] **Set Up Alert Policies** (15 mins)
  - Error rate > 1%
  - Latency > 1s
  - Service down
  - Database errors

- [ ] **Enable Log Aggregation** (10 mins)
  - Backend logs
  - Frontend logs
  - Access logs
  - Error logs

**Status**: 🟢 READY (Infrastructure and deployment scripts ready)  
**Owner**: DevOps Lead & Platform Engineers  
**Estimated Effort**: 4-6 hours (1/2 business day)

---

### PHASE 4: TESTING & QA (Friday-Saturday)
**Estimated**: 12-16 hours

#### Functional Testing
- [ ] **Core Feature Testing** (4 hours)
  - [ ] Bus tracking functionality
  - [ ] Location search
  - [ ] Route display
  - [ ] Form submissions
  - [ ] User authentication
  - [ ] Admin features (if applicable)
  - Document any issues found

- [ ] **API Testing** (3 hours)
  - [ ] All endpoints accessible
  - [ ] Response times acceptable
  - [ ] Error codes correct
  - [ ] Data validation working
  - [ ] Rate limiting functioning

- [ ] **Database Testing** (2 hours)
  - [ ] Data persists correctly
  - [ ] Transactions working
  - [ ] Constraints enforced
  - [ ] Backup functionality verified

#### Performance Testing
- [ ] **Load Testing** (3 hours)
  - Test with 100+ concurrent users
  - Measure response times
  - Check resource utilization
  - Document baseline metrics

- [ ] **Lighthouse Audit** (1 hour)
  - Performance > 80
  - Accessibility > 90
  - Best Practices > 90
  - SEO > 90

#### Security Testing
- [ ] **OWASP Top 10 Check** (2 hours)
  - SQL Injection attempts
  - XSS prevention
  - CSRF protection
  - Authentication/authorization
  - Data protection

- [ ] **SSL/TLS Verification** (30 mins)
  - Run testssl.sh or use SSL Labs
  - Target: A+ rating
  - No weak ciphers

#### User Acceptance Testing
- [ ] **Stakeholder Testing** (2 hours)
  - Business users test workflows
  - Verify all requirements met
  - Get approval to launch
  - Document sign-off

**Status**: 🟡 DEPENDS ON DEPLOYMENT  
**Owner**: QA Lead & Testing Team  
**Estimated Effort**: 12-16 hours (2 business days)

---

### PHASE 5: SECURITY HARDENING (Wed-Thu)
**Estimated**: 5-7 hours

#### Code Security Review
- [ ] **Dependency Vulnerability Scan** (30 mins)
  ```bash
  # Backend
  ./gradlew dependencyCheck
  # Frontend
  npm audit
  # Fix any critical vulnerabilities
  ```

- [ ] **Static Code Analysis** (1 hour)
  - Run SpotBugs (backend)
  - Run ESLint (frontend)
  - Check for hard-coded secrets
  - Review for OWASP issues

#### Infrastructure Security
- [ ] **Network Security Review** (1 hour)
  - Verify private database (no public IP)
  - Check firewall rules
  - Verify VPC isolation
  - Review IAM roles (least privilege)

- [ ] **Secrets Security Review** (30 mins)
  - All secrets in Secret Manager
  - No secrets in code/config
  - Access logs enabled
  - Rotation policy set

- [ ] **SSL/TLS Configuration** (30 mins)
  - Verify HTTPS enforced
  - Check certificate validity
  - Test security headers
  - Enable HSTS

#### Compliance & Documentation
- [ ] **Security Documentation** (1 hour)
  - Document security architecture
  - Create incident response playbook
  - List security contacts
  - Prepare compliance checklist

- [ ] **Data Protection Review** (30 mins)
  - Data encryption at rest ✓
  - Data encryption in transit ✓
  - PII handling documented
  - GDPR compliance (if applicable)

**Status**: 🟢 MOSTLY READY (Need final review)  
**Owner**: Security Lead & Compliance  
**Estimated Effort**: 5-7 hours

---

### PHASE 6: OPERATIONS READINESS (Wed-Thu)
**Estimated**: 6-8 hours

#### Documentation
- [ ] **Operations Manual** (2 hours)
  - Common procedures
  - Troubleshooting guide
  - System architecture diagram
  - API documentation

- [ ] **Runbooks** (2 hours)
  - Deployment procedures ✓
  - Rollback procedures ✓
  - Incident response ✓
  - Backup/restore ✓

- [ ] **Change Log** (30 mins)
  - Features added
  - Bugs fixed
  - Breaking changes
  - Migration notes

#### Team Training
- [ ] **DevOps Team Training** (1 hour)
  - Infrastructure overview
  - Deployment procedures
  - Monitoring dashboard
  - Incident response

- [ ] **Support Team Training** (1 hour)
  - Common issues & solutions
  - How to check logs
  - Performance monitoring
  - Escalation procedures

#### Monitoring & Alerting
- [ ] **Monitoring Dashboard** (1 hour)
  - Key metrics displayed
  - Trending charts
  - Alert status
  - Team access configured

- [ ] **On-Call Scheduling** (30 mins)
  - Week 1 on-call assigned
  - Escalation contacts listed
  - Alert notification channels set
  - Incident log started

**Status**: 🟡 PARTIALLY DONE  
**Owner**: DevOps Lead & Operations  
**Estimated Effort**: 6-8 hours

---

## 📊 SUMMARY OF PENDING WORK

| Phase | Tasks | Status | Effort | Owner | Deadline |
|-------|-------|--------|--------|-------|----------|
| 1: Infrastructure | Terraform setup, Database, Secrets | 🔴 0% | 8-10h | DevOps | Wed |
| 2: Configuration | Backend/Frontend builds, Images | 🟡 50% | 6-8h | Backend/Frontend | Thu |
| 3: Deployment | Cloud Run, DNS, Monitoring | 🟢 90% | 4-6h | DevOps | Fri |
| 4: Testing | QA, Performance, Security, UAT | 🟡 20% | 12-16h | QA Team | Sat |
| 5: Security | Code review, Hardening | 🟢 80% | 5-7h | Security | Thu |
| 6: Operations | Documentation, Training | 🟡 40% | 6-8h | Operations | Thu |
| **TOTAL** | **All phases** | **🟡 60%** | **41-55h** | **All teams** | **Fri Jan 12** |

---

## 🎯 CRITICAL BLOCKERS TO RESOLVE NOW

### 1. ⚠️ GCP Project Setup (HIGHEST PRIORITY)
**Status**: Not Started  
**Blocker**: Everything depends on this  
**Action Required**:
- [ ] Create production GCP project NOW
- [ ] Enable billing
- [ ] Add team members with Editor role
- [ ] Verify authentication

**Owner**: DevOps Lead  
**Deadline**: TODAY (Jan 5)

### 2. ⚠️ Domain Preparation
**Status**: Needs Verification  
**Blocker**: DNS configuration needed before launch  
**Action Required**:
- [ ] Verify `perundhu.app` domain registered
- [ ] Confirm registrar access
- [ ] Prepare to update DNS records
- [ ] Notify DNS admin

**Owner**: Operations Lead  
**Deadline**: TODAY (Jan 5)

### 3. ⚠️ Secrets & Keys Preparation
**Status**: Needs Documentation  
**Blocker**: Can't proceed without credentials  
**Action Required**:
- [ ] Collect all production secrets
  - Database password
  - JWT signing key
  - reCAPTCHA secret (if using)
  - Gemini API key (if using)
  - Any other API keys
- [ ] Document securely (NOT in Git!)
- [ ] Have them ready for Secret Manager

**Owner**: Backend Lead  
**Deadline**: TODAY (Jan 5)

### 4. ⚠️ Resource Quotas
**Status**: Needs Verification  
**Blocker**: Deployment may fail if quotas exceeded  
**Action Required**:
- [ ] Check GCP quotas for region
- [ ] Request increase if needed
- [ ] Typical needs: Cloud SQL, Cloud Run, VPC

**Owner**: DevOps Lead  
**Deadline**: TODAY (Jan 5)

---

## 📅 DETAILED TIMELINE

### Monday Jan 5 (TODAY) - 4 Hours Available
**Morning (9 AM - 12 PM)**:
- ✅ Review this checklist with team (30 mins)
- 🔴 Create GCP production project (30 mins)
- 🔴 Verify domain registration (20 mins)
- 🔴 Collect all secrets & credentials (30 mins)
- ✅ Document approach & get buy-in (20 mins)

**Afternoon (2 PM - 5 PM)**:
- 🔴 Set up Terraform variables (20 mins)
- 🔴 Create TF state bucket (15 mins)
- 🔴 Run terraform plan (30 mins)
- ✅ Schedule final approvals (15 mins)

### Tuesday Jan 7 - 8 Hours Available
**Full Day**:
- 🔴 Apply Terraform (30 mins)
- 🔴 Configure secrets (30 mins)
- 🔴 Apply database migrations (30 mins)
- 🔴 Verify infrastructure (1 hour)
- 🟡 Build & push container images (2 hours)
- ✅ Documentation & preparation (2 hours)

### Wednesday Jan 8 - 8 Hours Available
**Full Day**:
- 🟡 Frontend & backend final builds (2 hours)
- ✅ Final code review (1 hour)
- ✅ Security review (1.5 hours)
- ✅ Documentation complete (1.5 hours)
- ✅ Team training & briefing (2 hours)

### Thursday Jan 9 - 4 Hours Available
**Afternoon Only**:
- ✅ Final readiness review meeting (1 hour)
- ✅ Dry run of deployment (1 hour)
- ✅ Issue resolution & contingency planning (1 hour)
- ✅ All-hands briefing (30 mins)

### Friday Jan 12 - DEPLOYMENT DAY
**Full 8 Hours**:
- 🔴 Deploy infrastructure changes (1 hour)
- 🔴 Deploy applications (1 hour)
- 🟡 Smoke testing (2 hours)
- 🟡 Monitoring verification (1 hour)
- ✅ Go/No-Go decision (30 mins)
- ✅ Live monitoring & incident response (2 hours)

### Sat-Sun (Jan 13-14) - Ongoing
**Support Available**:
- On-call monitoring
- Issue resolution
- User support
- Documentation updates

---

## ✅ DAILY STANDUP POINTS

### Monday (Today) 5 PM Standup
- [ ] GCP project created?
- [ ] Team understands timeline?
- [ ] Blockers identified?
- [ ] Next steps confirmed?

### Tuesday 9 AM Standup
- [ ] Terraform plan approved?
- [ ] Any infrastructure blockers?
- [ ] Secrets ready?

### Tuesday 5 PM Standup
- [ ] Infrastructure fully deployed?
- [ ] Database migrations successful?
- [ ] Images built and pushed?

### Wednesday 9 AM Standup
- [ ] Code ready for deployment?
- [ ] All tests passing?
- [ ] Documentation complete?

### Thursday 9 AM Standup
- [ ] Final readiness review done?
- [ ] Team trained?
- [ ] Contingency plans ready?

### Friday 9 AM Standup (PRE-DEPLOYMENT)
- [ ] All systems ready?
- [ ] Go/No-Go decision?
- [ ] Monitoring active?
- [ ] Team stationed?

---

## 🎬 START HERE - IMMEDIATE ACTIONS (Next 2 Hours)

```
Priority 1 (DO NOW):
1. [ ] Create GCP production project
2. [ ] Add team to GCP project
3. [ ] Test gcloud authentication
4. [ ] Gather all production secrets/keys
5. [ ] Verify domain ownership

Priority 2 (DO TODAY):
1. [ ] Set up Terraform variables
2. [ ] Create state bucket
3. [ ] Run terraform plan
4. [ ] Get tech lead approval on plan

Priority 3 (DO TOMORROW):
1. [ ] Apply Terraform (DEPLOY INFRASTRUCTURE)
2. [ ] Build Docker images
3. [ ] Push images to GCR
4. [ ] Apply database migrations
```

---

## 📞 WHO OWNS WHAT

| Area | Owner | Contact |
|------|-------|---------|
| Overall Delivery | DevOps Lead | [Name/Contact] |
| Infrastructure & Terraform | DevOps Engineer | [Name/Contact] |
| Backend Deployment | Backend Lead | [Name/Contact] |
| Frontend Deployment | Frontend Lead | [Name/Contact] |
| QA & Testing | QA Lead | [Name/Contact] |
| Security Review | Security Lead | [Name/Contact] |
| Operations Readiness | Ops Lead | [Name/Contact] |
| Incident Management (Day 1) | On-Call Engineer | [Name/Contact] |

---

## 🚨 RISK ASSESSMENT

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| GCP quota exceeded | Medium | High | Request increase now |
| DNS propagation delay | Low | Medium | Use Cloud Run URLs as fallback |
| Database migration failure | Low | High | Test migration script now |
| Performance issues | Medium | High | Load test before go-live |
| Security vulnerability found | Low | High | Run security scan now |
| Team member unavailable | Low | Medium | Cross-train backup resources |

---

## ✨ SUCCESS CRITERIA

**For Production Launch to Proceed:**

Before Friday:
- ✅ Infrastructure fully deployed and tested
- ✅ Applications deployed and healthy
- ✅ All tests passing
- ✅ Security review completed
- ✅ Team trained and ready
- ✅ Monitoring configured
- ✅ Incident procedures documented
- ✅ Go/No-Go approval obtained

On Launch Day:
- ✅ Deployment completes without errors
- ✅ All health checks pass
- ✅ Error rate < 1% for first hour
- ✅ No P1 incidents
- ✅ User feedback positive

First Week:
- ✅ Availability > 99%
- ✅ Response times < 1 second
- ✅ Error rate remains < 1%
- ✅ Database backups working
- ✅ Scaling policies functioning

---

## 📝 NEXT DOCUMENT TO READ

After you understand this timeline, read these in order:

1. **[PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md)** - Complete 6-phase checklist
2. **[TERRAFORM_PRODUCTION_GUIDE.md](./TERRAFORM_PRODUCTION_GUIDE.md)** - Detailed Terraform setup
3. **[PRODUCTION_DEPLOYMENT_RUNBOOK.md](./PRODUCTION_DEPLOYMENT_RUNBOOK.md)** - Step-by-step deployment guide

---

**Document Status**: Ready for Implementation  
**Last Updated**: January 5, 2026  
**Version**: 1.0

**NEXT STEP**: Team syncs on this document, confirms blockers are resolved, and begins Phase 1 implementation.

