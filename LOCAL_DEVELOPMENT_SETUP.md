# Local Development Setup Guide

## Quick Fix: Make Backend Work Locally

### Problem
The backend is returning **403 Forbidden** for public endpoints like `/api/v1/bus-schedules/locations` because the **OriginValidationFilter** is blocking requests without proper Origin headers.

### Solution Options

---

## Option 1: Disable Origin Validation (Easiest)

Create or update `.env` file in the backend directory:

```bash
# Create .env file
cd /Users/mchand69/Documents/perundhu/backend
cat > .env << 'EOF'
# Disable origin validation for local development
ORIGIN_VALIDATION_ENABLED=false

# Optional: Also disable other security filters for easier testing
RATE_LIMIT_ENABLED=false
API_KEY_ENABLED=false
EOF
```

Then restart the backend:
```bash
# Kill existing backend
pkill -f "java.*perundhu" || lsof -ti:8080 | xargs kill -9

# Start with environment variables
cd /Users/mchand69/Documents/perundhu/backend
export $(cat .env | xargs) && ./gradlew bootRun --no-daemon
```

---

## Option 2: Use Local Dev Profile (Recommended)

Create `application-local.properties` for local development:

```bash
cd /Users/mchand69/Documents/perundhu/backend/app/src/main/resources

cat > application-local.properties << 'EOF'
# Local Development Configuration
# This file is for LOCAL ONLY - do NOT commit to git

# Disable security filters for local testing
security.origin-validation.enabled=false
security.origin-validation.strict-mode=false
rate-limit.enabled=false
security.api-key.enabled=false

# Allow all localhost origins
cors.allowed-origins=http://localhost:5173,http://localhost:4173,http://localhost:3000,http://localhost:8080

# Enable detailed logging
logging.level.com.perundhu.infrastructure.security=DEBUG
logging.level.org.springframework.security=DEBUG

# Database (local MySQL)
spring.datasource.url=jdbc:mysql://localhost:3306/perundhu?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root
EOF
```

Add to `.gitignore`:
```bash
echo "backend/app/src/main/resources/application-local.properties" >> .gitignore
```

Restart backend with local profile:
```bash
# Kill existing
pkill -f "java.*perundhu" || lsof -ti:8080 | xargs kill -9

# Start with local profile
cd /Users/mchand69/Documents/perundhu/backend
./gradlew bootRun --no-daemon --args='--spring.profiles.active=local'
```

---

## Option 3: Test with Proper Headers (For Production Testing)

If you want to keep security enabled and test with proper headers:

```bash
# Test with Origin header
curl -H "Origin: http://localhost:5173" \
     -H "Referer: http://localhost:5173/" \
     http://localhost:8080/api/v1/bus-schedules/locations | jq '.'

# Or use browser (automatically sends Origin/Referer)
# Open: http://localhost:5173
```

---

## Current Configuration Status

From `application.properties`:
```properties
# These are currently ENABLED by default:
security.origin-validation.enabled=true          # ← Blocking requests
security.origin-validation.strict-mode=false     # ← In non-strict mode (logs only)
rate-limit.enabled=true                          # ← Rate limiting active
security.api-key.enabled=false                   # ← API key validation disabled
```

**Issue:** Even though `strict-mode=false`, the OriginValidationFilter is still returning 403 for requests without Origin headers.

---

## Step-by-Step: Complete Local Setup

### 1. Stop Current Backend
```bash
# Kill all Java processes related to perundhu
pkill -f "java.*perundhu"

# Or kill by port
lsof -ti:8080 | xargs kill -9

# Verify port is free
lsof -i :8080
```

### 2. Choose Your Approach

**For Quick Testing (Option 1):**
```bash
cd /Users/mchand69/Documents/perundhu/backend
export ORIGIN_VALIDATION_ENABLED=false
export RATE_LIMIT_ENABLED=false
./gradlew clean bootRun --no-daemon
```

**For Proper Dev Setup (Option 2 - Recommended):**
```bash
# Create local config file (one time)
cd /Users/mchand69/Documents/perundhu/backend/app/src/main/resources
cat > application-local.properties << 'EOF'
security.origin-validation.enabled=false
rate-limit.enabled=false
logging.level.com.perundhu=DEBUG
EOF

# Start backend with local profile
cd /Users/mchand69/Documents/perundhu/backend
./gradlew bootRun --no-daemon --args='--spring.profiles.active=local'
```

### 3. Verify Backend Started
```bash
# Wait for startup (usually 20-30 seconds)
sleep 30

# Check if running
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}
```

### 4. Test Public Endpoint
```bash
# Test locations endpoint
curl http://localhost:8080/api/v1/bus-schedules/locations | jq '.[:3]'

# Should return location data without 403 error
```

