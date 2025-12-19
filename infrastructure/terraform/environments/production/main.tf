# Perundhu Production Environment Infrastructure
# This configuration sets up all required Google Cloud services

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }

  # Backend configuration for storing state
  backend "gcs" {
    bucket = "perundhu-terraform-state-production"
    prefix = "production/state"
  }
}

# Configure the Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Data sources
data "google_project" "project" {
  project_id = var.project_id
}

# Enable required APIs (simplified - only essential services)
resource "google_project_service" "required_apis" {
  for_each = toset([
    "compute.googleapis.com",
    "sqladmin.googleapis.com",
    "cloudbuild.googleapis.com",
    "run.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "servicenetworking.googleapis.com"
  ])

  project = var.project_id
  service = each.value

  disable_dependent_services = false
  disable_on_destroy         = false
}

# VPC Network
module "vpc" {
  source = "../../modules/vpc"

  project_id  = var.project_id
  region      = var.region
  environment = var.environment
  app_name    = var.app_name

  depends_on = [google_project_service.required_apis]
}

# Cloud SQL MySQL Database
module "database" {
  source = "../../modules/database"

  project_id       = var.project_id
  region           = var.region
  environment      = var.environment
  app_name         = var.app_name
  vpc_network      = module.vpc.private_vpc_connection
  private_subnet   = module.vpc.private_subnet_name
  db_version       = var.db_version
  db_instance_tier = var.db_instance_tier

  depends_on = [module.vpc]
}

# NOTE: Pub/Sub removed - app uses synchronous processing
# Can be re-enabled later if async messaging is needed

# Cloud Storage for file uploads (images only)
module "storage" {
  source = "../../modules/storage"

  project_id  = var.project_id
  region      = var.region
  environment = var.environment
  app_name    = var.app_name

  depends_on = [google_project_service.required_apis]
}

# NOTE: Redis removed - not needed for current app scale
# Can be re-enabled later if caching is needed

# Secret Manager for environment-specific configuration
# NOTE: Shared secrets (gemini-api-key, PUBLIC_API_KEY, recaptcha-*)
# are managed by the shared environment: terraform/environments/shared
module "secrets" {
  source = "../../modules/secrets"

  project_id  = var.project_id
  environment = var.environment
  app_name    = var.app_name
  db_url      = module.database.database_url
  db_username = module.database.db_user
  db_password = module.database.db_password
  redis_auth  = "" # Redis disabled

  depends_on = [module.database]
}

# IAM and Service Accounts
module "iam" {
  source = "../../modules/iam"

  project_id  = var.project_id
  environment = var.environment
  app_name    = var.app_name

  depends_on = [google_project_service.required_apis]
}

# Cloud Run for backend application
module "cloud_run" {
  source = "../../modules/cloud_run"

  project_id            = var.project_id
  region                = var.region
  environment           = var.environment
  app_name              = var.app_name
  service_account_email = module.iam.backend_service_account_email
  vpc_connector_name    = module.vpc.vpc_connector_name
  db_connection_name    = module.database.db_connection_name
  db_name               = module.database.db_name
  db_user               = module.database.db_user
  storage_bucket_name   = module.storage.images_bucket_name
  # Redis disabled - not needed for current app scale
  redis_host            = ""
  redis_port            = 6379
  # Backend uses default GCP Cloud Run URL

  depends_on = [module.vpc, module.database, module.storage, module.iam]
}

# NOTE: Monitoring and Budget modules removed
# Using default GCP monitoring and logging (free tier)
# Can be re-enabled later if custom alerts/dashboards are needed