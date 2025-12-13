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

variable "db_url" {
  description = "Full JDBC database URL"
  type        = string
  sensitive   = true
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

variable "redis_auth" {
  description = "Redis auth string"
  type        = string
  default     = ""
  sensitive   = true
}