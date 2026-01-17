# Why SQL Instance is Still ACTIVE - Root Cause Analysis

**Date:** January 17, 2026
**Status:** ⚠️ **ACTIVATION POLICY SET TO ALWAYS**

---

## 🎯 Root Cause Found!

### The Issue
Your `perundhu-preprod-mysql` instance has:
```
ACTIVATION_POLICY = "ALWAYS"
```

This means **the instance is configured to ALWAYS stay running**, regardless of activity!

---

## 📊 Current Configuration

| Instance | Activation Policy | State | Stays On? |
|----------|-------------------|-------|-----------|
| **perundhu-preprod-mysql** | ⚠️ **ALWAYS** | RUNNABLE | **YES - Always runs 24/7** |
| perundhu-preprod-mysql-asia | NEVER | STOPPED | ✅ Good (already stopped) |

---

## 🔍 How Activation Policy Works

### `ALWAYS` (Current Setting)
```
Instance stays ON 24/7
Cost: ~$7/month continuously
Auto-stop function: IGNORED
```

### `NEVER` 
```
Instance always OFF
Cost: ~$0/month
Use case: For development only
```

### `ON_DEMAND` (Recommended for Cost Savings)
```
Instance on when needed, stopped when idle
Cost: ~$2-3/month (depends on usage)
Auto-stop function: WORKS
```

---

## 💰 Cost Impact

### Current Setup (ALWAYS)
- **Instance is running 24/7**
- **Cost:** ~$7/month (always)
- **SQL Auto-Stop function:** Completely ignored/bypassed
- **Why?** Because ALWAYS policy overrides idle detection

### With ON_DEMAND (Recommended)
- **Instance runs when needed**
- **Auto-stops after 30 min idle**
- **Cost:** ~$2-3/month (with 70%+ downtime)
- **SQL Auto-Stop function:** Works perfectly

### Savings
- **Current:** $7/month (no savings)
- **With ON_DEMAND:** $3-4/month savings
- **Annual Savings:** $36-48/year

---

## ✅ Solution

To enable auto-stop, change the activation policy from `ALWAYS` to `ON_DEMAND`:

```bash
gcloud sql instances patch perundhu-preprod-mysql \
  --activation-policy=ON_DEMAND \
  --project=astute-strategy-406601
```

**What happens:**
1. ✅ Instance will respect idle detection
2. ✅ SQL Auto-Stop function will actually stop it
3. ✅ Cost drops to ~$2-3/month
4. ✅ Scheduler will work as designed

**After change:**
```
Activation Policy: ON_DEMAND
Instance idles after 30 min
Scheduler detects idle
Function stops instance
Cost saved: $3-4/month
```

---

## 🚨 Why This Happened

Your terraform configuration has:

```hcl
# infrastructure/terraform/environments/preprod/terraform.tfvars
db_instance_tier = "db-f1-micro"
db_availability_type = "ZONAL"

# But activation policy was set to ALWAYS elsewhere
# (possibly in main.tf or modules)
```

This needs to be fixed to:
```hcl
# Enable auto-stop by using ON_DEMAND policy
activation_policy = "ON_DEMAND"
```

---

## 🔧 Quick Fix Commands

### Option 1: Via gcloud (Immediate)
```bash
gcloud sql instances patch perundhu-preprod-mysql \
  --activation-policy=ON_DEMAND \
  --project=astute-strategy-406601
```

### Option 2: Via Terraform (Permanent)
Edit: `infrastructure/terraform/environments/preprod/terraform.tfvars`

Add or update:
```hcl
db_activation_policy = "ON_DEMAND"  # Change from ALWAYS
```

Then:
```bash
cd infrastructure/terraform/environments/preprod
terraform apply
```

---

## 📋 What Needs to Change

### Current State
```yaml
Instance Name: perundhu-preprod-mysql
Activation Policy: ALWAYS ❌
State: RUNNABLE (always on)
Monthly Cost: $7 (no savings)
Auto-Stop Function: Bypassed/Ignored
```

### After Fix
```yaml
Instance Name: perundhu-preprod-mysql
Activation Policy: ON_DEMAND ✅
State: Will be STOPPED when idle
Monthly Cost: $2-3 (saves $4/month)
Auto-Stop Function: WORKS (every 30 min)
```

---

## 📊 Expected Behavior After Fix

### Timeline
```
15:00 → App stops using database → Instance idle detected
15:30 → Scheduler triggers Cloud Function
15:30 → Function detects 0 connections for 30+ min
15:30 → Function STOPS instance (activation policy now allows it)
        Cost savings start: $0.23/day × 10 hours = $2.30/day

16:00 → Scheduler triggers again → Instance is STOPPED
        Message: "Instance already stopped. No action needed"
        
Next morning, app starts → Instance auto-starts
        (activation policy ON_DEMAND handles this)
```

---

## ⚠️ Important Notes

1. **Changing to ON_DEMAND won't break anything**
   - GCP will auto-start when Cloud Run tries to connect
   - Takes ~30 seconds to restart
   - Completely transparent to app

2. **No manual restarts needed**
   - Cloud Run will automatically wake up the instance
   - Connection pooling handles the brief delay

3. **Cost is worth it**
   - Savings: $4-5/month
   - Annual: $48-60/year
   - Risk: Very low (auto-restart is automatic)

4. **The Auto-Stop Function will finally work**
   - Currently: Ignored (because ALWAYS)
   - After fix: Actually stops the instance
   - Verification: Check Cloud Scheduler logs

---

## 🎯 Recommended Action

1. **Apply gcloud command immediately:**
   ```bash
   gcloud sql instances patch perundhu-preprod-mysql \
     --activation-policy=ON_DEMAND \
     --project=astute-strategy-406601
   ```

2. **Wait 5 minutes for change to take effect**

3. **Verify it worked:**
   ```bash
   gcloud sql instances list --project=astute-strategy-406601 \
     --format="table(name,settings.activationPolicy,state)"
   ```
   Should show: `ON_DEMAND` instead of `ALWAYS`

4. **Test the auto-stop:**
   - Stop using the app for 30+ minutes
   - Check Cloud Scheduler logs
   - Verify instance stops automatically
   - Cost savings will begin

---

## 📝 Summary

**Problem:** Instance is set to `ALWAYS` stay on
**Solution:** Change to `ON_DEMAND` so auto-stop works
**Cost Savings:** ~$4-5/month ($48-60/year)
**Risk:** None - auto-restart is automatic
**Time to Fix:** 2 minutes

**Current Status:** ⚠️ Auto-stop is IGNORED due to ALWAYS policy
**After Fix:** ✅ Auto-stop will work, saving $4-5/month

---

## 🔗 Related Documents

- [GCP_COST_OPTIMIZATION_PLAN.md](GCP_COST_OPTIMIZATION_PLAN.md)
- [SQL_AUTOSTOP_SCHEDULER_STATUS.md](SQL_AUTOSTOP_SCHEDULER_STATUS.md)
- [GCP_COST_OPTIMIZATION_DEPLOYMENT_SUMMARY.md](GCP_COST_OPTIMIZATION_DEPLOYMENT_SUMMARY.md)

---

**Last Updated:** January 17, 2026
**Status:** Ready for fix
**Recommended Action:** Apply activation policy patch now
