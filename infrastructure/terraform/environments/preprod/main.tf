# Perundhu PreProd Environment Infrastructure
# ============================================
# Configuration is split for maintainability:
# - Backend configuration: preprod/backend.tf
# - Infrastructure modules: main.tf (below)
# - Variables: variables.tf

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

# Include shared infrastructure components
# This sources the actual infrastructure modules and resources
# Values are passed from terraform.tfvars and ../shared/variables.tf

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

  vpc_cidr                    = var.vpc_cidr
  public_subnet_cidr          = var.public_subnet_cidr
  private_subnet_cidr         = var.private_subnet_cidr
  vpc_connector_cidr          = var.vpc_connector_cidr
  vpc_connector_min_instances = var.vpc_connector_min_instances
  vpc_connector_max_instances = var.vpc_connector_max_instances
  vpc_connector_machine_type  = var.vpc_connector_machine_type
  firewall_rules              = var.firewall_rules

  depends_on = [google_project_service.required_apis]
}

# Cloud SQL MySQL Database
module "database" {
  source = "../../modules/database"

  project_id              = var.project_id
  region                  = var.region
  environment             = var.environment
  app_name                = var.app_name
  vpc_network             = module.vpc.private_vpc_connection
  private_subnet          = module.vpc.private_subnet_name
  db_version              = var.db_version
  db_instance_tier        = var.db_instance_tier
  db_instance_name_suffix = var.db_instance_name_suffix
  database_name           = var.database_name
  database_user           = var.database_user

  db_disk_type                      = var.db_disk_type
  db_disk_size                      = var.db_disk_size
  db_disk_autoresize_limit          = var.db_disk_autoresize_limit
  db_availability_type              = var.db_availability_type
  db_deletion_protection            = var.db_deletion_protection
  db_backup_enabled                 = var.db_backup_enabled
  db_backup_start_time              = var.db_backup_start_time
  db_retained_backups_count         = var.db_retained_backups_count
  db_transaction_log_retention_days = var.db_transaction_log_retention_days
  db_binary_log_enabled             = var.db_binary_log_enabled
  db_slow_query_log_enabled         = var.db_slow_query_log_enabled
  db_general_log_enabled            = var.db_general_log_enabled

  depends_on = [module.vpc]
}

# Cloud Storage for file uploads (images only)
module "storage" {
  source = "../../modules/storage"

  project_id  = var.project_id
  region      = var.region
  environment = var.environment
  app_name    = var.app_name

  images_bucket_versioning_enabled   = var.images_bucket_versioning_enabled
  images_bucket_force_destroy        = var.images_bucket_force_destroy
  images_bucket_cors_enabled         = var.images_bucket_cors_enabled
  images_bucket_cors_origins         = var.images_bucket_cors_origins
  images_bucket_cors_methods         = var.images_bucket_cors_methods
  images_bucket_cors_headers         = var.images_bucket_cors_headers
  images_bucket_cors_max_age_seconds = var.images_bucket_cors_max_age_seconds
  images_bucket_lifecycle_rules      = var.images_bucket_lifecycle_rules

  depends_on = [google_project_service.required_apis]
}

# Secret Manager for database credentials
# NOTE: Shared secrets (gemini-api-key, PUBLIC_API_KEY, recaptcha-*)
# are managed by the shared-secrets module
module "secrets" {
  source = "../../modules/secrets"

  project_id  = var.project_id
  environment = var.environment
  app_name    = var.app_name
  db_username = module.database.db_user
  db_password = module.database.db_password

  depends_on = [module.database]
}

# IAM and Service Accounts
module "iam" {
  source = "../../modules/iam"

  project_id  = var.project_id
  environment = var.environment
  app_name    = var.app_name

  backend_roles           = var.backend_roles
  backend_optional_roles  = var.backend_optional_roles
  cloudbuild_roles        = var.cloudbuild_roles
  custom_role_permissions = var.custom_role_permissions
  enable_custom_role      = var.enable_custom_role

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

  # Redis and JWT disabled - not needed for current app scale
  redis_host      = var.redis_host
  redis_port      = var.redis_port
  jwt_secret_name = var.jwt_secret_name

  # Cloud Run scaling and resource config from variables
  min_instances = var.cloud_run_min_instances
  max_instances = var.cloud_run_max_instances
  cpu_limit     = var.cloud_run_cpu_limit
  memory_limit  = var.cloud_run_memory_limit

  depends_on = [module.vpc, module.database, module.storage, module.iam]
}

# NOTE: Pub/Sub removed - app uses synchronous processing
# NOTE: Redis removed - not needed for current app scale
# NOTE: Monitoring, Budget, and Logging modules removed - using default GCP free tier

