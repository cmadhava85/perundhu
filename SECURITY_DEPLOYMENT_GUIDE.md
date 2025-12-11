# Security Deployment Guide

This guide covers the 5-layer security system implemented to protect guest user endpoints from abuse.

## Security Features Overview

| Feature | Purpose | Backend | Frontend |
|---------|---------|---------|----------|
| **Rate Limiting** | Prevent API abuse | `RateLimitingFilter.java` | N/A |
| **Origin Validation** | Block direct API access | `OriginValidationFilter.java` | N/A |
| **Honeypot Fields** | Detect bot submissions | `HoneypotValidator.java` | `honeypot.ts`, `HoneypotFields.tsx` |
| **reCAPTCHA v3** | Score-based bot detection | `RecaptchaService.java` | `recaptchaService.ts` |
| **API Key** | Additional validation layer | `ApiKeyValidationFilter.java` | `apiKeyService.ts` |

## Secrets in GCP Secret Manager

The following secrets have been stored in GCP Secret Manager (project: `astute-strategy-406601`):

| Secret Name | Purpose | Used In |
|-------------|---------|---------|
| `JWT_SECRET_PREPROD` | JWT signing for preprod | Backend preprod |
| `JWT_SECRET_PROD` | JWT signing for production | Backend prod |
| `DATA_ENCRYPTION_KEY_PREPROD` | Data encryption for preprod | Backend preprod |
| `DATA_ENCRYPTION_KEY_PROD` | Data encryption for production | Backend prod |
| `PUBLIC_API_KEY` | API key for public endpoints | Both environments |

## Configuration by Environment

### Backend Properties

| Property | Development | Preprod | Production |
|----------|-------------|---------|------------|
| `rate-limit.enabled` | `true` | `true` | `true` |
| `rate-limit.read.requests-per-minute` | `100` | `60` | `30` |
| `rate-limit.write.requests-per-minute` | `10` | `5` | `3` |
| `security.origin-validation.enabled` | `false` | `true` | `true` |
| `security.origin-validation.strict-mode` | `false` | `false` | `true` |
| `security.honeypot.enabled` | `true` | `true` | `true` |
| `recaptcha.enabled` | `false` | `false` | `true` |
| `security.api-key.enabled` | `false` | `true` | `true` |

### Frontend Environment Variables

| Variable | Development | Preprod | Production |
|----------|-------------|---------|------------|
| `VITE_HONEYPOT_ENABLED` | `true` | `true` | `true` |
| `VITE_RECAPTCHA_ENABLED` | `false` | `false` | `true` |
| `VITE_API_KEY_ENABLED` | `false` | `true` | `true` |

## Setup Instructions

### 1. Rate Limiting (Already Active)

No additional setup required. Rate limits are enforced automatically.

**Limits:**
- Read endpoints: 100 req/min (dev), 60 req/min (preprod), 30 req/min (prod)
- Write endpoints: 10 req/min (dev), 5 req/min (preprod), 3 req/min (prod)  
- Upload endpoints: 5 req/min (dev), 3 req/min (preprod), 2 req/min (prod)

### 2. Origin Validation (Already Active in Preprod/Prod)

Validates that requests come from allowed origins (frontend domains).

**Allowed origins in production:**
- `https://perundhu.com`
- `https://www.perundhu.com`
- `https://*.run.app` (Cloud Run services)

### 3. Honeypot Fields (Already Active)

Frontend forms automatically include hidden honeypot fields. If bots fill these fields, submissions are rejected.

**Usage in new forms:**
```tsx
import HoneypotFields from '../components/common/HoneypotFields';
import { useSubmissionSecurity } from '../hooks/useSubmissionSecurity';

function MyForm() {
  const { prepareSubmission, isLoading } = useSubmissionSecurity();
  
  const handleSubmit = async (data) => {
    const secure = await prepareSubmission(data);
    if (!secure.isValid) return;
    
    await fetch('/api/endpoint', {
      method: 'POST',
      headers: secure.headers,
      body: JSON.stringify(secure.data)
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <HoneypotFields />
      {/* Your form fields */}
    </form>
  );
}
```

