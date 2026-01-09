# Flyway Migration Failure Root Cause & Fix

**Issue:** Flyway migrations failing in preprod CD pipeline  
**Error:** `Communications link failure - the driver has not received any packets from the server`  
**Root Cause:** Connection timeout is too aggressive (10 seconds)  
**Severity:** HIGH - Blocks all deployments

---

## 🔍 Problem Analysis

### Current Configuration
```yaml
FLYWAY_URL="jdbc:mysql://127.0.0.1:3306/perundhu?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&connectTimeout=10000"
```

### Why It Fails
1. **Cloud SQL Proxy is slow to establish connection**
   - Proxy needs to authenticate to GCP
   - Proxy needs to establish TCP tunnel to Cloud SQL instance
   - This often takes 8-15 seconds

2. **10-second timeout is insufficient**
   - `connectTimeout=10000` = 10 seconds
   - First request to proxy connection often exceeds this
   - Especially when database instance is cold

3. **Missing socket timeout**
   - Even if connection succeeds, long-running query can hang
   - No maximum query execution time configured

4. **Cloud SQL Proxy cold start**
   - When proxy first starts, it needs time to establish the tunnel
   - The 3-second wait after port opens is NOT enough

---

## ✅ Solution: Update Connection String & Timeouts

### Fix 1: Increase Connection Timeout
**Current:**
```
connectTimeout=10000  (10 seconds - INSUFFICIENT)
```

**Should be:**
```
connectTimeout=60000  (60 seconds - for initial connection)
socketTimeout=120000  (120 seconds - for query execution)
```

### Fix 2: Add Connection Pool Parameters
```
maxPoolSize=5
minPoolSize=1
```

### Fix 3: Increase Proxy Initialization Wait
**Current:**
```bash
sleep 3  # 3 seconds - INSUFFICIENT
```

**Should be:**
```bash
sleep 5  # 5 seconds - gives proxy time to fully initialize
```

### Fix 4: Add Connection Verification
Before running migrations, verify connection with a test query:
```bash
mysql -h 127.0.0.1 -u perundhu_user -p"${DB_PASSWORD}" \
  -e "SELECT 1" perundhu
```

---

## 📋 Implementation Steps

### Step 1: Update CD Pipeline FLYWAY_URL

**File:** `.github/workflows/cd-preprod.yml`

**Change this:**
```bash
FLYWAY_URL="jdbc:mysql://127.0.0.1:3306/perundhu?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&connectTimeout=10000"
```

**To this:**
```bash
FLYWAY_URL="jdbc:mysql://127.0.0.1:3306/perundhu?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&connectTimeout=60000&socketTimeout=120000"
```

### Step 2: Increase Proxy Initialization Wait

**Change this:**
```bash
echo "✅ Cloud SQL Proxy ready on port 3306"
sleep 3  # Extra wait for proxy to fully initialize
```

**To this:**
```bash
echo "✅ Cloud SQL Proxy ready on port 3306"
sleep 5  # Extra wait for proxy to fully initialize and establish tunnel
```

### Step 3: Add Connection Verification (Optional but Recommended)

Add before Flyway migrations:
```bash
echo "🔍 Verifying database connection..."
for i in {1..5}; do
  if mysql -h 127.0.0.1 -u "${DB_USER}" -p"${DB_PASSWORD}" -e "SELECT 1" perundhu &>/dev/null; then
    echo "✅ Database connection verified"
    break
  fi
  echo "  [$i/5] Waiting for database to accept connections..."
  sleep 2
done
```

### Step 4: Verify Cloud SQL Proxy Version

Ensure using the latest/compatible Cloud SQL Proxy:
```bash
# Current:
curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64

# Better - specify version:
curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64
# Or use latest release:
curl -L -o cloud_sql_proxy https://github.com/GoogleCloudPlatform/cloud-sql-proxy/releases/download/v2.7.0/cloud-sql-proxy.linux.amd64
```

