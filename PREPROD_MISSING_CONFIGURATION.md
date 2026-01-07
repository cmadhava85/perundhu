# PreProd Missing Configuration Analysis

**Date**: January 6, 2026  
**Status**: 🔍 Issues Found

## Summary

The preprod configuration is **missing or incorrectly configured** in several critical areas:

---

## 🚨 Critical Issues Found

### 1. ❌ WRONG JWT SECRET (High Priority)

**File**: `backend/app/src/main/resources/application-preprod.properties`

```properties
# CURRENT (WRONG - Using production secret):
app.jwtSecret=${sm://production-jwt-secret}

# SHOULD BE (Using preprod secret):
app.jwtSecret=${sm://preprod-jwt-secret}
```

**Problem**: Preprod is using the production JWT secret instead of preprod secret  
**Impact**: Authentication tokens from preprod won't work correctly  
**Fix**: Change to use `preprod-jwt-secret`

---

### 2. ❌ MISSING ENCRYPTION KEY (High Priority)

**File**: `backend/app/src/main/resources/application-preprod.properties`

**Status**: Completely missing from preprod config

**What's needed**:
```properties
# From production config:
security.data.encryption.enabled=true
security.data.encryption.key=${sm://production-data-encryption-key}

# Should be for preprod:
security.data.encryption.enabled=true
security.data.encryption.key=${sm://preprod-data-encryption-key}
```

**Problem**: No encryption configuration in preprod  
**Impact**: Data encryption won't work in preprod  
**Fix**: Add encryption key configuration

---

### 3. ❌ MISSING ADVANCED SECURITY SETTINGS (Medium Priority)

**File**: `backend/app/src/main/resources/application-preprod.properties`

Missing from preprod but present in production:
```properties
# Rate limiting
security.api.rate-limit.enabled=true
security.rate-limit.public-endpoints=30
security.rate-limit.authenticated-users=300

# IP filtering
security.ip-filtering.enabled=true
security.ip-filtering.block-suspicious-agents=true
security.ip-filtering.max-requests-per-second=10

# Data protection
security.data.obfuscate-for-non-premium=true
security.data.encrypt-sensitive-endpoints=true
security.data.log-access-attempts=true

# Security monitoring
security.monitoring.enabled=true
security.monitoring.alert-threshold=100
```

**Problem**: Preprod has only basic rate limiting, missing advanced features  
**Impact**: Reduced security in preprod environment  
**Fix**: Add missing security configurations

---

### 4. ⚠️ INCOMPLETE HIKARI CONNECTION POOL (Medium Priority)

**PREPROD Config**:
```properties
spring.datasource.hikari.maximum-pool-size=${HIKARI_MAX_POOL_SIZE:10}
spring.datasource.hikari.minimum-idle=${HIKARI_MIN_IDLE:2}
spring.datasource.hikari.connection-timeout=60000
spring.datasource.hikari.idle-timeout=300000
```

**PRODUCTION Config**:
```properties
spring.datasource.hikari.maximum-pool-size=${HIKARI_MAX_POOL_SIZE:10}
spring.datasource.hikari.minimum-idle=${HIKARI_MIN_IDLE:5}
spring.datasource.hikari.connection-timeout=${HIKARI_TIMEOUT:30000}
spring.datasource.hikari.idle-timeout=300000
spring.datasource.hikari.auto-commit=true
spring.datasource.hikari.pool-name=PerundhuProductionHikariCP
```

**Differences**:
- Preprod has `minimum-idle=2`, production has `5`
- Preprod has hardcoded `connection-timeout=60000`, production uses env var with fallback `30000`
- Preprod missing `auto-commit=true`
- Preprod missing `pool-name` configuration

**Problem**: Suboptimal connection pool settings for preprod  
**Fix**: Update to match production patterns with preprod values

---

### 5. ⚠️ MISSING FLYWAY CONFIGURATION DETAILS (Low Priority)

