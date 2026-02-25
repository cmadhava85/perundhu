# Cost-Optimized Single Domain Setup

## Overview
Migrated from dual-domain setup (www.perundhu.com + api.perundhu.com) to single-domain setup with nginx proxy to reduce costs and simplify DNS management.

## Architecture Change

### Previous Setup (Dual Domain)
```
Frontend: www.perundhu.com → Cloud Run Frontend Service
Backend:  api.perundhu.com → Cloud Run Backend Service

- 2 domain mappings
- 2 SSL certificates
- 2 DNS CNAME records
- CORS configuration required
```

### New Setup (Single Domain with Nginx Proxy)
```
Frontend:        www.perundhu.com → Cloud Run Frontend Service
Backend Proxy:   www.perundhu.com/api/* → (nginx) → Cloud Run Backend Service

- 1 domain mapping
- 1 SSL certificate
- 1 DNS CNAME record
- No CORS needed (same origin)
```

## Cost Savings

| Item | Before | After | Savings |
|------|--------|-------|---------|
| Domain Mappings | 2 | 1 | Free tier friendly |
| SSL Certificates | 2 | 1 | Simplified management |
| DNS Records | 2 CNAMEs | 1 CNAME | Easier configuration |
| CORS Issues | Yes | No | Better security |

**Estimated monthly savings:** Simplified management, reduced complexity, better free tier utilization

## Configuration Changes

### 1. Nginx Proxy Configuration
**File:** `frontend/nginx.conf`

```nginx
location /api/ {
    # Proxy to backend Cloud Run service
    proxy_pass https://perundhu-production-backend-gu2tgq6lwq-uc.a.run.app/;
    
    # Preserve original request details
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

### 2. Frontend Environment Variables
**File:** `frontend/.env.production`

```bash
# Changed from:
VITE_API_URL=https://api.perundhu.com
VITE_API_BASE_URL=https://api.perundhu.com

# To:
VITE_API_URL=/api
VITE_API_BASE_URL=/api
```

### 3. Preprod Environment
**File:** `frontend/.env.preprod`

Should also be updated if needed:
```bash
VITE_API_URL=/api
VITE_API_BASE_URL=/api
```

## DNS Configuration

### Required DNS Record
**Only ONE CNAME record needed:**

```
Type:   CNAME
Host:   www (or www.perundhu.com)
Value:  ghs.googlehosted.com
TTL:    300 seconds (5 minutes)
```

### DNS Records to DELETE
- ❌ `api.perundhu.com` A record → 34.36.97.68 (delete this)
- ❌ `www.perundhu.com` A record → 34.36.97.68 (delete this, replace with CNAME)

## Deployment Steps

### 1. Rebuild and Deploy Frontend
The frontend needs to be rebuilt with new environment variables and nginx configuration.

```bash
# Build production frontend with updated config
cd /Users/mchand69/Documents/perundhu/frontend
docker build \
  -t us-central1-docker.pkg.dev/perundhu-prod-001/perundhu-images-us/frontend:1.0.8 \
  --build-arg VITE_ENV_FILE=.env.production \
  --platform linux/amd64 .

# Push to registry
docker push us-central1-docker.pkg.dev/perundhu-prod-001/perundhu-images-us/frontend:1.0.8

# Deploy to Cloud Run
gcloud run deploy perundhu-production-frontend \
  --image us-central1-docker.pkg.dev/perundhu-prod-001/perundhu-images-us/frontend:1.0.8 \
  --platform managed \
  --region us-central1 \
  --project perundhu-prod-001 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 60s \
  --port 8080 \
  --labels app=perundhu,env=production
```

### 2. Create Domain Mapping
```bash
# Create domain mapping for www.perundhu.com only
./scripts/create-domain-mapping.sh
```

### 3. Configure DNS
In your DNS provider (currently Google Domains nameservers):

1. **Delete A record:**
   - Type: A
   - Host: www
   - Value: 34.36.97.68
   - Action: **DELETE**

2. **Add CNAME record:**
   - Type: CNAME
   - Host: www
   - Value: ghs.googlehosted.com
   - TTL: 300
   - Action: **ADD**

3. **Ignore api subdomain:**
   - No configuration needed for api.perundhu.com
   - Remove any existing A or CNAME records for api

### 4. Wait for SSL Certificate
- SSL certificate provisioning takes 15-30 minutes after DNS propagates
- DNS propagation takes 5-10 minutes with 300 second TTL

### 5. Test Configuration
```bash
# Run comprehensive tests
./scripts/test-domain-mappings.sh
```

## Testing Endpoints

### Frontend
- URL: `https://www.perundhu.com`
- Expected: React application loads
- Status: 200 OK

### API via Proxy
- Health: `https://www.perundhu.com/api/health`
- Search: `https://www.perundhu.com/api/locations/autocomplete?query=Chennai`
- Expected: JSON responses from backend
- Status: 200 OK

### Direct Backend (for debugging)
- URL: `https://perundhu-production-backend-gu2tgq6lwq-uc.a.run.app/api/health`
- Expected: Works independently
- Status: 200 OK

