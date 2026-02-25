# Production Infrastructure Cost Optimization Report
**Date:** February 23, 2026  
**Analysis Scope:** GCP Production Infrastructure for Perundhu

---

## 📊 CURRENT INFRASTRUCTURE OVERVIEW

### Cloud SQL (Database)
| Component | Current Configuration | Monthly Cost (Estimate) |
|-----------|----------------------|-------------------------|
| **Instance Type** | db-f1-micro (0.6GB RAM, shared vCPU) | ~$7.67/month |
| **Availability** | ZONAL (no HA replica) | Included |
| **Disk** | 10GB PD_HDD | ~$0.40/month |
| **Backups** | 7 days retention, binary logs enabled | ~$0.20/month |
| **Pricing Model** | PER_USE (always-on in practice) | $0.0106/hour |
| **Read Replica** | NOT ENABLED | $0 (configured but disabled) |

**Total Cloud SQL**: ~$8-9/month

### Cloud Run Services

#### Backend Service
| Configuration | Value | Cost Impact |
|---------------|-------|-------------|
| **CPU** | 2 cores | $0.00002400/vCPU-second |
| **Memory** | 2Gi | $0.00000250/GiB-second |
| **Min Instances** | 0 (scale to zero) ✅ | No idle cost |
| **Max Instances** | 5 | Limits burst costs |
| **CPU Throttling** | Enabled ✅ | Only charges for active CPU |
| **Startup CPU Boost** | Enabled | 2x CPU during startup |

**Estimated**: $5-15/month (depends on traffic)

#### Frontend Service
| Configuration | Value | Cost Impact |
|---------------|-------|-------------|
| **CPU** | 1 core | $0.00002400/vCPU-second |
| **Memory** | 512Mi | $0.00000250/GiB-second |
| **Min Instances** | 0 (scale to zero) ✅ | No idle cost |
| **Max Instances** | 20 | Allows traffic bursts |

**Estimated**: $3-10/month (depends on traffic)

### Load Balancer
| Component | Cost |
|-----------|------|
| **HTTP(S) Load Balancer** | $18.26/month (base) + traffic |
| **Forwarding Rules** | 2 rules × $18.26 = ~$36.52/month |
| **Data Processing** | $0.008/GB (first 10TB) |

**Estimated**: $40-50/month

### Other Services
| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **Static IP (NAT)** | 1 address (IN_USE) | ~$3/month |
| **Container Registry** | asia-south1-docker.pkg.dev | Storage + egress |
| **Secret Manager** | ~10 secrets, 5 active versions | ~$0.30/month |
| **Cloud Logging** | Standard tier | Free tier likely sufficient |
| **Cloud Functions** | NONE | $0 |
| **Compute Instances** | NONE | $0 |

---

## 💰 TOTAL ESTIMATED MONTHLY COST: $60-85

### Cost Breakdown:
- **Cloud SQL**: $8-9 (11%)
- **Load Balancer**: $40-50 (60%)
- **Cloud Run Backend**: $5-15 (10%)
- **Cloud Run Frontend**: $3-10 (8%)
- **Other**: $4-6 (6%)
- **Egress & Storage**: $2-5 (5%)

**Largest Cost Driver: Load Balancer (60% of costs)**

---

## 🎯 IMMEDIATE COST OPTIMIZATIONS (Quick Wins)

### 1. ✅ REDUCE HIKARICP CONNECTION POOL SIZE
**Current Issue**: Pool size too large for db-f1-micro

**Current Configuration:**
```properties
spring.datasource.hikari.maximum-pool-size=50  # Per backend instance
spring.datasource.hikari.minimum-idle=10       # Per backend instance
```

**Problem**: With 5 max Cloud Run instances × 50 connections = **250 potential connections**
- db-f1-micro recommended max: 50-100 total connections
- Risk of connection exhaustion and OOM errors

**✅ RECOMMENDED CHANGE:**
```properties
# For db-f1-micro with Cloud Run (0-5 instances)
spring.datasource.hikari.maximum-pool-size=10  # Was 50
spring.datasource.hikari.minimum-idle=2         # Was 10
```

**Calculation:**
- 5 instances × 10 connections = 50 total (within db-f1-micro limits)
- Each instance uses 2-10 connections based on load
- Leaves headroom for connection spikes

**Savings**: Prevents potential database instance upgrade ($7/month → $15/month avoided)  
**File**: `backend/app/src/main/resources/application-production.properties`

---

