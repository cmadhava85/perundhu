# Database User Configuration - Final Solution

## ✅ Correct Configuration

**We use and should ONLY have:**
```
perundhu_user with host %
```

This allows the user to connect from any host (localhost, Cloud SQL Proxy, etc.).

## ❌ What We DON'T Want

```
perundhu_user with empty/NULL host  ← MALFORMED (causes auth failures)
```

## Why the Empty Host Entry Appears

**Root Cause:** `gcloud sql users set-password` without specifying `--host` creates a new entry with empty host instead of updating the existing one.

**Solution Implemented:**
1. ✅ Added `type = "BUILT_IN"` to Terraform user resource
2. ✅ Added `lifecycle { ignore_changes = [password] }` to prevent Terraform from recreating user
3. ✅ Modified sync script to use `gcloud sql users create` with explicit host `%`
4. ✅ Delete malformed entries immediately if they appear

## Current State

```bash
NAME                    HOST  TYPE
perundhu_user           %     BUILT_IN  ← ✅ CORRECT (we use this)
perundhu_user_readonly  %     BUILT_IN
root                    %     BUILT_IN
```

## Password Management Flow

### Priority (Highest to Lowest)
1. **Secret Manager** - Source of truth (gcloud secret `db-password`)
2. **Database User Password** - Set to match Secret Manager
3. **Application Environment Variables** - Uses both above

### Sync Process
```bash
Secret Manager
     ↓
./sync-db-password.sh
     ↓
Database User (perundhu_user@%)
```

### How CD Pipeline Uses It
```
GitHub Actions
    ↓
gcloud secrets access latest --secret=db-password
    ↓
export FLYWAY_PASSWORD="${DB_PASSWORD}"
    ↓
./gradlew flywayMigrate -Pflyway.password="$FLYWAY_PASSWORD"
    ↓
Flyway connects to Cloud SQL via proxy
    ↓
Authentication: perundhu_user@% with Secret Manager password ✅
```

## Emergency Cleanup (If Malformed Entry Appears)

```bash
# Check current state
gcloud sql users list --instance=perundhu-preprod-mysql \
  --project=astute-strategy-406601 --format="table(name,host,type)"

# If you see perundhu_user with empty host:
gcloud sql users delete perundhu_user \
  --instance=perundhu-preprod-mysql \
  --project=astute-strategy-406601 \
  --quiet

# Wait 5 seconds
sleep 5

# Verify only correct one remains
gcloud sql users list --instance=perundhu-preprod-mysql \
  --project=astute-strategy-406601 --format="table(name,host,type)"

# Re-sync password
./sync-db-password.sh
```

## Terraform Configuration (Latest)

File: `infrastructure/terraform/modules/database/main.tf`

```terraform
resource "google_sql_user" "users" {
  name     = var.database_user          # "perundhu_user"
  instance = google_sql_database_instance.mysql_instance.name
  password = random_password.db_password.result
  host     = "%"                        # Allow any host ✅
  type     = "BUILT_IN"                 # Explicit type to prevent conflicts

  # Ignore password changes - we manage via Secret Manager/sync script
  lifecycle {
    ignore_changes = [password]
  }
}
```

## Testing Connection

```bash
# Get password from Secret Manager
DB_PASS=$(gcloud secrets versions access latest --secret=db-password \
  --project=astute-strategy-406601)

# Test connection (with Cloud SQL Proxy running on 127.0.0.1:3306)
mysql -h 127.0.0.1 -u perundhu_user -p"$DB_PASS" -e "SELECT 1" perundhu

# Success output: Should show "1" with no errors
```

## CD Pipeline Check Points

Before triggering CD pipeline, verify:

- [ ] Only `perundhu_user` with host `%` exists
  ```bash
  gcloud sql users list --instance=perundhu-preprod-mysql \
    --project=astute-strategy-406601 --format="table(name,host,type)" \
    | grep "perundhu_user"
  ```

- [ ] Password is synced
  ```bash
  ./sync-db-password.sh
  ```

- [ ] No malformed entries
  ```bash
  gcloud sql users list --instance=perundhu-preprod-mysql \
    --project=astute-strategy-406601 \
    --filter="name=perundhu_user AND host=''" \
    --format="value(name)" | wc -l
  # Should output: 0
  ```

## Summary

| Item | Status | Configuration |
|------|--------|----------------|
| **User to Use** | ✅ Active | `perundhu_user` with host `%` |
| **User to Avoid** | ❌ Never | `perundhu_user` with empty host |
| **Password Source** | ✅ Synced | Secret Manager (gcloud secret db-password) |
| **Terraform Drift** | ✅ Fixed | `lifecycle { ignore_changes = [password] }` |
| **Auth Mechanism** | ✅ Working | Environment variables in CD pipeline |

---
**Last Updated:** January 8, 2026
**Status:** ✅ Ready for CD Pipeline Deployment
