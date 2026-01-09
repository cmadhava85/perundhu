# CD Pipeline Verification Checklist - Step by Step

## Status Check (Run These Commands)

### Step 1️⃣: Verify Secret Manager Has Password
```bash
cd /Users/mchand69/Documents/perundhu

# Check if password exists
gcloud secrets versions access latest --secret=db-password --project=astute-strategy-406601 > /tmp/pw.txt
echo "Password length: $(cat /tmp/pw.txt | wc -c) characters"
cat /tmp/pw.txt | head -c 10
echo "..."  # Don't expose full password
```

### Step 2️⃣: Verify Database User Exists
```bash
# Check users
gcloud sql users list \
  --instance=perundhu-preprod-mysql \
  --project=astute-strategy-406601 \
  --format="table(name,host)"

# Expected output:
# NAME                  HOST
# perundhu_user         %
# perundhu_user_readonly %
# 
# DO NOT WANT:
# perundhu_user        (NULL or empty host)
```

### Step 3️⃣: Check Current Database Connection String
```bash
# Verify Flyway will connect to correct database
echo "Database: perundhu"
echo "User: perundhu_user"
echo "Host: 127.0.0.1:3306 (via Cloud SQL Proxy)"
echo "URL: jdbc:mysql://127.0.0.1:3306/perundhu?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&connectTimeout=60000&socketTimeout=120000"
```

### Step 4️⃣: Verify CD Pipeline Configuration
```bash
# Check the pipeline file
grep -A 5 "FLYWAY_PASSWORD" .github/workflows/cd-preprod.yml

# Expected:
# export FLYWAY_PASSWORD="${DB_PASSWORD}"
# export FLYWAY_USER="${DB_USER}"
# export FLYWAY_URL="${FLYWAY_URL}"
```

### Step 5️⃣: Verify Gradle Flyway Config
```bash
# Check build.gradle supports environment variables
grep -A 10 "flyway {" backend/build.gradle | head -20

# Expected:
# password = project.findProperty('flyway.password') ?:
#            System.getenv('FLYWAY_PASSWORD') ?:
#            System.getenv('DB_PASSWORD') ?:
#            'root'
```

## 🚀 Ready to Deploy?

If all checks above pass ✅, then:

```bash
# Option A: Trigger via Git Push
git push

# Option B: Trigger via GitHub Actions UI
# Go to: https://github.com/cmadhava85/perundhu/actions
# Select: "CD - Preprod Deployment"
# Click: "Run workflow"
# Click: "Run workflow" button in dialog
```

## 📊 Monitoring the Pipeline

Once triggered:

1. Go to: https://github.com/cmadhava85/perundhu/actions
2. Click on: "CD - Preprod Deployment" workflow
3. Click on: Latest run
4. Expand: "Run Migrations" step
5. Look for: ✅ "Flyway migrations completed successfully"

### Expected Log Output

```
⏳ Waiting for proxy to be ready...
✅ Cloud SQL Proxy ready on port 3306
✅ Proxy connection verified
📋 Migration Configuration:
   URL: jdbc:mysql://127.0.0.1:3306/perundhu?useSSL=false&...
   User: perundhu_user
   Password length: 32 chars
🔄 Running Flyway migrations through proxy...
✅ Flyway migrations completed successfully
```

### If Migration Fails

Look for error message like:
```
Access denied for user 'perundhu_user'@'cloud-sql-proxy~IP'
```

Then:

1. Run: `./sync-db-password.sh`
2. Check for malformed user entries: `gcloud sql users list --instance=perundhu-preprod-mysql --project=astute-strategy-406601 --format="table(name,host)"`
3. If duplicate exists: `gcloud sql users delete perundhu_user --instance=perundhu-preprod-mysql --quiet`
4. Re-run pipeline

## 🔐 How It Works (Detailed)

