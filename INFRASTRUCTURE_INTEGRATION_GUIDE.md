# Infrastructure Integration Guide

## Overview

This guide helps you integrate the **Redis duplicate detection** and **Google reCAPTCHA verification** features that were implemented in Phase 2 security fixes.

**Current Status:**
- ✅ Code implemented and ready
- ✅ In-memory fallback working (no infrastructure needed)
- ⏳ Redis integration (optional upgrade)
- ⏳ reCAPTCHA integration (optional upgrade)

---

## Quick Start (No Infrastructure)

The system works **out of the box** without any infrastructure setup:

1. **Duplicate Detection**: Uses in-memory cache (`InMemoryImageHashRepository`)
   - ✅ Works immediately
   - ✅ Thread-safe (ConcurrentHashMap)
   - ⚠️ Resets on application restart
   - ⚠️ Not shared across multiple instances

2. **CAPTCHA**: Disabled by default
   - ✅ All requests pass through
   - ⚠️ No bot protection

**To use as-is:** Just deploy the application. Duplicate detection works in-memory, CAPTCHA is disabled.

---

## Option 1: Redis Integration (Recommended for Production)

### Benefits
- ✅ Persistent duplicate detection (survives restarts)
- ✅ Shared across multiple application instances
- ✅ Automatic expiration (24-hour TTL)
- ✅ Production-grade reliability

### Step 1: Install Redis

**Option A: Docker (Easiest)**
```bash
docker run -d \
  --name perundhu-redis \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

**Option B: Package Manager**
```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis-server

# macOS
brew install redis
brew services start redis

# Verify installation
redis-cli ping  # Should return "PONG"
```

### Step 2: Uncomment Redis Dependency

Edit `backend/build.gradle`:

```gradle
// Remove Redis dependency for now - will use in-memory implementation
// implementation 'org.springframework.boot:spring-boot-starter-data-redis'
```

Change to:

```gradle
// Redis for production duplicate detection
implementation 'org.springframework.boot:spring-boot-starter-data-redis'
```

### Step 3: Create RedisConfig

Create `backend/app/src/main/java/com/perundhu/config/RedisConfig.java`:

```java
package com.perundhu.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

  @Bean
  public RedisTemplate<String, String> redisTemplate(
      RedisConnectionFactory connectionFactory) {
    RedisTemplate<String, String> template = new RedisTemplate<>();
    template.setConnectionFactory(connectionFactory);
    template.setKeySerializer(new StringRedisSerializer());
    template.setValueSerializer(new StringRedisSerializer());
    return template;
  }
}
```

### Step 4: Create RedisImageHashRepository

Create `backend/app/src/main/java/com/perundhu/adapter/out/cache/RedisImageHashRepository.java`:

```java
package com.perundhu.adapter.out.cache;

import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.concurrent.TimeUnit;

@Repository
@Profile("redis")  // Only active when 'redis' profile is enabled
public class RedisImageHashRepository {

  private static final String HASH_KEY_PREFIX = "image:hash:";
  private static final int DEFAULT_TTL_HOURS = 24;

  private final RedisTemplate<String, String> redisTemplate;

  public RedisImageHashRepository(RedisTemplate<String, String> redisTemplate) {
    this.redisTemplate = redisTemplate;
  }

  public boolean isDuplicate(String hash) {
    String key = HASH_KEY_PREFIX + hash;
    return Boolean.TRUE.equals(redisTemplate.hasKey(key));
  }

  public void storeHash(String hash, String contributionId) {
    storeHash(hash, contributionId, DEFAULT_TTL_HOURS);
  }

  public void storeHash(String hash, String contributionId, int ttlHours) {
    String key = HASH_KEY_PREFIX + hash;
    redisTemplate.opsForValue().set(key, contributionId, ttlHours, TimeUnit.HOURS);
  }

  public String getContributionId(String hash) {
    String key = HASH_KEY_PREFIX + hash;
    return redisTemplate.opsForValue().get(key);
  }

  public boolean deleteHash(String hash) {
    String key = HASH_KEY_PREFIX + hash;
    return Boolean.TRUE.equals(redisTemplate.delete(key));
  }
}
```

### Step 5: Update InMemoryImageHashRepository

Add profile to existing implementation:

```java
@Repository
@Profile("!redis")  // Only active when 'redis' profile is NOT enabled
public class InMemoryImageHashRepository {
  // ... existing code ...
}
```

### Step 6: Configure Redis Connection

Add to `backend/app/src/main/resources/application.properties`:

```properties
# Redis Configuration
spring.redis.host=${REDIS_HOST:localhost}
spring.redis.port=${REDIS_PORT:6379}
spring.redis.password=${REDIS_PASSWORD:}
spring.redis.database=0
spring.redis.timeout=2000ms

