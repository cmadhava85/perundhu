# Database User Configuration - Quick Reference

## ✅ Current Status

**Using:** `perundhu_user` with host `%`

```bash
NAME                    HOST  TYPE
perundhu_user           %     BUILT_IN  ← ✅ THIS ONE (CORRECT)
perundhu_user_readonly  %     BUILT_IN
root                    %     BUILT_IN
```

**NOT Using:** `perundhu_user` with empty/NULL host (malformed - would fail auth)

---

## How CD Pipeline Authenticates

```
1. Retrieve password from Secret Manager
   └─ gcloud secrets access latest --secret=db-password
   
2. Export as environment variable
   └─ export FLYWAY_PASSWORD="${DB_PASSWORD}"
   
3. Start Cloud SQL Proxy
   └─ cloud_sql_proxy -instances=perundhu-preprod-mysql=tcp:127.0.0.1:3306
   
4. Connect with Flyway
   └─ perundhu_user@% (from Secret Manager password)
   └─ URL: jdbc:mysql://127.0.0.1:3306/perundhu
```

---

## Key Improvements Made

| Item | Before | After | Impact |
|------|--------|-------|--------|
| **IPv4** | Disabled | ✅ Enabled | Proxy can connect |
| **User Host** | Mixed (both % and NULL) | ✅ Only % | No auth conflicts |
| **Password Handling** | CLI args | ✅ Env vars | Avoids escaping issues |
| **Terraform Drift** | Password recreates user | ✅ Lifecycle ignore | No malformed entries |
| **Password Sync** | Manual | ✅ Automated script | One command syncs all |

---

## Ready for CD Pipeline?

Run this check:

```bash
cd /Users/mchand69/Documents/perundhu

# Verify only correct user exists
gcloud sql users list \
  --instance=perundhu-preprod-mysql \
  --project=astute-strategy-406601 \
  --format="table(name,host,type)" \
  | grep perundhu_user

# Should output ONLY:
# perundhu_user           %     BUILT_IN
```

If you see an empty host entry, run:
```bash
./sync-db-password.sh
```

Then trigger the CD pipeline:
```bash
git push
```

---

## Files Updated

1. **`.github/workflows/cd-preprod.yml`** - Environment variable password handling
2. **`infrastructure/terraform/modules/database/main.tf`** - Lifecycle rules to prevent drift
3. **`sync-db-password.sh`** - Improved password synchronization script

## Status: ✅ READY FOR DEPLOYMENT
