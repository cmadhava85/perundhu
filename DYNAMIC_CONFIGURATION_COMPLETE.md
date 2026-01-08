# Dynamic Terraform Configuration - Complete ✅

**Status**: Both preprod and production environments now work dynamically with environment-specific configurations.

---

## Summary

Both `preprod` and `production` Terraform environments are now fully configured to leverage dynamic variables across all modules. Each environment can control its infrastructure behavior through `terraform.tfvars` without requiring code changes.

**Validation Status**: ✅ Both environments pass `terraform validate`

---

## Environment-Specific Configurations

### 1. Preprod Environment (Cost-Optimized)
**File**: `infrastructure/terraform/environments/preprod/terraform.tfvars`

**Key Characteristics**:
- **Database**: 
  - Tier: `db-f1-micro` (smallest/cheapest)
  - Disk: `PD_HDD`, 10 GB, auto-resize to 20 GB
  - Backups: **DISABLED** (saves costs)
  - Logging: **DISABLED** (saves I/O)
  - Availability: `ZONAL` (not highly available)
  
- **Cloud Run**:
  - Min instances: 0 (scale to zero for cost savings)
  - Max instances: 2
  - CPU: 1000m (1 CPU)
  - Memory: 512Mi
  
- **VPC Connector**:
  - Min instances: 2
  - Max instances: 3
  - Machine type: `e2-micro` (default, cost-optimized)
  
- **Firewall Rules**:
  - Internal: **ENABLED** (allow private communication)
  - SSH: **ENABLED** (for debugging in dev)
  - HTTP/HTTPS: **ENABLED** (external access)
  
- **Storage**:
  - Lifecycle: Delete images after 365 days
  - Versioning: DISABLED
  - CORS: ENABLED

**Use Case**: Development, testing, pre-production validation

---

### 2. Production Environment (Production-Grade)
**File**: `infrastructure/terraform/environments/production/terraform.tfvars`

**Key Characteristics**:
- **Database**: 
  - Tier: `db-n1-standard-1` (standard production tier)
  - Disk: `PD_HDD`, 50 GB, auto-resize to 100 GB
  - Backups: **ENABLED** (2 AM IST daily, 7 day retention)
  - Binary Logging: **ENABLED** (backup consistency)
  - Transaction Logs: **ENABLED** (7 day retention)
  - Slow Query Logging: **ENABLED** (performance monitoring)
  - General Logging: **DISABLED** (performance consideration)
  - Availability: `ZONAL` (can enable `REGIONAL` for HA)
  - Deletion Protection: **ENABLED** (prevent accidents)
  
- **Cloud Run**:
  - Min instances: 1 (always running)
  - Max instances: 10 (higher scaling capacity)
  - CPU: 2000m (2 CPUs)
  - Memory: 1Gi
  
- **VPC Connector**:
  - Min instances: 3 (higher resilience)
  - Max instances: 5
  - Machine type: `e2-micro` (default, configurable)
  
- **Firewall Rules**:
  - Internal: **ENABLED** (allow private communication)
  - SSH: **DISABLED** (security restriction)
  - HTTP/HTTPS: **ENABLED** (external access)
  
- **Storage**:
  - Lifecycle: Delete images after 730 days (2 years)
  - Versioning: DISABLED (cost optimization)
  - CORS: ENABLED

**Use Case**: Production, customer-facing, data-critical

---

## Configurable Variables by Module

### IAM Module
```hcl
# Add role assignments via variables
backend_roles = [
  "roles/cloudsql.client",
  "roles/storage.objectAdmin",
  "roles/logging.logWriter",
  "roles/monitoring.metricWriter",
  "roles/secretmanager.secretAccessor"
]

backend_optional_roles = {
  pubsub_publisher = false    # Enable when needed
  pubsub_subscriber = false   # Enable when needed
  redis_editor = false        # Enable when needed
}

cloudbuild_roles = [
  "roles/run.developer",
  "roles/storage.admin",
  "roles/iam.serviceAccountUser",
  "roles/logging.logWriter"
]

enable_custom_role = true  # Toggle custom role creation
```

### VPC Module
```hcl
vpc_cidr = "10.0.0.0/16"
public_subnet_cidr = "10.0.1.0/24"
private_subnet_cidr = "10.0.2.0/24"
vpc_connector_cidr = "10.8.0.0/28"

vpc_connector_min_instances = 2    # Preprod: 2, Prod: 3
vpc_connector_max_instances = 3    # Preprod: 3, Prod: 5

firewall_rules = {
  allow_internal = {
    enable = true
    source_ranges = ["10.0.0.0/16"]
  }
  allow_ssh = {
    enable = true        # Preprod: true, Prod: false
    source_ranges = ["0.0.0.0/0"]
  }
  allow_http_https = {
    enable = true
    source_ranges = ["0.0.0.0/0"]
  }
}
```

