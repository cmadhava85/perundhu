# Malformed User Prevention & Cleanup

## Changes Made

### 1. Updated Terraform Module
**File:** `infrastructure/terraform/modules/database/main.tf`

Added explicit documentation and verification that `host = "%"` is always specified:
- Both `google_sql_user.users` and `google_sql_user.readonly_user` now have comments explaining why `host = "%"` is required
- Prevents future malformed user creation from Terraform

### 2. Enhanced Sync Script
**File:** `sync-db-password.sh`

Updated to prevent malformed users in three ways:

**a) Cleaner User Recreation:**
- Deletes ALL user instances first (both malformed and correct)
- Waits 3 seconds for Cloud SQL to process
- Recreates with explicit `--host="%"` parameter

**b) Stricter Verification:**
- Counts correct entries (user with `host="%"`)
- Counts malformed entries (user without host)
- If any malformed entries exist, performs automatic cleanup

**c) Final Safety Check:**
- Verifies exactly 1 correct user exists
- If issues persist, performs "nuclear option" (delete all + recreate)
- Detailed verification report

---

## How It Works

### Malformed User Problem
```
❌ BAD: perundhu_user (with empty/NULL host)
❌ BAD: perundhu_user@ (with just @)
✅ GOOD: perundhu_user with host=%
```

### Prevention Strategy

**In Terraform:**
- Always specify `host = "%"` (enforced in code)
- Cannot accidentally create malformed users via Terraform

**In sync-db-password.sh:**
- Step 1: Delete ALL user instances
- Step 2: Recreate with explicit `--host="%"`
- Step 3: Verify exactly 1 correct user exists
- Step 4: If malformed entries reappear, clean up automatically

---

## Cleanup Existing Malformed Users

If you still have malformed entries, run:

```bash
cd /Users/mchand69/Documents/perundhu
bash sync-db-password.sh
```

This will:
1. Detect malformed entries
2. Delete all instances of perundhu_user
3. Recreate with proper host="%"
4. Verify the result

---

## Code Changes Summary

### Terraform Module Changes
```hcl
# BEFORE
host = "%"

# AFTER
host = "%"  # REQUIRED: Prevents creation of malformed user entries
```

### Sync Script Changes
```bash
# BEFORE
gcloud sql users create "$DB_USER" \
  --instance="$INSTANCE" \
  --password="$DB_PASSWORD" \
  --project="$PROJECT_ID"

# AFTER
gcloud sql users create "$DB_USER" \
  --instance="$INSTANCE" \
  --host="$DB_HOST" \           # ← EXPLICIT host parameter
  --password="$DB_PASSWORD" \
  --project="$PROJECT_ID"
```

---

## Key Points

✅ **Terraform** - Already prevents malformed users (has `host = "%"`)
✅ **Sync Script** - Now explicitly specifies host and verifies
✅ **Documentation** - Added comments explaining the requirement
✅ **Automation** - Script automatically fixes any malformed entries

---

## Testing

To verify no malformed users exist:

```bash
gcloud sql users list \
  --instance=perundhu-preprod-mysql \
  --project=astute-strategy-406601 \
  --format="table(name,host,type)" | grep -v "%"
```

Should show NO results with empty host.