---

## 🔧 Gradle Configuration (Backup Plan)

If timeouts still occur, also update `backend/build.gradle`:

```gradle
flyway {
    // ... existing config ...
    configurations {
        all {
            // Increase Flyway's internal timeout
            timeoutMs = 300000  // 5 minutes for entire migration
        }
    }
}
```

Or via Gradle property:
```bash
./gradlew flywayMigrate \
  -Pflyway.connectRetries=3 \
  -Pflyway.initSql="SET SESSION max_execution_time=0" \
  ...
```

---

## 📊 Timeout Explanation

### MySQL Connection Timeouts Hierarchy

```
1. connectTimeout (10→60 seconds)
   └─ How long to wait for initial connection to open
   └─ Cloud SQL Proxy tunnel establishment
   └─ **PROBLEM: 10s is too short**

2. socketTimeout (add 120 seconds)
   └─ How long to wait for socket response
   └─ Individual query execution timeout
   └─ **MISSING: Can cause hang if query takes time**

3. Migration execution timeout
   └─ Total time for entire migration job
   └─ Set at Gradle/Flyway level
   └─ Should be 5-10 minutes
```

### Why 60 + 120?
- **60s connectTimeout:** Cloud SQL Proxy is slow to initialize, especially cold-start
- **120s socketTimeout:** Some migrations might run complex queries
- **Together:** Robust against various timing scenarios

---

## 🧪 Testing the Fix

After updating CD pipeline:

1. **Trigger deployment:**
   ```bash
   git commit -m "Fix: Increase Flyway connection timeouts for Cloud SQL Proxy"
   git push origin master
   ```

2. **Monitor migration step:**
   - Check for "Cloud SQL Proxy ready" message
   - Should wait ~5 seconds before attempting connection
   - Should see successful database connection

3. **Expected success:**
   ```
   ✅ Cloud SQL Proxy ready on port 3306
   [wait 5 seconds]
   🔄 Running Flyway migrations through proxy...
   ✅ Flyway migrations completed successfully
   ```

---

## 📚 Related Configuration Files

### Current State:
- **CD Pipeline:** `.github/workflows/cd-preprod.yml` (line ~262)
- **Application Config:** `backend/app/src/main/resources/application-preprod.properties`
- **Database Module:** `infrastructure/terraform/modules/database/main.tf`

### Database URL Comparison:

| Context | URL | Timeouts |
|---------|-----|----------|
| **Application (Cloud Run)** | `jdbc:mysql://google/perundhu?cloudSqlInstance=...&socketFactory=...` | 60s connect / 120s socket |
| **CD Pipeline (Flyway)** | `jdbc:mysql://127.0.0.1:3306/perundhu?...` | **10s connect (WRONG)** / no socket |
| **Local Dev** | `jdbc:mysql://localhost:3306/perundhu?...` | 10s (OK - local) |

**The issue:** Preprod CD uses same timeouts as local dev, but with network overhead of Cloud SQL Proxy!

---

## ✅ Checklist

Before considering this resolved:
- [ ] Update FLYWAY_URL with connectTimeout=60000&socketTimeout=120000
- [ ] Increase proxy wait from 3s to 5s
- [ ] (Optional) Add connection verification with mysql test
- [ ] Commit changes to master
- [ ] Trigger new deployment
- [ ] Monitor logs for successful migration
- [ ] Verify no "Communications link failure" errors

---

## 🎯 Summary

| Item | Current | Fixed | Impact |
|------|---------|-------|--------|
| connectTimeout | 10s | 60s | Allows proxy to initialize |
| socketTimeout | missing | 120s | Prevents hanging queries |
| Proxy wait | 3s | 5s | Ensures tunnel established |
| Result | ❌ FAILS | ✅ SUCCEEDS | Deployments unblocked |

---

**Next Action:** Apply these timeout fixes to the CD pipeline