### Database Module
```hcl
db_disk_type = "PD_HDD"              # Preprod & Prod: HDD (cost-effective)
db_disk_size = 10                    # Preprod: 10, Prod: 50
db_disk_autoresize_limit = 20        # Preprod: 20, Prod: 100

db_availability_type = "ZONAL"       # Can change to "REGIONAL" for HA
db_deletion_protection = false       # Preprod: false, Prod: true

db_backup_enabled = false            # Preprod: false, Prod: true
db_backup_start_time = "02:00"
db_retained_backups_count = 7
db_transaction_log_retention_days = 7
db_binary_log_enabled = false        # Preprod: false, Prod: true

db_slow_query_log_enabled = false    # Preprod: false, Prod: true
db_general_log_enabled = false
```

### Storage Module
```hcl
images_bucket_versioning_enabled = false
images_bucket_force_destroy = false

images_bucket_lifecycle_rules = [
  {
    age_days = 365          # Preprod: 365, Prod: 730
    action = "Delete"
    storage_class = null
  }
]

images_bucket_cors_enabled = true
images_bucket_cors_origins = ["*"]
images_bucket_cors_methods = ["GET", "HEAD", "PUT", "POST"]
```

---

## How to Customize Behavior

### Option 1: Modify terraform.tfvars
Edit the variables directly in the tfvars file:

```bash
# For preprod
nano infrastructure/terraform/environments/preprod/terraform.tfvars

# For production
nano infrastructure/terraform/environments/production/terraform.tfvars
```

### Option 2: Override via Command Line
```bash
# Enable database backups in preprod
terraform plan -var="db_backup_enabled=true"

# Enable HA in production
terraform plan -var="db_availability_type=REGIONAL"

# Increase database size
terraform plan -var="db_disk_size=100" -var="db_disk_autoresize_limit=200"
```

### Option 3: Enable Optional Features

**Enable Pub/Sub for Preprod**:
```hcl
backend_optional_roles = {
  pubsub_publisher = true    # Enable publisher role
  pubsub_subscriber = true   # Enable subscriber role
  redis_editor = false       # Keep disabled
}
```

**Enable Redis for Production**:
```hcl
backend_optional_roles = {
  pubsub_publisher = false
  pubsub_subscriber = false
  redis_editor = true        # Enable Redis role
}
```

**Enable HA for Production**:
```hcl
db_availability_type = "REGIONAL"  # High availability across zones
```

---

## Deployment Workflow

### Preprod Deployment
```bash
cd infrastructure/terraform/environments/preprod
terraform plan -var-file=terraform.tfvars -out=tfplan
terraform apply tfplan
```

### Production Deployment
```bash
cd infrastructure/terraform/environments/production
terraform plan -var-file=terraform.tfvars -out=tfplan
terraform apply tfplan  # Requires manual approval
```

---

## Validation

Both environments have been validated:

```bash
✅ Preprod: terraform validate SUCCESS
✅ Production: terraform validate SUCCESS
```

All modules are properly referenced and can be customized through their respective tfvars files.

---

## Key Benefits

1. **Cost Optimization**: Preprod runs lean with minimal resources
2. **Production Grade**: Production has backups, logging, and proper protection
3. **Flexibility**: Any variable can be overridden per environment
4. **DRY Principle**: Shared infrastructure definition with environment-specific values
5. **Maintenance**: Single source of truth for each environment's config
6. **Security**: SSH disabled by default in production, deletion protection enabled
7. **Monitoring**: Production has slow query logging enabled for performance insights
8. **Disaster Recovery**: Production has 7-day backup retention and binary logs

---

## Next Steps (Optional)

1. **Enable High Availability in Production**:
   - Change `db_availability_type = "REGIONAL"` in production tfvars
   - Requires recreation of database instance

2. **Enable Feature Flags**:
   - Set `backend_optional_roles` to enable Pub/Sub or Redis based on requirements
   - IAM roles will be assigned dynamically

3. **Performance Tuning**:
   - Monitor slow queries in production using `db_slow_query_log_enabled`
   - Adjust `cloud_run_*` settings based on load patterns
   - Scale `vpc_connector_max_instances` if needed

4. **Backup Strategy**:
   - Consider enabling in preprod if needed: `db_backup_enabled = true`
   - Adjust retention: `db_retained_backups_count = 7`

---

## Summary

✅ **Both preprod and production are now fully dynamic and can be customized through terraform.tfvars without any code changes.**

Each environment leverages:
- Configurable IAM roles and service accounts
- Dynamic firewall rules
- Environment-specific database settings
- Flexible storage policies
- Per-environment scaling parameters

**Status**: Ready for deployment with dynamic, environment-aware configuration! 🚀
