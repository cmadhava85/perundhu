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
  description = "VPC network for private IP"
  type        = string
}

variable "private_subnet" {
  description = "Private subnet name"
  type        = string
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

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "perundhu"
}

variable "database_user" {
  description = "Database user name"
  type        = string
  default     = "perundhu_user"
}

variable "create_test_database" {
  description = "Whether to create a test database"
  type        = bool
  default     = true
}

variable "depends_on" {
  description = "List of resources this module depends on"
  type        = list(any)
  default     = []
}