# Admin CORS Preflight Fix - Deployment Guide

## Summary of Changes

Fixed CORS preflight (OPTIONS) requests returning 401 Unauthorized for admin endpoints. The issue was that `AdminBasicAuthFilter` was enforcing authentication on ALL requests, including CORS preflight requests.

**Impact**: Admin pages in frontend couldn't access backend admin APIs due to blocked CORS preflight requests.

## Code Change

**File**: `backend/app/src/main/java/com/perundhu/infrastructure/security/AdminBasicAuthFilter.java`

**Change**: Added check to bypass authentication for OPTIONS (preflight) requests:

```java
String method = request.getMethod();

// Allow CORS preflight requests (OPTIONS) without authentication
if ("OPTIONS".equalsIgnoreCase(method)) {
    log.debug("Allowing CORS preflight request (OPTIONS) without authentication: {}", requestUri);
    filterChain.doFilter(request, response);
    return;
}
```

## Deployment Steps

### Option 1: Quick Deploy via gcloud run deploy (Recommended)

```bash
cd /Users/mchand69/Documents/perundhu

# This uses Cloud Run's built-in builder to create the container
gcloud run deploy perundhu-backend-preprod \
  --source=. \
  --region=asia-south1 \
  --platform=managed \
  --allow-unauthenticated \
  --project=astute-strategy-406601 \
  --set-env-vars="SPRING_PROFILES_ACTIVE=preprod,DB_USERNAME=perundhu_user,FLYWAY_ENABLED=false,SERVER_PORT=8080" \
  --add-cloudsql-instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql \
  --cpu=2 \
  --memory=2Gi \
  --max-instances=10 \
  --min-instances=0
```

### Option 2: Manual Build & Push

```bash
# 1. Build the backend
cd /Users/mchand69/Documents/perundhu/backend
./gradlew clean build -x test

# 2. Build and push Docker image
cd /Users/mchand69/Documents/perundhu
bash docker-build-and-push.sh preprod

# 3. Deploy to Cloud Run
bash deploy-preprod-backend.sh
```

## Verification

### Test Script
Run the comprehensive test script after deployment:

```bash
bash /Users/mchand69/Documents/perundhu/test-admin-cors.sh
```

### Manual Test (Single Endpoint)

```bash
# Test CORS preflight
curl -X OPTIONS 'https://perundhu-backend-preprod-c6qn3mz4wa-el.a.run.app/api/admin/contributions/routes' \
  -H 'Origin: https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app' \
  -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: authorization' \
  -v

# Expected response: HTTP 200 with CORS headers
```

## Testing Checklist

- [ ] Deploy backend using option 1 or 2 above
- [ ] Wait for deployment to complete (5-10 minutes)
- [ ] Run test script: `bash test-admin-cors.sh`
- [ ] Verify no HTTP 401 errors in response
- [ ] Check frontend admin pages load without CORS errors
- [ ] Test admin functionality:
  - [ ] View route contributions
  - [ ] View bus contributions  
  - [ ] View stop contributions
  - [ ] View route issues

## Admin Endpoints Verified

✓ `/api/admin/contributions/routes`
✓ `/api/v1/admin/contributions/routes`
✓ `/api/admin/contributions/buses`
✓ `/api/v1/admin/contributions/buses`
✓ `/api/admin/contributions/stops`
✓ `/api/v1/admin/contributions/stops`
✓ `/api/admin/route-issues`
✓ `/api/v1/admin/route-issues`

## Debugging

If OPTIONS requests still return 401 after deployment:

1. Check backend logs:
   ```bash
   gcloud run logs read perundhu-backend-preprod \
     --region=asia-south1 \
     --project=astute-strategy-406601 \
     --limit=100
   ```

2. Verify new revision is active:
   ```bash
   gcloud run revisions list --service=perundhu-backend-preprod \
     --region=asia-south1 \
     --project=astute-strategy-406601 \
     --limit=3
   ```

3. Check if deployment is still in progress:
   ```bash
   gcloud builds list \
     --region=asia-south1 \
     --project=astute-strategy-406601 \
     --limit=5
   ```

## CORS Configuration Reference

**File**: `backend/app/src/main/resources/application-preprod.properties`

```properties
# Allowed origins for CORS
cors.allowed-origins=https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app,https://perundhu-frontend-preprod-c6qn3mz4wa-el.a.run.app
```

**File**: `backend/app/src/main/java/com/perundhu/infrastructure/config/CorsConfig.java`
- Allowed methods: GET, POST, PUT, DELETE, OPTIONS
- Allowed headers: Authorization, Content-Type, X-reCAPTCHA-Token, etc.
- Credentials: Yes (withCredentials: true)

## Related Documentation
- [ADMIN_CORS_PREFLIGHT_FIX.md](ADMIN_CORS_PREFLIGHT_FIX.md)
- [RECAPTCHA_PREPROD_FIX.md](RECAPTCHA_PREPROD_FIX.md)
