# Perundhu Production Environment Configuration
# Generated for GCP Project: perundhu-prod-001
# Region: asia-south1 (Mumbai - optimal for India)
# This configuration is production-grade with HA and monitoring

# ============================================
# GCP Configuration
# ============================================
project_id = "perundhu-prod-001"
region     = "asia-south1"
zone       = "asia-south1-a"

# ============================================
# Environment Configuration
# ============================================
environment = "production"
app_name    = "perundhu"

# ============================================
# Database Configuration
# ============================================
db_version              = "MYSQL_8_0"
db_instance_tier        = "db-n1-standard-1" # Standard tier for production (1 vCPU, 3.75GB RAM)
db_instance_name_suffix = ""

database_name = "perundhu"
database_user = "perundhu_user"

# Database Storage (production-grade)
db_disk_type             = "PD_HDD" # HDD for balance of cost and performance
db_disk_size             = 50       # Start with 50GB in production
db_disk_autoresize_limit = 100      # Allow growth up to 100GB

# Database Availability (production-grade)
db_availability_type   = "ZONAL" # ZONAL is cost-effective; upgrade to REGIONAL if HA needed
db_deletion_protection = true    # Prevent accidental deletion in production

# Database Backups (ENABLED in production)
db_backup_enabled                 = true
db_backup_start_time              = "02:00" # 2 AM IST for off-peak backup
db_retained_backups_count         = 7       # Keep 7 backups for recovery
db_transaction_log_retention_days = 7       # 7 days of transaction logs
db_binary_log_enabled             = true    # Enable binary logging for backup consistency

# Database Logging (production monitoring)
db_slow_query_log_enabled = true  # Monitor slow queries for performance tuning
db_general_log_enabled    = false # Disabled to avoid performance impact (enable if needed for debugging)

# ============================================
# Cloud Run Configuration
# ============================================
cloud_run_min_instances = 1       # Always have 1 instance running
cloud_run_max_instances = 10      # Scale up to 10 for load
cloud_run_cpu_limit     = "2000m" # 2 CPUs for production
cloud_run_memory_limit  = "1Gi"   # 1GB memory for production

# ============================================
# VPC Configuration
# ============================================
vpc_cidr                    = "10.0.0.0/16"
public_subnet_cidr          = "10.0.1.0/24"
private_subnet_cidr         = "10.0.2.0/24"
vpc_connector_cidr          = "10.8.0.0/28"
vpc_connector_min_instances = 2 # Match existing connector in GCP
vpc_connector_max_instances = 3 # Match existing connector in GCP

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
# Notifications Configuration
# ============================================
notification_email = "ops@perundhu.com"

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
# Container Image (CI/CD managed)
# ============================================
# This will be overridden by GitHub Actions during deployment
# Format: asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu/backend:VERSION
container_image = "asia-south1-docker.pkg.dev/perundhu-prod-001/perundhu/backend:latest"

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