### 4. Google reCAPTCHA v3 (Requires Setup)

**Step 1: Get reCAPTCHA Keys**
1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Create a new site with **reCAPTCHA v3**
3. Add domains:
   - `perundhu.com`
   - `www.perundhu.com`
   - `localhost` (for development)
4. Copy the Site Key and Secret Key

**Step 2: Store Secret Key in GCP**
```bash
echo -n "YOUR_RECAPTCHA_SECRET_KEY" | gcloud secrets create RECAPTCHA_SECRET_KEY --data-file=- --project=astute-strategy-406601
```

**Step 3: Update Environment Variables**

Frontend `.env.production`:
```
VITE_RECAPTCHA_ENABLED=true
VITE_RECAPTCHA_SITE_KEY=your-site-key-here
```

Backend `application-prod.properties`:
```properties
recaptcha.enabled=true
recaptcha.secret-key=${RECAPTCHA_SECRET_KEY}
recaptcha.site-key=your-site-key-here
```

**Step 4: Update Cloud Run Deployment**

Add to `cd-production.yml`:
```yaml
--set-secrets="...,RECAPTCHA_SECRET_KEY=RECAPTCHA_SECRET_KEY:latest"
```

### 5. API Key Validation (Already Active in Preprod/Prod)

The API key (`PUBLIC_API_KEY`) is already stored in GCP Secret Manager and referenced in workflows.

**Frontend usage:**
- The `useSubmissionSecurity` hook automatically adds the API key header
- API key is read from `VITE_PUBLIC_API_KEY` environment variable

**To update the API key:**
```bash
# Generate new key
NEW_KEY=$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-32)

# Update in GCP
echo -n "$NEW_KEY" | gcloud secrets versions add PUBLIC_API_KEY --data-file=-

# Update frontend .env files with the new key
```

## Verification

### Test Rate Limiting
```bash
# Should succeed
for i in {1..5}; do curl -I https://your-api.run.app/api/v1/routes; done

# Should get 429 after exceeding limit
for i in {1..100}; do curl -I https://your-api.run.app/api/v1/routes; done
```

### Test Origin Validation
```bash
# Should fail (no Origin header)
curl -X POST https://your-api.run.app/api/v1/contributions -d '{}' -H "Content-Type: application/json"

# Should succeed (with Origin header)
curl -X POST https://your-api.run.app/api/v1/contributions -d '{}' -H "Content-Type: application/json" -H "Origin: https://perundhu.com"
```

### Test API Key
```bash
# Should fail (no API key)
curl -X POST https://your-api.run.app/api/v1/contributions/paste -d '{}' -H "Content-Type: application/json"

# Should succeed (with API key)
curl -X POST https://your-api.run.app/api/v1/contributions/paste -d '{}' -H "Content-Type: application/json" -H "X-API-Key: your-api-key"
```

## Monitoring

### Rate Limit Violations
Check Cloud Run logs for:
```
Rate limit exceeded for IP: xxx.xxx.xxx.xxx
```

### Bot Detections
Check for honeypot triggers:
```
Honeypot validation failed: field xxx was filled
```

### reCAPTCHA Failures
```
reCAPTCHA verification failed: score too low (0.1)
```

## Troubleshooting

### Issue: Legitimate users getting rate limited
**Solution:** Increase limits in `application-{env}.properties`:
```properties
rate-limit.read.requests-per-minute=120
```

### Issue: Origin validation blocking legitimate requests
**Solution:** Add the origin to allowed list:
```properties
security.origin-validation.allowed-origins=https://newdomain.com
```

### Issue: reCAPTCHA rejecting valid users
**Solution:** Lower the threshold:
```properties
recaptcha.score-threshold=0.3
```

## Security Best Practices

1. **Never commit secrets** - Always use GCP Secret Manager
2. **Rotate keys periodically** - Update `PUBLIC_API_KEY` every 90 days
3. **Monitor logs** - Set up alerts for rate limit violations
4. **Test in preprod first** - Enable strict mode in preprod before prod
5. **Keep reCAPTCHA optional** - Don't block submissions if reCAPTCHA fails
