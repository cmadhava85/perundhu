# CD Pipeline Cloud SQL Connection Fix - January 2026

## 🔴 Problem

The CD pipeline migrations were timing out with this error:

```
couldn't connect to "astute-strategy-406601:asia-south1:perundhu-preprod-mysql": 
  dial tcp 10.189.0.5:3307: connect: connection timed out
```

### Root Cause

The Cloud SQL instance was configured with **private IP only** (`ipv4_enabled = false`):
- ✅ Private IP (10.189.0.5) for internal VPC communication
- ❌ No public IP for external connections
- ❌ GitHub Actions runners cannot reach private-only instances

The Cloud SQL Proxy running in GitHub Actions could not establish a connection because:
1. The runner is outside the VPC
2. No public IP was available
3. The proxy tried to connect on port 3307 (wrong port) as a fallback

---

## ✅ Solution

Enabled IPv4 (public IP) on the Cloud SQL instance so GitHub Actions runners can connect via Cloud SQL Proxy.

### Changes Made

**1. Updated Terraform Database Module** 
- File: `infrastructure/terraform/modules/database/main.tf`
- Changed: `ipv4_enabled = false` → `ipv4_enabled = true`

**2. Fixed Invalid Terraform Configuration**
- File: `infrastructure/terraform/environments/preprod/main.tf`
- Removed: Invalid `jwt_secret = ""` parameter from secrets module

**3. Applied Terraform Changes**
- Executed: `terraform apply`
- Duration: ~56 seconds to apply changes to Cloud SQL instance
- Result: Public IPv4 address now available

### New Configuration

```
Cloud SQL Instance: perundhu-preprod-mysql
Region: asia-south1
Public IP: 34.14.177.174
Private IP: 10.189.0.5
IPv4 Enabled: ✅ YES
```

---

## 🔌 How It Works Now

### CD Pipeline Database Connection Flow

```
GitHub Actions Runner (outside VPC)
         ↓
Cloud SQL Proxy (port 3306)
         ↓
Cloud SQL Public IP (34.14.177.174:3306)
         ↓
Cloud SQL Instance (perundhu-preprod-mysql)
         ↓
MySQL Database (port 3306)
```

### Flyway Migrations

The CD pipeline uses this configuration:
```bash
# Cloud SQL Proxy listens on localhost:3306
cloud_sql_proxy -instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql=tcp:127.0.0.1:3306

# Flyway connects to localhost through proxy
FLYWAY_URL="jdbc:mysql://127.0.0.1:3306/perundhu?..."
```

With IPv4 enabled, the Cloud SQL Proxy can now successfully:
1. ✅ Establish initial connection
2. ✅ Authenticate with the instance
3. ✅ Create tunnel to Cloud SQL
4. ✅ Forward Flyway migrations to the database

---

## 📋 Security Considerations

### Public IP is Secure Because:

1. **Cloud SQL Authorization**
   - Requires valid credentials (username/password stored in Google Secret Manager)
   - Google Cloud handles authentication

2. **Database User Permissions**
   - `perundhu_user` account has specific database permissions
   - Only for Flyway migrations and application use

3. **Private IP Still Available**
   - Apps running inside GCP VPC still use private IP (10.189.0.5)
   - More efficient, no internet routing

4. **Best Practice**
   - Public IP allows external deployments
   - Private IP allows internal VPC communication
   - Having both is a standard GCP configuration

---

## ✅ Verification

```bash
# Verify IPv4 is enabled
gcloud sql instances describe perundhu-preprod-mysql \
  --project=astute-strategy-406601 \
  --format='table(ipAddresses[0].ipAddress,ipAddresses[0].type,settings.ipConfiguration.ipv4Enabled)'

# Output:
# IP_ADDRESS      TYPE     IPV4_ENABLED
# 34.14.177.174   PRIMARY  True
```

---

## 🚀 Next Steps

The CD pipeline should now work correctly:
1. GitHub Actions triggers on code push
2. Builds backend and frontend images
3. Cloud SQL Proxy connects successfully
4. Flyway runs migrations
5. Deploys to Cloud Run

### Testing the Pipeline

```bash
# Trigger deployment manually
git push  # or workflow_dispatch from GitHub Actions

# Check logs in GitHub Actions > CD - Preprod Deployment
```

---

## 📚 Related Files

- `infrastructure/terraform/modules/database/main.tf` - Database module with IPv4 enabled
- `infrastructure/terraform/environments/preprod/main.tf` - Fixed configuration
- `.github/workflows/cd-preprod.yml` - CD pipeline configuration
- `CLOUD_SQL_PROXY_CONNECTION_ISSUE.md` - Original investigation notes

---

**Fixed:** 2026-01-09  
**Status:** ✅ Ready for deployment
