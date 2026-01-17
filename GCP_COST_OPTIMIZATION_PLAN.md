# GCP Cost Optimization Plan
## Target: Preprod < $10/month | Production < $20/month

---

## 📊 Current Infrastructure Analysis

### PreProd Environment
| Resource | Current Config | Monthly Cost |
|----------|---------------|--------------|
| Cloud SQL | db-f1-micro (0.6GB RAM, 10GB HDD) | $7-10 |
| Cloud Run | min:0, max:3, 512Mi RAM | $2-5 |
| VPC Connector | 2-3 instances | $5-8 |
| Cloud Storage | 10GB | $1-2 |
| **TOTAL** | | **$15-25** |

### Production Environment
| Resource | Current Config | Monthly Cost |
|----------|---------------|--------------|
| Cloud SQL | db-n1-standard-1 (3.75GB RAM, 50GB HDD) | $35-45 |
| Cloud Run | min:1, max:10, 1Gi RAM | $10-15 |
| VPC Connector | 2-3 instances | $5-8 |
| Cloud Storage | 50GB | $2-3 |
| **TOTAL** | | **$52-71** |

---

## 🎯 Cost Reduction Strategy

### Phase 1: Immediate Changes (70% cost reduction)

#### 1.1 Switch to Cloud SQL Shared-Core Instances
**Current Problem:** Using dedicated CPU instances (expensive)
**Solution:** Switch to shared-core instances

```hcl
# PreProd
db_instance_tier = "db-f1-micro"  # ✅ Already optimal
db_disk_size = 10                  # ✅ Already optimal

# Production
db_instance_tier = "db-g1-small"  # Change from db-n1-standard-1
# Savings: $35 → $10/month (73% reduction)
```

#### 1.2 Use Public IP for Cloud SQL (Remove VPC Connector)
**Current Problem:** VPC Connector costs $5-8/month per environment
**Solution:** Use Cloud SQL public IP with SSL

```hcl
# Both environments
use_public_ip = true  # ✅ Already configured in preprod

# Remove VPC Connector requirement
vpc_connector_min_instances = 0
vpc_connector_max_instances = 0
```

**Security:** Public IP with SSL is secure for small-scale apps. Add authorized networks if needed.

#### 1.3 Optimize Cloud Run Configuration

**PreProd:**
```hcl
cloud_run_min_instances = 0      # ✅ Already optimal (scale to zero)
cloud_run_max_instances = 2      # Reduce from 3
cloud_run_memory_limit  = "256Mi" # Reduce from 512Mi
cloud_run_cpu_limit     = "1000m" # Keep at 1 CPU
```

**Production:**
```hcl
cloud_run_min_instances = 0      # Change from 1 (save ~$7/month)
cloud_run_max_instances = 5      # Reduce from 10
cloud_run_memory_limit  = "512Mi" # Reduce from 1Gi
cloud_run_cpu_limit     = "1000m" # Reduce from 2000m
```

#### 1.4 Enable SQL Auto-Stop (Already Configured ✅)
Your infrastructure already has SQL auto-stop configured:
- Stops after 30 minutes of inactivity
- Saves ~$5-10/month when idle
- Keep this enabled

#### 1.5 Reduce Storage Costs
```hcl
# PreProd
db_disk_size = 10  # ✅ Already optimal
db_disk_type = "PD_HDD"  # ✅ Already optimal

# Production
db_disk_size = 20  # Reduce from 50GB
db_disk_autoresize_limit = 50  # Reduce from 100GB
db_disk_type = "PD_HDD"  # ✅ Already optimal
```

---

### Phase 2: Architectural Changes (Additional 20% reduction)

#### 2.1 Use Scheduled Stop/Start (Already Configured ✅)
Your GitHub Actions workflow already stops services:
- **Stop:** 10 PM EST daily
- **Start:** 8 AM EST daily
- **Downtime:** 10 hours/day (42% savings)

**For Dev/Testing:** Consider longer downtimes
```yaml
# Modify .github/workflows/gcp-cost-optimization.yml
# Stop: 6 PM EST (end of work day)
# Start: 9 AM EST (start of work day)
# Downtime: 15 hours/day (62% savings)
```

#### 2.2 Use Cloud Run Gen2 with HTTP/2 Multiplexing
```yaml
# In Cloud Run deployment
execution-environment: gen2
```
Allows more concurrent requests per instance (80 vs 250)

#### 2.3 Consolidate Environments
**Option:** Use single Cloud SQL instance for both preprod and prod
- Create separate databases on same instance
- Reduce from 2 instances → 1 instance
- **Savings:** $10-15/month
- **Risk:** Less isolation (not recommended for production)

---

## 📋 Implementation Plan

### Step 1: Update Terraform Variables