### 5. Start Frontend (in separate terminal)
```bash
cd /Users/mchand69/Documents/perundhu/frontend
npm run dev

# Frontend should be at: http://localhost:5173
```

---

## Understanding the Security Filters

Current filter chain order:
1. **RateLimitingFilter** - Limits requests per minute
2. **OriginValidationFilter** - Validates Origin/Referer headers ← **This is blocking you**
3. **ApiKeyValidationFilter** - Validates API keys (disabled)
4. **AdminBasicAuthFilter** - Basic auth for admin endpoints
5. Spring Security Authorization

### Why `/api/v1/bus-schedules/locations` Returns 403:

Even though it's in `ALWAYS_ALLOWED_PATHS`, the filter logic has a bug:

```java
// In OriginValidationFilter.java (line 76-79)
if (ALWAYS_ALLOWED_PATHS.stream().anyMatch(path::startsWith)) {
    filterChain.doFilter(request, response);  // Should allow
    return;
}
```

**The path IS allowed**, but there's likely another issue in the code flow or the backend didn't recompile after your change.

---

## Troubleshooting

### Backend Won't Start
```bash
# Check port in use
lsof -i :8080

# Force kill
lsof -ti:8080 | xargs kill -9

# Check Gradle daemon
cd /Users/mchand69/Documents/perundhu/backend
./gradlew --stop
```

### Still Getting 403
```bash
# Verify the filter is actually disabled
curl -v http://localhost:8080/actuator/health 2>&1 | grep "X-"

# Check logs for filter activity
tail -f /Users/mchand69/Documents/perundhu/backend/logs/perundhu.log | grep -i "origin\|validation"
```

### Clean Build
```bash
cd /Users/mchand69/Documents/perundhu/backend
./gradlew clean build --no-daemon
./gradlew bootRun --no-daemon
```

---

## Recommended: Create Startup Script

Create `start-local.sh` in backend directory:

```bash
#!/bin/bash
cd /Users/mchand69/Documents/perundhu/backend

# Kill existing processes
echo "Stopping existing backend..."
pkill -f "java.*perundhu" 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
sleep 2

# Stop Gradle daemons
echo "Stopping Gradle daemons..."
./gradlew --stop

# Set local development environment
export ORIGIN_VALIDATION_ENABLED=false
export RATE_LIMIT_ENABLED=false
export API_KEY_ENABLED=false
export SPRING_PROFILES_ACTIVE=local

# Start backend
echo "Starting backend with local profile..."
./gradlew bootRun --no-daemon

# Or use this for background:
# ./gradlew bootRun --no-daemon > /tmp/backend.log 2>&1 &
# echo "Backend starting... Check logs: tail -f /tmp/backend.log"
```

Make it executable:
```bash
chmod +x /Users/mchand69/Documents/perundhu/backend/start-local.sh
```

Run it:
```bash
/Users/mchand69/Documents/perundhu/backend/start-local.sh
```

---

## Environment Variables Reference

For local development, set these in your shell or `.env` file:

```bash
# Security Filters
export ORIGIN_VALIDATION_ENABLED=false
export ORIGIN_STRICT_MODE=false
export RATE_LIMIT_ENABLED=false
export API_KEY_ENABLED=false

# CORS
export CORS_ALLOWED_ORIGINS="http://localhost:5173,http://localhost:4173"

# Database
export DB_URL="jdbc:mysql://localhost:3306/perundhu?createDatabaseIfNotExist=true&useSSL=false"
export DB_USERNAME="root"
export DB_PASSWORD="root"

# JWT (optional for auth testing)
export JWT_SECRET="dev-secret-key-for-local-testing"
```

---

## Quick Command Reference

```bash
# Kill backend
pkill -f "java.*perundhu"

# Start backend (quick)
cd /Users/mchand69/Documents/perundhu/backend
export ORIGIN_VALIDATION_ENABLED=false && ./gradlew bootRun --no-daemon

# Start backend (proper)
cd /Users/mchand69/Documents/perundhu/backend
./gradlew bootRun --no-daemon --args='--spring.profiles.active=local'

# Test endpoint
curl http://localhost:8080/api/v1/bus-schedules/locations | jq '.[:3]'

# Check health
curl http://localhost:8080/actuator/health

# View logs
tail -f backend/logs/perundhu.log
```

---

## Next Steps

1. ✅ Choose Option 1 or Option 2 above
2. ✅ Restart backend with security disabled
3. ✅ Test `/api/v1/bus-schedules/locations` endpoint
4. ✅ Start frontend if needed
5. ✅ Develop without 403 errors!

**For production deployment**, enable all security filters back by setting environment variables or using proper profiles (dev, preprod, prod).
