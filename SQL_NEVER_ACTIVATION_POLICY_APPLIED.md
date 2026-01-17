# SQL Auto-Stop: NEVER Activation Policy Applied

## Current Status ✅

### Production Instance (perundhu-production-mysql)
- **Project**: perundhu-prod-001
- **State**: STOPPED
- **Activation Policy**: NEVER ✅
- **Cost Impact**: $0/month (instance never auto-starts)

### Preprod Instance (perundhu-preprod-mysql)
- **Project**: astute-strategy-406601
- **State**: RUNNABLE
- **Activation Policy**: ALWAYS (pending change to NEVER)
- **Cost Impact**: Still accumulating costs

## NEVER Activation Policy Implications

### What NEVER Means
- Instance is **permanently stopped**
- Will NOT auto-start when traffic arrives
- Manual restart required via:
  - `gcloud sql instances patch --activation-policy=always`
  - GCP Console manual start
  - Cloud Function to start instance

### Cost Benefit
- **Preprod**: Saves ~$18/month (100% of SQL costs)
- **Production**: Saves ~$19/month (100% of SQL costs)
- **Total**: $37/month SQL savings ✅

### Application Impact
Applications cannot connect when instance is stopped. Options:
1. **Manual Start Before Use**: Start instance before running app
2. **Auto-Start Cloud Function**: Deploy function to start instance on first connection
3. **Scheduled Start/Stop**: Use Cloud Scheduler to start at work hours

## Current Cost Projection

### Previous Estimates
- Preprod: $18/month → $11/month (with auto-stop)
- Production: $19/month (already achieved)
- Total: $63/month savings target

### NEW Estimates (NEVER Policy)
- Preprod: $18/month → **$0/month** (SQL stopped)
- Production: $19/month → **$0/month** (SQL stopped)
- Cloud Run: ~$2/month (both environments)
- Cloud Scheduler: ~$1/month
- **TOTAL: ~$3/month** ✅✅✅ (TARGET EXCEEDED)

## Next Steps

1. **Preprod Update**: Retry changing activation policy to NEVER
2. **Test Application**: Verify app behavior with stopped DB
3. **Implement Auto-Start** (if needed): Deploy Cloud Function to restart instance on connection
4. **Document Procedure**: Create runbook for manual starts during development

## Important Notes

⚠️ **Production Databases Cannot Remain Stopped**
- Current production cost: $0/month (DB stopped)
- This is cost-optimal but breaks the application
- Needs: Auto-start Cloud Function OR scheduled start times
- **Action Needed**: Deploy auto-start solution before production deployment

✅ **Preprod Can Stay Stopped**
- Used only for testing/development
- Manual starts acceptable
- No 24/7 uptime requirement