## Request Flow

### User Request to API
```
1. Browser: https://www.perundhu.com/api/locations/autocomplete?query=Chennai
2. Cloud Run Frontend Service (nginx)
3. Nginx proxy_pass to: https://perundhu-production-backend-gu2tgq6lwq-uc.a.run.app/locations/autocomplete?query=Chennai
4. Cloud Run Backend Service
5. Response back through nginx to browser
```

### Key Points
- URL path `/api/` is stripped by nginx proxy
- Backend sees: `/locations/autocomplete?query=Chennai`
- Same-origin request (no CORS needed)
- Single SSL certificate covers entire flow

## Troubleshooting

### Issue: API returns 404
**Symptom:** `https://www.perundhu.com/api/health` returns 404

**Causes:**
1. Frontend not rebuilt with updated nginx configuration
2. Old frontend image still deployed
3. Nginx configuration syntax error

**Solution:**
```bash
# Check nginx configuration
docker run --rm -it us-central1-docker.pkg.dev/perundhu-prod-001/perundhu-images-us/frontend:1.0.8 nginx -t

# Check deployed image version
gcloud run services describe perundhu-production-frontend \
  --region=us-central1 \
  --project=perundhu-prod-001 \
  --format="value(spec.template.spec.containers[0].image)"

# Rebuild and redeploy if needed
```

### Issue: API returns 502 Bad Gateway
**Symptom:** Nginx returns 502 when proxying

**Causes:**
1. Backend service unreachable
2. Backend service URL incorrect in nginx config
3. Backend service authentication issue

**Solution:**
```bash
# Test backend directly
curl https://perundhu-production-backend-gu2tgq6lwq-uc.a.run.app/api/health

# Check nginx error logs
gcloud run logs read perundhu-production-frontend \
  --region=us-central1 \
  --project=perundhu-prod-001 \
  --limit=50

# Verify backend URL in nginx.conf
grep proxy_pass frontend/nginx.conf
```

### Issue: DNS not resolving
**Symptom:** `dig www.perundhu.com` returns A record instead of CNAME

**Causes:**
1. A record not deleted
2. CNAME not added
3. Configured in wrong DNS management location

**Solution:**
```bash
# Check current DNS
dig @ns-cloud-e1.googledomains.com www.perundhu.com ANY +noall +answer

# Should show:
# www.perundhu.com. 300 IN CNAME ghs.googlehosted.com.

# If shows A record:
# www.perundhu.com. 300 IN A 34.36.97.68
# → DELETE A record, ADD CNAME record
```

## Rollback Plan

If issues occur, rollback steps:

### 1. Quick Rollback - Use Direct Cloud Run URLs
```bash
# Update frontend to use direct backend URL
# Edit frontend/.env.production:
VITE_API_URL=https://perundhu-production-backend-gu2tgq6lwq-uc.a.run.app/api
VITE_API_BASE_URL=https://perundhu-production-backend-gu2tgq6lwq-uc.a.run.app/api

# Rebuild and redeploy
```

### 2. Full Rollback - Dual Domain Setup
```bash
# 1. Revert nginx.conf to return 404 for /api
# 2. Revert .env.production to use https://api.perundhu.com
# 3. Create api.perundhu.com domain mapping
# 4. Configure DNS CNAME for api.perundhu.com
# 5. Rebuild and redeploy frontend
```

## Files Modified

### Configuration Files
- ✅ `frontend/nginx.conf` - Added API proxy configuration
- ✅ `frontend/.env.production` - Changed API URL to `/api`
- ✅ `scripts/test-domain-mappings.sh` - Updated for single domain
- ✅ `scripts/create-domain-mapping.sh` - New script for single domain

### Files to Check/Update
- ⚠️ `frontend/.env.preprod` - May need similar update
- ⚠️ `backend CORS configuration` - Can be simplified (same origin)

## Benefits Summary

### Development
- ✅ Simpler local development (no CORS issues)
- ✅ Same-origin requests (better security)
- ✅ Easier debugging (single domain)

### Operations
- ✅ Single SSL certificate to manage
- ✅ Single domain mapping to maintain
- ✅ Simpler DNS configuration
- ✅ Fewer moving parts

### Cost
- ✅ Optimized for GCP free tier
- ✅ Reduced certificate management overhead
- ✅ No separate api domain costs

### Security
- ✅ No CORS configuration needed
- ✅ Same-origin policy enforced
- ✅ Single certificate to secure

## Next Steps

1. ✅ Configure nginx proxy in frontend
2. ✅ Update frontend environment variables
3. ✅ Create domain mapping script
4. ✅ Update test script
5. ⏳ **Rebuild and deploy frontend** (next action)
6. ⏳ Configure DNS CNAME record
7. ⏳ Wait for SSL certificate (15-30 min)
8. ⏳ Run tests
9. ⏳ Monitor in production

## References

- [Cloud Run Domain Mappings](https://cloud.google.com/run/docs/mapping-custom-domains)
- [Nginx Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [SSL Certificate Provisioning](https://cloud.google.com/run/docs/securing/using-custom-domains)
