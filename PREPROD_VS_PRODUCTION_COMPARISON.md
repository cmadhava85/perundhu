# Preprod vs Production Configuration Comparison

## Quick Reference Table

| Configuration | Preprod | Production | Purpose |
|---|---|---|---|
| **Database Tier** | `db-f1-micro` | `db-n1-standard-1` | Cost vs Performance |
| **Database Disk** | 10 GB → 20 GB | 50 GB → 100 GB | Storage capacity |
| **Backups** | ❌ DISABLED | ✅ ENABLED | Data protection |
| **Backups Retention** | N/A | 7 days | Recovery window |
| **Binary Logging** | ❌ Disabled | ✅ Enabled | Backup consistency |
| **Slow Query Logging** | ❌ Disabled | ✅ Enabled | Performance monitoring |
| **Deletion Protection** | ❌ Disabled | ✅ ENABLED | Prevent accidents |
| **Cloud Run Min** | 0 instances | 1 instance | Cost vs availability |
| **Cloud Run Max** | 2 instances | 10 instances | Scaling capacity |
| **Cloud Run CPU** | 1000m (1 CPU) | 2000m (2 CPUs) | Compute power |
| **Cloud Run Memory** | 512 MB | 1 GB | Memory allocation |
| **VPC Connector Min** | 2 instances | 3 instances | Baseline capacity |
| **VPC Connector Max** | 3 instances | 5 instances | Peak capacity |
| **SSH Access** | ✅ ENABLED | ❌ DISABLED | Security |
| **Storage Retention** | 1 year | 2 years | Archive duration |
| **IAM - Optional Roles** | All false | Configurable | Feature flags |
| **HA (Regional DB)** | ❌ ZONAL | Can enable | High availability |

---

## Detailed Configuration Comparison

### 1. Database Configuration

#### Preprod - Cost Optimized
```hcl
db_instance_tier = "db-f1-micro"  # Smallest instance
db_disk_type = "PD_HDD"
db_disk_size = 10                 # Start small
db_disk_autoresize_limit = 20     # Limited growth

db_availability_type = "ZONAL"    # Single zone
db_deletion_protection = false    # Can be deleted

# No backups or monitoring
db_backup_enabled = false
db_slow_query_log_enabled = false
db_general_log_enabled = false
```

**Cost Impact**: ~$5-10/month for minimal database

#### Production - Enterprise Grade
```hcl
db_instance_tier = "db-n1-standard-1"  # Standard tier (1 vCPU, 3.75GB RAM)
db_disk_type = "PD_HDD"
db_disk_size = 50                      # Larger initial size
db_disk_autoresize_limit = 100         # Room to grow

db_availability_type = "ZONAL"         # Single zone (can upgrade to REGIONAL)
db_deletion_protection = true          # Protected

# Full backup strategy
db_backup_enabled = true
db_backup_start_time = "02:00"         # Off-peak backup
db_retained_backups_count = 7          # One week recovery
db_transaction_log_retention_days = 7  # Point-in-time recovery
db_binary_log_enabled = true           # Backup consistency

# Performance monitoring
db_slow_query_log_enabled = true
db_general_log_enabled = false
```

**Cost Impact**: ~$60-100/month for standard database with backups

---

### 2. Cloud Run Configuration

#### Preprod
```hcl
cloud_run_min_instances = 0      # Scales to zero when idle
cloud_run_max_instances = 2      # Limited concurrent requests
cloud_run_cpu_limit = "1000m"    # 1 CPU
cloud_run_memory_limit = "512Mi" # 512 MB
```

**Cost Pattern**: Pay per execution, idles at $0/month

#### Production
```hcl
cloud_run_min_instances = 1      # Always running
cloud_run_max_instances = 10     # High concurrency
cloud_run_cpu_limit = "2000m"    # 2 CPUs
cloud_run_memory_limit = "1Gi"   # 1 GB
```

**Cost Pattern**: Baseline cost + scaling, guaranteed availability

---

### 3. VPC & Network Configuration

#### Preprod
```hcl
vpc_connector_min_instances = 2   # Minimal VPC throughput
vpc_connector_max_instances = 3   # Limited scaling

firewall_rules = {
  allow_ssh = {
    enable = true  # SSH ENABLED for debugging
  }
  # ...other rules
}
```

**Network Profile**: Development-friendly, open for troubleshooting

#### Production
```hcl
vpc_connector_min_instances = 3   # Higher baseline capacity
vpc_connector_max_instances = 5   # More scaling headroom

firewall_rules = {
  allow_ssh = {
    enable = false  # SSH DISABLED for security
  }
  # ...other rules
}
```

