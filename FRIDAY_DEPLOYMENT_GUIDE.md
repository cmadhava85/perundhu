# 🚀 PERUNDHU DEPLOYMENT - FRIDAY JANUARY 12, 2026

**Current Status**: Infrastructure Ready | Docker Images Ready (pending Docker startup)  
**Timeline**: 2-3 hours for full deployment  
**Target**: Go Live by 3 PM IST

---

## ✅ COMPLETED SETUP

### Infrastructure (✅ Jan 5)
- ✅ GCP Project: `perundhu-prod-001`
- ✅ Cloud SQL Database: Running in asia-south1
- ✅ VPC Network: Configured
- ✅ Service Accounts: Created with permissions
- ✅ Secrets: All configured in Secret Manager

### Configuration (✅ Jan 5)
- ✅ JWT: `production-jwt-secret` configured
- ✅ reCAPTCHA: Enterprise protection enabled
- ✅ Database: MySQL 8.0 ready
- ✅ Application properties: All environments configured

### Docker Images (⏳ Pending Docker Startup)
- ⏳ Backend image: Ready to build
- ⏳ Frontend image: Ready to build

---

## 📋 FRIDAY DEPLOYMENT CHECKLIST

### 09:00 AM - PRE-DEPLOYMENT SETUP

**1. Start Docker & Build Images (if not done yet)**
```bash
# Make sure Docker Desktop is running
bash /Users/mchand69/Documents/perundhu/docker-build-and-push.sh
```
⏱️ Time: 20-30 minutes

**2. Verify Images in GCR**
```bash
gcloud container images list --project=perundhu-prod-001 --repository-format=json
```
Expected output:
- `asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu/backend:1.0.0`
- `asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu/frontend:1.0.0`

**3. Verify Database Migration**
```bash
gcloud sql connect perundhu-production-mysql \
  --user=perundhu_user \
  --project=perundhu-prod-001 \
  --database=perundhu
```
Check: Tables should exist from Flyway migrations

### 10:00 AM - DEPLOY BACKEND TO CLOUD RUN

```bash
# Deploy backend service
gcloud run deploy perundhu-backend \
  --image asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu/backend:1.0.0 \
  --platform managed \
  --region asia-south1 \
  --project perundhu-prod-001 \
  --service-account cloud-run-sa@perundhu-prod-001.iam.gserviceaccount.com \
  --set-env-vars SPRING_PROFILES_ACTIVE=production \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --max-instances 50 \
  --min-instances 1 \
  --no-allow-unauthenticated
```

**Verify Backend:**
```bash
BACKEND_URL=$(gcloud run services describe perundhu-backend \
  --region asia-south1 \
  --project perundhu-prod-001 \
  --format='value(status.address.url)')

echo "Backend URL: $BACKEND_URL"
curl -s ${BACKEND_URL}/actuator/health | jq .
```

⏱️ Time: 5-10 minutes

### 10:30 AM - DEPLOY FRONTEND TO CLOUD RUN

```bash
# Deploy frontend service
gcloud run deploy perundhu-frontend \
  --image asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu/frontend:1.0.0 \
  --platform managed \
  --region asia-south1 \
  --project perundhu-prod-001 \
  --allow-unauthenticated \
  --memory 256Mi \
  --cpu 1 \
  --max-instances 20 \
  --min-instances 1
```

**Verify Frontend:**
```bash
FRONTEND_URL=$(gcloud run services describe perundhu-frontend \
  --region asia-south1 \
  --project perundhu-prod-001 \
  --format='value(status.address.url)')

echo "Frontend URL: $FRONTEND_URL"
curl -s ${FRONTEND_URL} | head -20
```

⏱️ Time: 5-10 minutes

### 11:00 AM - CONFIGURE DOMAINS

**Update DNS Records:**
```bash
# Get the global load balancer IP
gcloud compute addresses list --global --project=perundhu-prod-001

# Update DNS records at your registrar:
# perundhu.app → [Frontend Load Balancer IP]
# api.perundhu.app → [Backend Load Balancer IP]
```

**Configure Cloud Armor & SSL (Optional - for enhanced security):**
```bash
# This is optional but recommended for production
# Can be configured via Google Cloud Console
```

⏱️ Time: 10-15 minutes

### 11:30 AM - SMOKE TESTING

**Backend Tests:**
```bash
API_URL="https://api.perundhu.app"  # or Cloud Run URL

# Health check
curl -s ${API_URL}/actuator/health

# Test key endpoints
curl -s ${API_URL}/api/v1/locations | jq . | head -20
curl -s ${API_URL}/api/v1/routes | jq . | head -20
```

**Frontend Tests:**
```bash
# Open in browser
https://perundhu.app

# Test key features:
# 1. Homepage loads
# 2. Bus tracker functionality
# 3. Contribution submission (with reCAPTCHA)
# 4. Admin login (with JWT)
```

⏱️ Time: 10-15 minutes

