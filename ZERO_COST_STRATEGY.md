# Zero-Cost Strategy for Perundhu (Development Mode)

**Current Monthly Cost:** ~$60/month  
**Target Cost:** ~$0-5/month  
**Strategy:** Stop all services when not actively developing

---

## 💰 Current Cost Breakdown

| Service | Current Cost | Can Reduce To | Savings |
|---------|--------------|---------------|---------|
| **Cloud SQL** | $34.31 | $0 | $34.31 |
| **Compute Engine (VPC)** | $13.90 | $0 | $13.90 |
| **Cloud Run** | $0.11 | $0.11 | $0 |
| **Networking** | $5.12 | ~$1 | $4.12 |
| **Artifact Registry** | $4.21 | ~$1 | $3.21 |
| **Secret Manager** | $1.54 | $1.54 | $0 |
| **Others** | $0.72 | $0.72 | $0 |
| **TOTAL** | **$59.91** | **~$3-5** | **$54-56** |

**Monthly Savings: ~$55/month (92% reduction)**

---

## 🎯 Immediate Actions (Save $55/month)

### 1. Stop Cloud SQL Databases (Save $34/month)

```bash
# Stop production database
gcloud sql instances patch perundhu-prod-mysql \
  --activation-policy=NEVER \
  --project=perundhu-prod-001

# Stop preprod database  
gcloud sql instances patch perundhu-preprod-mysql \
  --activation-policy=NEVER \
  --project=astute-strategy-406601

# Verify both are stopped
gcloud sql instances list --project=perundhu-prod-001
gcloud sql instances list --project=astute-strategy-406601
```

**Impact:** Databases won't run, but data is preserved. Start when needed.

### 2. Delete VPC Connectors (Save $14/month)

```bash
# Delete production VPC connector
gcloud compute networks vpc-access connectors delete perundhu-prod-vpc-conn \
  --region=asia-south1 \
  --project=perundhu-prod-001 \
  --quiet

# Delete preprod VPC connector
gcloud compute networks vpc-access connectors delete perundhu-preprod-vpc-conn \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --quiet
```

**Impact:** Cloud Run can't connect to Cloud SQL via private IP. You'll need to:
- Enable public IP on Cloud SQL when you start it
- Update Cloud Run to use public connection

### 3. Clean Up Old Container Images (Save $3/month)

```bash
# List old images
gcloud artifacts docker images list asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu/backend \
  --sort-by=~CREATE_TIME \
  --limit=50

# Delete images older than 30 days (keep latest 5)
gcloud artifacts docker images list asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu/backend \
  --format="get(package)" \
  --filter="createTime<$(date -v-30d -u +%Y-%m-%dT%H:%M:%S)" | \
  while read image; do
    gcloud artifacts docker images delete "$image" --quiet --project=perundhu-prod-001
  done
```

### 4. Scale Cloud Run to Zero (Already Done) ✅

Your Cloud Run is already optimized at $0.11/month!

---

## 📋 When You Want to Develop

### Start Everything (Takes ~5 minutes)

```bash
#!/bin/bash
# save as: start-gcp-dev.sh

echo "🚀 Starting GCP services for development..."

# 1. Start Cloud SQL (takes 2-3 minutes)
echo "Starting Cloud SQL..."
gcloud sql instances patch perundhu-preprod-mysql \
  --activation-policy=ALWAYS \
  --project=astute-strategy-406601

# 2. Wait for database to be ready
echo "Waiting for database..."
sleep 120

# 3. Recreate VPC connector (takes 2-3 minutes)
echo "Creating VPC connector..."
gcloud compute networks vpc-access connectors create perundhu-preprod-vpc-conn \
  --region=asia-south1 \
  --network=perundhu-preprod-vpc \
  --range=10.8.0.0/28 \
  --min-instances=2 \
  --max-instances=3 \
  --machine-type=e2-micro \
  --project=astute-strategy-406601

# 4. Update Cloud Run to use VPC connector
echo "Updating Cloud Run..."
gcloud run services update perundhu-preprod-backend \
  --region=asia-south1 \
  --vpc-connector=perundhu-preprod-vpc-conn \
  --project=astute-strategy-406601

echo "✅ All services started! You can now develop."
```

### Stop Everything (Takes ~2 minutes)

```bash
#!/bin/bash
# save as: stop-gcp-dev.sh

echo "🛑 Stopping GCP services to save costs..."

# 1. Stop Cloud SQL
echo "Stopping Cloud SQL..."
gcloud sql instances patch perundhu-preprod-mysql \
  --activation-policy=NEVER \
  --project=astute-strategy-406601

# 2. Delete VPC connector
echo "Deleting VPC connector..."
gcloud compute networks vpc-access connectors delete perundhu-preprod-vpc-conn \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --quiet

echo "✅ All services stopped! Monthly cost reduced to ~$5."
```

---

## 🔧 Alternative: Use Local Development Only

**Cost:** $0/month  
**Setup Time:** 30 minutes

### 1. Stop All GCP Services