**PREPROD**:
```properties
spring.flyway.validate-on-migrate=false
spring.flyway.out-of-order=false
```

**PRODUCTION**:
```properties
spring.flyway.validate-on-migrate=true
spring.flyway.locations=classpath:db/migration/mysql
# Plus other Hibernate settings
```

**Problem**: Preprod has different Flyway settings  
**Impact**: May allow migrations to fail silently  
**Fix**: Align preprod Flyway validation with production

---

### 6. ❌ MISSING ANTI-SCRAPING MEASURES (Low Priority)

**Production has** (missing in preprod):
```properties
security.anti-scraping.enabled=true
security.anti-scraping.max-pages-per-session=50
security.anti-scraping.block-automated-tools=true
```

---

### 7. ❌ MISSING AUDIT LOGGING (Low Priority)

**Production has** (missing in preprod):
```properties
security.audit.enabled=true
security.audit.log-file=logs/security-audit.log
security.audit.retention-days=90
```

---

### 8. ⚠️ REFERENCES TO MISSING SECRETS (High Priority)

**Current preprod references**:
```properties
app.jwtSecret=${sm://production-jwt-secret}        ❌ Wrong!
recaptcha.site-key=${sm://recaptcha-site-key}      ✓ Correct (shared)
recaptcha.secret-key=${sm://recaptcha-secret-key}  ✓ Correct (shared)
admin.auth.username=${sm://admin-username}         ✓ Correct (shared)
admin.auth.password=${sm://admin-password}         ✓ Correct (shared)
```

**Missing secrets that should exist**:
```
preprod-jwt-secret              ❌ Does NOT exist in GCP yet
preprod-data-encryption-key     ❌ Does NOT exist in GCP yet (but may be created by Terraform)
```

---

## Configuration Comparison Matrix

| Configuration | PreProd | Production | Status |
|---|---|---|---|
| JWT Secret | production-jwt-secret | production-jwt-secret | ❌ WRONG in preprod |
| Encryption Key | Missing | production-data-encryption-key | ❌ MISSING |
| Rate Limiting | Basic only | Advanced | ⚠️ Incomplete |
| IP Filtering | None | Enabled | ❌ Missing |
| Audit Logging | None | Enabled | ❌ Missing |
| Anti-Scraping | None | Enabled | ❌ Missing |
| Hikari Pool Min | 2 | 5 | ⚠️ Lower in preprod |
| Hikari Pool Name | None | PerundhuProductionHikariCP | ⚠️ Missing |
| Flyway Validate | false | true | ⚠️ Risky |

---

## Required Fixes

### Fix 1: Update JWT Secret Reference (Critical)
**File**: `backend/app/src/main/resources/application-preprod.properties`

Change:
```properties
app.jwtSecret=${sm://production-jwt-secret}
```

To:
```properties
app.jwtSecret=${sm://preprod-jwt-secret}
```

### Fix 2: Add Encryption Configuration (Critical)
**File**: `backend/app/src/main/resources/application-preprod.properties`

Add after rate-limit configuration:
```properties
# ============================================
# ENCRYPTION CONFIGURATION (Preprod)
# ============================================
security.data.encryption.enabled=true
security.data.encryption.key=${sm://preprod-data-encryption-key}
```

### Fix 3: Update Hikari Settings (Recommended)
Replace:
```properties
spring.datasource.hikari.maximum-pool-size=${HIKARI_MAX_POOL_SIZE:10}
spring.datasource.hikari.minimum-idle=${HIKARI_MIN_IDLE:2}
spring.datasource.hikari.connection-timeout=60000
spring.datasource.hikari.idle-timeout=300000
```

With:
```properties
spring.datasource.hikari.maximum-pool-size=${HIKARI_MAX_POOL_SIZE:10}
spring.datasource.hikari.minimum-idle=${HIKARI_MIN_IDLE:3}
spring.datasource.hikari.connection-timeout=${HIKARI_TIMEOUT:45000}
spring.datasource.hikari.idle-timeout=300000
spring.datasource.hikari.auto-commit=true
spring.datasource.hikari.pool-name=PerundhuPreprodHikariCP
```

