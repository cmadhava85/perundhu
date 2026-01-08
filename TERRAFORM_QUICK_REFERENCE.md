# Terraform Dynamic Configuration - Quick Reference Card

## Status: ✅ Both Preprod & Production Working Dynamically

---

## 🚀 Quick Start

### Deploy Preprod
```bash
cd infrastructure/terraform/environments/preprod
terraform plan -var-file=terraform.tfvars
terraform apply
```

### Deploy Production
```bash
cd infrastructure/terraform/environments/production
terraform plan -var-file=terraform.tfvars
terraform apply
```

---

## ⚙️ Key Configuration Points

### Cost Optimization (Preprod)
```hcl
cloud_run_min_instances = 0      # Scales to zero
db_instance_tier = "db-f1-micro" # Smallest DB
db_backup_enabled = false        # No backups
db_disk_size = 10                # 10GB initial
```

### Production Grade (Production)
```hcl
cloud_run_min_instances = 1      # Always running
db_instance_tier = "db-n1-standard-1" # Standard tier
db_backup_enabled = true         # 7-day retention
db_disk_size = 50                # 50GB initial
```

---

## 📝 Common Configuration Changes

### Enable Database Backups (add to tfvars)
```hcl
db_backup_enabled = true
db_retained_backups_count = 7
db_backup_start_time = "02:00"
db_transaction_log_retention_days = 7
db_binary_log_enabled = true
```

### Enable SSH Access
```hcl
firewall_rules = {
  allow_ssh = {
    enable = true  # Change from false to true
  }
}
```

### Enable Performance Monitoring
```hcl
db_slow_query_log_enabled = true
```

### Enable Optional Features (Pub/Sub, Redis)
```hcl
backend_optional_roles = {
  pubsub_publisher = true   # For async publishing
  pubsub_subscriber = true  # For event handling
  redis_editor = true       # For caching
}
```

### Scale Up Database
```hcl
db_disk_size = 100
db_disk_autoresize_limit = 200
```

### Enable Regional HA
```hcl
db_availability_type = "REGIONAL"
db_deletion_protection = true
```

---

## 📊 Configuration Comparison

| Setting | Preprod | Production |
|---------|---------|------------|
| **Cost** | $5-17/mo | $137-335/mo |
| **DB Tier** | db-f1-micro | db-n1-standard-1 |
| **Backups** | ❌ No | ✅ Yes (7 days) |
| **SSH** | ✅ Enabled | ❌ Disabled |
| **Cloud Run Min** | 0 | 1 |
| **Cloud Run Max** | 2 | 10 |
| **DB Size** | 10→20GB | 50→100GB |
| **Monitoring** | ❌ No | ✅ Slow query logs |

---

## 🔧 File Locations

### Configuration Files
```
infrastructure/terraform/environments/
├── preprod/
│   ├── terraform.tfvars     ← Edit here for preprod config
│   └── main.tf              ← Don't edit (references shared)
├── production/
│   ├── terraform.tfvars     ← Edit here for production config
│   └── main.tf              ← Don't edit (references shared)
└── shared/
    └── base.tf              ← Shared infrastructure definition
```

### Modules
```
infrastructure/terraform/modules/
├── iam/           (roles, service accounts)
├── vpc/           (network, firewall, VPC connector)
├── database/      (Cloud SQL MySQL)
├── storage/       (Cloud Storage buckets)
├── cloud_run/     (Backend service)
├── secrets/       (Secret Manager)
└── shared-secrets/(API keys)
```

---

## ✅ Validation

```bash
# Check configuration syntax
terraform -chdir=infrastructure/terraform/environments/preprod validate
terraform -chdir=infrastructure/terraform/environments/production validate

# See what will change
terraform -chdir=infrastructure/terraform/environments/preprod plan -var-file=terraform.tfvars
```

---

## 🎯 Workflow: Make a Change

1. **Edit the tfvars file** you want to change
   ```bash
   nano infrastructure/terraform/environments/preprod/terraform.tfvars
   ```

2. **Review the plan** to see what will change
   ```bash
   terraform plan -var-file=terraform.tfvars
   ```

