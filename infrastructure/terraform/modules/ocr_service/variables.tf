variable "app_name" {
  description = "Application name"
  type        = string
  default     = "perundhu"
}

variable "environment" {
  description = "Environment (preprod, production)"
  type        = string
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-south1"
}

variable "container_image" {
  description = "Docker image for OCR service"
  type        = string
}

variable "service_account_email" {
  description = "Service account email for the OCR service"
  type        = string
}

variable "backend_service_account_email" {
  description = "Service account email for the backend (to allow invoking OCR service)"
  type        = string
}

variable "cpu_limit" {
  description = "CPU limit for the container"
  type        = string
  default     = "2"
}

variable "memory_limit" {
  description = "Memory limit for the container"
  type        = string
  default     = "4Gi"
}

variable "min_instances" {
  description = "Minimum number of instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 5
}

variable "concurrency" {
  description = "Maximum concurrent requests per instance (low for ML workloads)"
  type        = number
  default     = 10
}

variable "cpu_throttling" {
  description = "Enable CPU throttling to reduce costs (only charge during requests)"
  type        = bool
  default     = true
}
