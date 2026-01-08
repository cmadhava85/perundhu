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