### 2. ✅ OPTIMIZE BACKEND CLOUD RUN RESOURCES
**Current**: 2 CPU, 2Gi memory  
**Analysis**: Likely over-provisioned for early-stage traffic

**✅ RECOMMENDED CHANGE:**
```bash
gcloud run services update perundhu-production-backend \
  --region asia-south1 \
  --cpu 1 \
  --memory 1Gi
```

**Rationale:**
- Java 21 with Virtual Threads doesn't need 2 CPUs for low traffic
- 1Gi memory sufficient for Spring Boot with db-f1-micro connection pool
- Can scale back up if CPU usage > 70%

**Savings**: ~40% reduction in Cloud Run costs = **$2-6/month**

---

### 3. ✅ REDUCE FRONTEND CLOUD RUN MAX INSTANCES
**Current**: max-scale=20  
**Analysis**: Excessive for early-stage traffic

**✅ RECOMMENDED CHANGE:**
```bash
gcloud run services update perundhu-production-frontend \
  --region asia-south1 \
  --max-instances 10  # Was 20
```

**Rationale:**
- Nginx frontend is lightweight
- 10 instances can handle 1000-5000 concurrent users
- Prevents runaway costs during traffic spikes or attacks

**Savings**: Caps burst costs = **$5-10/month** saved during spikes

---

### 4. ✅ REDUCE CLOUD SQL BACKUP RETENTION
**Current**: 7 days backup retention, 7 days transaction logs  
**Recommendation**: Consider 3-day retention for early stage

**✅ OPTIONAL CHANGE:**
```bash
gcloud sql instances patch perundhu-production-mysql \
  --backup-retention-count=3 \
  --transaction-log-retention-days=3
```

**Rationale:**
- 3 days sufficient for disaster recovery in early stage
- Can increase as business grows
- Transaction logs used for point-in-time recovery

**Savings**: ~$0.10-0.20/month (minimal but safe change)

---

### 5. ⚠️ CONSIDER DISABLING BINARY LOGS
**Current**: Binary logs enabled (needed for replication)  
**Read Replica**: Disabled (not being used)

**✅ IF NO REPLICA PLANNED:**
```bash
gcloud sql instances patch perundhu-production-mysql \
  --no-enable-bin-log
```

**Rationale:**
- Binary logs only needed for read replicas
- Currently not using read replica (READ_REPLICA_ENABLED=false)
- Saves storage and I/O overhead

**⚠️ WARNING**: Only disable if:
- You don't plan to use read replicas
- You're okay with backup-only recovery (no point-in-time recovery)

**Savings**: ~$0.20-0.50/month + reduced I/O costs

---

## 🔍 MEDIUM-TERM OPTIMIZATIONS (Next 30-90 Days)

### 6. 🎯 OPTIMIZE LOAD BALANCER ARCHITECTURE

**Current Cost**: $40-50/month (60% of total infrastructure cost)

**Problem**: Using HTTP(S) Load Balancer when Cloud Run has built-in routing

**Option A: Use Cloud Run Domain Mapping (RECOMMENDED for Early Stage)**
```bash
# Map custom domains directly to Cloud Run services
gcloud run domain-mappings create \
  --service perundhu-production-frontend \
  --domain perundhu.com

gcloud run domain-mappings create \
  --service perundhu-production-backend \
  --domain api.perundhu.com
```

**Pros:**
- **Zero load balancer cost** ($40-50/month saved)
- Automatic SSL certificates
- Built-in CDN capabilities
- Simpler architecture

**Cons:**
- No advanced routing (URL rewrite, header manipulation)
- No shared IP for frontend + backend
- Harder to implement API gateway patterns

**Savings**: **$40-50/month (50-70% total cost reduction)**

---

**Option B: Keep Load Balancer for Advanced Features**

If you need:
- URL path rewriting (e.g., `/api` → backend)
- Shared SSL termination
- Cloud Armor (DDoS protection, WAF)
- Advanced routing rules

**Then**: Keep load balancer but optimize it:
- Use Cloud CDN for static content
- Enable Cloud Armor only if needed
- Monitor data processing costs

---

### 7. 💾 AUTO-STOP CLOUD SQL DURING IDLE HOURS

**Concept**: Stop database during low-traffic hours (e.g., 2am-6am IST)

