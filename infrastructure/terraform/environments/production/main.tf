# Perundhu Production Environment Infrastructure
# ============================================
# Configuration is split for maintainability:
# - Backend configuration: production/backend.tf
# - Infrastructure modules: main.tf (below)
# - Variables: variables.tf
# 
# Database Cost Optimization (Jan 2026):
# - Downgraded from db-n1-standard-1 to db-f1-micro
# - Saves ~$20/month (~$240/year) with minimal performance impact
# - db-f1-micro is suitable for read-heavy bus tracking workloads

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

  backend "gcs" {
    bucket = "perundhu-prod-001-tf-state-1767644488"
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

# Include shared infrastructure components
# This sources the actual infrastructure modules and resources
# Values are passed from terraform.tfvars and ../shared/variables.tf

# Data sources (commented out - not needed for this operation)
# data "google_project" "project" {
#   project_id = var.project_id
# }

# Discover the SA running this terraform apply (GitHub Actions deployer)
# Used to grant it iam.serviceAccountUser on the backend SA
data "google_client_openid_userinfo" "deployer" {}

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
  use_public_ip           = var.use_public_ip
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
  db_activation_policy              = var.db_activation_policy
  db_backup_enabled                 = var.db_backup_enabled
  db_backup_start_time              = var.db_backup_start_time
  db_retained_backups_count         = var.db_retained_backups_count
  db_transaction_log_retention_days = var.db_transaction_log_retention_days
  db_binary_log_enabled             = var.db_binary_log_enabled
  db_slow_query_log_enabled         = var.db_slow_query_log_enabled
  db_general_log_enabled            = var.db_general_log_enabled

  # Read replica for 100k users scale
  create_read_replica = var.create_read_replica
  read_replica_tier   = var.read_replica_tier
  read_replica_zone   = var.read_replica_zone

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
#
# NOTE: For existing production secrets (production-db-url, production-data-encryption-key, production-jwt-secret),
# we reference them using data sources instead of creating them, as they were created manually.
# To manage these via Terraform in the future, import them into state:
#   terraform import module.secrets.google_secret_manager_secret.db_url[0] projects/perundhu-prod-001/secrets/production-db-url
module "secrets" {
  source = "../../modules/secrets"

  project_id  = var.project_id
  environment = var.environment
  app_name    = var.app_name
  db_username = module.database.db_user
  db_password = module.database.db_password

  # Leave these empty to avoid creating duplicates of manually-created secrets
  # Cloud Run will reference the existing secrets directly by name
  db_url              = ""
  data_encryption_key = ""
  jwt_secret          = ""

  depends_on = [module.database]
}

# Data sources for existing production secrets (created manually)
# These allow Terraform to reference them without managing their lifecycle
data "google_secret_manager_secret" "production_db_url" {
  secret_id = "production-db-url"
}

data "google_secret_manager_secret" "production_data_encryption_key" {
  secret_id = "production-data-encryption-key"
}

data "google_secret_manager_secret" "production_jwt_secret" {
  secret_id = "production-jwt-secret"
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
  deployer_sa_email       = data.google_client_openid_userinfo.deployer.email

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

  # Flyway migration flags
  flyway_enabled        = true
  spring_flyway_enabled = true
  restart_trigger       = "" # Set manually via gcloud or leave empty

  # Environment-specific secrets - use existing manually-created secrets
  db_url_secret_name              = data.google_secret_manager_secret.production_db_url.secret_id
  data_encryption_key_secret_name = data.google_secret_manager_secret.production_data_encryption_key.secret_id

  # JWT secret (uses production-jwt-secret)
  jwt_secret_name = data.google_secret_manager_secret.production_jwt_secret.secret_id

  # Shared secrets (from shared-secrets module, referenced by default names)
  # These use the default variable values in cloud_run module:
  # - gemini_api_key_secret_name = "gemini-api-key"
  # - admin_username_secret_name = "admin-username"
  # - admin_password_secret_name = "admin-password"
  # - recaptcha_secret_key_secret_name = "recaptcha-secret-key"
  # - recaptcha_site_key_secret_name = "recaptcha-site-key"

  # Redis disabled - not needed for current app scale
  redis_host = var.redis_host
  redis_port = var.redis_port

  # Cloud Run scaling and resource config from variables
  min_instances         = var.cloud_run_min_instances
  max_instances         = var.cloud_run_max_instances
  cpu_limit             = var.cloud_run_cpu_limit
  memory_limit          = var.cloud_run_memory_limit
  container_concurrency = var.cloud_run_concurrency
  timeout_seconds       = var.cloud_run_timeout

  depends_on = [module.vpc, module.database, module.storage, module.iam, module.secrets]
}

# NOTE: Pub/Sub removed - app uses synchronous processing
# NOTE: Redis removed - not needed for current app scale
# NOTE: Monitoring, Budget, and Logging modules removed - using default GCP free tier

