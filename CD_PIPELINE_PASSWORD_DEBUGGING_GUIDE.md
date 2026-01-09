# CD Pipeline Password Retrieval & Flyway Authentication - Troubleshooting Guide

## 🔍 How the CD Pipeline Reads Database Password

### Current Flow

```
1. GitHub Actions Runner Authenticates to GCP
   ↓
2. Retrieves db-password from Secret Manager
   gcloud secrets versions access latest --secret=db-password
   ↓
3. Exports as Environment Variable
   export FLYWAY_PASSWORD="${DB_PASSWORD}"
   ↓
4. Pass to Gradle/Flyway
   -Pflyway.password="$FLYWAY_PASSWORD"
   ↓
5. Flyway Connects to Cloud SQL via Cloud SQL Proxy
   url: jdbc:mysql://127.0.0.1:3306/perundhu
   user: perundhu_user
   password: [from Secret Manager]
```

## 📋 Configuration Layers

### Layer 1: Secret Manager (Source of Truth)
```bash
# Where password lives
gcloud secrets versions access latest --secret=db-password --project=astute-strategy-406601

# Current status: ✅ Synced with database user
```

### Layer 2: Gradle/Flyway Configuration
File: `backend/build.gradle`

```gradle
flyway {
    password = project.findProperty('flyway.password') ?:      # From -P gradle parameter
              System.getenv('FLYWAY_PASSWORD') ?:              # From environment variable ← PRIMARY
              System.getenv('DB_PASSWORD') ?:                  # Fallback to env var
              'root'                                            # Default (don't use in production)
}
```

Priority: **Environment Variable > Gradle Parameter > Fallback**

### Layer 3: CD Pipeline Script
File: `.github/workflows/cd-preprod.yml`

```bash
# 1. Retrieve from Secret Manager
DB_PASSWORD=$(gcloud secrets versions access latest --secret=db-password)

# 2. Export as environment variable (used by Flyway)
export FLYWAY_PASSWORD="${DB_PASSWORD}"
export FLYWAY_USER="${DB_USER}"
export FLYWAY_URL="${FLYWAY_URL}"

# 3. Pass to Gradle (as backup)
./gradlew flywayMigrate \
    -Pflyway.password="$FLYWAY_PASSWORD" \
    -Pflyway.user="$FLYWAY_USER" \
    -Pflyway.url="$FLYWAY_URL"
```

## 🐛 Common Issues & Solutions

### Issue 1: "Access denied for user 'perundhu_user'"

**Symptoms:**
```
Error Code: 1045
Message: Access denied for user 'perundhu_user' (using password: YES)
```

**Root Causes:**
1. ❌ Database user password doesn't match Secret Manager password
2. ❌ Malformed user entry with no host (shadowing correct user)
3. ❌ Special characters in password need escaping

**Solution:**
```bash
# Step 1: Verify current users
gcloud sql users list --instance=perundhu-preprod-mysql --project=astute-strategy-406601

# Expected output:
# NAME              HOST
# perundhu_user    %      ← ✅ ONLY THIS
# perundhu_user_readonly %

# Step 2: If duplicate exists, sync password
./sync-db-password.sh

# This will:
# - Get latest password from Secret Manager
# - Set it on database user
# - Remove any malformed entries
```

### Issue 2: Environment Variables Not Being Read

**Symptoms:**
```
Flyway uses default password 'root' instead of actual password
```

**Debug:**
```bash
# Check if variables are exported in CI/CD
echo $FLYWAY_PASSWORD  # Should show password length

# Check if build.gradle can find environment variables
./gradlew properties | grep flyway
```

### Issue 3: Special Characters in Password Causing Shell Escaping Issues

**Symptoms:**
```
Password with characters like @, $, &, ", ` causing issues
```

**Fixed By:**
- Using environment variables instead of command-line parameters
- Proper double-quoting: `"$FLYWAY_PASSWORD"`
- Gradle handles the escaping internally

## ✅ Verification Checklist

Before running CD pipeline, verify:

- [ ] **Secret Manager has password**
  ```bash
  gcloud secrets versions access latest --secret=db-password --project=astute-strategy-406601
  ```

- [ ] **Database user exists and is correct**
  ```bash
  gcloud sql users list --instance=perundhu-preprod-mysql --project=astute-strategy-406601 --format="table(name,host)"
  # Should show: perundhu_user with host %
  ```

- [ ] **Password is synced**
  ```bash
  ./sync-db-password.sh
  ```

- [ ] **Cloud SQL Proxy can connect**
  ```bash
  # Local test (if Cloud SQL Proxy is running)
  mysql -h 127.0.0.1 -u perundhu_user -p"$(gcloud secrets versions access latest --secret=db-password --project=astute-strategy-406601)" -e "SELECT 1" perundhu
  ```

- [ ] **Flyway configuration is correct**
  ```bash
  grep -A 10 "flyway {" backend/build.gradle
  ```

## 📊 CD Pipeline Execution Flow

```
trigger: git push
  ↓
Check CI Status
  ↓
Build Backend Image
  ↓
Build Frontend Image
  ↓
Run Migrations (THIS IS WHERE PASSWORD IS USED)
  ├─ Authenticate to GCP
  ├─ Retrieve db-password from Secret Manager ← PASSWORD RETRIEVED HERE
  ├─ Export environment variables
  ├─ Start Cloud SQL Proxy (127.0.0.1:3306)
  ├─ Test proxy connectivity
  ├─ Run: ./gradlew flywayMigrate
  │  └─ Uses FLYWAY_PASSWORD environment variable
  └─ Kill proxy
  ↓
Deploy Backend
  ↓
Deploy Frontend
  ↓
Verify Services
```

## 🔐 Security Best Practices

1. **Never log the password**
   - ✅ We only log the password length
   - ❌ Don't use `echo $FLYWAY_PASSWORD`

2. **Use environment variables, not command-line params**
   - ✅ `export FLYWAY_PASSWORD=...` then use in gradle
   - ❌ `./gradlew -Pflyway.password=...` (visible in process list)

3. **Rotate password periodically**
   - Use: `gcloud secrets versions list --secret=db-password`
   - Previous versions are kept for rollback

4. **Sync password after any manual changes**
   - Run: `./sync-db-password.sh`
   - Ensures all layers are in sync

## 📝 Troubleshooting Steps

1. **Check Secret Manager**
   ```bash
   gcloud secrets versions access latest --secret=db-password --project=astute-strategy-406601
   echo $?  # Should be 0
   ```

2. **Check Database User**
   ```bash
   gcloud sql users list --instance=perundhu-preprod-mysql --project=astute-strategy-406601
   ```

3. **Sync Password**
   ```bash
   ./sync-db-password.sh
   ```

4. **Check CD Pipeline Logs**
   - Go to: GitHub Actions > CD - Preprod Deployment
   - Look for: "Migration Configuration" section
   - Verify URL, User, and Password length are correct

5. **Test Locally** (if you have Cloud SQL Proxy running)
   ```bash
   DB_PASS=$(gcloud secrets versions access latest --secret=db-password --project=astute-strategy-406601)
   mysql -h 127.0.0.1 -u perundhu_user -p"$DB_PASS" -e "SELECT 1" perundhu
   ```

## 🚀 Running the Pipeline

Once verified:
```bash
git push  # Triggers CD pipeline automatically
```

Monitor at: https://github.com/cmadhava85/perundhu/actions

---

**Last Updated:** 2026-01-09  
**Status:** ✅ All configurations synced and ready