**Implementation**: Cloud Scheduler + Cloud Function
```bash
# Stop database at 2am
gcloud scheduler jobs create http stop-db-2am \
  --schedule="0 2 * * *" \
  --uri="https://sqladmin.googleapis.com/sql/v1beta4/projects/perundhu-prod-001/instances/perundhu-production-mysql/stop" \
  --http-method=POST

# Start database at 6am
gcloud scheduler jobs create http start-db-6am \
  --schedule="0 6 * * *" \
  --uri="https://sqladmin.googleapis.com/sql/v1beta4/projects/perundhu-prod-001/instances/perundhu-production-mysql/start" \
  --http-method=POST
```

**⚠️ CAUTION**:
- Only for non-24/7 services
- Causes ~1-2 minute startup delay
- Not recommended if traffic is global

**Savings**: 4 hours/day × 30 days = ~17% = **$1-2/month**

---

### 8. 📉 CLOUD SQL DISK AUTO-RESIZE
**Current**: 10GB PD_HDD  
**Risk**: Manual resizing if data grows

**✅ ENABLE AUTO-INCREASE:**
```bash
gcloud sql instances patch perundhu-production-mysql \
  --storage-auto-increase \
  --storage-auto-increase-limit=20
```

**Benefit**: Prevents outages, caps at 20GB

---

## 🚀 LONG-TERM OPTIMIZATIONS (3-6 Months)

### 9. 🔄 MIGRATE TO CLOUD SQL SHARED-CORE INSTANCE
**Current**: db-f1-micro (0.6GB RAM)  
**Alternative**: Use Cloud SQL on-demand pricing

**If traffic remains low (<1000 users/day):**
- Consider keeping db-f1-micro
- It's already the cheapest option

**If traffic grows (>1000 users/day):**
- Upgrade to db-g1-small (1.7GB RAM, $15/month)
- Or db-n1-standard-1 (3.75GB RAM, $46/month)

---

### 10. 📊 IMPLEMENT CLOUD SQL CONNECTION POOLER
**Concept**: PgBouncer/ProxySQL for connection management

**Benefits:**
- Reduces database connections
- Better connection reuse
- Can stay on db-f1-micro longer

**Complexity**: Requires additional container in Cloud Run

---

### 11. ☁️ EVALUATE CLOUD RUN JOBS FOR BACKGROUND TASKS
**If you have**:
- Scheduled data processing
- Batch jobs
- Report generation

**Use Cloud Run Jobs** instead of always-on services:
```bash
gcloud run jobs create job-name \
  --image=image \
  --execute-now
```

**Savings**: Only pay for job execution time

---

## 📋 RECOMMENDED IMPLEMENTATION CHECKLIST

### Phase 1: Immediate (This Week) - Estimated Savings: $8-15/month
- [ ] 1. Reduce HikariCP pool size (10 max, 2 min idle)
- [ ] 2. Reduce backend Cloud Run resources (1 CPU, 1Gi memory)
- [ ] 3. Reduce frontend max instances (10 max)
- [ ] 4. Set Cloud SQL backup retention to 3 days
- [ ] 5. Review if binary logs needed (disable if no replica planned)

### Phase 2: Next Month - Estimated Savings: $40-50/month
- [ ] 6. Evaluate moving to Cloud Run domain mapping (remove load balancer)
- [ ] 7. Enable Cloud CDN if keeping load balancer
- [ ] 8. Set up database usage monitoring

### Phase 3: In 3 Months - Estimated Savings: Variable
- [ ] 9. Monitor and optimize based on actual traffic patterns
- [ ] 10. Consider read replica if traffic > 5000 requests/day
- [ ] 11. Evaluate database tier upgrade if needed

---

## 🎯 QUICK START: APPLY IMMEDIATE OPTIMIZATIONS

### Step 1: Update HikariCP Configuration
```properties
# Edit: backend/app/src/main/resources/application-production.properties

# Primary datasource connection pool (OPTIMIZED FOR db-f1-micro)
spring.datasource.hikari.maximum-pool-size=10  # Changed from 50
spring.datasource.hikari.minimum-idle=2         # Changed from 10
spring.datasource.hikari.connection-timeout=20000  # Reduced from 30000

# Replica datasource connection pool (if enabled)
spring.datasource.replica.hikari.maximum-pool-size=8   # Changed from 30
spring.datasource.replica.hikari.minimum-idle=1        # Changed from 5
```

### Step 2: Update Backend Cloud Run Resources
```bash
gcloud run services update perundhu-production-backend \
  --region asia-south1 \
  --cpu 1 \
  --memory 1Gi
```

### Step 3: Update Frontend Cloud Run Max Instances
```bash
gcloud run services update perundhu-production-frontend \
  --region asia-south1 \
  --max-instances 10
```

