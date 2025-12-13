variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "perundhu"
}

variable "gemini_api_key" {
  description = "Google Gemini API key for AI features (shared across all environments)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "recaptcha_site_key" {
  description = "Google reCAPTCHA v3 site key (shared across all environments)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "recaptcha_secret_key" {
  description = "Google reCAPTCHA v3 secret key (shared across all environments)"
  type        = string
  default     = ""
  sensitive   = true
}
