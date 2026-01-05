# 🚀 PRODUCTION DEPLOYMENT - QUICK REFERENCE CARD

**Print this or bookmark for easy access during deployment**

---

## TODAY (Monday Jan 5) - 3 CRITICAL ACTIONS

```
☐ ACTION 1: Create GCP Project (30 min)
  gcloud projects create perundhu-prod-001
  gcloud config set project perundhu-prod-001
  
☐ ACTION 2: Gather Production Secrets (30 min)
  - Database password (will be auto-generated)
  - JWT secret
  - reCAPTCHA secret
  - Gemini API key
  - Any other credentials

☐ ACTION 3: Verify Domain & DNS (20 min)
  - Confirm perundhu.app is registered
  - Identify DNS admin
  - Prepare for DNS updates Friday
```

---

## PHASE TIMELINE

```
TUESDAY-THURSDAY          FRIDAY (JAN 12)         SATURDAY-SUNDAY
Preparation Day 1-3       Deployment Day          Post-Launch
│                         │                       │
├─ Terraform init         ├─ Deploy backend       ├─ Intensive monitoring
├─ Build images           ├─ Deploy frontend      ├─ Issue resolution
├─ Security review        ├─ Domain mapping       ├─ Performance tuning
├─ Team training          ├─ Smoke tests          └─ Post-mortem
└─ Final verification     └─ Go live
```

---

## QUICK COMMAND REFERENCE

### GCP Project Setup
```bash
# Create project
gcloud projects create perundhu-prod-001

# Set as active
gcloud config set project perundhu-prod-001

# Enable APIs
gcloud services enable compute sqladmin cloudbuild \
  run storage secretmanager cloudresourcemanager iam
```

### Terraform (Tue-Thu)
```bash
cd infrastructure/terraform/environments/production

# Edit variables
cp terraform.tfvars.example terraform.tfvars
# Edit with your PROJECT_ID, region, domain

# Deploy
terraform init -backend-config="bucket=YOUR_PROJECT_ID-terraform-state-production"
terraform plan -var="project_id=YOUR_PROJECT_ID"
terraform apply -var="project_id=YOUR_PROJECT_ID"

# Verify
terraform output
```

### Build & Push Images (Wed-Thu)
```bash
# Backend
cd backend
./gradlew clean build -Dspring.profiles.active=production
docker build -t gcr.io/YOUR_PROJECT/perundhu-backend:1.0.0 .
docker push gcr.io/YOUR_PROJECT/perundhu-backend:1.0.0

# Frontend
cd frontend
npm run build
docker build -t gcr.io/YOUR_PROJECT/perundhu-frontend:1.0.0 .
docker push gcr.io/YOUR_PROJECT/perundhu-frontend:1.0.0
```

### Deploy to Cloud Run (Friday)
```bash
# Backend
gcloud run deploy perundhu-backend \
  --image gcr.io/YOUR_PROJECT/perundhu-backend:1.0.0 \
  --region asia-south1 --memory 2Gi --cpu 2 \
  --platform managed

# Frontend
gcloud run deploy perundhu-frontend \
  --image gcr.io/YOUR_PROJECT/perundhu-frontend:1.0.0 \
  --region asia-south1 --memory 256Mi \
  --allow-unauthenticated --platform managed

# Map domains
gcloud run domain-mappings create \
  --service perundhu-backend --domain api.perundhu.app
gcloud run domain-mappings create \
  --service perundhu-frontend --domain perundhu.app
```

### Verify Health (Friday)
```bash
# Backend health
curl https://api.perundhu.app/actuator/health

# Frontend
curl https://perundhu.app

# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit 20
```

---

## 🎯 SUCCESS CHECKLIST

### Before Deployment
- [ ] GCP project created
- [ ] Terraform state bucket created
- [ ] All secrets in Secret Manager
- [ ] Docker images built and pushed
- [ ] Monitoring dashboards configured
- [ ] Alert policies set up
- [ ] Team trained
- [ ] Rollback plan documented

