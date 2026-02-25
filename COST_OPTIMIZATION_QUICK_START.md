# 🎯 Production Cost Optimization - Quick Start Guide

**Current Monthly Cost**: $60-85  
**Optimized Monthly Cost**: $22-39 (with all changes)  
**Immediate Savings (Phase 1)**: $8-15/month

---

## ⚡ CRITICAL ISSUE IDENTIFIED

### HikariCP Connection Pool Too Large for db-f1-micro

**Problem**: Your current configuration allows up to **250 database connections** (5 Cloud Run instances × 50 connections/instance), but your `db-f1-micro` instance can only handle **50-100 connections** safely.

**Risk**: Database crashes, connection exhaustion, forced instance upgrade

**✅ FIXED**: Connection pool reduced to 10 per instance (50 total max)

---

## 🚀 APPLY OPTIMIZATIONS NOW

### Option 1: Automated Script (Recommended)
```bash
cd /Users/mchand69/Documents/perundhu
./scripts/optimize-production-costs.sh
```

This will:
- ✅ Reduce backend CPU (2 → 1) and memory (2Gi → 1Gi)
- ✅ Cap frontend max instances (20 → 10)
- ✅ Reduce Cloud SQL backup retention (7 → 3 days)
- ⚠️ Requires backend rebuild for HikariCP changes

---

### Option 2: Manual Steps

#### Step 1: Update Backend Cloud Run
```bash
gcloud run services update perundhu-production-backend \
  --region asia-south1 \
  --cpu 1 \
  --memory 1Gi
```
**Savings**: $2-6/month

---

#### Step 2: Cap Frontend Max Instances
```bash
gcloud run services update perundhu-production-frontend \
  --region asia-south1 \
  --max-instances 10
```
**Savings**: $2-4/month (prevents burst spikes)

---

#### Step 3: Optimize Cloud SQL Backups
```bash
gcloud sql instances patch perundhu-production-mysql \
  --backup-retention-count=3 \
  --transaction-log-retention-days=3
```
**Savings**: $0.20/month

---

#### Step 4: Rebuild Backend with New HikariCP Settings
**⚠️ IMPORTANT**: HikariCP pool size already updated in code

```bash
cd backend

# Build for AMD64 (Cloud Run compatible)
docker build --platform linux/amd64 \
  -t asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu-images/backend:1.0.3 \
  -t asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu-images/backend:latest .

# Push to registry
docker push asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu-images/backend:1.0.3
docker push asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu-images/backend:latest

# Deploy to Cloud Run
gcloud run services update perundhu-production-backend \
  --region asia-south1 \
  --image asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu-images/backend:1.0.3
```

**Savings**: Prevents database upgrade ($7 → $15/month avoided)

---

## 📊 WHAT CHANGED IN CODE

### [application-production.properties](backend/app/src/main/resources/application-production.properties)

**Before:**
```properties
spring.datasource.hikari.maximum-pool-size=50
spring.datasource.hikari.minimum-idle=10
spring.datasource.hikari.connection-timeout=30000

spring.datasource.replica.hikari.maximum-pool-size=30
spring.datasource.replica.hikari.minimum-idle=5
```

**After (✅ Already Updated):**
```properties
spring.datasource.hikari.maximum-pool-size=10  # 5 instances × 10 = 50 total
spring.datasource.hikari.minimum-idle=2         # Reduced idle connections
spring.datasource.hikari.connection-timeout=20000

spring.datasource.replica.hikari.maximum-pool-size=8   # For future replica
spring.datasource.replica.hikari.minimum-idle=1
```

---

## 🎯 LARGEST COST SAVINGS (Phase 2)

### Remove Load Balancer: Save $40-50/month (60% of costs)

**Current**: Using HTTP(S) Load Balancer ($40-50/month)  
**Alternative**: Cloud Run domain mappings (built-in, free)

**If you don't need:**
- URL path rewriting
- Shared IP for frontend + backend
- Cloud Armor (DDoS/WAF)

**Then migrate to direct domain mapping:**
```bash
# Map perundhu.com directly to frontend
gcloud run domain-mappings create \
  --service perundhu-production-frontend \
  --domain perundhu.com

# Map api.perundhu.com directly to backend
gcloud run domain-mappings create \
  --service perundhu-production-backend \
  --domain api.perundhu.com
```

