# Perundhu Shared Infrastructure
# ============================================
# This configuration creates resources shared across ALL environments
# Apply this ONCE before creating preprod or production environments
# ============================================

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Backend configuration for storing state
  backend "gcs" {
    bucket = "perundhu-terraform-state-shared"
    prefix = "shared/state"
  }
}

# Configure the Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable Secret Manager API
resource "google_project_service" "secretmanager" {
  project = var.project_id
  service = "secretmanager.googleapis.com"

  disable_dependent_services = false
  disable_on_destroy         = false
}

# Shared Secrets (same across all environments)
module "shared_secrets" {
  source = "../../modules/shared-secrets"

  project_id           = var.project_id
  app_name             = var.app_name
  gemini_api_key       = var.gemini_api_key
  recaptcha_site_key   = var.recaptcha_site_key
  recaptcha_secret_key = var.recaptcha_secret_key
  admin_username       = var.admin_username
  admin_password       = var.admin_password

  depends_on = [google_project_service.secretmanager]
}
