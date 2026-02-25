# Terraform Authorization Error - Root Cause & Solution

**Error**: `Error 403: The client is not authorized to make this request`

**Root Cause**: Application Default Credentials (ADC) are **stale/expired/invalid**

**Status**: ✅ Identified | ✅ Fixable in ~2 minutes

---

## The Problem Explained

### Why gcloud Works But Terraform Doesn't

```
gcloud auth     → Uses active user session from terminal ✅ WORKS
Terraform       → Uses Application Default Credentials (ADC) file ❌ EXPIRED
```

**What Happened:**
1. You authenticated with `gcloud auth login` earlier
2. That session is valid and working (we verified with `gcloud sql instances list`)
3. But the ADC file at `~/.config/gcloud/application_default_credentials.json` is stale
4. Terraform tries to use ADC and gets 403 error

### Proof This Is The Issue

```bash
# This works:
$ gcloud sql instances list
OUTPUT: perundhu-production-mysql  MYSQL_8_0  STOPPED ✅

# This fails:
$ gcloud auth application-default print-access-token
ERROR: Invalid or expired credentials ❌

# Terraform uses ↑ this, which is why it fails
```

---

## Solution: Recreate Application Default Credentials (2 minutes)

### Method: Remove Stale ADC and Recreate

Run these commands in a **new** terminal window (NOT in the existing one):

```bash
# Step 1: Clear stale ADC file
rm ~/.config/gcloud/application_default_credentials.json

# Step 2: This command will... open a browser
# Just complete the Google login flow like before
gcloud auth application-default login

# Step 3: Verify it works
gcloud auth application-default print-access-token
# Should output: eyJhbGciOiJSUzI1NiIsImtpZCI6... (long token string)

# Step 4: Go back to terraform directory and try again
cd /Users/mchand69/Documents/perundhu/infrastructure/terraform/environments/production

# Step 5: Try the import again
terraform import module.database.google_sql_database_instance.mysql_instance \
  projects/perundhu-prod-001/instances/perundhu-production-mysql

# Expected output: Import successful!
```

---

## Why This Happens

When you first authenticated with `gcloud auth login`, a **session token** was created. That token is valid for ~1 hour and auto-refreshes with gcloud CLI.

However, `gcloud auth application-default login` creates a **separate, persistent file** (`application_default_credentials.json`) that:
- Doesn't auto-refresh as easily
- Expires after a certain period
- Needs to be manually recreated

**This is expected GCP behavior** - it's a security feature that requires re-authentication for ADC credentials.

---

## Why I Can't Run This Automatically

I cannot run `gcloud auth application-default login` automatically in this terminal because:

1. **It requires browser interaction** - Google opens your browser for 2FA/login
2. **Terminal-based auth doesn't work** - GCP requires browser-based OAuth flow
3. **You must complete it interactively** - Security requires you to click "I agree" in browser

This is by design - it prevents automated token stealing.

---

## Quick Reference: What To Do

| Step | Command | Does |
|------|---------|------|
| 1 | Open NEW terminal | Fresh session for auth |
| 2 | `rm ~/.config/gcloud/application_default_credentials.json` | Clear expired creds |
| 3 | `gcloud auth application-default login` | Browser opens, you login |
| 4 | `gcloud auth application-default print-access-token` | Verify it works |
| 5 | `cd .../infrastructure/terraform/environments/production` | Go to tf dir |
| 6 | `terraform import ...` | Should work now ✅ |

---

## After You Complete Browser Authentication

Once you run `gcloud auth application-default login` and complete the browser flow, Terraform will:

1. **Find the fresh ADC file** at `~/.config/gcloud/application_default_credentials.json`
2. **Use it for all API calls** to Google Cloud
3. **Successfully import** the Cloud SQL instance
4. **Apply the plan** without authorization errors

---

## Verification After Fix

You'll know it worked when:

```bash
# This prints a token (no error):
$ gcloud auth application-default print-access-token
eyJhbGciOiJSUzI1NiIsImtpZCI6I...

# Then Terraform import succeeds:
$ terraform import module.database.google_sql_database_instance.mysql_instance \
    projects/perundhu-prod-001/instances/perundhu-production-mysql

module.database.google_sql_database_instance.mysql_instance: Importing from ID...
module.database.google_sql_database_instance.mysql_instance: Import successful!
# ✅ No 403 error!
```

---

## If Browser Auth Doesn't Work

If you still get errors after `gcloud auth application-default login`, try:

```bash
# Clear everything and start fresh
gcloud auth login --reauth --no-launch-browser

# Or use a specific account
gcloud config set account cmadhava@gmail.com
gcloud auth login
gcloud auth application-default login
```

---

## Summary

| Issue | Cause | Fix | Time |
|-------|-------|-----|------|
| 403 Unauthorized | Stale ADC file | Run `gcloud auth application-default login` | 2 min |
| Works in gcloud | Session token active | N/A | N/A |
| Fails in Terraform | Uses expired ADC | Recreate ADC | 2 min |

---

## The Full Timeline

**Past:** You logged in with `gcloud auth login` ✅  
**Now:** That session is still active BUT ADC expired ❌  
**Next:** Run `gcloud auth application-default login` in new terminal ⏳  
**After:** Terraform will import successfully ✅  

---

## Commands To Run (Copy-Paste)

Open a **NEW terminal and run**:

```bash
# Clear old credentials
rm ~/.config/gcloud/application_default_credentials.json

# Recreate them (browser will open)
gcloud auth application-default login

# Verify it works
echo "Testing: " && gcloud auth application-default print-access-token && echo "✅ Success!"

# Now try Terraform
cd /Users/mchand69/Documents/perundhu/infrastructure/terraform/environments/production
terraform import module.database.google_sql_database_instance.mysql_instance \
  projects/perundhu-prod-001/instances/perundhu-production-mysql
```

---

**That's it! The browser login takes ~1 minute, then Terraform will work.** 🚀