3. **Apply the change** when ready
   ```bash
   terraform apply tfplan
   ```

**That's it!** No code changes needed.

---

## 📋 Configuration Variables Reference

### Database Variables
- `db_disk_type`: "PD_HDD" or "PD_SSD"
- `db_disk_size`: Initial size in GB
- `db_disk_autoresize_limit`: Max size before manual intervention
- `db_availability_type`: "ZONAL" or "REGIONAL"
- `db_deletion_protection`: true/false
- `db_backup_enabled`: true/false
- `db_backup_start_time`: "HH:MM" format
- `db_retained_backups_count`: Number of backups to keep
- `db_slow_query_log_enabled`: true/false
- `db_general_log_enabled`: true/false

### Cloud Run Variables
- `cloud_run_min_instances`: 0-10 (0 = scales to zero)
- `cloud_run_max_instances`: 1-100 (max concurrent)
- `cloud_run_cpu_limit`: "1000m", "2000m", etc.
- `cloud_run_memory_limit`: "256Mi", "512Mi", "1Gi", etc.

### VPC Variables
- `vpc_cidr`: Network CIDR block
- `public_subnet_cidr`: Public subnet range
- `private_subnet_cidr`: Private subnet range
- `vpc_connector_min_instances`: Min VPC connector capacity
- `vpc_connector_max_instances`: Max VPC connector capacity

### Storage Variables
- `images_bucket_lifecycle_rules`: List of rules
- `images_bucket_versioning_enabled`: true/false
- `images_bucket_cors_enabled`: true/false

### IAM Variables
- `backend_roles`: List of required roles
- `backend_optional_roles`: Map with enable flags
- `cloudbuild_roles`: List of build roles
- `enable_custom_role`: true/false

---

## 🚨 Important Notes

### ⚠️ SSH Access
- **Preprod**: Enabled by default (for development)
- **Production**: Disabled by default (for security)
- To enable in production, update tfvars and apply

### ⚠️ Database Backups
- **Preprod**: Disabled to save costs
- **Production**: Enabled with 7-day retention
- Backup window: 02:00 AM IST (off-peak)

### ⚠️ Deletion Protection
- **Preprod**: Disabled (can delete freely)
- **Production**: Enabled (prevent accidents)

### ⚠️ Cloud Run Scaling
- **Preprod**: Scales to zero (min instances = 0)
- **Production**: Always running (min instances = 1)

---

## 🔗 Related Documentation

- [DYNAMIC_CONFIGURATION_COMPLETE.md](DYNAMIC_CONFIGURATION_COMPLETE.md)
- [PREPROD_VS_PRODUCTION_COMPARISON.md](PREPROD_VS_PRODUCTION_COMPARISON.md)
- [CD_PIPELINE_VALIDATION_REPORT.md](CD_PIPELINE_VALIDATION_REPORT.md)
- [TERRAFORM_DYNAMIC_CONFIG_VALIDATION_FINAL.md](TERRAFORM_DYNAMIC_CONFIG_VALIDATION_FINAL.md)

---

## 💡 Pro Tips

1. **Always run `terraform plan` first** before applying
2. **Keep preprod config as close to production as possible** (except costs)
3. **Test changes in preprod first** before production
4. **Document why you changed a setting** in tfvars comments
5. **Enable backups only when needed** (saves costs in dev)
6. **Use version tags** when deploying via CI/CD

---

## ⚡ Emergency Commands

```bash
# Check current state
terraform show

# Destroy everything (careful!)
terraform destroy -var-file=terraform.tfvars

# Force unlock state (if stuck)
terraform force-unlock LOCK_ID

# Show current variables being used
terraform variables
```

---

## 📞 Support

For issues:
1. Check `terraform plan` output for specific error
2. Review `terraform.tfvars` for typos
3. Ensure all required variables are set
4. Run `terraform validate` to check syntax
5. Check GCP project and permissions

---

**Remember**: ✅ Both environments are now 100% dynamic!
Change behavior via tfvars - no code changes needed! 🚀
