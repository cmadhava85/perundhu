# 🚀 QUICK REFERENCE CARD - PERUNDHU DEPLOYMENT

## TODAY - START DOCKER & BUILD IMAGES

```bash
# 1. Start Docker Desktop (manually or via terminal)
# 2. Run this script:
bash /Users/mchand69/Documents/perundhu/docker-build-and-push.sh

# Wait for completion (20-30 minutes)
```

**What it does:**
- ✅ Builds backend Docker image
- ✅ Pushes to asia-south1-docker.pkg.dev
- ✅ Builds frontend Docker image  
- ✅ Pushes to GCR

---

## FRIDAY 09:00 AM - DEPLOYMENT COMMANDS

### Deploy Backend (5 min)
```bash
gcloud run deploy perundhu-backend \
  --image asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu/backend:1.0.0 \
  --platform managed --region asia-south1 --project perundhu-prod-001 \
  --service-account cloud-run-sa@perundhu-prod-001.iam.gserviceaccount.com \
  --memory 2Gi --cpu 2 --max-instances 50 --no-allow-unauthenticated
```

### Deploy Frontend (5 min)
```bash
gcloud run deploy perundhu-frontend \
  --image asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu/frontend:1.0.0 \
  --platform managed --region asia-south1 --project perundhu-prod-001 \
  --allow-unauthenticated --memory 256Mi --cpu 1
```

### Configure Domains (15 min)
```bash
# Get IPs
gcloud compute addresses list --global --project=perundhu-prod-001

# Update registrar DNS for: perundhu.app & api.perundhu.app
```

### Smoke Tests (15 min)
```bash
# Backend test
curl https://api.perundhu.app/actuator/health

# Frontend test: Open https://perundhu.app in browser
```

---

## KEY FILES

- **Build Script**: `docker-build-and-push.sh`
- **Deployment Guide**: `FRIDAY_DEPLOYMENT_GUIDE.md`
- **Status Summary**: `PRODUCTION_STATUS_SUMMARY.md`

---

## INFRASTRUCTURE STATUS ✅

| Item | Status |
|------|--------|
| GCP Project (perundhu-prod-001) | ✅ Ready |
| Cloud SQL Database | ✅ Running |
| VPC Network | ✅ Configured |
| Secrets (JWT, reCAPTCHA) | ✅ Created |
| Service Accounts | ✅ Permissions Set |
| Terraform State | ✅ Bucket Ready |
| Backend Code | ✅ JAR Built |
| Docker Images | ⏳ Script Ready |

---

## FRIDAY TIMELINE

```
09:00 AM - Deploy backend (5 min)
09:05 AM - Deploy frontend (5 min)  
09:10 AM - Configure domains (15 min)
09:25 AM - Smoke tests (15 min)
10:00 AM - Go Live! 🚀
```

---

**Next Step**: Start Docker, then run: `bash docker-build-and-push.sh`
