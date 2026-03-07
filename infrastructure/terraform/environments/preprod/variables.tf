# ============================================
# Preprod Environment Variables (from shared)
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

variable "db_version" {
  description = "MySQL database version"
  type        = string
  default     = "MYSQL_8_0"
}

variable "db_instance_tier" {
  description = "Database instance tier"
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

variable "db_activation_policy" {
  description = "Activation policy for Cloud SQL instance (ALWAYS or NEVER)"
  type        = string
  default     = "NEVER"
}

variable "use_public_ip" {
  description = "Use public IP for Cloud SQL instead of private IP (saves cost by eliminating Cloud SQL Proxy overhead)"
  type        = bool
  default     = false
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
# SQL Auto-Stop Configuration
# ============================================

variable "sql_autostop_idle_minutes" {
  description = "Minutes of inactivity before auto-stopping SQL instance"
  type        = number
  default     = 30
}

variable "sql_autostop_dry_run_mode" {
  description = "If true, Cloud Function logs what it would do without stopping the instance"
  type        = bool
  default     = false
}

variable "sql_autostop_cron_schedule" {
  description = "Cron schedule for SQL auto-stop Cloud Function (crontab format)"
  type        = string
  default     = "*/30 * * * *"
}

variable "sql_autostop_schedule_interval_minutes" {
  description = "Scheduler interval in minutes (for documentation)"
  type        = number
  default     = 30
}

variable "sql_autostop_time_zone" {
  description = "Time zone for Cloud Scheduler (IANA format)"
  type        = string
  default     = "Asia/Kolkata"
}

variable "sql_autostop_function_source_path" {
  description = "Path to zipped Cloud Function source code"
  type        = string
  default     = ""
}