### Step 4: Optimize Cloud SQL Backups
```bash
gcloud sql instances patch perundhu-production-mysql \
  --backup-retention-count=3 \
  --transaction-log-retention-days=3
```

### Step 5: (Optional) Disable Binary Logs if No Replica
```bash
# ONLY if you don't plan to use read replicas
gcloud sql instances patch perundhu-production-mysql \
  --no-enable-bin-log
```

---

## 📊 PROJECTED SAVINGS AFTER OPTIMIZATIONS

### Conservative Estimate:
| Optimization | Monthly Savings |
|--------------|-----------------|
| HikariCP Pool Reduction | $1-2 (prevents upgrade) |
| Backend Resource Reduction | $2-6 |
| Frontend Max Instance Cap | $2-4 |
| Backup Retention Reduction | $0.20 |
| Binary Log Disable | $0.50 |
| **Total (Phase 1)** | **$6-13/month** |

### With Load Balancer Removal (Phase 2):
| Total Savings | **$46-63/month (50-70%)** |
|---------------|---------------------------|
| New Monthly Cost | **$22-39/month** |

---

## 🔍 MONITORING RECOMMENDATIONS

### Set Up Budget Alerts
```bash
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Perundhu Production Budget" \
  --budget-amount=50 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

### Monitor Key Metrics:
1. **Cloud SQL**:
   - Active connections (should be < 50)
   - CPU utilization (should be < 80%)
   - Storage usage (with auto-increase enabled)

2. **Cloud Run**:
   - Instance count (backend should rarely hit 5)
   - CPU utilization per instance
   - Memory usage per instance

3. **Load Balancer**:
   - Data processing costs
   - Request count vs cost

### Use Cost Breakdown Reports:
```bash
gcloud billing accounts list
gcloud billing account-budgets list --billing-account=ACCOUNT_ID
```

---

## ⚠️ IMPORTANT CAVEATS

### DO NOT OPTIMIZE:
1. **Security**: Don't reduce security features to save costs
2. **Reliability**: Don't risk downtime for minimal savings
3. **Backup Strategy**: Always maintain adequate backup retention

### MONITOR AFTER CHANGES:
1. Check Cloud SQL connection count (should be < 50 total)
2. Watch backend response times (should be < 500ms p95)
3. Monitor error rates (should be < 0.1%)

### ROLLBACK PLAN:
If issues occur after optimizations:
```bash
# Restore backend resources
gcloud run services update perundhu-production-backend \
  --region asia-south1 \
  --cpu 2 \
  --memory 2Gi

# Restore HikariCP settings
# Edit application-production.properties with original values
# Redeploy backend
```

---

## 📈 COST PROJECTION BY TRAFFIC TIER

### Current (0-100 users/day): $60-85/month
**Optimized**: $22-39/month (-65%)

### Growing (100-1000 users/day): $80-120/month
**Optimized**: $40-70/month (-50%)

### Scaled (1000-5000 users/day): $150-250/month
**Recommendations**:
- Upgrade to db-g1-small ($15/month)
- Keep backend at 1 CPU, 1Gi (scale horizontally)
- Enable read replica if write latency issues
- Keep frontend max instances at 10-20

### Large Scale (5000+ users/day): $300-500/month
**Recommendations**:
- Upgrade to db-n1-standard-1 ($46/month)
- Enable read replica ($46/month)
- Increase backend to 2 CPU, 2Gi
- Consider Cloud CDN for static content
- Implement caching (Redis/Memorystore)

---

## 🎉 CONCLUSION

**Your infrastructure is already well-optimized for early stage!**

**Top Recommendations:**
1. ✅ **Reduce HikariCP pool size** (critical for db-f1-micro stability)
2. ✅ **Right-size Cloud Run backend** (1 CPU, 1Gi sufficient for now)
3. ✅ **Cap frontend max instances** (prevent runaway costs)
4. 🎯 **Remove load balancer** (saves 60% of costs if advanced routing not needed)

**Total Potential Savings**: **$46-63/month (50-70%)**  
**New Monthly Cost**: **$22-39/month** (from $60-85)

**Next Steps:**
1. Apply Phase 1 optimizations (HikariCP, Cloud Run resources)
2. Monitor for 1 week
3. Evaluate load balancer necessity
4. Scale resources based on actual traffic patterns

---

**Report Generated:** February 23, 2026  
**Review Date:** March 23, 2026 (reassess based on traffic growth)
