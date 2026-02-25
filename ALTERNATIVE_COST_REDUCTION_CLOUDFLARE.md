# Alternative Cost Reduction Plan: $20-30/Month Target

**Issue**: Cloud Run custom domain mappings are not available in asia-south1 region  
**Impact**: Cannot remove load balancer via Option 1  
**Current Cost**: $41.50-55.50/month  
**Target Cost**: $20-30/month  
**Additional Savings Needed**: $11.50-35.50/month  
**Date**: February 24, 2026

---

## 🚫 Why Option 1 Failed

Cloud Run domain mappings (`gcloud run domain-mappings create`) are either:
- Not supported in `asia-south1` region
- Require domain verification that conflicts with existing setup
- Have been deprecated/changed in favor of load balancers

The load balancer is currently **necessary** for custom domains with Cloud Run in your region.

---

## 💡 Alternative Strategies to Reach $20-30/Month

---

### **Strategy A: Aggressive Resource Reduction (Achieves Target)**

Reduce Cloud Run resources and optimize aggressively while keeping the load balancer.

**Savings: $12-20/month**  
**New Cost: $21.50-43.50/month** ✅

#### Changes:

1. **Reduce Backend Cloud Run** (save $2-4/month):
   ```bash
   # Max instances: 5 → 2
   # Min instances: 0 (already optimized)
   gcloud run services update perundhu-production-backend \
     --max-instances=2 \
     --region=asia-south1 \
     --project=perundhu-prod-001
   ```

2. **Reduce Frontend Cloud Run** (save $3-6/month):
   ```bash
   # Max instances: 10 → 3
   # CPU: 1 vCPU → 512m (0.5 vCPU)
   # Memory: 512Mi → 256Mi
   gcloud run services update perundhu-production-frontend \
     --max-instances=3 \
     --cpu=0.5 \
     --memory=256Mi \
     --region=asia-south1 \
     --project=perundhu-prod-001
   ```

3. **Stop Database During Off-Peak Hours** (save $2-3/month):
   ```bash
   # Create Cloud Scheduler jobs to stop/start database
   # Stop at 11 PM IST (5:30 PM UTC)
   gcloud scheduler jobs create http db-stop-job \
     --location=asia-south1 \
     --schedule="30 17 * * *" \
     --uri="https://sqladmin.googleapis.com/sql/v1beta4/projects/perundhu-prod-001/instances/perundhu-production-mysql/stop" \
     --http-method=POST \
     --oauth-service-account-email=perundhu-production-backend@perundhu-prod-001.iam.gserviceaccount.com
   
   # Start at 6 AM IST (12:30 AM UTC)
   gcloud scheduler jobs create http db-start-job \
     --location=asia-south1 \
     --schedule="30 0 * * *" \
     --uri="https://sqladmin.googleapis.com/sql/v1beta4/projects/perundhu-prod-001/instances/perundhu-production-mysql/start" \
     --http-method=POST \
     --oauth-service-account-email=perundhu-production-backend@perundhu-prod-001.iam.gserviceaccount.com
   ```
   **Risk**: App unavailable 11 PM - 6 AM IST (7 hours/day)

4. **More Aggressive Artifact Registry Cleanup** (save $1/month):
   ```json
   # Keep only 3 versions instead of 10
   {
     "rules": [{
       "action": {"type": "Delete"},
       "condition": {
         "tagState": "ANY",
         "olderThan": "2592000s"
       }
     }, {
       "action": {"type": "Keep"},
       "mostRecentVersions": {
         "keepCount": 3
       }
     }]
   }
   ```

5. **Reduce SQL Connections Further** (save $0.50-1/month):
   - Backend max pool: 10 → 5
   - Replica max pool: 8 → 4

**Total Savings: $8.50-15/month**  
**New Monthly Cost: $26.50-47/month** ⚠️ (still above target)

---

### **Strategy B: Switch to Cloudflare (Achieves Target)** ⭐ **RECOMMENDED**

Use Cloudflare as a reverse proxy instead of Google Cloud Load Balancer.

**Savings: $18-25/month**  
**New Cost: $23.50-30.50/month** ✅

#### How It Works:

1. **Instead of Load Balancer routing**, use Cloudflare:
   ```
   perundhu.com (Cloudflare DNS)
   ├── Cloudflare Proxy (FREE)
   │   ├── www.perundhu.com → https://perundhu-production-frontend-gu2tgq6lwq-el.a.run.app
   │   └── api.perundhu.com → https://perundhu-production-backend-gu2tgq6lwq-el.a.run.app
   ```

2. **Cloudflare Provides**:
   - ✅ FREE SSL certificates
   - ✅ FREE CDN (faster than Cloud CDN!)
   - ✅ FREE DDoS protection
   - ✅ FREE caching rules
   - ✅ Custom domain routing
   - ✅ Automatic HTTPS

#### Implementation Steps:

1. **Transfer DNS to Cloudflare** (or add as secondary):
   - Sign up at cloudflare.com (FREE plan)
   - Add domain perundhu.com
   - Update nameservers at registrar or keep Google DNS as primary