# Connection pool
spring.redis.lettuce.pool.max-active=8
spring.redis.lettuce.pool.max-idle=8
spring.redis.lettuce.pool.min-idle=2
```

### Step 7: Enable Redis Profile

**Development:**
```bash
# .env
SPRING_PROFILES_ACTIVE=redis
```

**Production (Docker):**
```dockerfile
ENV SPRING_PROFILES_ACTIVE=redis
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379
```

**Production (GCP Cloud Run):**
```bash
gcloud run deploy perundhu-backend \
  --set-env-vars SPRING_PROFILES_ACTIVE=redis \
  --set-env-vars REDIS_HOST=10.0.0.3
```

### Step 8: Test Redis Integration

```bash
# Start Redis
docker start perundhu-redis

# Start application with Redis profile
./gradlew bootRun --args='--spring.profiles.active=redis'

# Test duplicate detection
curl -X POST http://localhost:8080/api/v1/contributions/images \
  -F "image=@test.jpg" \
  -F "userId=test123"

# Upload same image again (should return 409 Conflict)
curl -X POST http://localhost:8080/api/v1/contributions/images \
  -F "image=@test.jpg" \
  -F "userId=test123"

# Check Redis
redis-cli
> KEYS image:hash:*
> GET image:hash:<hash_value>
> TTL image:hash:<hash_value>  # Should show ~86400 seconds (24 hours)
```

---

## Option 2: Google reCAPTCHA Integration

### Benefits
- ✅ **95%+ bot detection** rate
- ✅ Invisible to most users (reCAPTCHA v3)
- ✅ **Free tier**: 1 million assessments/month
- ✅ Minimal UX friction

### Step 1: Get reCAPTCHA Keys

1. Go to https://www.google.com/recaptcha/admin
2. Click **"+"** to add a new site
3. Fill in:
   - **Label**: Perundhu Bus Tracker
   - **reCAPTCHA type**: reCAPTCHA v3
   - **Domains**: 
     - `localhost` (for development)
     - `your-domain.com` (for production)
4. Accept Terms of Service
5. Click **Submit**

You'll get:
- **Site Key**: `6LeXXXXXXXXXXXXXXXXXXXXX` (public, goes in frontend)
- **Secret Key**: `6LeYYYYYYYYYYYYYYYYYYYYY` (private, goes in backend)

**Test Keys (for development only):**
- Site Key: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
- Secret Key: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

### Step 2: Configure Backend

Add to `backend/app/src/main/resources/application.properties`:

```properties
# Google reCAPTCHA Configuration
recaptcha.enabled=true
recaptcha.secret-key=${RECAPTCHA_SECRET_KEY}
recaptcha.score-threshold=0.5
```

Set environment variable:

```bash
# Development (.env)
RECAPTCHA_SECRET_KEY=6LeYYYYYYYYYYYYYYYYYYYYY

# Production (Docker)
docker run -e RECAPTCHA_SECRET_KEY=6LeYYYYYYYYYYYYYYYYYYYY ...

# Production (GCP Cloud Run)
gcloud run deploy perundhu-backend \
  --set-env-vars RECAPTCHA_SECRET_KEY=6LeYYYYYYYYYYYYYYYYYYYY
```

### Step 3: Update Frontend

**Add Script to HTML:**

Edit `frontend/index.html` (or main layout):

```html
<head>
  <!-- Existing head content -->
  
  <!-- Google reCAPTCHA v3 -->
  <script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
