# ============================================
# Storage Module Variables
# ============================================

variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
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

# ============================================
# Bucket Configuration
# ============================================

variable "images_bucket_versioning_enabled" {
  description = "Enable versioning for images bucket"
  type        = bool
  default     = false
}

variable "images_bucket_force_destroy" {
  description = "Force destroy bucket (allow deletion even if non-empty)"
  type        = bool
  default     = false
}

# ============================================
# Lifecycle Rules
# ============================================

variable "images_bucket_lifecycle_rules" {
  description = "Lifecycle rules for images bucket"
  type = list(object({
    description = optional(string)
    age_days    = number
    action      = string  # "Delete", "SetStorageClass", etc
    storage_class = optional(string)
  }))
  default = [
    {
      description = "Delete images after 1 year to save costs"
      age_days    = 365
      action      = "Delete"
    }
  ]
}

# ============================================
# CORS Configuration
# ============================================

variable "images_bucket_cors_enabled" {
  description = "Enable CORS for images bucket"
  type        = bool
  default     = true
}

variable "images_bucket_cors_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = ["*"]
}

variable "images_bucket_cors_methods" {
  description = "CORS allowed methods"
  type        = list(string)
  default     = ["GET", "HEAD", "PUT", "POST"]
}

variable "images_bucket_cors_headers" {
  description = "CORS allowed response headers"
  type        = list(string)
  default     = ["Content-Type", "Content-Length"]
}

variable "images_bucket_cors_max_age_seconds" {
  description = "CORS max age in seconds"
  type        = number
  default     = 3600
}