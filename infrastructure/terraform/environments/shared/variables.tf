# ============================================
# Shared Environment Variables
# Common variables used across preprod & production
# ============================================

variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "asia-south1"
}

variable "zone" {
  description = "The GCP zone"
  type        = string
  default     = "asia-south1-a"
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

# ============================================
# Database Configuration
# ============================================

variable "db_version" {
  description = "MySQL database version"
  type        = string
  default     = "MYSQL_8_0"
}

variable "db_instance_tier" {
  description = "Database instance tier"
  type        = string
  # Override this in environment-specific tfvars
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

# ============================================
# Cloud Run Configuration
# ============================================

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

# ============================================
# Optional Services
# ============================================

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

# ============================================
# Notifications
# ============================================

variable "notification_email" {
  description = "Email address for alerts and notifications"
  type        = string
  default     = "alerts@perundhu.com"
}

# ============================================
# SHARED SECRETS - Same across all environments
# ============================================

variable "gemini_api_key" {
  description = "Google Gemini API key for AI features (shared across all environments)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "recaptcha_site_key" {
  description = "Google reCAPTCHA v3 site key (shared across all environments)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "recaptcha_secret_key" {
  description = "Google reCAPTCHA v3 secret key (shared across all environments)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "admin_username" {
  description = "Username for admin panel authentication (shared across all environments)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "admin_password" {
  description = "Password for admin panel authentication (shared across all environments)"
  type        = string
  default     = ""
  sensitive   = true
}
