variable "project_id" {
  description = "The GCP project ID"
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

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_url" {
  description = "Full database connection URL (optional, for modern Spring Boot apps)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "data_encryption_key" {
  description = "Data encryption key for sensitive data at rest (optional)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "jwt_secret" {
  description = "JWT secret key for token signing (optional)"
  type        = string
  sensitive   = true
  default     = ""
}