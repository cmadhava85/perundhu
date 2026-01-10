# reCAPTCHA Implementation Fix - January 2026

## 🐛 Issues Found

### 1. **Backend Configuration Mismatch**
- **Problem**: CD Pipeline was setting `RECAPTCHA_ENABLED=false` in preprod
- **Impact**: reCAPTCHA was disabled even though secrets were configured
- **Location**: [.github/workflows/cd-preprod.yml](cd-preprod.yml#L358)

### 2. **Property Name Inconsistency**
- **Problem**: `RecaptchaService.java` was using `recaptcha.score-threshold` but `application-*.properties` used `recaptcha.min-score`
- **Impact**: Score threshold wasn't being read correctly, defaulting to 0.5
- **Files**:
  - [RecaptchaService.java](backend/app/src/main/java/com/perundhu/infrastructure/security/RecaptchaService.java#L38)
  - [application-preprod.properties](backend/app/src/main/resources/application-preprod.properties#L140)
  - [application-development.properties](backend/app/src/main/resources/application-development.properties#L62)

### 3. **Missing Action Property**
- **Problem**: `recaptcha.action` property wasn't defined in properties files
- **Impact**: Service was using default value, but not explicitly configured
- **Location**: All application properties files

### 4. **Environment Variable Mapping**
- **Problem**: Properties file had hardcoded `recaptcha.enabled=true` instead of reading from environment
- **Impact**: Could not dynamically control reCAPTCHA via CD pipeline
- **Location**: [application-preprod.properties](backend/app/src/main/resources/application-preprod.properties#L136)

## ✅ Fixes Applied

### 1. **RecaptchaService.java**
Updated property binding to match application.properties:
```java
// Changed from:
@Value("${recaptcha.score-threshold:0.5}")

// To:
@Value("${recaptcha.min-score:0.5}")
```

### 2. **application-preprod.properties**
```properties
# Before:
recaptcha.enabled=true

# After:
recaptcha.enabled=${RECAPTCHA_ENABLED:true}
recaptcha.action=submit  # ADDED
```

### 3. **application-development.properties**
```properties
# Before:
recaptcha.score-threshold=0.5

# After:
recaptcha.min-score=0.5
recaptcha.action=submit  # ADDED
```

### 4. **CD Pipeline (.github/workflows/cd-preprod.yml)**
```yaml
# Before:
RECAPTCHA_ENABLED=false

# After:
RECAPTCHA_ENABLED=true
```

## 🔍 How reCAPTCHA Now Works

### Frontend Flow
1. User fills out contribution form
2. `useSubmissionSecurity` hook calls `getRecaptchaToken(action)`
3. Token is added to request headers as `X-Recaptcha-Token`
4. Request is sent to backend

### Backend Flow
1. `ContributionController` receives request
2. `extractCaptchaToken()` reads token from `X-Recaptcha-Token` header
3. If `recaptchaService.isEnabled()` returns true:
   - Calls `recaptchaService.verifyToken(token, "paste_contribution")`
   - Verifies token with Google reCAPTCHA API
   - Checks score against threshold (0.5)
   - Validates action matches expected action
4. If verification fails, returns 403 Forbidden
5. If verification succeeds, processes contribution

## 📝 Configuration Reference

### Environment Variables (CD Pipeline)
```bash
RECAPTCHA_ENABLED=true           # Enable/disable reCAPTCHA
RECAPTCHA_SITE_KEY=${secret}     # From Google Cloud Secret Manager
RECAPTCHA_SECRET_KEY=${secret}   # From Google Cloud Secret Manager
```

### Application Properties
```properties
recaptcha.enabled=${RECAPTCHA_ENABLED:true}
recaptcha.site-key=${RECAPTCHA_SITE_KEY:}
recaptcha.secret-key=${RECAPTCHA_SECRET_KEY:}
recaptcha.min-score=0.5           # Minimum score to pass (0.0-1.0)
recaptcha.max-age-seconds=120     # Token expiration
recaptcha.action=submit           # Expected action name
```

## 🧪 Testing reCAPTCHA

### Verify Backend Configuration
```bash
# Check if reCAPTCHA is enabled in logs
curl https://perundhu-backend-preprod-*.run.app/actuator/health

# Look for log entries like:
# "reCAPTCHA verification successful - score: 0.9"
```

### Test Contribution Submission
```bash
curl -X POST 'https://perundhu-backend-preprod-*.run.app/api/v1/contributions/paste' \
  -H 'Content-Type: application/json' \
  -H 'X-Recaptcha-Token: YOUR_TOKEN_HERE' \
  -H 'X-Form-Timestamp: 1767992820219' \
  -d '{
    "text": "Route 123A\nCoimbatore → Salem\nMorning 7:30 AM",
    "sourceAttribution": "Test"
  }'
```

Expected behavior:
- **With valid token**: 200 OK with contribution data
- **With invalid token**: 403 Forbidden with "CAPTCHA verification failed"
- **With no token**: Request processed if RECAPTCHA_ENABLED=false

## 🚀 Deployment Steps

1. **Commit changes**:
   ```bash
   git add .
   git commit -m "fix: reCAPTCHA configuration issues in contribute page"
   ```

2. **Push to trigger CD pipeline**:
   ```bash
   git push origin master
   ```

3. **Verify deployment**:
   - Check GitHub Actions logs
   - Verify backend deployment with `RECAPTCHA_ENABLED=true`
   - Test contribution submission on preprod

4. **Monitor logs**:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=perundhu-backend-preprod" \
     --limit 50 --format json | jq '.[] | select(.textPayload | contains("reCAPTCHA"))'
   ```

## 📊 Verification Checklist

- [x] `RecaptchaService.java` uses correct property names
- [x] `application-preprod.properties` allows dynamic `RECAPTCHA_ENABLED`
- [x] `application-development.properties` uses consistent property names
- [x] CD Pipeline sets `RECAPTCHA_ENABLED=true`
- [x] Frontend sends token in `X-Recaptcha-Token` header
- [x] Backend reads token from header correctly
- [ ] Deploy and test in preprod environment
- [ ] Verify contribution submissions work with reCAPTCHA
- [ ] Check Cloud Run logs for reCAPTCHA verification messages

## 🔗 Related Files

- [RecaptchaService.java](backend/app/src/main/java/com/perundhu/infrastructure/security/RecaptchaService.java)
- [ContributionController.java](backend/app/src/main/java/com/perundhu/adapter/in/rest/ContributionController.java)
- [useSubmissionSecurity.ts](frontend/src/hooks/useSubmissionSecurity.ts)
- [application-preprod.properties](backend/app/src/main/resources/application-preprod.properties)
- [cd-preprod.yml](.github/workflows/cd-preprod.yml)

## 📚 Additional Resources

- [Google reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [Spring Boot Configuration Properties](https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html)
- [RECAPTCHA_BACKEND_COMPLETE_GUIDE.md](RECAPTCHA_BACKEND_COMPLETE_GUIDE.md)
- [RECAPTCHA_QUICK_REFERENCE.md](RECAPTCHA_QUICK_REFERENCE.md)