**Network Profile**: Production-locked, SSH via Cloud Console/Bastion only

---

### 4. Storage & Lifecycle Configuration

#### Preprod
```hcl
images_bucket_lifecycle_rules = [
  {
    age_days = 365        # Delete after 1 year
    action = "Delete"
    storage_class = null
  }
]
images_bucket_versioning_enabled = false
```

**Storage Cost**: Minimal retention, aggressive cleanup

#### Production
```hcl
images_bucket_lifecycle_rules = [
  {
    age_days = 730        # Delete after 2 years
    action = "Delete"
    storage_class = null
  }
]
images_bucket_versioning_enabled = false  # Can enable if needed
```

**Storage Cost**: Longer retention for compliance/archival

---

### 5. IAM & Service Accounts

#### Preprod
```hcl
backend_roles = [
  "roles/cloudsql.client",
  "roles/storage.objectAdmin",
  "roles/logging.logWriter",
  "roles/monitoring.metricWriter",
  "roles/secretmanager.secretAccessor"
]

backend_optional_roles = {
  pubsub_publisher = false
  pubsub_subscriber = false
  redis_editor = false
}

enable_custom_role = true
```

**IAM Profile**: Basic permissions, optional features disabled

#### Production
```hcl
backend_roles = [
  "roles/cloudsql.client",
  "roles/storage.objectAdmin",
  "roles/logging.logWriter",
  "roles/monitoring.metricWriter",
  "roles/secretmanager.secretAccessor"
]

# Can enable based on features needed
backend_optional_roles = {
  pubsub_publisher = false  # Set to true for async processing
  pubsub_subscriber = false # Set to true for event handling
  redis_editor = false      # Set to true for caching
}

enable_custom_role = true
```

**IAM Profile**: Same base roles, optional features enabled per requirement

---

## How to Transition Between Configurations

### Upgrade Preprod → Production Configuration
```bash
# Copy production tfvars to preprod
cp infrastructure/terraform/environments/production/terraform.tfvars \
   infrastructure/terraform/environments/preprod/terraform.tfvars

# Update project-specific values
sed -i 's/perundhu-prod-001/astute-strategy-406601/g' \
  infrastructure/terraform/environments/preprod/terraform.tfvars
sed -i 's/production/preprod/g' \
  infrastructure/terraform/environments/preprod/terraform.tfvars

# Review changes
terraform plan
```

### Enable High Availability in Production
```bash
# Edit production tfvars
# Change: db_availability_type = "REGIONAL"

terraform plan -var="db_availability_type=REGIONAL"
terraform apply
```

### Enable Pub/Sub in Production
```bash
# Edit production tfvars
# Change: pubsub_publisher = true, pubsub_subscriber = true

terraform plan
terraform apply
```

---

## Cost Estimation

### Preprod Monthly
| Service | Cost |
|---------|------|
| Cloud SQL (db-f1-micro, 10GB) | $5-8 |
| Cloud Run (0-2 instances, minimal CPU) | $0-5 |
| VPC Connector | $0-2 |
| Storage | $0-2 |
| **Total** | **$5-17/month** |

### Production Monthly
| Service | Cost |
|---------|------|
| Cloud SQL (db-n1-standard-1, 50GB, backups) | $80-120 |
| Cloud Run (1-10 instances, 2 CPUs) | $50-200 |
| VPC Connector (higher capacity) | $2-5 |
| Storage (longer retention) | $5-10 |
| **Total** | **$137-335/month** |

---

## Summary: Key Differences

| Dimension | Preprod | Production |
|-----------|---------|------------|
| **Primary Goal** | Development & Testing | Customer-Facing Stability |
| **Cost Strategy** | Minimize | Ensure Quality |
| **Availability** | Best-effort | Highly Available |
| **Data Protection** | None | Comprehensive |
| **Monitoring** | Basic | Full Observability |
| **Security** | Relaxed (SSH enabled) | Strict (SSH disabled) |
| **Scaling** | Limited (scale-to-zero) | High (10 instances max) |
| **Recovery** | None | 7-day rollback capability |

---

## Configuration Files

**Preprod**: `/infrastructure/terraform/environments/preprod/terraform.tfvars`
- Cost-optimized
- Development-friendly
- Feature flags all disabled

**Production**: `/infrastructure/terraform/environments/production/terraform.tfvars`
- Production-grade
- High availability
- Full monitoring and backups
- Feature flags configurable

Both leverage the same **shared infrastructure definition** (`shared/base.tf`) with dynamic variables from each environment's tfvars file.
