variable "project_id" {
  description = "The GCP project ID"
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

variable "cloud_run_service" {
  description = "Cloud Run service name"
  type        = string
}

variable "cloud_run_url" {
  description = "Cloud Run service URL"
  type        = string
  default     = ""
}

variable "db_instance_name" {
  description = "Database instance name"
  type        = string
}

variable "notification_email" {
  description = "Email address for alerts"
  type        = string
}