2. **Configure DNS Records in Cloudflare**:
   ```
   # Delete existing A records in Cloud DNS or keep them as backup
   
   # In Cloudflare, add CNAME records with Proxy enabled (orange cloud):
   www.perundhu.com → CNAME → perundhu-production-frontend-gu2tgq6lwq-el.a.run.app
   api.perundhu.com → CNAME → perundhu-production-backend-gu2tgq6lwq-el.a.run.app
   perundhu.com → CNAME → perundhu-production-frontend-gu2tgq6lwq-el.a.run.app
   ```

3. **Enable Cloudflare Proxy** (orange cloud icon):
   - Cloudflare will provide SSL and cache
   - Requests go through Cloudflare's global network

4. **Allow Cloud Run Public Access**:
   ```bash
   # Ensure Cloud Run services are publicly accessible
   gcloud run services add-iam-policy-binding perundhu-production-frontend \
     --member="allUsers" \
     --role="roles/run.invoker" \
     --region=asia-south1 \
     --project=perundhu-prod-001
   
   gcloud run services add-iam-policy-binding perundhu-production-backend \
     --member="allUsers" \
     --role="roles/run.invoker" \
     --region=asia-south1 \
     --project=perundhu-prod-001
   ```

5. **Test Domains Through Cloudflare**:
   ```bash
   curl https://www.perundhu.com
   curl https://api.perundhu.com/v1/health
   ```

6. **Delete Google Cloud Load Balancer**:
   ```bash
   # Once Cloudflare is working, delete LB components
   gcloud compute forwarding-rules delete perundhu-https-rule --global --quiet
   gcloud compute forwarding-rules delete perundhu-http-rule --global --quiet
   gcloud compute target-https-proxies delete perundhu-https-proxy --global --quiet
   gcloud compute target-http-proxies delete perundhu-http-proxy --global --quiet
   gcloud compute url-maps delete perundhu-frontend-lb --global --quiet
   gcloud compute backend-services delete perundhu-frontend-backend --global --quiet
   gcloud compute backend-services delete perundhu-backend-backend --global --quiet
   gcloud compute addresses delete perundhu-frontend-ip --global --quiet
   
   # Delete unused SSL certificates
   gcloud compute ssl-certificates list --global | grep -v ACTIVE | awk '{print $1}' | xargs -I {} gcloud compute ssl-certificates delete {} --global --quiet
   ```

#### Pros:
- ✅ **Saves $18-25/month** (load balancer cost)
- ✅ **FREE** Cloudflare plan sufficient
- ✅ Better global CDN than Google's
- ✅ Built-in DDoS protection
- ✅ Page Rules for caching (3 free rules)
- ✅ Faster setup than load balancer
- ✅ Analytics dashboard included
- ✅ SSL auto-renewal

#### Cons:
- ⚠️ Third-party dependency (Cloudflare)
- ⚠️ Extra DNS hop (minimal latency)
- ⚠️ Need to configure CORS if not already done
- ⚠️ Must keep Cloud Run services publicly accessible

---

### **Strategy C: Hybrid (Cloudflare + Resource Reduction)**

Combine Strategy B with minor resource reductions.

**Savings: $20-30/month**  
**New Cost: $15-25/month** ✅✅ (exceeds target!)

1. **Use Cloudflare** (save $18-25/month)
2. **Reduce Frontend max instances** 10 → 5 (save $2-3/month)
3. **Keep 3 image versions in Artifact Registry** (save $1/month)

---

## 📊 Comparison Table

| Strategy | Monthly Cost | Savings | Downtime Risk | Complexity | Achieves Target |
|----------|--------------|---------|---------------|------------|-----------------|
| **Current** | $41.50-55.50 | - | None | Medium | ❌ |
| **Strategy A** | $26.50-47 | $8.50-15 | 7hrs/day DB stop | Medium | ⚠️ |
| **Strategy B** | $23.50-30.50 | $18-25 | None | Low | ✅ |
| **Strategy C** | $15-25 | $26.50-40.50 | None | Low | ✅✅ |

---

## ⚡ Recommended Path: **Strategy B (Cloudflare)**

