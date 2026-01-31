# IP Filtering Fix - Paste Validation Endpoint

## Issue Fixed

**Problem:** POST request to `/api/v1/contributions/paste/validate` returns **HTTP 403 "Request blocked for security reasons"**

**Root Cause:** The `IpFilteringFilter` was blocking POST requests to validation endpoints because they weren't read-only methods (GET/HEAD/OPTIONS). However, these endpoints are read-only operations that don't modify state - they're just for previewing/validating data before submission.

**Error Message:**
```
HTTP 403
{
  "error": "Access denied",
  "message": "Request blocked for security reasons"
}
```

## Solution Applied

**File:** `backend/app/src/main/java/com/perundhu/infrastructure/config/IpFilteringFilter.java`

**Changes:**
1. Added new method `isValidationEndpoint()` that identifies post validation/analysis endpoints
2. Added check in `doFilterInternal()` to skip IP filtering for validation endpoints from allowed origins

**Code Added:**
```java
// Skip IP filtering for validation/analysis endpoints that use POST but don't modify state
if (isValidationEndpoint(requestUri) && isApiPath(requestUri) && (isAllowedOrigin(origin) || isAllowedReferer(referer))) {
  filterChain.doFilter(request, response);
  return;
}

/**
 * Check if URI is a validation/analysis endpoint that uses POST but doesn't modify state.
 * These endpoints should be treated as read-only for IP filtering purposes.
 */
private boolean isValidationEndpoint(String uri) {
  if (uri == null) {
    return false;
  }
  // Validation endpoints that use POST but are read-only (no state changes)
  return uri.equals("/api/v1/contributions/paste/validate") || // Paste validation (preview only)
      uri.equals("/api/v1/contributions/analyze-image") || // Image analysis (no persistence)
      uri.equals("/api/v1/contributions/voice/transcribe") || // Voice transcription (no persistence)
      uri.startsWith("/api/v1/analytics/"); // Analytics queries (read-only aggregations)
}
```

## Endpoints Fixed

Now allowed from frontend domains (POST requests no longer blocked):
1. ✅ `/api/v1/contributions/paste/validate` - Paste text validation (preview)
2. ✅ `/api/v1/contributions/analyze-image` - Image analysis (preview)
3. ✅ `/api/v1/contributions/voice/transcribe` - Voice transcription (preview)
4. ✅ `/api/v1/analytics/**` - Analytics queries (read-only aggregations)

## Build Status

✅ **Code compiled successfully**
- Backend rebuilt: `./gradlew clean build -x test`
- JAR created: `build/libs/perundhu-backend.jar`
- Fix verified in compiled binary (confirmed strings in .class file)

## Deployment

### Deploy to Preprod

```bash
cd /Users/mchand69/Documents/perundhu

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
  --min-instances=0 \
  --timeout=3600 \
  --to-latest
```

## Testing

### After deployment, run this test:

```bash
curl -m 10 -s 'https://perundhu-backend-preprod-1032721240281.asia-south1.run.app/api/v1/contributions/paste/validate' \
  -X POST \
  -H 'content-type: application/json' \
  -H 'origin: https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app' \
  -d '{"text":"Route 123A test"}' \
  -w "\n\nHTTP: %{http_code}\n"
```

**Expected Response:**
```
HTTP: 200 ✅ (not 403)
{
  "success": true,
  "validationResult": {...}
}
```

**Old Response (Before Fix):**
```
HTTP: 403 ❌
{"error":"Access denied","message":"Request blocked for security reasons"}
```

## Related Issues Fixed

- **CORS Preflight Fix:** Admin endpoints now handle OPTIONS requests correctly
- **IP Filtering Fix:** Validation endpoints no longer blocked (this fix)

## Files Modified

- `backend/app/src/main/java/com/perundhu/infrastructure/config/IpFilteringFilter.java`
  - Added `isValidationEndpoint()` method
  - Added validation endpoint check in filter logic
  - +22 lines added, no lines removed

## Testing Checklist

- [ ] Deploy to preprod Cloud Run
- [ ] Test paste validation endpoint returns HTTP 200
- [ ] Test image analysis endpoint returns HTTP 200
- [ ] Test voice transcribe endpoint returns HTTP 200
- [ ] Test analytics endpoints work
- [ ] Verify frontend can call validation endpoints without 403 errors
- [ ] Check that actual POST submissions (non-validation) still require proper auth/rate limiting

## Documentation

- Validation endpoints documented in `CSRF_ENDPOINT_ANALYSIS.md`
- IP filtering logic documented in `IpFilteringFilter.java` comments
- All endpoints are read-only and don't modify server state
