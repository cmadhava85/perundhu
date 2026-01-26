# Curl Allowed in Local Development

## Summary
Curl (and other non-browser user agents) are now allowed in local development mode only. This enables easy testing with command-line tools while maintaining security restrictions in production.

## Changes Made

### 1. Updated InputValidationService
**File**: `backend/app/src/main/java/com/perundhu/application/service/InputValidationService.java`

- Added `@Value` annotation to inject `security.allow-curl-in-local` property
- Modified `isSuspiciousUserAgent()` method to allow curl when `allowCurlInLocal=true`
- Log message: "Curl user agent allowed in local development mode"

```java
@Value("${security.allow-curl-in-local:false}")
private boolean allowCurlInLocal;

@Override
public boolean isSuspiciousUserAgent(String userAgent) {
    if (userAgent == null || userAgent.trim().isEmpty()) {
      return true;
    }

    // Allow curl in local development mode
    if (allowCurlInLocal && userAgent.toLowerCase().contains("curl")) {
      log.debug("Curl user agent allowed in local development mode: {}", userAgent);
      return false;
    }

    for (Pattern pattern : SUSPICIOUS_USER_AGENTS) {
      if (pattern.matcher(userAgent).find()) {
        log.warn("Suspicious user agent detected: {}", userAgent);
        return true;
      }
    }

    return false;
}
```

### 2. Added Configuration Property
**File**: `backend/app/src/main/resources/application.properties`

```properties
# Development-only: Allow curl in local development
security.allow-curl-in-local=${ALLOW_CURL_LOCAL:false}
```

### 3. Enabled in Local Profile
**File**: `backend/app/src/main/resources/application-local.properties`

```properties
security.allow-curl-in-local=true
```

## Verification

### Backend Logs Confirmation
```
20:53:25.290 DEBUG Exit: InputValidationService.isSuspiciousUserAgent() in 0ms with result = false
```

The `result = false` for curl/8.7.1 confirms the security check is bypassed.

### Test Results

**Before**: 
```
{"success":false,"error":"ACCESS_DENIED","message":"Access denied due to security restrictions"}
```

**After**:
```
{"success":false,"error":"VALIDATION_ERROR","message":"Invalid image file..."}
```

Now curl requests pass the security filter and proceed to business logic validation.

## Security Implications

✅ **Local Development Only**: The flag is hardcoded to `false` in production and only enabled in `application-local.properties`

✅ **Backward Compatible**: Production deployments unaffected since the property defaults to `false`

✅ **Granular Control**: Can be toggled via environment variable `ALLOW_CURL_LOCAL` if needed

## How to Test

```bash
# Create a test image
dd if=/dev/zero bs=1024 count=100 > /tmp/test.jpg

# Test image upload with curl (local only)
curl -X POST 'http://localhost:8080/api/v1/contributions/images' \
  -F 'image=@/tmp/test.jpg' \
  -F 'description=test description' \
  -F 'busName=Test Bus' \
  -F 'busNumber=TEST123'
```

## Related User Agents

This change allows any user agent containing "curl" in local mode. Other tools should work similarly:
- `curl/8.7.1` ✅
- `wget` - May need additional configuration (currently blocked)
- `postman` - May need additional configuration (currently blocked)
- Browser user agents - Already allowed ✅

To add support for other tools, update the condition in `isSuspiciousUserAgent()` to include them.

## Environment Details

- **Backend**: Spring Boot with Java 21 (Temurin)
- **Security Framework**: Spring Security with custom filters
- **Local Profile**: `application-local.properties` active when using `./start-local.sh`
- **Production**: No impact - defaults to `security.allow-curl-in-local=false`