</head>
```

**Update Image Upload Form:**

Edit `frontend/src/components/ImageContribution.tsx`:

```typescript
const handleImageUpload = async (file: File, metadata: Record<string, string>) => {
  // Get reCAPTCHA token
  const recaptchaToken = await window.grecaptcha.execute('YOUR_SITE_KEY', {
    action: 'image_upload'
  });

  // Add token to metadata
  const metadataWithCaptcha = {
    ...metadata,
    captchaToken: recaptchaToken
  };

  // Upload image
  const formData = new FormData();
  formData.append('image', file);
  Object.entries(metadataWithCaptcha).forEach(([key, value]) => {
    formData.append(key, value);
  });

  const response = await fetch('/api/v1/contributions/images', {
    method: 'POST',
    body: formData
  });

  // Handle response
};
```

**Add TypeScript Declarations:**

Create `frontend/src/types/recaptcha.d.ts`:

```typescript
interface Window {
  grecaptcha: {
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
    ready: (callback: () => void) => void;
  };
}
```

**Update Voice Upload:**

Edit `frontend/src/components/VoiceContribution.tsx`:

```typescript
const handleVoiceUpload = async (audioBlob: Blob) => {
  const recaptchaToken = await window.grecaptcha.execute('YOUR_SITE_KEY', {
    action: 'voice_upload'
  });

  const formData = new FormData();
  formData.append('audio', audioBlob);
  formData.append('captchaToken', recaptchaToken);

  // ... rest of upload logic
};
```

**Update Manual Contribution:**

Edit `frontend/src/components/ManualContribution.tsx`:

```typescript
const handleManualSubmit = async (data: RouteData) => {
  const recaptchaToken = await window.grecaptcha.execute('YOUR_SITE_KEY', {
    action: 'manual_contribution'
  });

  const payload = {
    ...data,
    captchaToken: recaptchaToken
  };

  const response = await fetch('/api/v1/contributions/routes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  // ... handle response
};
```

### Step 4: Test reCAPTCHA Integration

```bash
# Use test keys for development
export RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
export RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe

# Start backend
./gradlew bootRun

# Start frontend
cd frontend && npm run dev

# Test in browser
# 1. Open browser console
# 2. Upload an image
# 3. Check Network tab for CAPTCHA token in request
# 4. Check backend logs for CAPTCHA verification

# Expected backend log:
# "reCAPTCHA verification successful for action: image_upload"
```

### Step 5: Monitor CAPTCHA Usage

**Check Google Admin Console:**
1. Go to https://www.google.com/recaptcha/admin
2. Click your site
3. View analytics:
   - Request volume
   - Score distribution
   - Action breakdown

**Set up alerts:**
```properties
# application.properties
# Log CAPTCHA failures for monitoring
logging.level.com.perundhu.adapter.out.security.RecaptchaService=DEBUG
```

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] **Redis Setup**
  - [ ] Provision Redis instance (managed service or self-hosted)
  - [ ] Configure connection pool settings
  - [ ] Test failover/recovery
  - [ ] Set up monitoring (memory usage, hit rate)

- [ ] **reCAPTCHA Setup**
  - [ ] Register production domain
  - [ ] Generate production keys
  - [ ] Test with production site key
  - [ ] Configure score threshold (0.5 recommended)

- [ ] **Environment Variables**
  - [ ] Set `SPRING_PROFILES_ACTIVE=redis`
  - [ ] Set `RECAPTCHA_SECRET_KEY=<prod_key>`
  - [ ] Set `REDIS_HOST=<prod_host>`
  - [ ] Set `REDIS_PASSWORD=<if_needed>`

### Post-Deployment

- [ ] **Verify Duplicate Detection**
  ```bash
  # Upload same image twice
  # Should get 409 Conflict on second upload
  ```

- [ ] **Verify CAPTCHA**
  ```bash
  # Check backend logs for "reCAPTCHA verification successful"
  ```

- [ ] **Monitor Metrics**
  - [ ] Redis hit/miss rate
  - [ ] CAPTCHA pass/fail rate
  - [ ] Duplicate detection rate
  - [ ] False positive rate

- [ ] **Set up Alerts**
  - [ ] Redis connection failures
  - [ ] CAPTCHA API failures
  - [ ] High bot detection rate (> 30%)
  - [ ] Redis memory usage (> 80%)

---

## Troubleshooting

### Redis Issues

**Problem: "Connection refused"**
```bash
# Check Redis is running
docker ps | grep redis
redis-cli ping

# Check connection settings
echo $REDIS_HOST
echo $REDIS_PORT

# Test connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT ping
```

**Problem: "Out of memory"**
```bash
# Check memory usage
redis-cli INFO memory

# Increase maxmemory
redis-cli CONFIG SET maxmemory 512mb

# Or restart with new limit
docker run -d redis:7-alpine redis-server --maxmemory 512mb
```

**Problem: "Keys not expiring"**
```bash
# Check TTL
redis-cli TTL image:hash:<hash>

# Should show seconds remaining (~86400 for 24 hours)
# If -1, key doesn't expire (bug)
# If -2, key doesn't exist
```

### reCAPTCHA Issues

**Problem: "CAPTCHA verification failed"**
```bash
# Check secret key is set
echo $RECAPTCHA_SECRET_KEY

# Check backend logs for detailed error
# Common causes:
# - Wrong secret key
# - Site key mismatch
# - Action mismatch
# - Domain not registered
```

**Problem: "Score too low"**
```properties
# Lower threshold temporarily for debugging
recaptcha.score-threshold=0.3

# Check user's score in logs
# Adjust threshold based on legitimate user scores
```

**Problem: "CAPTCHA token expired"**
```typescript
// Tokens expire after 2 minutes
// Generate token just before submission, not on page load

// Bad:
const token = await grecaptcha.execute(...);  // Page load
// ... user fills form for 5 minutes ...
submitForm(token);  // Token expired!

// Good:
const handleSubmit = async () => {
  const token = await grecaptcha.execute(...);  // Just before submit
  submitForm(token);  // Token fresh!
};
```

---

## Cost Estimation

### Redis

**Option 1: Self-Hosted (Docker)**
- **Cost**: $0 (runs on your server)
- **Pros**: Free, full control
- **Cons**: Manual maintenance, no HA

**Option 2: Managed Service**

| Provider | Instance | Cost/Month | Notes |
|----------|----------|------------|-------|
| Google Memorystore | 1GB Basic | ~$35 | Auto-backup, 99.9% SLA |
| AWS ElastiCache | cache.t3.micro | ~$15 | Good for small apps |
| Azure Cache | C0 (250MB) | ~$16 | Limited features |

**Recommendation**: Start with Docker, upgrade to managed if needed.

### reCAPTCHA

**Free Tier:**
- ✅ **1 million assessments/month FREE**
- ✅ No credit card required

**Paid Tier:**
- **$1.00 per 1,000 assessments** beyond 1M
- Example: 1.5M/month = $500 free + $500 paid = **$0.50/month**

**Your Usage (Estimated):**
- 100 uploads/day × 30 days = 3,000/month
- **Well within free tier** ✅

**Recommendation**: Use free tier, monitor usage.

---

## Monitoring & Metrics

### Redis Metrics

**Check via redis-cli:**
```bash
redis-cli INFO stats
# keyspace_hits: 1234
# keyspace_misses: 56
# Hit rate = hits / (hits + misses) = 95.6%
```

**Check via application logs:**
```java
log.info("Duplicate image detected: hash={}, original={}", 
         imageHash, originalContributionId);
```

**Key Metrics:**
- **Hit Rate**: Should be > 20% (indicates duplicates being caught)
- **Memory Usage**: Should stay < 100MB for typical usage
- **Key Count**: Should match contribution volume

### reCAPTCHA Metrics

**Check via Google Admin Console:**
- Request volume (should match uploads)
- Score distribution (most users > 0.5)
- Action breakdown (image_upload, voice_upload, manual_contribution)

**Check via application logs:**
```java
log.warn("CAPTCHA verification failed for user: {}", userId);
log.debug("reCAPTCHA verification successful for action: {}", action);
```

**Key Metrics:**
- **Pass Rate**: Should be > 95% for legitimate users
- **Fail Rate**: High rate (> 30%) indicates bot attack or threshold too high
- **Score Distribution**: Most humans score > 0.5

---

## Migration Path

### Phase 1: Development (Current)
- ✅ In-memory duplicate detection
- ✅ CAPTCHA disabled
- ✅ Works without infrastructure

### Phase 2: Staging
- ✅ Redis (Docker) for testing
- ✅ reCAPTCHA test keys
- ✅ Verify integration

### Phase 3: Production
- ✅ Managed Redis (Memorystore/ElastiCache)
- ✅ Production reCAPTCHA keys
- ✅ Monitoring enabled

### Phase 4: Optimization
- ✅ Fine-tune CAPTCHA threshold based on data
- ✅ Optimize Redis memory usage
- ✅ A/B test CAPTCHA vs no CAPTCHA impact

---

## Summary

**Current Setup (No Infrastructure):**
- ✅ Duplicate detection works (in-memory)
- ✅ CAPTCHA disabled (no bot protection)
- ✅ Production-ready for low traffic

**With Redis (Recommended):**
- ✅ Persistent duplicate detection
- ✅ Multi-instance support
- ✅ Cost: $0-35/month

**With reCAPTCHA (Recommended):**
- ✅ 95%+ bot blocking
- ✅ Invisible to users
- ✅ Cost: $0/month (< 1M requests)

**Total Monthly Cost (Fully Integrated):**
- **Minimum**: $0 (Docker Redis + reCAPTCHA free tier)
- **Production**: ~$35 (Managed Redis + reCAPTCHA free tier)

**Recommendation**: Deploy with in-memory cache first, add Redis + reCAPTCHA before scaling to production.
