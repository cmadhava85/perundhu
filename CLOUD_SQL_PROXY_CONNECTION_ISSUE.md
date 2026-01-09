# Cloud SQL Proxy Connection Issue - Root Cause Analysis

## 🔴 The Real Problem

```
Cloud SQL Proxy Error:
couldn't connect to "astute-strategy-406601:asia-south1:perundhu-preprod-mysql": 
  dial tcp 10.189.0.5:3307: connect: connection timed out
```

### What This Means

1. **Cloud SQL Proxy successfully started** ✅
   - It's listening on 127.0.0.1:3306 for Flyway

2. **Cloud SQL Proxy tried to reach the actual database** but failed ❌
   - Target: 10.189.0.5:3307 (private IP of Cloud SQL instance)
   - Issue: Connection timed out (can't reach it)

3. **Root causes could be:**
   - Database instance doesn't exist
   - Database is on the wrong port (3307 vs 3306)
   - Firewall rules block the connection from GitHub Actions runner
   - VPC/Private IP isn't accessible from GitHub Actions
   - Database instance is not running

---

## 🔍 Investigation Needed

### Check 1: Does the Database Instance Exist?

```bash
gcloud sql instances list --project=astute-strategy-406601

# Expected output should show:
# NAME                          DATABASE_VERSION  LOCATION      TIER        STATUS
# perundhu-preprod-mysql        MYSQL_8_0         asia-south1   db-f1-micro UP
```

**Status:** ⚠️ VERIFY

### Check 2: What's the Correct Instance Name?

From terraform.tfvars:
- `environment = "preprod"`
- `app_name = "perundhu"`
- `db_instance_name_suffix = ""` (EMPTY)

So the instance name should be:
```
{app_name}-{environment}-mysql{suffix}
= perundhu-preprod-mysql (NO SUFFIX)
```

**Status:** ⚠️ VERIFY this matches what exists in GCP

### Check 3: Instance Configuration

```bash
gcloud sql instances describe perundhu-preprod-mysql \
  --project=astute-strategy-406601

# Key things to check:
# - databaseVersion: MYSQL_8_0 ✓
# - region: asia-south1 ✓
# - tier: db-f1-micro ✓
# - ipAddresses[0].ipAddress: Should show private IP
# - ipAddresses[0].type: Should be PRIVATE
```

**Status:** ⚠️ VERIFY private IP matches 10.189.0.5

### Check 4: Can Cloud SQL Proxy Reach It?

The error shows Cloud SQL Proxy is trying port **3307** not 3306:
```
dial tcp 10.189.0.5:3307: connect: connection timed out
```

This is **WRONG**. Cloud SQL instances run on MySQL port **3306**, not 3307.

**Status:** 🔴 CRITICAL - Proxy is using wrong port!

---

## 🚨 The Issue: Cloud SQL Proxy Port

### Standard MySQL Port
- MySQL server port: **3306**
- Cloud SQL instance uses: **3306**

### What the error shows
- Cloud SQL Proxy trying to reach: **3307** ❌ WRONG!

### Why This Happens
Cloud SQL Proxy should connect to the Cloud SQL instance on **3306**, but something is telling it to use **3307**.

**Possible causes:**
1. Old Cloud SQL Proxy version using wrong default
2. Instance configuration specifies port 3307
3. Command-line option error

### What the CD Pipeline Does
```bash
cloud_sql_proxy -instances=${{ env.SQL_INSTANCE }}=tcp:127.0.0.1:3306 -max_connections=100 &
```

This command tells Cloud SQL Proxy:
- Listen on: 127.0.0.1:3306 (for Flyway to connect)
- Connect to: astute-strategy-406601:asia-south1:perundhu-preprod-mysql (uses DEFAULT port)

The **default port for Cloud SQL connections should be 3306**, not 3307.

---

## ✅ Solutions to Try (In Order)

### Solution 1: Verify Database Instance Exists and is Running

```bash
# Check if instance exists
gcloud sql instances list --project=astute-strategy-406601 | grep perundhu-preprod-mysql

# Check instance details
gcloud sql instances describe perundhu-preprod-mysql \
  --project=astute-strategy-406601

# Check instance status (should be RUNNABLE)
gcloud sql instances describe perundhu-preprod-mysql \
  --project=astute-strategy-406601 \
  --format='value(state)'

# Expected output: RUNNABLE
```

**If instance doesn't exist:**
```bash
# Create it using Terraform
cd infrastructure/terraform/environments/preprod
terraform init
terraform apply
```

### Solution 2: Check Instance Network Configuration

```bash
# Verify private IP is set
gcloud sql instances describe perundhu-preprod-mysql \
  --project=astute-strategy-406601 \
  --format='value(ipAddresses[0].ipAddress,ipAddresses[0].type)'

# Should show:
# 10.x.x.x (some private IP)
# PRIVATE
```

### Solution 3: Explicit Port in Cloud SQL Proxy Command

```bash
# Current (using default port):
cloud_sql_proxy -instances=${{ env.SQL_INSTANCE }}=tcp:127.0.0.1:3306 &

# Try explicit port:
cloud_sql_proxy -instances=${{ env.SQL_INSTANCE }}=tcp:127.0.0.1:3306 \
  -port=3306 \
  -max_connections=100 &
```

### Solution 4: Use Latest Cloud SQL Proxy Version

```bash
# Current in CD pipeline:
curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64

# Try latest version instead:
curl -L -o cloud_sql_proxy https://github.com/GoogleCloudPlatform/cloud-sql-proxy/releases/download/v2.7.0/cloud-sql-proxy.linux.amd64
chmod +x cloud_sql_proxy
./cloud_sql_proxy --version
```

---

## 🎯 Most Likely Issue

The **database instance probably doesn't exist or isn't running**. 

When Cloud SQL instance doesn't exist, Cloud SQL Proxy can't connect to it and tries alternative ports (3307) which also fail.

### Quick Fix Steps:
1. Verify `perundhu-preprod-mysql` exists in GCP
2. If not, apply Terraform to create it
3. If yes, check why it's not accepting connections on port 3306
4. Try restarting the instance if needed

---

## 📋 What to Check in GCP Console

Go to: **Cloud SQL > Instances**

Look for: `perundhu-preprod-mysql`

Check:
- [ ] Instance exists?
- [ ] Status: RUNNABLE?
- [ ] Region: asia-south1?
- [ ] Tier: db-f1-micro?
- [ ] Private IP assigned?
- [ ] VPC network configured?

If any are missing/wrong, Terraform needs to be applied.

---

**Next Action:** Verify database instance exists and is running in GCP
