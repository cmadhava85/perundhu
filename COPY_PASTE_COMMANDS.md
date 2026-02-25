# Terraform Fix - Copy & Paste Commands

## What I've Already Done ✅

- Cleared stale ADC credentials file
- Verified your account has permissions
- Created Terraform configuration with all needed variables

## What You Need To Do (3 Steps - 5 minutes)

### STEP 1: Run Browser Authentication (1 minute)

Copy and paste this command:

```bash
gcloud auth application-default login
```

**What happens:**
- Browser opens
- You sign in with: `cmadhava@gmail.com`
- Click "Allow" for permissions
- Browser closes
- Return to terminal

### STEP 2: Verify Authentication (30 seconds)

```bash
gcloud auth application-default print-access-token
```

**Expected:** Long token starting with `eyJ...`

If you see a token = ✅ Success!
If error = try Step 1 again

### STEP 3: Run Terraform (2-3 minutes)

Copy each command one by one:

```bash
cd /Users/mchand69/Documents/perundhu/infrastructure/terraform/environments/production
```

```bash
terraform import module.database.google_sql_database_instance.mysql_instance \
  projects/perundhu-prod-001/instances/perundhu-production-mysql
```

**Expected:** `Import successful!`

Then run:

```bash
terraform plan -out=tfplan
```

Then:

```bash
terraform apply tfplan
```

## Or Use Automated Script (Easiest)

If you prefer automated, run:

```bash
/tmp/terraform_auth_steps.sh
```

This will:
1. Open browser for authentication
2. Verify credentials work
3. Run terraform import automatically

---

## What Happens After

Once terraform apply completes:

✅ Cloud SQL infrastructure deployed
✅ VPC, networking, IAM configured
✅ Ready for Docker image build
✅ Ready for Cloud Run deployment

---

## Still Stuck?

See detailed guides:
- `TERRAFORM_AUTH_STALE_ADC.md` - Full explanation
- `GCP_AUTHENTICATION_REQUIRED.md` - Step by step
- `TERRAFORM_FIX_AUTHORIZATION_ISSUE.md` - Technical details

---

## Summary

**Current Status:**
- ✅ Code ready
- ✅ Terraform config ready  
- ✅ GCP permissions ready
- ⏳ Just need browser auth (1 min)

**Then to live:** ~35 more minutes (docker build + cloud run deploy)
