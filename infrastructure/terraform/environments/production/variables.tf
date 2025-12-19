# Production Environment Variables
# Simplified - removed unused variables for Redis, Budget, Monitoring

variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region for resources"
  type        = string
  default     = "asia-south1"
}

variable "zone" {
  description = "The GCP zone for resources"
  type        = string
  default     = "asia-south1-a"
}

variable "environment" {
  description = "The environment name"
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "The application name"
  type        = string
  default     = "perundhu"
}

variable "db_version" {
  description = "MySQL database version"
  type        = string
  default     = "MYSQL_8_0"
}

variable "db_instance_tier" {
  description = "The machine tier for the database instance"
  type        = string
  default     = "db-n1-standard-1"
}

variable "domain_name" {
  description = "Custom domain name for the application"
  type        = string
  default     = "perundhu.app"
}

variable "container_image" {
  description = "Container image for Cloud Run deployment"
  type        = string
}

# ============================================
# NOTE: Shared secrets (gemini_api_key, recaptcha_*)
# are managed in terraform/environments/shared
# ============================================