```
1. GitHub Actions CI Pipeline runs and succeeds
   ↓
2. CD Pipeline triggers automatically (or manual workflow_dispatch)
   ↓
3. Check CI Status: if CI passed or manual trigger, proceed
   ↓
4. Build Backend Docker Image
   ├─ Authenticate to GCP
   ├─ Build JAR: ./gradlew build -x test
   ├─ Build Docker image for linux/amd64
   └─ Push to Artifact Registry
   ↓
5. Build Frontend Docker Image
   ├─ Authenticate to GCP
   ├─ Get Google Maps API key from Secret Manager
   ├─ Build Docker image for linux/amd64
   └─ Push to Artifact Registry
   ↓
6. Run Migrations (CRITICAL STEP WHERE PASSWORD IS USED)
   ├─ Authenticate to GCP
   ├─ Install Cloud SQL Proxy v2
   ├─ Retrieve DB_PASSWORD from Secret Manager
   │  └─ Command: gcloud secrets versions access latest --secret=db-password
   ├─ Export as environment variables:
   │  ├─ FLYWAY_PASSWORD="${DB_PASSWORD}"
   │  ├─ FLYWAY_USER="perundhu_user"
   │  └─ FLYWAY_URL="jdbc:mysql://127.0.0.1:3306/perundhu..."
   ├─ Start Cloud SQL Proxy
   │  └─ Listens on: 127.0.0.1:3306
   ├─ Verify proxy is ready (netcat check)
   ├─ Test connection with mysql client
   ├─ Run Flyway migration with:
   │  └─ ./gradlew flywayMigrate \
   │     -Pflyway.url="$FLYWAY_URL" \
   │     -Pflyway.user="$FLYWAY_USER" \
   │     -Pflyway.password="$FLYWAY_PASSWORD"
   ├─ Gradle passes environment variables to Flyway
   ├─ Flyway connects to Cloud SQL via proxy
   └─ If successful: ✅, if failed: repair and retry
   ↓
7. Deploy Backend
   ├─ Authenticate to GCP
   ├─ Deploy Docker image to Cloud Run
   ├─ Set environment variables:
   │  ├─ SPRING_DATASOURCE_PASSWORD (from Secret Manager)
   │  ├─ SPRING_DATASOURCE_USERNAME
   │  └─ Other Spring Boot configs
   └─ Verify deployment
   ↓
8. Deploy Frontend
   ├─ Authenticate to GCP
   ├─ Deploy Docker image to Cloud Run
   └─ Verify deployment
   ↓
9. Verify Services
   ├─ Test backend API endpoints
   ├─ Test frontend accessibility
   └─ Done ✅
```

## 📝 Key Improvements in Current Pipeline

✅ **Password Retrieved from Secret Manager**
- Uses: `gcloud secrets versions access latest --secret=db-password`
- More secure than hardcoding

✅ **Environment Variables for Password**
- Uses: `export FLYWAY_PASSWORD="${DB_PASSWORD}"`
- Avoids shell escaping issues with special characters
- More secure than command-line parameters

✅ **Comprehensive Debugging**
- Shows: URL, User, Password length
- Shows: Proxy startup, port binding
- Shows: Connection test status

✅ **Fault Tolerance**
- Tests connection before migration
- Has repair mechanism if migration fails
- 60 second timeout for proxy initialization

✅ **Proper Proxy Management**
- Starts with verbose logging
- Waits for readiness
- Properly kills proxy after done

## 💡 If You Get "Access denied" Error

### Root Cause #1: Database User Password Mismatch

```bash
# Symptom: "Access denied for user 'perundhu_user' (using password: YES)"

# Solution:
./sync-db-password.sh

# This script will:
# 1. Get password from Secret Manager
# 2. Update database user password
# 3. Verify they match
```

### Root Cause #2: Malformed User Entry

```bash
# Symptom: Same as above, but password is correct

# Check:
gcloud sql users list --instance=perundhu-preprod-mysql --project=astute-strategy-406601 --format="table(name,host)"

# If you see NULL or empty host, DELETE:
gcloud sql users delete perundhu_user --instance=perundhu-preprod-mysql --quiet

# Wait 10 seconds, then verify:
gcloud sql users list --instance=perundhu-preprod-mysql --project=astute-strategy-406601 --format="table(name,host)"

# Should show ONLY:
# perundhu_user    %
```

### Root Cause #3: Cloud SQL Proxy Not Ready

```bash
# Symptom: "Failed to open port 3306" or timeout

# Usually fixes itself with:
# 1. Wait 30 seconds (takes time for proxy to connect to Cloud SQL instance)
# 2. Verify Cloud SQL instance is running:
gcloud sql instances describe perundhu-preprod-mysql \
  --project=astute-strategy-406601 \
  --format="value(state)"
# Should output: RUNNABLE

# 3. Check instance has public IP:
gcloud sql instances describe perundhu-preprod-mysql \
  --project=astute-strategy-406601 \
  --format="table(ipAddresses[0].ipAddress)"
```

---

**Ready to proceed?** Run the verification steps above, then trigger the pipeline!
