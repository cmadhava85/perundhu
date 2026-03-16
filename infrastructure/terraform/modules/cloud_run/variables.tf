variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., preprod, prod)"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "service_account_email" {
  description = "Service account email for Cloud Run"
  type        = string
}

variable "vpc_connector_name" {
  description = "VPC connector name"
  type        = string
}

variable "container_image" {
  description = "Container image URL"
  type        = string
  default     = "gcr.io/cloudrun/hello"
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 5
}

variable "min_instances" {
  description = "Minimum number of instances"
  type        = number
  default     = 0
}

variable "cpu_limit" {
  description = "CPU limit"
  type        = string
  default     = "1000m"
}

variable "memory_limit" {
  description = "Memory limit"
  type        = string
  default     = "512Mi"
}

variable "db_connection_name" {
  description = "Cloud SQL connection name"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_user" {
  description = "Database user"
  type        = string
}

variable "storage_bucket_name" {
  description = "Storage bucket name for images"
  type        = string
}

variable "container_concurrency" {
  description = "Maximum number of concurrent requests per container instance"
  type        = number
  default     = 80
}

variable "timeout_seconds" {
  description = "Request timeout in seconds"
  type        = number
  default     = 60
}

variable "redis_host" {
  description = "Redis host (leave empty to disable Redis)"
  type        = string
  default     = ""
}

variable "redis_port" {
  description = "Redis port"
  type        = number
  default     = 6379
}

variable "jwt_secret_name" {
  description = "Secret name for JWT (leave empty to disable JWT secret)"
  type        = string
  default     = ""
}

variable "cors_allowed_origins" {
  description = "CORS allowed origins"
  type        = string
  default     = "*"
}

variable "allow_public_access" {
  description = "Allow public access to the service"
  type        = bool
  default     = true
}

variable "custom_domain" {
  description = "Custom domain for the service"
  type        = string
  default     = ""
}

# Flyway migration variables
variable "flyway_enabled" {
  description = "Enable Flyway database migrations"
  type        = bool
  default     = true
}

variable "spring_flyway_enabled" {
  description = "Enable Spring Boot Flyway integration"
  type        = bool
  default     = true
}

variable "restart_trigger" {
  description = "Restart trigger for forcing Cloud Run revision updates"
  type        = string
  default     = ""
}

# Secret names for environment variables
variable "db_url_secret_name" {
  description = "Secret name for database URL (leave empty to use MYSQL_* variables)"
  type        = string
  default     = ""
}

variable "admin_username_secret_name" {
  description = "Secret name for admin username"
  type        = string
  default     = "admin-username"
}

variable "admin_password_secret_name" {
  description = "Secret name for admin password"
  type        = string
  default     = "admin-password"
}

variable "data_encryption_key_secret_name" {
  description = "Secret name for data encryption key"
  type        = string
  default     = ""
}

variable "gemini_api_key_secret_name" {
  description = "Secret name for Gemini API key"
  type        = string
  default     = "gemini-api-key"
}

variable "recaptcha_secret_key_secret_name" {
  description = "Secret name for reCAPTCHA secret key"
  type        = string
  default     = "recaptcha-secret-key"
}

variable "recaptcha_site_key_secret_name" {
  description = "Secret name for reCAPTCHA site key"
  type        = string
  default     = "recaptcha-site-key"
}

variable "backend_service_name" {
  description = "Override for the backend Cloud Run service name. Defaults to '{app_name}-{environment}-backend' if empty."
  type        = string
  default     = ""
}