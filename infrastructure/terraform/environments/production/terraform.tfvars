# Perundhu Production Environment Configuration
# Generated for GCP Project: perundhu-prod-001
# Region: us-central1 (Iowa - optimal for Cloud Run domain mappings)
# MIGRATED: Feb 2026 from asia-south1 to enable Cloud Run domain mappings
# 
# COST OPTIMIZATION ENABLED (Jan 2026)
# ======================================
# Monthly Cost Reduction: $60 → ~$2
# - Database: STOPPED (db_activation_policy = NEVER) - saves $34/month
# - Cloud Run: Scale to zero (min_instances = 0) - saves $6/month
# - VPC Connector: DISABLED - saves $14/month
# - Artifact Registry: Clean old images manually - saves $4/month
# Total Savings: ~$58/month

# ============================================
# GCP Configuration
# ============================================
project_id = "perundhu-prod-001"
region     = "us-central1"
zone       = "us-central1-a"

# ============================================
# Environment Configuration
# ============================================
environment = "production"
app_name    = "perundhu"

# ============================================
# Cloud SQL IP Configuration
# ============================================
# Using public IP for current setup
use_public_ip = true

# ============================================
db_version              = "MYSQL_8_0"
db_instance_tier        = "db-f1-micro" # Matches actual deployed instance
db_instance_name_suffix = "-us"         # Matches actual deployed instance name: perundhu-production-mysql-us

database_name = "perundhu"
database_user = "perundhu_user"

# Database Storage (match actual deployment)
db_disk_type             = "PD_HDD"
db_disk_size             = 10       # Matches actual (was planning 20)
db_disk_autoresize_limit = 100      # Reset to GCP default

# Database Availability (match actual instance)
db_availability_type   = "ZONAL"
db_deletion_protection = false    # Matches actual deployed instance

# Database Activation Policy
# ALWAYS: DB stays running — required for prod to serve live traffic.
# Set to NEVER only when taking prod fully offline for extended maintenance.
db_activation_policy = "ALWAYS" # Production DB must be running to serve requests

# Database Backups (ENABLED for production data protection)
# Prevents data loss during Cloud SQL maintenance or failures
# COST OPTIMIZED (Feb 2026): Reduced retention from 7 to 3 days, disabled binary logs
db_backup_enabled                 = true    # ENABLED for production stability
db_backup_start_time              = "02:00" # 2 AM IST for off-peak backup
db_retained_backups_count         = 3       # Reduced from 7 to 3 for cost optimization
db_transaction_log_retention_days = 3       # Reduced from 7 to 3 for cost optimization
db_binary_log_enabled             = false   # Disabled - no read replica (saves $0.20-0.50/month)

# Database Logging (production monitoring)
db_slow_query_log_enabled = true  # Monitor slow queries for performance tuning
db_general_log_enabled    = false # Disabled to avoid performance impact (enable if needed for debugging)

# ============================================
# Cloud Run Configuration
# ============================================
# min_instances=0: Cloud Run scales to zero when idle (saves ~$6.50/month).
# Startup CPU boost handles cold starts (~3-5s for this Java/Spring app).
# Cloud SQL connects on first request — min=1 is not required for DB connectivity.
cloud_run_min_instances = 0       # Scale to zero - saves ~$6.50/month; startup CPU boost handles cold starts
cloud_run_max_instances = 5       # Autoscale up to 5 instances under load
cloud_run_cpu_limit     = "1000m" # 1 CPU for backend
cloud_run_memory_limit  = "512Mi" # 512Mi for backendcloud_run_concurrency   = 80      # Max concurrent requests per instance
cloud_run_timeout       = 60      # Request timeout in seconds
# ============================================
# VPC Configuration (Cost Optimized - VPC Connector DISABLED)
# ============================================
vpc_cidr                    = "10.0.0.0/16"
public_subnet_cidr          = "10.0.1.0/24"
private_subnet_cidr         = "10.0.2.0/24"
vpc_connector_cidr          = "10.8.0.0/28"
# VPC Connector DISABLED for cost savings (saves $14/month)
# Cloud Run will use public IP to connect to Cloud SQL
# Note: Database must allow public connections for this to work
vpc_connector_min_instances = 2 # Kept for reference only (connector disabled)
vpc_connector_max_instances = 3 # Kept for reference only (connector disabled)
vpc_connector_machine_type  = "e2-micro" # Kept for reference only (connector disabled)