```bash
# Stop databases
gcloud sql instances patch perundhu-prod-mysql --activation-policy=NEVER --project=perundhu-prod-001
gcloud sql instances patch perundhu-preprod-mysql --activation-policy=NEVER --project=astute-strategy-406601

# Delete VPC connectors
gcloud compute networks vpc-access connectors delete perundhu-prod-vpc-conn --region=asia-south1 --project=perundhu-prod-001 --quiet
gcloud compute networks vpc-access connectors delete perundhu-preprod-vpc-conn --region=asia-south1 --project=astute-strategy-406601 --quiet

# Scale Cloud Run to 0 (already at min=0, so no action needed)
```

### 2. Use Your Existing Local Setup

You already have:
- ✅ Local MySQL running
- ✅ Backend runs via `./gradlew bootRun`
- ✅ Frontend runs via `npm run dev`
- ✅ Local data uploaded

**No GCP costs at all!**

---

## 💡 Hybrid Approach (Recommended)

**Cost:** ~$3-5/month  
**Best for:** Occasional development/testing

### Keep Running:
- ✅ Secret Manager ($1.54/month) - needed for credentials
- ✅ Cloud Run (scale to zero, $0.11/month) - only pay when accessed
- ✅ Artifact Registry (~$1/month) - store 1-2 images
- ✅ Cloud Storage ($0.07/month) - small uploads bucket

### Stop When Not Developing:
- ❌ Cloud SQL (stop when not needed)
- ❌ VPC Connector (delete when not needed)

### Your Development Workflow:

**During active development (1-2 days/week):**
```bash
# Morning: Start services
./start-gcp-dev.sh  # Takes 5 minutes, costs $1-2 for the day

# Develop all day
# Test on GCP

# Evening: Stop services  
./stop-gcp-dev.sh  # Takes 2 minutes, saves money overnight
```

**Daily cost when running:** ~$2/day  
**Days per month:** 8-10 days = $16-20/month  
**Days stopped:** 20-22 days = $0  
**Monthly total:** ~$16-20 (vs $60 now)

---

## 🚨 What Gets Deleted vs Stopped

### Stopped (Data Preserved):
- ✅ Cloud SQL databases - **data is safe**, just not running
- ✅ Cloud Run services - **code is safe**, scales to zero
- ✅ Container images - **images remain** in registry

### Deleted (Must Recreate):
- ⚠️ VPC Connector - **can recreate** in 3 minutes
- ⚠️ Old container images - **only delete old ones**, keep recent

### Never Touched:
- ✅ Source code in GitHub
- ✅ Terraform configuration
- ✅ Database backups (if enabled)

---

## 📊 Cost Comparison

| Scenario | Monthly Cost | Best For |
|----------|--------------|----------|
| **Current (always-on)** | $60 | Production with traffic |
| **Start/stop as needed** | $16-20 | Active development |
| **Local only** | $0 | Solo development |
| **Minimal GCP** | $3-5 | Occasional testing |

---

## 🎬 Quick Start Commands

### Immediate Cost Reduction (Run Now):

```bash
# This will reduce your bill to ~$5/month immediately
cd /Users/mchand69/Documents/perundhu

# Stop all databases
gcloud sql instances patch perundhu-prod-mysql --activation-policy=NEVER --project=perundhu-prod-001
gcloud sql instances patch perundhu-preprod-mysql --activation-policy=NEVER --project=astute-strategy-406601

# Delete VPC connectors (save $14/month)
gcloud compute networks vpc-access connectors delete perundhu-prod-vpc-conn --region=asia-south1 --project=perundhu-prod-001 --quiet
gcloud compute networks vpc-access connectors delete perundhu-preprod-vpc-conn --region=asia-south1 --project=astute-strategy-406601 --quiet

echo "✅ Monthly cost reduced from $60 to ~$5!"
echo "ℹ️  Use local MySQL for development"
echo "ℹ️  Start GCP services only when needed for testing"
```

---

## 🔑 Key Takeaways

1. **Cloud SQL is your biggest cost** ($34/month) - stop it when not actively using
2. **VPC Connector is $14/month** - delete it, recreate only when needed (3 minutes)
3. **Develop locally** - you already have everything set up
4. **GCP is for testing/staging only** - not for daily development
5. **Start services on-demand** - 5 minutes to start, 2 minutes to stop

**Target: $0-5/month for development, scale up only for production launch**

---

## Next Steps

**Choose your path:**

### Path A: Zero Cost (Recommended for now)
```bash
# Stop everything, develop locally only
gcloud sql instances patch perundhu-preprod-mysql --activation-policy=NEVER --project=astute-strategy-406601
# Delete VPC connector
# Use local MySQL + local backend + local frontend
# Cost: $0/month
```

### Path B: On-Demand GCP
```bash
# Create start/stop scripts
# Start services when you need to test on GCP
# Stop services every evening
# Cost: $16-20/month (only for days you use it)
```

### Path C: Production Ready
```bash
# Keep everything running 24/7
# Only when you have real users and revenue
# Cost: $60/month
```

**Recommendation:** Start with Path A (zero cost), move to Path B when you need occasional GCP testing.

---

**Created:** January 20, 2026  
**Purpose:** Reduce GCP costs to near-zero during development