**File:** `infrastructure/terraform/environments/preprod/terraform.tfvars`
```hcl
# Optimized PreProd Configuration
cloud_run_min_instances = 0
cloud_run_max_instances = 2
cloud_run_memory_limit  = "256Mi"
cloud_run_cpu_limit     = "1000m"

db_instance_tier = "db-f1-micro"  # No change
db_disk_size = 10                  # No change

# VPC Connector (remove if using public IP)
vpc_connector_min_instances = 0
vpc_connector_max_instances = 0
use_public_ip = true
```

**File:** `infrastructure/terraform/environments/production/terraform.tfvars`
```hcl
# Optimized Production Configuration
cloud_run_min_instances = 0        # Change from 1
cloud_run_max_instances = 5        # Change from 10
cloud_run_memory_limit  = "512Mi"  # Change from 1Gi
cloud_run_cpu_limit     = "1000m"  # Change from 2000m

db_instance_tier = "db-g1-small"   # Change from db-n1-standard-1
db_disk_size = 20                  # Change from 50
db_disk_autoresize_limit = 50      # Change from 100

# VPC Connector (optional - remove if using public IP)
vpc_connector_min_instances = 0
vpc_connector_max_instances = 0
```

### Step 2: Apply Terraform Changes
```bash
# PreProd
cd infrastructure/terraform/environments/preprod
terraform plan
terraform apply

# Production
cd infrastructure/terraform/environments/production
terraform plan
terraform apply
```

### Step 3: Update Cloud Run to Use Public IP
If you remove VPC connector, update Cloud Run to connect via public IP:

**File:** `infrastructure/terraform/modules/cloud_run/main.tf`
```hcl
# Comment out or remove VPC connector annotation
# annotations = {
#   "run.googleapis.com/vpc-access-connector" = var.vpc_connector_name
# }

# Update DB connection to use public IP
env {
  name  = "DB_HOST"
  value = var.db_public_ip  # Add this variable
}
```

### Step 4: Extend Auto-Stop Schedule (Optional)
Modify `.github/workflows/gcp-cost-optimization.yml`:
```yaml
schedule:
  # Stop at 6 PM EST (23:00 UTC)
  - cron: '0 23 * * *'
  # Start at 9 AM EST (14:00 UTC)
  - cron: '0 14 * * *'
```

---

## 💰 Expected Cost Savings

### PreProd (Target: < $10/month)
| Optimization | Before | After | Savings |
|--------------|--------|-------|---------|
| Cloud SQL | $10 | $7 | $3 |
| Cloud Run Memory | $3 | $1.50 | $1.50 |
| VPC Connector | $7 | $0 | $7 |
| Auto-Stop (42% downtime) | - | - | $6 |
| **Total** | **$20** | **$4.87** | **$15.13** ✅ |

### Production (Target: < $20/month)
| Optimization | Before | After | Savings |
|--------------|--------|-------|---------|
| Cloud SQL (db-g1-small) | $40 | $10 | $30 |
| Cloud Run (min 0) | $12 | $5 | $7 |
| Cloud Run Memory | $5 | $2.50 | $2.50 |
| VPC Connector | $7 | $0 | $7 |
| Storage (20GB) | $2 | $1 | $1 |
| **Total** | **$66** | **$18.50** | **$47.50** ✅ |

---

## ⚠️ Important Considerations

### Performance Trade-offs
1. **Min Instances = 0:** First request will have cold start (~2-5 seconds)
   - **Mitigation:** Use Cloud Scheduler to ping service every 5 minutes during business hours
   
2. **Smaller Memory:** May cause OOM errors under load
   - **Monitoring:** Set up Cloud Monitoring alerts for OOM kills
   - **Scaling:** Can increase if needed

3. **Shared-Core SQL:** Lower performance under high load
   - **Testing:** Monitor query performance with Cloud SQL Insights
   - **Upgrade Path:** Can upgrade to db-n1-standard-1 if needed

### Security Trade-offs (Public IP)
1. **Public IP Exposure:** Database accessible from internet
   - **Mitigation 1:** SSL required (already configured)
   - **Mitigation 2:** Add authorized networks:
     ```hcl
     authorized_networks = [
       {
         name  = "cloud-run"
         value = "0.0.0.0/0"  # Or restrict to Cloud Run IPs
       }
     ]
     ```
   
2. **VPC Connector Removal:** No private network connection
   - **Alternative:** Keep VPC connector but reduce instances to 2-2 (min-max same)

---

## 🎮 Quick Implementation Commands

