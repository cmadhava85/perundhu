# Production Environment Variables

variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region for resources"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The GCP zone for resources"
  type        = string
  default     = "us-central1-a"
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

variable "notification_email" {
  description = "Email address for monitoring notifications"
  type        = string
}

variable "domain_name" {
  description = "Custom domain name for the application"
  type        = string
  default     = "perundhu.app"
}

variable "frontend_custom_domain" {
  description = "Custom domain for frontend"
  type        = string
  default     = "www.perundhu.app"
}

variable "enable_ssl" {
  description = "Enable SSL/TLS for the application"
  type        = bool
  default     = true
}

variable "max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 50
}

variable "min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 1
}

variable "cpu_limit" {
  description = "CPU limit for Cloud Run instances"
  type        = string
  default     = "2000m"
}

variable "memory_limit" {
  description = "Memory limit for Cloud Run instances"
  type        = string
  default     = "2Gi"
}

variable "container_image" {
  description = "Container image for Cloud Run deployment"
  type        = string
}