**Update DNS:**
- Delete A records pointing to load balancer IP
- Add CNAME records pointing to Cloud Run URLs

**Savings**: $40-50/month (evaluate in 30 days)

---

## 📈 MONITORING CHECKLIST

After applying optimizations, monitor for **1 week**:

### Cloud SQL Health
```bash
# Check active connections (should be < 50)
gcloud sql operations list --instance=perundhu-production-mysql --limit=10

# Check CPU/memory usage in Cloud Console
# Navigate to: SQL → perundhu-production-mysql → Monitoring
```

**✅ Expected**: 10-30 active connections  
**⚠️ Warning**: >50 connections consistently  
**❌ Critical**: Connection errors in logs

---

### Backend Performance
```bash
# Check backend logs for errors
gcloud run logs read perundhu-production-backend \
  --region asia-south1 \
  --limit=50

# Check metrics in Cloud Console
# Navigate to: Cloud Run → perundhu-production-backend → Metrics
```

**✅ Expected**: 
- Response time < 500ms (p95)
- Error rate < 0.1%
- CPU < 70%, Memory < 80%

**⚠️ Warning**: 
- Response time > 1000ms
- CPU > 80% sustained
- Memory > 90%

**❌ Rollback if**:
- Error rate > 1%
- Frequent 503/504 errors
- Database connection failures

---

### Frontend Performance
```bash
# Check frontend metrics
# Navigate to: Cloud Run → perundhu-production-frontend → Metrics
```

**✅ Expected**:
- <10 instances during normal traffic
- Quick scale-up during traffic spikes

---

## 🔄 ROLLBACK COMMANDS

If you experience issues after optimization:

```bash
# Restore backend resources
gcloud run services update perundhu-production-backend \
  --region asia-south1 \
  --cpu 2 \
  --memory 2Gi

# Restore frontend max instances
gcloud run services update perundhu-production-frontend \
  --region asia-south1 \
  --max-instances 20

# Restore Cloud SQL backups
gcloud sql instances patch perundhu-production-mysql \
  --backup-retention-count=7 \
  --transaction-log-retention-days=7

# Revert HikariCP settings in application-production.properties
# Then rebuild and redeploy backend
```

---

## 💡 OPTIONAL OPTIMIZATIONS

### Disable Binary Logs (if no read replica planned)
```bash
gcloud sql instances patch perundhu-production-mysql \
  --no-enable-bin-log
```

**⚠️ WARNING**: Removes point-in-time recovery  
**Savings**: $0.50/month + reduced I/O  
**Only do if**: You're okay with backup-only recovery

---

### Set Up Budget Alerts
```bash
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT_ID \
  --display-name="Perundhu Production Budget" \
  --budget-amount=50 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

---

## 📚 REFERENCE DOCUMENTS

1. **Full Report**: [PRODUCTION_COST_OPTIMIZATION_REPORT.md](PRODUCTION_COST_OPTIMIZATION_REPORT.md)
   - Detailed analysis and long-term strategies
   - Cost breakdown by service
   - Scaling recommendations

2. **Optimization Script**: [scripts/optimize-production-costs.sh](scripts/optimize-production-costs.sh)
   - Automated application of changes
   - Includes monitoring and rollback commands

3. **Configuration Changes**: [backend/app/src/main/resources/application-production.properties](backend/app/src/main/resources/application-production.properties)
   - HikariCP pool sizes updated
   - Connection timeouts optimized

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Run optimization script OR apply manual steps
- [ ] Rebuild backend with new HikariCP settings (v1.0.3)
- [ ] Deploy backend v1.0.3 to Cloud Run
- [ ] Monitor for 1 week (Cloud SQL connections, response times, errors)
- [ ] Review Phase 2 optimization (load balancer removal)
- [ ] Set up budget alerts
- [ ] Schedule monthly cost review

---

## 🎉 EXPECTED RESULTS

**After Phase 1 (Immediate)**:
- Monthly cost: $52-70 (from $60-85)
- Database connections: 10-30 active (safe range)
- Backend response time: <500ms
- Zero connection exhaustion errors

**After Phase 2 (Load Balancer Removal)**:
- Monthly cost: $22-39 (65% reduction)
- Simpler architecture
- Still highly available and scalable

---

**Questions or Issues?**  
Review the full report or check monitoring dashboards in Cloud Console.

**Last Updated**: February 23, 2026