### Fix 4: Add Security Features (Recommended)
Add to preprod config:
```properties
# ============================================
# ADVANCED SECURITY CONFIGURATION (PreProd)
# ============================================
# Rate limiting - stricter than production for testing
security.api.rate-limit.enabled=true
security.rate-limit.public-endpoints=50
security.rate-limit.authenticated-users=200
security.rate-limit.premium-users=500

# IP filtering
security.ip-filtering.enabled=true
security.ip-filtering.block-suspicious-agents=true
security.ip-filtering.max-requests-per-second=5
security.ip-filtering.max-unique-endpoints=15

# Data protection
security.data.obfuscate-for-non-premium=false
security.data.encrypt-sensitive-endpoints=true
security.data.log-access-attempts=true

# Security monitoring
security.monitoring.enabled=true
security.monitoring.alert-threshold=50
security.monitoring.block-after-violations=3

# Audit logging
security.audit.enabled=true
security.audit.log-file=logs/security-audit.log
security.audit.retention-days=30

# Anti-scraping - lighter than production
security.anti-scraping.enabled=true
security.anti-scraping.max-pages-per-session=100
security.anti-scraping.block-automated-tools=true
```

### Fix 5: Update Flyway Settings (Optional)
Change:
```properties
spring.flyway.validate-on-migrate=false
```

To:
```properties
spring.flyway.validate-on-migrate=true
```

---

## Terraform Secrets Status

### Secrets that SHOULD exist in preprod GCP:
```
✅ preprod-db-password          (created by Terraform)
✅ preprod-db-username          (created by Terraform)
✅ preprod-db-url               (created by Terraform)
✅ preprod-data-encryption-key  (created by Terraform) ← Used by Fix 2
❓ preprod-jwt-secret           (needs verification)
✅ recaptcha-site-key           (shared, should exist)
✅ recaptcha-secret-key         (shared, should exist)
✅ admin-username               (shared, should exist)
✅ admin-password               (shared, should exist)
```

**Action**: Verify that `preprod-jwt-secret` and `preprod-data-encryption-key` exist in GCP Secret Manager

---

## Priority Order for Fixes

| Priority | Issue | Impact | Fix Time |
|----------|-------|--------|----------|
| 🔴 CRITICAL | JWT Secret Points to Production | Auth broken | 2 min |
| 🔴 CRITICAL | Missing Encryption Configuration | Feature won't work | 5 min |
| 🟡 HIGH | Hikari Pool Misconfigured | Connection issues | 5 min |
| 🟡 HIGH | Missing Security Features | Reduced security | 10 min |
| 🟢 MEDIUM | Flyway Validation Off | Migration failures | 2 min |
| 🟢 MEDIUM | Missing Audit Logging | No audit trail | 5 min |

---

## Checklist

- [ ] Fix JWT Secret reference (production → preprod-jwt-secret)
- [ ] Add encryption key configuration
- [ ] Update Hikari connection pool settings
- [ ] Add advanced security configurations
- [ ] Verify preprod-jwt-secret exists in GCP
- [ ] Verify preprod-data-encryption-key exists in GCP
- [ ] Update Flyway validation setting
- [ ] Test preprod deployment with new config
- [ ] Verify no functionality broken
- [ ] Document final configuration

---

## Related Issues

1. **Terraform**: Preprod state bucket was pointing to production (FIXED in commit 5fbdcb5)
2. **Application Config**: Now multiple issues found in application-preprod.properties (THIS DOCUMENT)
3. **Secrets**: Need to verify all required secrets exist in GCP Secret Manager

---

**Recommendation**: Apply fixes in priority order. Fixes 1-2 are critical for functionality. Fixes 3-5 improve reliability and security.
