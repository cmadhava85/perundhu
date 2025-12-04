variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "billing_account_id" {
  description = "The billing account ID"
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

variable "budget_amount" {
  description = "Monthly budget amount in USD"
  type        = number
  default     = 100
}

variable "notification_email" {
  description = "Email address for budget notifications"
  type        = string
  default     = ""
}

variable "notification_channels" {
  description = "List of notification channel IDs"
  type        = list(string)
  default     = []
}
