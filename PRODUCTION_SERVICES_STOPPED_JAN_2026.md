# Production Services Stopped - Cost Savings

**Date**: January 10, 2026  
**Action**: Production services stopped to save costs  
**Project**: perundhu-prod-001

## ✅ Services Stopped

### 1. Cloud Run Service - DELETED
- **Service**: `perundhu-production-backend`
- **Region**: asia-south1
- **Status**: ✅ Deleted
- **Cost Impact**: ~$0/month (previously charged per request + always-on instances)

### 2. Cloud SQL Instance - STOPPED
- **Instance**: `perundhu-production-mysql`
- **Region**: asia-south1
- **Status**: ✅ STOPPED (activation policy: NEVER)
- **Cost Impact**: Significant savings (~$50-150/month depending on tier)
- **Note**: Storage charges still apply (~$0.17/GB/month), but no compute charges

## 💰 Estimated Cost Savings

| Resource | Before | After | Monthly Savings |
|----------|--------|-------|----------------|
| Cloud Run Backend | $5-20 | $0 | $5-20 |
| Cloud SQL Compute | $50-150 | $0 | $50-150 |
| Cloud SQL Storage | $10-30 | $10-30 | $0 (still charged) |
| **Total Estimated** | **$65-200** | **$10-30** | **$55-170/month** |

## ⚠️ Resources Still Active (Minor Costs)

### 1. Private IP Address
- **Name**: `perundhu-production-private-ip-address`
- **Type**: Global
- **Status**: RESERVED
- **Cost**: ~$0.01-0.10/month (negligible)

### 2. NAT Auto IP
- **Name**: `nat-auto-ip-33353580-8-1767645562240773`
- **Region**: asia-south1
- **Status**: IN_USE
- **Cost**: ~$1-5/month (NAT gateway charges if active)

### 3. Cloud SQL Storage
- **Note**: Even when stopped, Cloud SQL charges for disk storage
- **Cost**: ~$0.17/GB/month for SSD storage
- **Data preserved**: All data remains intact

## 🔄 How to Restart Production Services

### Restart Cloud SQL Instance
```bash
gcloud sql instances patch perundhu-production-mysql \
  --project=perundhu-prod-001 \
  --activation-policy=ALWAYS
```

### Recreate Cloud Run Service
You'll need to redeploy the backend service:
```bash
# Trigger CD pipeline for production
# Or manually deploy with:
gcloud run deploy perundhu-production-backend \
  --image=BACKEND_IMAGE_URL \
  --project=perundhu-prod-001 \
  --region=asia-south1 \
  --platform=managed
```

## 📊 Current Status Summary

### Production Project (perundhu-prod-001)
- ✅ Cloud Run: **NO SERVICES RUNNING** (deleted)
- ✅ Cloud SQL: **STOPPED** (activation policy: NEVER)
- ⚠️ Reserved IPs: 2 (minimal cost)
- ⚠️ Storage: Cloud SQL disk still allocated

### Preprod Project (astute-strategy-406601)
- ✅ Cloud Run Backend: **RUNNING** (perundhu-backend-preprod)
- ✅ Cloud Run Frontend: **RUNNING** (perundhu-frontend-preprod)
- ✅ Cloud SQL: **RUNNING** (perundhu-preprod-mysql)
- **Note**: Preprod services remain active for development/testing

## 💡 Additional Cost-Saving Options

### If you want even more savings:

#### 1. Stop Preprod Services (when not in use)
```bash
# Stop preprod Cloud SQL
gcloud sql instances patch perundhu-preprod-mysql \
  --project=astute-strategy-406601 \
  --activation-policy=NEVER

# Delete preprod Cloud Run services (can redeploy when needed)
gcloud run services delete perundhu-backend-preprod \
  --project=astute-strategy-406601 \
  --region=asia-south1 \
  --quiet

gcloud run services delete perundhu-frontend-preprod \
  --project=astute-strategy-406601 \
  --region=asia-south1 \
  --quiet
```

#### 2. Delete Unused Storage
```bash
# List all disks
gcloud compute disks list --project=perundhu-prod-001

# Delete unused Cloud SQL instance (WARNING: deletes all data!)
# gcloud sql instances delete perundhu-production-mysql --project=perundhu-prod-001
```

#### 3. Release Reserved IP Addresses
```bash
# Release the private IP (if not needed)
gcloud compute addresses delete perundhu-production-private-ip-address \
  --project=perundhu-prod-001 \
  --global
```

## 🔒 Data Safety

- ✅ **Cloud SQL Data**: Preserved even when instance is stopped
- ✅ **Container Images**: Stored in Artifact Registry (minimal cost)
- ✅ **Secrets**: Stored in Secret Manager (minimal cost)
- ✅ **Terraform State**: Preserved in GCS buckets

## 📝 Next Steps

1. **Monitor Billing**: Check GCP billing dashboard in 2-3 days to confirm cost reduction
2. **Set Budget Alerts**: Configure billing alerts if not already done
3. **Review Monthly**: Check if production is still needed to be stopped
4. **Consider**: Deleting Cloud SQL instance entirely if data is backed up and not needed

## 🛠️ Quick Commands Reference

```bash
# Check production project billing
gcloud billing accounts list
gcloud billing projects describe perundhu-prod-001

# View current month costs
gcloud alpha billing accounts projects describe perundhu-prod-001

# List all billable resources
gcloud asset search-all-resources --project=perundhu-prod-001 \
  --asset-types=compute.googleapis.com/Instance,sqladmin.googleapis.com/Instance,run.googleapis.com/Service
```

---

**Status**: ✅ Production services successfully stopped  
**Estimated Monthly Savings**: $55-170  
**Data Safety**: All data preserved  
**Restart Time**: 5-10 minutes when needed