### During Deployment (Friday)
- [ ] Infrastructure deployed
- [ ] Applications deployed to Cloud Run
- [ ] Health checks passing
- [ ] Smoke tests passing
- [ ] No critical errors in logs
- [ ] Response times acceptable
- [ ] DNS mappings working

### After Deployment
- [ ] Error rate < 1%
- [ ] Latency < 500ms
- [ ] Availability > 99%
- [ ] Database backups running
- [ ] Monitoring alerts functional
- [ ] On-call team responsive

---

## ⚡ CRITICAL DECISIONS

| Decision | Options | Action |
|----------|---------|--------|
| **GCP Project** | Create new or use existing? | ✅ Create new (perundhu-prod-001) |
| **Region** | asia-south1 or other? | ✅ Use asia-south1 (Mumbai) |
| **Domain** | perundhu.app or other? | ✅ Use perundhu.app |
| **Go-Live Time** | Date & time? | ✅ Friday Jan 12, 9 AM |
| **Rollback Ready?** | Yes or no? | ✅ Document procedure |
| **On-Call Team** | Who's available? | ✅ Assign 24-hour coverage |

---

## 🚨 COMMON ISSUES & FIXES

| Issue | Fix | Time |
|-------|-----|------|
| Terraform plan fails | Check GCP quotas, enable APIs | 5-10 min |
| Image push fails | Verify Docker auth, check image size | 5 min |
| Cloud Run deploy fails | Check image exists in GCR, verify IAM | 5 min |
| Health check fails | Check logs: `gcloud logging read` | 5 min |
| DNS not resolving | Wait 10-30 min, use Cloud Run URL | varies |
| High error rate | Check logs for errors, review metrics | varies |

---

## 📞 ESCALATION CONTACTS

```
On-Call (Jan 12):     Madhavan Chandraprakasam | cmadhava@gmail.com
DevOps Lead:          Madhavan Chandraprakasam | cmadhava@gmail.com
Backend Lead:         Madhavan Chandraprakasam | cmadhava@gmail.com
Security Lead:        Madhavan Chandraprakasam | cmadhava@gmail.com
CTO/Manager:          Madhavan Chandraprakasam | cmadhava@gmail.com

Slack Channel:        #production-incidents
Status Page:          https://status.perundhu.app
Customer Support:     support@perundhu.app
```

---

## 📊 INFRASTRUCTURE QUICK FACTS

```
Backend Service
  - Name: perundhu-backend
  - Memory: 2GB
  - CPU: 2
  - Min instances: 1
  - Max instances: 10
  - Timeout: 300s
  
Frontend Service
  - Name: perundhu-frontend
  - Memory: 256MB
  - CPU: 1
  - Max instances: 20
  - Timeout: 60s
  
Database
  - Type: Cloud SQL MySQL 8.0
  - Tier: db-n1-standard-1
  - Storage: 100GB (expandable)
  - Backups: Daily
  
Network
  - Region: asia-south1
  - VPC: Private
  - Connector: For Cloud Run
  
Domain
  - Frontend: perundhu.app
  - Backend: api.perundhu.app
  - SSL: Auto-provisioned
```

---

## 📋 DAILY STANDUP QUESTIONS

### Monday
- [ ] GCP project created?
- [ ] Team ready?
- [ ] Blockers identified?

### Tuesday
- [ ] Terraform plan approved?
- [ ] Any infrastructure issues?
- [ ] Secrets ready?

### Wednesday
- [ ] Code ready?
- [ ] Images building?
- [ ] Security review progressing?

### Thursday
- [ ] Final checks done?
- [ ] Team trained?
- [ ] Go/No-Go ready?

### Friday (Deployment)
- [ ] All systems ready?
- [ ] Deploy executed?
- [ ] Tests passing?
- [ ] Go live?
- [ ] Monitoring active?

---

## ✅ PRE-DEPLOYMENT SIGN-OFF

**Print this section and have leads sign off:**

```
Infrastructure Lead: _______________ Date: ________
Code Quality Lead:   _______________ Date: ________
Security Lead:       _______________ Date: ________
QA Lead:             _______________ Date: ________
Operations Lead:     _______________ Date: ________
Project Manager:     _______________ Date: ________

GO/NO-GO DECISION: ☐ GO  ☐ NO-GO
```