### 12:00 PM - PERFORMANCE & SECURITY VERIFICATION

**Run Lighthouse Audit:**
```bash
# Use Chrome DevTools → Lighthouse for production URL
# Target:
#   Performance: > 90
#   Accessibility: > 95
#   Best Practices: > 95
#   SEO: > 95
```

**Security Check:**
```bash
# Verify SSL/TLS
curl -s -I https://perundhu.app | grep -i secure

# Check security headers
curl -s -I https://api.perundhu.app | grep -E "X-|Content-|Strict"
```

⏱️ Time: 10 minutes

### 12:30 PM - USER ACCEPTANCE TESTING

**Test Core Features:**
- [ ] Bus location search by route
- [ ] Real-time bus tracking
- [ ] Contribution submission with images
- [ ] Admin login and approval workflow
- [ ] reCAPTCHA fraud detection
- [ ] JWT token authentication
- [ ] Mobile responsiveness

⏱️ Time: 20-30 minutes

### 01:00 PM - FINAL SIGN-OFF

**Checklist:**
- [ ] All endpoints responding with 200 OK
- [ ] No 5xx errors in logs
- [ ] Database connections healthy
- [ ] Authentication working
- [ ] reCAPTCHA tokens validating
- [ ] Frontend pages loading < 2 seconds
- [ ] Mobile site responsive
- [ ] Stakeholder approval obtained

### 01:30 PM - GO LIVE

**Make Announcement:**
```
🎉 Perundhu Bus Tracker is now LIVE!
Visit: https://perundhu.app

Thank you for using Perundhu. Your feedback helps us improve.
```

**Start Monitoring (24-hour watch):**
```bash
# Monitor in Cloud Console
# Cloud Logging: Check for errors
# Cloud Monitoring: Watch metrics
# Cloud Run Metrics: Check latency & errors
```

⏱️ Post-deployment: Continuous monitoring

---

## 🚨 TROUBLESHOOTING

### Backend won't start
```bash
# Check logs
gcloud run logs read perundhu-backend --region asia-south1 --limit=50

# Common issues:
# 1. Database connection: Verify DB_CONNECTION_NAME
# 2. JWT secret: Verify production-jwt-secret exists
# 3. reCAPTCHA: Verify recaptcha-secret-key exists
```

### Frontend not accessible
```bash
# Check deployment
gcloud run services describe perundhu-frontend --region asia-south1

# Check logs
gcloud run logs read perundhu-frontend --region asia-south1 --limit=50

# Verify CORS:
curl -H "Origin: https://perundhu.app" -I https://api.perundhu.app/api/v1/health
```

### DNS not resolving
```bash
# Verify DNS propagation
nslookup perundhu.app
nslookup api.perundhu.app

# Check registrar DNS settings
# Should point to Cloud Run load balancer IPs
```

### reCAPTCHA validation failing
```bash
# Verify site key matches frontend
gcloud secrets versions access latest --secret=recaptcha-site-key

# Verify secret key is accessible
gcloud secrets versions access latest --secret=recaptcha-secret-key --project=perundhu-prod-001
```

---

## 📊 POST-DEPLOYMENT MONITORING

### Daily (First 7 days)
- [ ] Monitor error rates (target: < 1%)
- [ ] Monitor response times (target: < 500ms)
- [ ] Check database CPU/memory
- [ ] Review user feedback
- [ ] Monitor reCAPTCHA metrics

### Weekly (First month)
- [ ] Performance analysis
- [ ] Security audit logs
- [ ] Cost analysis
- [ ] Scaling assessment
- [ ] Feature usage metrics

---

## 📞 EMERGENCY CONTACTS

**Incident Commander**: Madhavan Chandraprakasam  
**On-Call Rotation**: Set up 24-hour coverage for first week

**Escalation Path:**
1. Check logs first
2. Roll back if critical issue
3. Contact DevOps lead
4. Emergency hotline (if applicable)

---

## 🎉 SUCCESS METRICS

**Day 1:**
- ✅ Zero P1 incidents
- ✅ All health checks passing
- ✅ Error rate < 1%
- ✅ Response time < 500ms p95

**Week 1:**
- ✅ Uptime > 99.5%
- ✅ Error rate < 0.5%
- ✅ Database backups working
- ✅ No critical security issues

---

## 📚 DOCUMENTATION

**Runbooks available:**
- [PRODUCTION_DEPLOYMENT_RUNBOOK.md](./PRODUCTION_DEPLOYMENT_RUNBOOK.md) - Step-by-step procedures
- [CI_CD_DOCUMENTATION.md](./CI_CD_DOCUMENTATION.md) - Pipeline operations
- [TERRAFORM_PRODUCTION_GUIDE.md](./TERRAFORM_PRODUCTION_GUIDE.md) - Infrastructure reference

---

**Status**: Ready for Go Live  
**Last Updated**: January 5, 2026  
**Next Steps**: Start Docker, build images, deploy Friday

Good luck! 🚀
