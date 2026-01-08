# Perundhu PreProd Environment Configuration
# Generated for GCP Project: astute-strategy-406601
# Region: asia-south1 (Mumbai - optimal for India)

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

# Database Backups (disabled in preprod to save costs)
db_backup_enabled                 = false
db_retained_backups_count         = 3
db_transaction_log_retention_days = 1
db_binary_log_enabled             = false

# Database Logging (minimal in preprod)
db_slow_query_log_enabled = false
db_general_log_enabled    = false
db_deletion_protection    = false

# ============================================
# Cloud Run Configuration
# ============================================
cloud_run_min_instances = 0       # Scale to zero for cost savings
cloud_run_max_instances = 2       # Low max for dev
cloud_run_cpu_limit     = "1000m" # 1 CPU
cloud_run_memory_limit  = "512Mi" # Minimal memory

# ============================================
# VPC Configuration
# ============================================
vpc_cidr                    = "10.0.0.0/16"
public_subnet_cidr          = "10.0.1.0/24"
private_subnet_cidr         = "10.0.2.0/24"
vpc_connector_cidr          = "10.8.0.0/28"
vpc_connector_min_instances = 2
vpc_connector_max_instances = 3

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
# Firewall Rules (development-friendly)
# ============================================
firewall_rules = {
  allow-internal = {
    direction     = "INGRESS"
    priority      = 1000
    enable        = true
    source_ranges = ["10.0.0.0/16"]
    allow_rules = [
      { protocol = "icmp" },
      { protocol = "tcp", ports = ["0-65535"] },
      { protocol = "udp", ports = ["0-65535"] }
    ]
  }
  allow-ssh = {
    direction     = "INGRESS"
    priority      = 1005
    enable        = true # Enable SSH for debugging in preprod
    source_ranges = ["0.0.0.0/0"]
    target_tags   = ["ssh"]
    allow_rules = [
      { protocol = "tcp", ports = ["22"] }
    ]
  }
  allow-http-https = {
    direction     = "INGRESS"
    priority      = 1010
    enable        = true
    source_ranges = ["0.0.0.0/0"]
    target_tags   = ["http-server", "https-server"]
    allow_rules = [
      { protocol = "tcp", ports = ["80", "443", "8080"] }
    ]
  }
}

# ============================================
# CORS Configuration
# ============================================
images_bucket_cors = {
  origin      = ["http://localhost:3000", "http://localhost:5173"]
  methods     = ["GET", "HEAD", "OPTIONS"]
  max_age_sec = 3600
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

enable_custom_role = false

# ============================================
# Notifications Configuration
# ============================================
notification_email = "alerts@perundhu.com"

# Domain Configuration (optional - can override via -var if needed)
# domain_name = "preprod.perundhu.app"

# Container Image (optional - managed by CI/CD, can override via -var if needed)
# container_image = "asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-latest"
