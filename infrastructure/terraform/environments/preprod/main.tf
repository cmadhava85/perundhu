# Perundhu PreProd Environment Infrastructure
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

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "compute.googleapis.com",
    "sqladmin.googleapis.com",
    "cloudbuild.googleapis.com",
    "run.googleapis.com",
    "pubsub.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "servicenetworking.googleapis.com",
    "redis.googleapis.com",
    "memcache.googleapis.com"
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

# Pub/Sub for messaging
module "pubsub" {
  source = "../../modules/pubsub"

  project_id  = var.project_id
  region      = var.region
  environment = var.environment
  app_name    = var.app_name

  depends_on = [google_project_service.required_apis]
}

# Cloud Storage for file uploads
module "storage" {
  source = "../../modules/storage"

  project_id  = var.project_id
  region      = var.region
  environment = var.environment
  app_name    = var.app_name

  depends_on = [google_project_service.required_apis]
}

# Redis for caching - OPTIONAL for preprod (set enable_redis = false to save ~$25/month)
module "redis" {
  source = "../../modules/redis"
  count  = var.enable_redis ? 1 : 0

  project_id         = var.project_id
  region             = var.region
  environment        = var.environment
  app_name           = var.app_name
  vpc_network        = module.vpc.network_name
  authorized_network = module.vpc.network_self_link

  # Use smallest Redis for dev (1GB)
  memory_size_gb = 1
  tier           = "BASIC" # No HA for preprod

  depends_on = [module.vpc]
}

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
  redis_auth  = var.enable_redis ? module.redis[0].redis_auth_string : ""

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
  # Redis is optional for preprod - use empty string if disabled
  redis_host = var.enable_redis ? module.redis[0].redis_host : ""
  redis_port = var.enable_redis ? module.redis[0].redis_port : 6379

  # Cost optimization: Scale to zero, minimal resources
  min_instances = 0       # Scale to zero when idle
  max_instances = 2       # Low max for dev
  cpu_limit     = "1000m" # 1 CPU
  memory_limit  = "512Mi" # Minimal memory for dev

  depends_on = [module.vpc, module.database, module.storage, module.iam]
}

# Monitoring and Alerting
module "monitoring" {
  source = "../../modules/monitoring"

  project_id         = var.project_id
  environment        = var.environment
  app_name           = var.app_name
  cloud_run_service  = module.cloud_run.service_name
  db_instance_name   = module.database.db_instance_name
  notification_email = var.notification_email

  depends_on = [module.cloud_run, module.database]
}

# Budget Alerts for cost monitoring
module "budget" {
  source = "../../modules/budget"

  project_id         = var.project_id
  billing_account_id = var.billing_account_id
  environment        = var.environment
  app_name           = var.app_name
  budget_amount      = var.monthly_budget_amount
  notification_email = var.notification_email
}

# Logging optimization - reduce retention to minimize costs
module "logging" {
  source = "../../modules/logging"

  project_id                = var.project_id
  environment               = var.environment
  app_name                  = var.app_name
  log_retention_days        = 7    # Minimum retention for dev
  exclude_debug_logs        = true # Don't store debug logs
  exclude_health_check_logs = true # Don't store health check spam
}