variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., preprod, production)"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "vpc_network" {
  description = "VPC network for private IP"
  type        = string
}

variable "private_subnet" {
  description = "Private subnet name"
  type        = string
}

variable "use_public_ip" {
  description = "Use public IP instead of private IP for Cloud SQL (enables cost savings by eliminating Cloud SQL Proxy)"
  type        = bool
  default     = false
}

# ============================================
# Database Configuration
# ============================================

variable "db_version" {
  description = "MySQL database version"
  type        = string
  default     = "MYSQL_8_0"
}

variable "db_instance_tier" {
  description = "Database instance tier (e.g., db-f1-micro, db-n1-standard-1)"
  type        = string
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

variable "db_instance_name_suffix" {
  description = "Suffix for database instance name (e.g., '-asia' for perundhu-preprod-mysql-asia)"
  type        = string
  default     = ""
}

# ============================================
# Storage Configuration
# ============================================

variable "db_disk_type" {
  description = "Database disk type (PD_HDD for cost optimization, PD_SSD for performance)"
  type        = string
  default     = "PD_HDD"
}

variable "db_disk_size" {
  description = "Initial database disk size in GB"
  type        = number
  default     = 10
}

variable "db_disk_autoresize_limit" {
  description = "Maximum disk size in GB for autoresize"
  type        = number
  default     = 20
}

# ============================================
# Backup Configuration
# ============================================

variable "db_backup_enabled" {
  description = "Enable automated backups"
  type        = bool
  default     = false # Disabled by default in preprod, enable in production
}

variable "db_backup_start_time" {
  description = "Start time for backup (HH:MM format)"
  type        = string
  default     = "02:00"
}

variable "db_retained_backups_count" {
  description = "Number of backups to retain"
  type        = number
  default     = 3
}

variable "db_transaction_log_retention_days" {
  description = "Number of days to retain transaction logs"
  type        = number
  default     = 1
}

variable "db_binary_log_enabled" {
  description = "Enable binary logging"
  type        = bool
  default     = false
}

# ============================================
# Availability Configuration
# ============================================

variable "db_availability_type" {
  description = "Availability type (ZONAL or REGIONAL)"
  type        = string
  default     = "ZONAL" # ZONAL is cheaper
}

variable "db_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

# ============================================
# Logging Configuration
# ============================================

variable "db_slow_query_log_enabled" {
  description = "Enable slow query logging"
  type        = bool
  default     = false # Disabled by default, enable in production
}

variable "db_general_log_enabled" {
  description = "Enable general log"
  type        = bool
  default     = false
}

variable "create_test_database" {
  description = "Whether to create a test database"
  type        = bool
  default     = true
}