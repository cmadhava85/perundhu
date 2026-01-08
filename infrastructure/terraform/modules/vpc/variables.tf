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
# Network Configuration
# ============================================

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  description = "CIDR block for the private subnet"
  type        = string
  default     = "10.0.2.0/24"
}

variable "vpc_connector_cidr" {
  description = "CIDR block for VPC connector"
  type        = string
  default     = "10.8.0.0/28"
}

variable "vpc_connector_min_instances" {
  description = "Minimum number of VPC connector instances"
  type        = number
  default     = 2
}

variable "vpc_connector_max_instances" {
  description = "Maximum number of VPC connector instances"
  type        = number
  default     = 3
}

variable "vpc_connector_machine_type" {
  description = "Machine type for VPC connector"
  type        = string
  default     = "e2-micro"
}

# ============================================
# Firewall Rules Configuration
# ============================================

variable "firewall_rules" {
  description = "Firewall rules to create"
  type = map(object({
    direction       = optional(string, "INGRESS")
    priority        = optional(number, 1000)
    allow_rules     = optional(list(object({ protocol = string, ports = optional(list(string)) })), [])
    source_ranges   = optional(list(string), [])
    target_tags     = optional(list(string), [])
    enable          = optional(bool, true)
  }))
  default = {
    allow_internal = {
      allow_rules = [
        { protocol = "icmp" },
        { protocol = "tcp", ports = ["0-65535"] },
        { protocol = "udp", ports = ["0-65535"] }
      ]
      source_ranges = ["10.0.0.0/16"]
      enable        = true
    }
    allow_ssh = {
      allow_rules = [
        { protocol = "tcp", ports = ["22"] }
      ]
      source_ranges = ["0.0.0.0/0"]
      target_tags   = ["ssh"]
      enable        = false  # Disabled by default for security
    }
    allow_http_https = {
      allow_rules = [
        { protocol = "tcp", ports = ["80", "443", "8080"] }
      ]
      source_ranges = ["0.0.0.0/0"]
      target_tags   = ["http-server", "https-server"]
      enable        = true
    }
  }
}