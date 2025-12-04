# Perundhu PreProd Environment Variables

variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The GCP zone"
  type        = string
  default     = "us-central1-a"
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
  default     = "db-f1-micro"
}

variable "notification_email" {
  description = "Email for monitoring notifications"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "preprod.perundhu.com"
}

variable "enable_ssl" {
  description = "Enable SSL/HTTPS"
  type        = bool
  default     = true
}

variable "max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 5
}

variable "min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 1
}

variable "cpu_limit" {
  description = "CPU limit for Cloud Run instances"
  type        = string
  default     = "1000m"
}

variable "memory_limit" {
  description = "Memory limit for Cloud Run instances"
  type        = string
  default     = "2Gi"
}

variable "container_image" {
  description = "Container image for the backend application"
  type        = string
  default     = "gcr.io/PROJECT_ID/perundhu-backend:latest"
}

variable "ocr_service_image" {
  description = "Container image for the OCR service (PaddleOCR)"
  type        = string
  default     = "gcr.io/PROJECT_ID/perundhu-ocr-service:latest"
}