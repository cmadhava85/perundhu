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

variable "vpc_network" {
  description = "VPC network name"
  type        = string
}

variable "authorized_network" {
  description = "VPC network ID for authorized access"
  type        = string
}

variable "memory_size_gb" {
  description = "Redis memory size in GB"
  type        = number
  default     = 1
}

variable "tier" {
  description = "Redis tier (BASIC or STANDARD_HA)"
  type        = string
  default     = "BASIC"
}

variable "redis_version" {
  description = "Redis version"
  type        = string
  default     = "REDIS_6_X"
}