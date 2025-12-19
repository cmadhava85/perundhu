# Perundhu PreProd Environment Variables
# Simplified - removed unused variables for Redis, Budget, Monitoring

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
  description = "Environment name"
  type        = string
  default     = "preprod"
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
  default     = "db-f1-micro" # Smallest/cheapest tier for dev
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "preprod.perundhu.com"
}

variable "container_image" {
  description = "Container image for the backend application"
  type        = string
  default     = "gcr.io/PROJECT_ID/perundhu-backend:latest"
}

# ============================================
# NOTE: Shared secrets (gemini_api_key, recaptcha_*)
# are managed in terraform/environments/shared
# ============================================