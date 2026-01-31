# Admin Endpoints CORS Preflight Fix

## Problem Identified
CORS preflight requests (OPTIONS) to admin endpoints were returning **HTTP 401 Unauthorized** instead of HTTP 200/204, blocking browser requests from the frontend.

**Original Error:**
```
curl -X OPTIONS 'https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/admin/contributions/routes' \
  -H 'Origin: https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app' \
  -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: authorization'

Response: HTTP/2 401 
{"error":"UNAUTHORIZED","message":"Authentication required","status":401}
```

**Root Cause:**
The `AdminBasicAuthFilter` was enforcing authentication on ALL requests, including CORS preflight (OPTIONS) requests. However, CORS preflights must ALWAYS return success headers WITHOUT authentication challenges.

## Solution Applied

### Code Change
**File:** [backend/app/src/main/java/com/perundhu/infrastructure/security/AdminBasicAuthFilter.java](backend/app/src/main/java/com/perundhu/infrastructure/security/AdminBasicAuthFilter.java)

**Change:** Added check to allow OPTIONS requests without authentication

```java
@Override
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {

    String requestUri = request.getRequestURI();
    String method = request.getMethod();

    // Allow CORS preflight requests (OPTIONS) without authentication
    // CORS preflight must succeed with appropriate headers for browsers to proceed
    if ("OPTIONS".equalsIgnoreCase(method)) {
        log.debug("Allowing CORS preflight request (OPTIONS) without authentication: {}", requestUri);
        filterChain.doFilter(request, response);
        return;
    }

    // Only apply to admin endpoints
    if (!isAdminEndpoint(requestUri)) {
        filterChain.doFilter(request, response);
        return;
    }
    
    // ... rest of authentication logic
}
```

## Admin Endpoints Fixed

All admin endpoints now correctly handle CORS preflights:

1. **Contribution Management**
   - `/api/admin/contributions/routes`
   - `/api/v1/admin/contributions/routes`
   - `/api/admin/contributions/buses`
   - `/api/v1/admin/contributions/buses`
   - `/api/admin/contributions/stops`
   - `/api/v1/admin/contributions/stops`

2. **Route Issues Management**
   - `/api/admin/route-issues`
   - `/api/v1/admin/route-issues`
   - `/api/v1/route-issues/admin/**`

3. **Other Admin Endpoints**
   - `/api/admin/auth/**` (exempted as they handle auth)
   - Any endpoint matching `/api/admin/` or `/api/v1/admin/` patterns

## How CORS Preflight Works

```
1. Browser sends OPTIONS request
   ├─ No authentication needed
   └─ CORS headers tell browser if cross-origin request is allowed

2. If OPTIONS succeeds (200/204)
   └─ Browser sends actual request with authentication

3. If OPTIONS fails (4xx/5xx)
   └─ Browser blocks the actual request (CORS error in console)
```

## Expected Behavior After Fix

### CORS Preflight Request
```bash
curl -X OPTIONS 'https://backend/api/admin/contributions/routes' \
  -H 'Origin: https://frontend-domain' \
  -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: authorization'

Response: HTTP/2 200 ✅
access-control-allow-origin: https://frontend-domain
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
access-control-allow-headers: Authorization, Content-Type, ...
```

### Actual Request (with authentication)
```bash
curl -X GET 'https://backend/api/admin/contributions/routes' \
  -H 'Origin: https://frontend-domain' \
  -H 'Authorization: Basic [base64-creds]'

Response: HTTP/2 200 ✅
[Admin data]
```

## Test Endpoints

All admin endpoints should now work with CORS:

```bash
# Test CORS preflight
curl -X OPTIONS 'https://perundhu-backend-preprod-c6qn3mz4wa-el.a.run.app/api/admin/contributions/routes' \
  -H 'Origin: https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app' \
  -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: authorization' \
  -v

# Expected: HTTP 200 with CORS headers ✅
```

## Deployment Status

- [x] Code change applied
- [x] Backend rebuilt locally
- [ ] Deployed to preprod Cloud Run (in progress via `gcloud run deploy`)
- [ ] Test with frontend from browser
- [ ] Monitor logs for CORS-related errors

## Configuration

CORS is configured in:
- **File:** `backend/app/src/main/java/com/perundhu/infrastructure/config/CorsConfig.java`
- **Allowed Origins (Preprod):** 
  - `https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app`
  - `https://perundhu-frontend-preprod-c6qn3mz4wa-el.a.run.app`
- **Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers:** Authorization, Content-Type, X-reCAPTCHA-Token, etc.

## Verification Checklist

- [ ] Backend deployment successful
- [ ] `curl -X OPTIONS` returns HTTP 200 (not 401)
- [ ] Admin pages load without CORS errors in browser console
- [ ] Contributions API accessible from frontend
- [ ] Route management functional
- [ ] No 401 errors for OPTIONS requests in logs

## Related Files
- [backend/app/src/main/java/com/perundhu/infrastructure/security/AdminBasicAuthFilter.java](backend/app/src/main/java/com/perundhu/infrastructure/security/AdminBasicAuthFilter.java)
- [backend/app/src/main/java/com/perundhu/infrastructure/config/CorsConfig.java](backend/app/src/main/java/com/perundhu/infrastructure/config/CorsConfig.java)
- [backend/app/src/main/java/com/perundhu/infrastructure/config/SecurityConfig.java](backend/app/src/main/java/com/perundhu/infrastructure/config/SecurityConfig.java)
- [backend/app/src/main/resources/application-preprod.properties](backend/app/src/main/resources/application-preprod.properties)
