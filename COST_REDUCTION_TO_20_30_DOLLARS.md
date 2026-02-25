# Cost Reduction Plan: $20-30/Month Target

**Current Cost**: $41.50-55.50/month  
**Target Cost**: $20-30/month  
**Additional Savings Needed**: $11.50-35.50/month  
**Date**: February 23, 2026

---

## 📊 Current Cost Breakdown

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| Cloud SQL (db-f1-micro) | $8-9 | Already at minimum tier |
| Backend Cloud Run | $3-5 | 0-5 instances, 1 CPU, 1Gi |
| Frontend Cloud Run | $3-5 | 0-10 instances, 1 CPU, 512Mi |
| **HTTP(S) Load Balancer** | **$18-25** | **Biggest fixed cost** |
| Cloud CDN | $3-8 (offset) | Reduces Cloud Run costs |
| Cloud Storage | $1 | Images bucket |
| Artifact Registry | $1-2 | Container images |
| Networking/Misc | $2-3 | VPC, etc. |
| **Total** | **$41.50-55.50** | |

---

## 🎯 Three Options to Reach $20-30/Month

---

## ⭐ **Option 1: Remove Load Balancer (RECOMMENDED)**

**Savings: $18-25/month**  
**Target Cost: $23.50-30.50/month** ✅

### How It Works:

Instead of using a load balancer with custom domain, use **Cloud Run's built-in custom domain mapping**:

- **Frontend**: `www.perundhu.com` → Cloud Run frontend service
- **Backend**: `api.perundhu.com` → Cloud Run backend service

Both services get automatic HTTPS via Google-managed certificates.

### Current Setup:
```
perundhu.com (via Load Balancer IP 34.36.97.68)
    ├── perundhu.com/* → Frontend Cloud Run
    └── api.perundhu.com/* → Backend Cloud Run
```

### New Setup (No Load Balancer):
```
www.perundhu.com → Frontend Cloud Run (direct domain mapping)
api.perundhu.com → Backend Cloud Run (direct domain mapping)
```

### Cloud Run URLs:
- Frontend: `https://perundhu-production-frontend-gu2tgq6lwq-el.a.run.app`
- Backend: `https://perundhu-production-backend-gu2tgq6lwq-el.a.run.app`

### Pros:
- ✅ **Saves $18-25/month** (55% of target savings)
- ✅ Still have custom domains (www.perundhu.com, api.perundhu.com)
- ✅ Still have HTTPS (Google-managed certificates)
- ✅ Cloud Run domain mapping is FREE
- ✅ Simpler architecture, less to manage
- ✅ Cloud CDN can still be used (via Cloud Run)

### Cons:
- ⚠️ Lose global load balancing (but your traffic is India-focused)
- ⚠️ Lose advanced routing features (but you only have 2 services)
- ⚠️ DNS TTLs matter more (harder to switch backends quickly)
- ⚠️ Each service needs separate domain mapping

### Implementation Steps:

1. **Add Cloud Run domain mappings:**
   ```bash
   # Map www.perundhu.com to frontend
   gcloud run domain-mappings create \
     --service=perundhu-production-frontend \
     --domain=www.perundhu.com \
     --region=asia-south1 \
     --project=perundhu-prod-001
   
   # Map api.perundhu.com to backend
   gcloud run domain-mappings create \
     --service=perundhu-production-backend \
     --domain=api.perundhu.com \
     --region=asia-south1 \
     --project=perundhu-prod-001
   ```

2. **Update DNS records:**
   ```bash
   # Delete old A records
   gcloud dns record-sets delete www.perundhu.com. --type=A --zone=perundhu-com
   gcloud dns record-sets delete api.perundhu.com. --type=A --zone=perundhu-com
   
   # Add CNAME records (Cloud Run provides the target)
   # You'll get the CNAME target from domain mapping status
   gcloud run domain-mappings describe --domain=www.perundhu.com --region=asia-south1
   gcloud run domain-mappings describe --domain=api.perundhu.com --region=asia-south1
   ```

3. **Wait for SSL provisioning** (10-30 minutes)

4. **Test domains:**
   ```bash
   curl https://www.perundhu.com
   curl https://api.perundhu.com/v1/health
   ```

5. **Delete load balancer:**
   ```bash
   # Delete forwarding rules
   gcloud compute forwarding-rules delete perundhu-https-rule --global
   gcloud compute forwarding-rules delete perundhu-http-rule --global
   
   # Delete target proxies
   gcloud compute target-https-proxies delete perundhu-https-proxy --global
   gcloud compute target-http-proxies delete perundhu-http-proxy --global
   
   # Delete URL map
   gcloud compute url-maps delete perundhu-frontend-lb --global
   
   # Delete backend services
   gcloud compute backend-services delete perundhu-frontend-backend --global
   gcloud compute backend-services delete perundhu-backend-backend --global
   
   # Delete SSL certificates (keep active ones, delete unused)
   gcloud compute ssl-certificates delete perundhu-ssl-cert --global
   gcloud compute ssl-certificates delete perundhu-api-ssl-cert --global
   
   # Release static IP (optional - keeps $0.01/hour = $7/month)
   gcloud compute addresses delete perundhu-frontend-ip --global
   ```

