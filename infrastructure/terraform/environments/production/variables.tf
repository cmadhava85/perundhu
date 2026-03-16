# ============================================
# Production Environment Variables (from shared)
# ============================================
# These variables are defined in shared/variables.tf
# They are duplicated here for Terraform to recognize them in this module

variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The GCP zone"
  type        = string
  default     = "us-central1-a"
}

variable "environment" {
  description = "Environment name (preprod, production)"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "perundhu"
}

variable "use_public_ip" {
  description = "Use public IP instead of private IP for Cloud SQL (for cost savings)"
  type        = bool
  default     = true
}

variable "db_version" {
  description = "MySQL database version"
  type        = string
  default     = "MYSQL_8_0"
}

variable "db_instance_tier" {
  description = "Database instance tier (db-f1-micro for cost optimization)"
  type        = string
}

variable "db_instance_name_suffix" {
  description = "Suffix for database instance name"
  type        = string
  default     = ""
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "perundhu"
}

variable "database_user" {
  description = "Database user name"
  type        = string
  default     = "perundhu_user"
}

variable "cloud_run_min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 0
}

variable "cloud_run_max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 2
}

variable "cloud_run_cpu_limit" {
  description = "CPU limit for Cloud Run containers"
  type        = string
  default     = "1000m"
}

variable "cloud_run_memory_limit" {
  description = "Memory limit for Cloud Run containers"
  type        = string
  default     = "512Mi"
}

variable "cloud_run_concurrency" {
  description = "Maximum concurrent requests per Cloud Run container instance"
  type        = number
  default     = 80
}

variable "cloud_run_timeout" {
  description = "Request timeout in seconds for Cloud Run"
  type        = number
  default     = 60
}

variable "redis_host" {
  description = "Redis host (empty string to disable)"
  type        = string
  default     = ""
}

variable "redis_port" {
  description = "Redis port"
  type        = number
  default     = 6379
}

variable "jwt_secret_name" {
  description = "JWT secret name (empty string to disable)"
  type        = string
  default     = ""
}

variable "notification_email" {
  description = "Email address for alerts and notifications"
  type        = string
  default     = "alerts@perundhu.com"
}

# ============================================
# VPC & Network Configuration
# ============================================

variable "vpc_cidr" {
  description = "VPC network CIDR range"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "Public subnet CIDR range"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  description = "Private subnet CIDR range"
  type        = string
  default     = "10.0.2.0/24"
}

variable "vpc_connector_cidr" {
  description = "VPC Connector CIDR range"
  type        = string
  default     = "10.8.0.0/28"
}

variable "vpc_connector_min_instances" {
  description = "Minimum instances for VPC connector"
  type        = number
  default     = 2
}

variable "vpc_connector_max_instances" {
  description = "Maximum instances for VPC connector"
  type        = number
  default     = 3
}

variable "vpc_connector_machine_type" {
  description = "Machine type for VPC connector"
  type        = string
  default     = "e2-micro"
}

variable "firewall_rules" {
  description = "Firewall rules configuration"
  type = map(object({
    direction     = string
    priority      = number
    enable        = bool
    source_ranges = list(string)
    target_tags   = optional(list(string))
    allow_rules = list(object({
      protocol = string
      ports    = optional(list(string))
    }))
  }))
  default = {}
}

# ============================================
# Database Storage Configuration
# ============================================

variable "db_disk_type" {
  description = "Database disk type (PD_HDD or PD_SSD)"
  type        = string
  default     = "PD_HDD"
}

variable "db_disk_size" {
  description = "Database disk size in GB"
  type        = number
  default     = 10
}

variable "db_disk_autoresize_limit" {
  description = "Database disk maximum auto-resize limit"
  type        = number
  default     = 20
}

variable "db_availability_type" {
  description = "Database availability type (ZONAL or REGIONAL)"
  type        = string
  default     = "ZONAL"
}

variable "db_deletion_protection" {
  description = "Database deletion protection"
  type        = bool
  default     = false
}

variable "db_activation_policy" {
  description = "Database activation policy (ALWAYS, NEVER, or ON_DEMAND)"
  type        = string
  default     = "ALWAYS"
}

