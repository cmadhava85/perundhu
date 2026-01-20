# Perundhu PreProd Environment Configuration
# Generated for GCP Project: astute-strategy-406601
# Region: asia-south1 (Mumbai - optimal for India)
# 
# COST OPTIMIZATION ENABLED (Jan 2026)
# ======================================
# Monthly Cost Reduction: Similar to production
# - Database: STOPPED (db_activation_policy = NEVER) - saves ~$18/month
# - Cloud Run: Scale to zero (min_instances = 0) - saves ~$3/month
# - VPC Connector: DISABLED - saves $14/month
# Total Savings: ~$35/month

# ============================================
# GCP Configuration
# ============================================
project_id = "astute-strategy-406601"
region     = "asia-south1"
zone       = "asia-south1-a"

# ============================================
# Environment Configuration
# ============================================
environment = "preprod"
app_name    = "perundhu"

# ============================================
# Database Configuration
# ============================================
db_version              = "MYSQL_8_0"
db_instance_tier        = "db-f1-micro" # Cost-optimized for dev
db_instance_name_suffix = ""

database_name = "perundhu"
database_user = "perundhu_user"

# Database Storage (cost-optimized for development)
db_disk_type             = "PD_HDD" # HDD is cheaper, suitable for dev
db_disk_size             = 10       # Minimum size to save costs
db_disk_autoresize_limit = 20       # Auto-grow up to 20GB

# Database Availability (cost-optimized)
db_availability_type = "ZONAL" # Cheaper than REGIONAL

# Database Activation Policy (NEVER = stopped, saves ~$18/month)
db_activation_policy = "NEVER" # ALWAYS = always running, NEVER = stopped

# Database Backups (disabled in preprod to save costs)
db_backup_enabled                 = false
db_retained_backups_count         = 3
db_transaction_log_retention_days = 1
db_binary_log_enabled             = false

# Database Logging (minimal in preprod)
db_slow_query_log_enabled = false
db_general_log_enabled    = false
db_deletion_protection    = false

# Use public IP for Cloud SQL (cost optimization by eliminating Cloud SQL Proxy)
# Current instance uses private IP; set false to avoid replacement
use_public_ip = false

# ============================================
# Read Replica Configuration (Optional - for testing 100k scale)
# ============================================
# Disabled by default - enable for testing read/write splitting
create_read_replica = false
read_replica_tier   = "db-f1-micro"
read_replica_zone   = "asia-south1-b"

# ============================================
# Cloud Run Configuration (Optimized for < $10/month)
# ============================================
cloud_run_min_instances = 0       # Scale to zero for cost savings
cloud_run_max_instances = 2       # Reduced from 3 for cost savings
cloud_run_cpu_limit     = "1000m" # 1 CPU
cloud_run_memory_limit  = "512Mi" # Min required for Gen2 (256Mi not supported)

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
images_bucket_versioning_enabled = false
images_bucket_force_destroy      = false
images_bucket_cors_enabled       = true

# Lifecycle: Delete images after 1 year to save costs
images_bucket_lifecycle_rules = [
  {
    age_days      = 365
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
    enable    = true
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
# Storage Lifecycle Rules
# ============================================
# Already defined above with images_bucket_lifecycle_rules

# ============================================
# IAM Configuration
# ============================================
backend_roles = [
  "roles/cloudsql.client",
  "roles/secretmanager.secretAccessor",
  "roles/storage.objectViewer"
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

custom_role_permissions = [
  "compute.instances.get",
  "compute.instances.list"
]

enable_custom_role = true

# ============================================
# SQL Auto-Stop Configuration (Cloud Function + Cloud Scheduler)
# ============================================
# Cloud Function automatically stops idle Cloud SQL instances to reduce costs
# Saves ~$28/month when SQL is idle

sql_autostop_idle_minutes                = 30                        # Stop after 30 min of inactivity
sql_autostop_dry_run_mode                = false                     # Set to true to test without stopping
sql_autostop_cron_schedule               = "*/30 * * * *"            # Run every 30 minutes
sql_autostop_schedule_interval_minutes   = 30                        # For documentation
sql_autostop_time_zone                   = "Asia/Kolkata"            # IST timezone
sql_autostop_function_source_path        = "/tmp/sql-autostop.zip"   # Update with actual path before apply

# ============================================
# Notifications Configuration
# ============================================
notification_email = "alerts@perundhu.com"

# Domain Configuration (optional - can override via -var if needed)
# domain_name = "preprod.perundhu.app"

# Container Image (optional - managed by CI/CD, can override via -var if needed)
# container_image = "asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-latest"
