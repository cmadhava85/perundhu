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

variable "pubsub_topic_image_processing" {
  description = "Pub/Sub topic for image processing notifications"
  type        = string
  default     = ""
}

variable "enable_public_access" {
  description = "Enable public access to static assets bucket"
  type        = bool
  default     = true
}