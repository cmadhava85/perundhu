variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 7  # Minimum for cost savings
}

variable "exclude_debug_logs" {
  description = "Exclude debug/trace logs to save costs"
  type        = bool
  default     = true
}

variable "exclude_health_check_logs" {
  description = "Exclude health check logs to save costs"
  type        = bool
  default     = true
}