6. **Update frontend environment** (if hardcoded):
   - Already using `api.perundhu.com` ✅

---

## 💡 **Option 2: Keep Load Balancer, Reduce Everything Else**

**Savings: $8-15/month**  
**Target Cost: $26.50-47.50/month** ⚠️ (doesn't quite hit target)

### Changes:

1. **Reduce Backend Cloud Run further:**
   - Max instances: 5 → 3 (saves $1-2/month)
   - CPU: 1 → 0.5 vCPU (saves $1-2/month, but may impact performance)

2. **Reduce Frontend Cloud Run further:**
   - Max instances: 10 → 5 (saves $2-3/month)
   - CPU: 1 → 0.5 vCPU (saves $1-2/month)

3. **Stop database during off-hours** (risky for production):
   - Use Cloud Scheduler to stop DB at night (11 PM - 6 AM IST)
   - Saves ~30% of DB cost = $2-3/month
   - **Risk**: Users can't access app during stopped hours

4. **Reduce SQL disk size:**
   - 10GB → 10GB (already at minimum)

5. **Delete unused buckets/resources:**
   - Review Cloud Storage buckets
   - Clean up old Artifact Registry images more aggressively

### Pros:
- ✅ Keep custom domain setup
- ✅ Keep load balancer benefits

### Cons:
- ❌ **Doesn't reach $20-30/month target**
- ❌ Performance degradation (CPU reduction)
- ❌ Risky database stopping in production

---

## 🚀 **Option 3: Hybrid - Remove LB + Further Optimizations**

**Savings: $20-30/month**  
**Target Cost: $15-25/month** ✅✅ (exceeds target!)

Combine Option 1 (remove LB) with additional optimizations:

1. **Remove Load Balancer** (save $18-25/month)
2. **Reduce Frontend max instances** 10 → 5 (save $2-3/month)
3. **Aggressive Artifact Registry cleanup** - keep only 5 versions (save $1/month)
4. **Consider db-g1-small only if needed** (current db-f1-micro is fine)

**Result**: $15-25/month total cost

---

## 📋 Comparison Table

| Option | Monthly Cost | Savings | Custom Domain | Performance | Complexity |
|--------|--------------|---------|---------------|-------------|------------|
| **Current** | $41.50-55.50 | - | ✅ | High | Medium |
| **Option 1** | $23.50-30.50 | $18-25 | ✅ | High | Low |
| **Option 2** | $26.50-47.50 | $8-15 | ✅ | Medium | Medium |
| **Option 3** | $15-25 | $26.50-40.50 | ✅ | Medium-High | Low |

---

## ⚡ Recommended Approach: **Option 1**

**Why?**
- ✅ Achieves your $20-30/month target
- ✅ Simplifies architecture
- ✅ Maintains all core functionality
- ✅ Still has custom domains and HTTPS
- ✅ Easy to implement and reverse if needed
- ✅ No performance degradation

**When NOT to use Option 1:**
- ❌ If you need multi-region load balancing
- ❌ If you need advanced traffic splitting (A/B testing)
- ❌ If you need IP-based allowlisting (corporate firewalls)
- ❌ If you plan to add many more services behind one domain

---

## 🛠️ Implementation Script for Option 1

```bash
#!/bin/bash
# Cost Reduction: Remove Load Balancer
# Savings: $18-25/month

PROJECT_ID="perundhu-prod-001"
REGION="asia-south1"

echo "=== Step 1: Create Cloud Run Domain Mappings ==="

# Frontend domain mapping
echo "Mapping www.perundhu.com to frontend..."
gcloud run domain-mappings create \
  --service=perundhu-production-frontend \
  --domain=www.perundhu.com \
  --region=$REGION \
  --project=$PROJECT_ID

# Backend domain mapping
echo "Mapping api.perundhu.com to backend..."
gcloud run domain-mappings create \
  --service=perundhu-production-backend \
  --domain=api.perundhu.com \
  --region=$REGION \
  --project=$PROJECT_ID

echo ""
echo "=== Step 2: Get DNS Record Details ==="
echo "Waiting for domain mappings to initialize..."
sleep 30

# Get the DNS records needed
echo ""
echo "Frontend DNS records needed:"
gcloud run domain-mappings describe www.perundhu.com \
  --region=$REGION \
  --project=$PROJECT_ID

echo ""
echo "Backend DNS records needed:"
gcloud run domain-mappings describe api.perundhu.com \
  --region=$REGION \
  --project=$PROJECT_ID

echo ""
echo "==================================="
echo "MANUAL STEP REQUIRED:"
echo "Update DNS records in Cloud DNS based on the output above"
echo "Typically you'll need to add CNAME records pointing to ghs.googlehosted.com"
echo "==================================="
echo ""
echo "Press Enter when DNS is updated and SSL certificates are ACTIVE (10-30 min)..."
read

echo ""
echo "=== Step 3: Test New Domains ==="
echo "Testing www.perundhu.com..."
curl -I https://www.perundhu.com | head -5

echo ""
echo "Testing api.perundhu.com..."
curl -I https://api.perundhu.com/v1/health | head -5

echo ""
echo "Are both domains working correctly? (yes/no)"
read CONFIRMATION

if [ "$CONFIRMATION" != "yes" ]; then
  echo "Aborting. Fix domains before proceeding."
  exit 1
fi

echo ""
echo "=== Step 4: Delete Load Balancer Components ==="

# Delete forwarding rules
echo "Deleting forwarding rules..."
gcloud compute forwarding-rules delete perundhu-https-rule --global --quiet
gcloud compute forwarding-rules delete perundhu-http-rule --global --quiet

# Delete target proxies
echo "Deleting target proxies..."
gcloud compute target-https-proxies delete perundhu-https-proxy --global --quiet
gcloud compute target-http-proxies delete perundhu-http-proxy --global --quiet

# Delete URL map
echo "Deleting URL map..."
gcloud compute url-maps delete perundhu-frontend-lb --global --quiet

# Delete backend services
echo "Deleting backend services..."
gcloud compute backend-services delete perundhu-frontend-backend --global --quiet
gcloud compute backend-services delete perundhu-backend-backend --global --quiet

# Delete unused SSL certificates
echo "Deleting unused SSL certificates..."
gcloud compute ssl-certificates delete perundhu-ssl-cert --global --quiet 2>/dev/null || true
gcloud compute ssl-certificates delete perundhu-api-ssl-cert --global --quiet 2>/dev/null || true

# Release static IP
echo "Releasing static IP (saves $7/month)..."
gcloud compute addresses delete perundhu-frontend-ip --global --quiet 2>/dev/null || true

echo ""
echo "==================================="
echo "✅ LOAD BALANCER REMOVED"
echo "💰 Savings: $18-25/month"
echo "📉 New monthly cost: $23.50-30.50"
echo "==================================="
echo ""
echo "Verify everything works:"
echo "  Frontend: https://www.perundhu.com"
echo "  Backend: https://api.perundhu.com/v1/health"
```

---

## 📊 Estimated Monthly Cost After Option 1

| Component | Cost | Notes |
|-----------|------|-------|
| Cloud SQL (db-f1-micro) | $8-9 | Optimized |
| Backend Cloud Run | $3-5 | 0-5 instances |
| Frontend Cloud Run | $3-5 | 0-10 instances |
| Cloud Storage | $1 | Images |
| Artifact Registry | $1-2 | Containers |
| Networking/Misc | $1-2 | Minimal |
| ~~Load Balancer~~ | ~~$0~~ | **REMOVED** |
| **Total** | **$17-24** | **✅ Within target!** |

---

## 🔄 Rollback Plan (If Needed)

If you need to restore the load balancer:

1. Keep Cloud Run domain mappings active
2. Recreate load balancer (use Terraform or manual gcloud commands)
3. Point DNS back to load balancer IP
4. Remove Cloud Run domain mappings

All data and services remain untouched - only routing changes.

---

## ⚠️ Things to Consider

1. **Traffic patterns**: Monitor actual costs after migration
2. **Regional latency**: Cloud Run direct mapping is single-region (but you're India-focused)
3. **Static IP**: Load balancer provides static IP (34.36.97.68) - some corporate firewalls need this
4. **Future scaling**: If you add 5+ services, load balancer becomes more valuable

---

## 🎯 Final Recommendation

**Implement Option 1** - Remove the load balancer and save $18-25/month to reach your $20-30/month target.

**Next Steps:**
1. Review the implementation script above
2. Test domain mappings in a non-production environment first (if available)
3. Schedule maintenance window (30-60 minutes)
4. Execute migration during low-traffic period
5. Monitor costs for 7 days to confirm savings

**Expected Result:**
- Monthly cost: $17-24 (well within $20-30 target)
- Same functionality (custom domains, HTTPS, auto-scaling)
- Simpler architecture
- $216-300/year savings

---

**Questions? Concerns?**
Let me know if you want to proceed with Option 1 or explore other alternatives!