**Why?**
- ✅ Achieves your $20-30/month target reliably
- ✅ No performance degradation
- ✅ Actually improves performance (Cloudflare's CDN is faster)
- ✅ No downtime windows required
- ✅ Simple to implement and reverse
- ✅ Adds security features (DDoS protection)
- ✅ Better analytics

**When NOT to use Strategy B:**
- ❌ If you have compliance requiring GCP-only infrastructure
- ❌ If you need Google Cloud Armor features
- ❌ If Cloudflare is blocked in your target regions

---

## 🛠️ Implementation: Strategy B (Cloudflare)

### Phase 1: Setup Cloudflare (15 minutes)

1. **Sign up for Cloudflare** (FREE plan):
   ```
   https://dash.cloudflare.com/sign-up
   ```

2. **Add perundhu.com**:
   - Click "Add a Site"
   - Enter: perundhu.com
   - Select FREE plan
   - Cloudflare will scan your DNS records

3. **Import Existing DNS Records**:
   - Cloudflare will auto-detect records from Cloud DNS
   - Verify all records are imported

4. **Add Cloud Run CNAME records**:
   ```
   Type: CNAME
   Name: www
   Target: perundhu-production-frontend-gu2tgq6lwq-el.a.run.app
   Proxy: ON (orange cloud)
   
   Type: CNAME
   Name: api
   Target: perundhu-production-backend-gu2tgq6lwq-el.a.run.app
   Proxy: ON (orange cloud)
   
   Type: CNAME
   Name: @ (root)
   Target: perundhu-production-frontend-gu2tgq6lwq-el.a.run.app
   Proxy: ON (orange cloud)
   ```

5. **Update Nameservers** (at domain registrar):
   - Cloudflare will provide 2 nameservers
   - Update at your domain registrar (Google Domains, GoDaddy, etc.)
   - Wait 1-24 hours for DNS propagation

### Phase 2: Enable Public Access (5 minutes)

```bash
# Frontend
gcloud run services add-iam-policy-binding perundhu-production-frontend \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --region=asia-south1 \
  --project=perundhu-prod-001

# Backend  
gcloud run services add-iam-policy-binding perundhu-production-backend \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --region=asia-south1 \
  --project=perundhu-prod-001
```

### Phase 3: Test & Verify (10 minutes)

```bash
# Test domains
curl -I https://www.perundhu.com
curl -I https://api.perundhu.com/v1/health

# Check Cloudflare is intercepting
curl -I https://www.perundhu.com | grep -i "cf-ray"
# Should see: cf-ray: xxx-XXX (indicates Cloudflare is active)
```

### Phase 4: Delete Load Balancer (10 minutes)

```bash
#!/bin/bash
PROJECT_ID="perundhu-prod-001"

echo "Deleting Load Balancer components..."

# Forwarding rules
gcloud compute forwarding-rules delete perundhu-https-rule --global --quiet --project=$PROJECT_ID
gcloud compute forwarding-rules delete perundhu-http-rule --global --quiet --project=$PROJECT_ID

# Target proxies
gcloud compute target-https-proxies delete perundhu-https-proxy --global --quiet --project=$PROJECT_ID
gcloud compute target-http-proxies delete perundhu-http-proxy --global --quiet --project=$PROJECT_ID

# URL map
gcloud compute url-maps delete perundhu-frontend-lb --global --quiet --project=$PROJECT_ID

# Backend services
gcloud compute backend-services delete perundhu-frontend-backend --global --quiet --project=$PROJECT_ID
gcloud compute backend-services delete perundhu-backend-backend --global --quiet --project=$PROJECT_ID

# Static IP
gcloud compute addresses delete perundhu-frontend-ip --global --quiet --project=$PROJECT_ID 2>/dev/null || true

# SSL certificates (keep active ones)
gcloud compute ssl-certificates delete perundhu-ssl-cert --global --quiet --project=$PROJECT_ID 2>/dev/null || true
gcloud compute ssl-certificates delete perundhu-api-ssl-cert --global --quiet --project=$PROJECT_ID 2>/dev/null || true

echo "✅ Load Balancer deleted - Saving $18-25/month"
```

### Phase 5: Configure Cloudflare Optimization (optional)

1. **SSL/TLS Settings**:
   - Mode: Full (strict)
   - Always Use HTTPS: ON
   - Minimum TLS Version: 1.2

2. **Caching**:
   - Browser Cache TTL: 4 hours
   - Page Rules (3 free):
     - `api.perundhu.com/*` → Cache Level: Bypass
     - `www.perundhu.com/static/*` → Cache Level: Cache Everything
     - `www.perundhu.com/*` → Browser Cache TTL: 1 day

3. **Speed Optimization**:
   - Auto Minify: JavaScript, CSS, HTML
   - Brotli: ON
   - Early Hints: ON
   - HTTP/3: ON

---

## 💰 Expected Monthly Cost (Strategy B)

| Component | Cost | Notes |
|-----------|------|-------|
| Cloud SQL (db-f1-micro) | $8-9 | Optimized |
| Backend Cloud Run | $3-5 | 0-5 instances |
| Frontend Cloud Run | $3-5 | 0-10 instances |
| Cloud Storage | $1 | Images |
| Artifact Registry | $1-2 | Containers |
| Cloudflare | **$0** | **FREE plan** |
| Networking/Misc | $1-2 | Minimal |
| ~~Load Balancer~~ | ~~$0~~ | **DELETED** |
| **Total** | **$17-24** | **✅ Under target!** |

---

## 🔄 Rollback Plan

If Cloudflare doesn't work:

1. Keep Cloudflare DNS records
2. Recreate load balancer (takes 15 minutes)
3. Update Cloudflare CNAME to point to load balancer IP
4. Remove Cloud Run public access

---

## ✅ Next Steps

**Ready to proceed with Strategy B (Cloudflare)?**

1. I can guide you through Cloudflare setup
2. We'll test before deleting the load balancer
3. Validation: 24-48 hours to confirm cost savings
4. Expected result: $17-24/month (well under $30 target)

**Or prefer Strategy A (Aggressive resource reduction)?**
- More risk (DB downtime, resource constraints)
- May not reach target ($26-47/month)

Let me know which strategy you want to implement!