# ============================================
# Database Backup Configuration
# ============================================

variable "db_backup_enabled" {
  description = "Enable automated database backups"
  type        = bool
  default     = false
}

variable "db_backup_start_time" {
  description = "Backup window start time (HH:MM format)"
  type        = string
  default     = "02:00"
}

variable "db_retained_backups_count" {
  description = "Number of backups to retain"
  type        = number
  default     = 3
}

variable "db_transaction_log_retention_days" {
  description = "Transaction log retention in days"
  type        = number
  default     = 1
}

variable "db_binary_log_enabled" {
  description = "Enable binary logging"
  type        = bool
  default     = false
}

# ============================================
# Database Logging Configuration
# ============================================

variable "db_slow_query_log_enabled" {
  description = "Enable slow query log"
  type        = bool
  default     = false
}

variable "db_general_log_enabled" {
  description = "Enable general query log"
  type        = bool
  default     = false
}

# ============================================
# Read Replica Configuration (100k users scale)
# ============================================

variable "create_read_replica" {
  description = "Create read replica for scaling read operations"
  type        = bool
  default     = false # Enable in production when scaling to 100k users
}

variable "read_replica_tier" {
  description = "Database tier for read replica"
  type        = string
  default     = "db-n1-standard-1" # Can be same or smaller than primary
}

variable "read_replica_zone" {
  description = "Zone for read replica (different from primary for HA)"
  type        = string
  default     = "us-central1-b"
}

# ============================================
# Storage Configuration
# ============================================

variable "images_bucket_versioning_enabled" {
  description = "Enable versioning for images bucket"
  type        = bool
  default     = false
}

variable "images_bucket_force_destroy" {
  description = "Force destroy images bucket (even if not empty)"
  type        = bool
  default     = false
}

variable "images_bucket_cors_enabled" {
  description = "Enable CORS for images bucket"
  type        = bool
  default     = true
}

variable "images_bucket_cors_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = ["*"]
}

variable "images_bucket_cors_methods" {
  description = "CORS allowed HTTP methods"
  type        = list(string)
  default     = ["GET", "HEAD", "PUT", "POST"]
}

variable "images_bucket_cors_headers" {
  description = "CORS allowed headers"
  type        = list(string)
  default     = ["Content-Type", "Content-Length"]
}

variable "images_bucket_cors_max_age_seconds" {
  description = "CORS max age in seconds"
  type        = number
  default     = 3600
}

variable "images_bucket_lifecycle_rules" {
  description = "Lifecycle rules for images bucket"
  type = list(object({
    age_days      = number
    action        = string
    storage_class = optional(string)
  }))
  default = []
}

# ============================================
# IAM Configuration
# ============================================

variable "backend_roles" {
  description = "IAM roles for backend service account"
  type        = list(string)
  default = [
    "roles/cloudsql.client",
    "roles/storage.objectAdmin",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/secretmanager.secretAccessor"
  ]
}

variable "backend_optional_roles" {
  description = "Optional IAM roles for backend service account (feature-gated)"
  type = map(object({
    role    = string
    enabled = bool
  }))
  default = {
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
}

variable "cloudbuild_roles" {
  description = "IAM roles for Cloud Build service account"
  type        = list(string)
  default = [
    "roles/run.developer",
    "roles/storage.admin",
    "roles/iam.serviceAccountUser",
    "roles/logging.logWriter"
  ]
}

variable "custom_role_permissions" {
  description = "Permissions for custom IAM role"
  type        = list(string)
  default = [
    "cloudsql.instances.connect",
    "storage.objects.get",
    "storage.objects.list",
    "secretmanager.versions.access",
    "logging.logEntries.create",
    "monitoring.timeSeries.create"
  ]
}

variable "enable_custom_role" {
  description = "Enable creation of custom IAM role"
  type        = bool
  default     = true
}

# ============================================
# Container Image Configuration
# ============================================

variable "container_image" {
  description = "Container image for Cloud Run (backend image)"
  type        = string
  default     = "us-central1-docker.pkg.dev/perundhu-prod-001/perundhu/backend:latest"
}