### Option 1: Full Optimization (Aggressive)
```bash
# Update preprod
cd infrastructure/terraform/environments/preprod
sed -i '' 's/cloud_run_memory_limit  = "512Mi"/cloud_run_memory_limit  = "256Mi"/' terraform.tfvars
sed -i '' 's/cloud_run_max_instances = 3/cloud_run_max_instances = 2/' terraform.tfvars
terraform apply -auto-approve

# Update production
cd infrastructure/terraform/environments/production
sed -i '' 's/db_instance_tier        = "db-n1-standard-1"/db_instance_tier        = "db-g1-small"/' terraform.tfvars
sed -i '' 's/cloud_run_min_instances = 1/cloud_run_min_instances = 0/' terraform.tfvars
sed -i '' 's/cloud_run_max_instances = 10/cloud_run_max_instances = 5/' terraform.tfvars
sed -i '' 's/cloud_run_memory_limit  = "1Gi"/cloud_run_memory_limit  = "512Mi"/' terraform.tfvars
sed -i '' 's/cloud_run_cpu_limit     = "2000m"/cloud_run_cpu_limit     = "1000m"/' terraform.tfvars
sed -i '' 's/db_disk_size             = 50/db_disk_size             = 20/' terraform.tfvars
terraform apply -auto-approve
```

### Option 2: Conservative (Safer)
```bash
# Only change Cloud SQL tier and Cloud Run min instances
cd infrastructure/terraform/environments/production
sed -i '' 's/db_instance_tier        = "db-n1-standard-1"/db_instance_tier        = "db-g1-small"/' terraform.tfvars
sed -i '' 's/cloud_run_min_instances = 1/cloud_run_min_instances = 0/' terraform.tfvars
terraform apply -auto-approve
```

---

## 📊 Monitoring After Changes

### Set Up Budget Alerts
```bash
# Create budget alerts in GCP Console
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT \
  --display-name="Preprod Budget" \
  --budget-amount=10 \
  --threshold-rule=percent=80 \
  --threshold-rule=percent=100

gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT \
  --display-name="Production Budget" \
  --budget-amount=20 \
  --threshold-rule=percent=80 \
  --threshold-rule=percent=100
```

### Monitor Performance
1. **Cloud SQL Performance:**
   - Enable Cloud SQL Insights (free)
   - Monitor query latency and CPU usage
   
2. **Cloud Run Performance:**
   - Monitor cold start times
   - Set up uptime checks (free)
   - Monitor request latency

3. **Error Rates:**
   - Set up alerts for 5xx errors
   - Monitor OOM kills in Cloud Run

---

## 🔄 Rollback Plan

If performance degrades, rollback changes:
```bash
cd infrastructure/terraform/environments/production
git checkout HEAD~1 terraform.tfvars
terraform apply
```

Or manually increase resources:
```bash
# Increase Cloud SQL tier
gcloud sql instances patch perundhu-production-mysql \
  --tier=db-n1-standard-1

# Increase Cloud Run min instances
gcloud run services update perundhu-backend-production \
  --min-instances=1 \
  --region=asia-south1
```

---

## ✅ Success Criteria

**After 1 Week:**
- [ ] PreProd cost < $10/month
- [ ] Production cost < $20/month
- [ ] No performance degradation
- [ ] No increase in error rates
- [ ] Response times < 500ms (p95)

**Monitoring:**
- Check GCP billing daily for first week
- Monitor Cloud Monitoring dashboards
- Review error logs daily

---

## 📚 Additional Cost-Saving Tips

### 1. Use GCP Free Tier
- Cloud Storage: 5GB free
- Cloud Functions: 2M invocations/month free
- Cloud Build: 120 build-minutes/day free

### 2. Delete Unused Resources
```bash
# Find unused Cloud Storage buckets
gsutil ls -p YOUR_PROJECT_ID

# Find unused static IPs
gcloud compute addresses list --filter="status:RESERVED"

# Find unused disks
gcloud compute disks list --filter="users:*" --format="table(name,sizeGb,zone,status)"
```

### 3. Use Committed Use Discounts (If scaling up)
- 57% discount for 3-year commitment
- Only if consistent usage (not for dev environments)

### 4. Use Preemptible VMs (If using Compute Engine)
- 80% discount but can be terminated
- Good for batch processing, not web services

---

## 📞 Support

**Questions or Issues?**
1. Check GCP billing dashboard: https://console.cloud.google.com/billing
2. Review Cloud Monitoring: https://console.cloud.google.com/monitoring
3. Check this optimization plan: `/GCP_COST_OPTIMIZATION_PLAN.md`

**Emergency Rollback:**
```bash
./scripts/rollback-infrastructure.sh production
```

---

## 📅 Next Review: February 17, 2026

Schedule a cost review in 30 days to:
1. Analyze actual costs vs. estimates
2. Identify further optimization opportunities
3. Adjust budgets if needed