# ============================================
# Storage Configuration
# ============================================
images_bucket_versioning_enabled = false # Disabled to reduce costs; enable if versioning needed
images_bucket_force_destroy      = false # Prevent accidental bucket deletion

images_bucket_cors_enabled = true

# Lifecycle: Delete images after 2 years (longer retention for archives)
images_bucket_lifecycle_rules = [
  {
    age_days      = 730 # 2 years
    action        = "Delete"
    storage_class = null
  }
]

# ============================================
# Firewall Rules (imported from existing GCP resources)
# ============================================
firewall_rules = {
  "allow-internal" = {
    enable    = true
    direction = "INGRESS"
    priority  = 1000
    allow_rules = [
      {
        protocol = "tcp"
        ports    = ["0-65535"]
      },
      {
        protocol = "udp"
        ports    = ["0-65535"]
      },
      {
        protocol = "icmp"
        ports    = []
      }
    ]
    source_ranges = ["10.0.0.0/16"]
    target_tags   = []
  }
  "allow-ssh" = {
    enable    = false # Disabled - no VMs in this project; Cloud Run does not use SSH
    direction = "INGRESS"
    priority  = 1000
    allow_rules = [
      {
        protocol = "tcp"
        ports    = ["22"]
      }
    ]
    source_ranges = ["0.0.0.0/0"]
    target_tags   = ["ssh"]
  }
  "allow-http-https" = {
    enable    = true
    direction = "INGRESS"
    priority  = 1000
    allow_rules = [
      {
        protocol = "tcp"
        ports    = ["80", "443", "8080"]
      }
    ]
    source_ranges = ["0.0.0.0/0"]
    target_tags   = ["http-server", "https-server"]
  }
}

# ============================================
# Notifications Configuration
# ============================================
notification_email = "ops@perundhu.com"

# ============================================
# IAM Configuration
# ============================================
backend_roles = [
  "roles/cloudsql.client",
  "roles/secretmanager.secretAccessor",
  "roles/storage.objectCreator"
]

backend_optional_roles = {
  pubsub_publisher = {
    role    = "roles/pubsub.publisher"
    enabled = false
  }
  pubsub_subscriber = {
    role    = "roles/pubsub.subscriber"
    enabled = false
  }
  redis_editor = {
    role    = "roles/redis.editor"
    enabled = false
  }
}

cloudbuild_roles = [
  "roles/cloudbuild.builds.editor",
  "roles/container.developer",
  "roles/artifactregistry.writer"
]

custom_role_permissions = []

# Custom role disabled - compute.instances.get/list are not needed by Cloud Run apps
enable_custom_role = false

# ============================================
# Container Image (CI/CD managed)
# ============================================
# This will be overridden by GitHub Actions during deployment
# Format: us-central1-docker.pkg.dev/perundhu-prod-001/perundhu-images-us/backend:VERSION
container_image = "us-central1-docker.pkg.dev/perundhu-prod-001/perundhu-images-us/backend:latest"

# Domain Configuration (optional - manage via -var if needed)
# domain_name = "api.perundhu.app"

# ============================================
# Advanced Configuration (optional overrides)
# ============================================
# Enable these options if needed for your production environment:

# For High Availability (optional):
# db_availability_type = "REGIONAL"  # Uncomment to enable HA across zones

# For automatic backups at custom time:
# db_backup_start_time = "03:00"      # 3 AM IST

# For larger data migrations:
# db_disk_size = 100                  # Increase initial disk size
# db_disk_autoresize_limit = 200      # Set higher limit