---

## 📈 PERFORMANCE TARGETS

| Metric | Target | How to Check |
|--------|--------|-------------|
| Error Rate | < 1% | Cloud Monitoring dashboard |
| Latency (p99) | < 1s | Cloud Monitoring metrics |
| Availability | > 99.5% | Cloud Logging, uptime check |
| Health Check | 200 OK | `curl /actuator/health` |
| Response Time | < 500ms | Cloud Monitoring or curl -w |

---

## 🎯 DEPLOYMENT WINDOW

**Friday January 12, 2026**

```
09:00 AM - Window Opens
09:15 AM - Begin Deployment
11:00 AM - Smoke Testing
12:00 PM - DNS Verification
13:00 PM - Final Check
14:00 PM - Go Live
15:00 PM - Monitor (4 hours)
19:00 PM - Handoff to On-Call
```

**Maximum downtime allowed**: 15 minutes (if rollback needed)

---

## 🔄 ROLLBACK PROCEDURE

**If critical issue found (< 5 minutes):**

```bash
# Quick rollback to previous image
gcloud run deploy perundhu-backend \
  --image gcr.io/YOUR_PROJECT/perundhu-backend:0.9.9 \
  --region asia-south1

# Verify
curl https://api.perundhu.app/actuator/health
```

**If infrastructure issue (> 5 minutes):**

```bash
# Terraform rollback
terraform destroy -var="project_id=YOUR_PROJECT"
# Recreate from backup

# Or revert specific service
gcloud run services update-traffic perundhu-backend \
  --to-revisions PREVIOUS_REVISION_ID=100
```

**Notify team immediately if rollback executed**

---

## 📚 DOCUMENTATION QUICK LINKS

| Document | Use For | Time |
|----------|---------|------|
| [PRODUCTION_QUICK_START.md](./PRODUCTION_QUICK_START.md) | Overview & summary | 5 min |
| [PRODUCTION_LAUNCH_PENDING_ACTIONS.md](./PRODUCTION_LAUNCH_PENDING_ACTIONS.md) | Detailed task breakdown | 20 min |
| [TERRAFORM_PRODUCTION_GUIDE.md](./TERRAFORM_PRODUCTION_GUIDE.md) | Infrastructure setup | Reference |
| [PRODUCTION_DEPLOYMENT_RUNBOOK.md](./PRODUCTION_DEPLOYMENT_RUNBOOK.md) | Deployment steps | Reference |
| [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md) | Verification steps | Reference |

---

## 🎉 SUCCESS INDICATORS

**When you see these, deployment is successful:**

✅ Backend service status: READY  
✅ Frontend service status: READY  
✅ Health check returns 200 OK  
✅ No ERROR logs in Cloud Logging  
✅ Metrics dashboard shows normal traffic  
✅ User feedback is positive  
✅ Error rate remains < 1%  

---

## 🛑 DEPLOYMENT STOP CONDITIONS

**Stop deployment immediately if:**

🔴 GCP project quota exceeded  
🔴 Security vulnerability found  
🔴 Database connection fails  
🔴 Team member unavailable  
🔴 Critical code issue discovered  
🔴 Infrastructure destruction (accidental)  
🔴 Stakeholder requests delay  

---

## 📝 NOTES SECTION

Use this space for your deployment notes:

```
Monday:    ___________________________________

Tuesday:   ___________________________________

Wednesday: ___________________________________

Thursday:  ___________________________________

Friday:    ___________________________________

Issues:    ___________________________________

Lessons:   ___________________________________
```

---

## 💾 SAVE THIS FILE

**Keep handy during deployment:**
- [ ] Print and keep at desk
- [ ] Bookmark in browser
- [ ] Share with team via Slack
- [ ] Add to war room materials

---

**Last Updated**: January 5, 2026  
**Version**: 1.0  
**Next Update**: January 8, 2026

🚀 **READY FOR LAUNCH!** 🚀

