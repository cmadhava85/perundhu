# ============================================
# Perundhu Base Infrastructure (Shared by preprod & production)
# ============================================
# This file contains the common infrastructure code
# used by all environments. Environment-specific
# configurations override defaults via tfvars.

# NOTE: This is NOT a module - it's included directly via terraform_self_service.
# terraform, required_providers, and provider blocks are defined in the root
# environment files (preprod/main.tf and production/main.tf).
# This file contains only resources and module instantiations.

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

  depends_on = [module.vpc]
}

# Cloud Storage for file uploads (images only)
module "storage" {
  source = "../../modules/storage"

  project_id  = var.project_id
  region      = var.region
  environment = var.environment
  app_name    = var.app_name

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
# Can be re-enabled later if async messaging is needed

# NOTE: Redis removed from deployment - not needed for current app scale
# Can be re-enabled later if caching is needed

# NOTE: Monitoring, Budget, and Logging modules removed
# Using default GCP monitoring and logging (free tier)
# Can be re-enabled later if custom alerts/dashboards are needed
