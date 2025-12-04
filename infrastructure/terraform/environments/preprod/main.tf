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

  project_id   = var.project_id
  region       = var.region
  environment  = var.environment
  app_name     = var.app_name

  depends_on = [google_project_service.required_apis]
}

# Cloud SQL MySQL Database
module "database" {
  source = "../../modules/database"

  project_id      = var.project_id
  region          = var.region
  environment     = var.environment
  app_name        = var.app_name
  vpc_network     = module.vpc.private_vpc_connection
  private_subnet  = module.vpc.private_subnet_name
  db_version      = var.db_version
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

# Redis for caching
module "redis" {
  source = "../../modules/redis"

  project_id        = var.project_id
  region            = var.region
  environment       = var.environment
  app_name          = var.app_name
  vpc_network       = module.vpc.network_name
  authorized_network = module.vpc.network_self_link

  depends_on = [module.vpc]
}

# Secret Manager for sensitive configuration
module "secrets" {
  source = "../../modules/secrets"

  project_id   = var.project_id
  environment  = var.environment
  app_name     = var.app_name
  db_password  = module.database.db_password
  redis_auth   = module.redis.redis_auth_string

  depends_on = [module.database, module.redis]
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

  project_id                = var.project_id
  region                    = var.region
  environment               = var.environment
  app_name                  = var.app_name
  service_account_email     = module.iam.backend_service_account_email
  vpc_connector_name        = module.vpc.vpc_connector_name
  db_connection_name        = module.database.db_connection_name
  db_name                   = module.database.db_name
  db_user                   = module.database.db_user
  storage_bucket_name       = module.storage.images_bucket_name
  redis_host                = module.redis.redis_host
  redis_port                = module.redis.redis_port
  # Backend uses default GCP Cloud Run URL

  depends_on = [module.vpc, module.database, module.storage, module.redis, module.iam]
}

# OCR Service (PaddleOCR) for text extraction from images
module "ocr_service" {
  source = "../../modules/ocr_service"

  project_id                    = var.project_id
  region                        = var.region
  environment                   = var.environment
  app_name                      = var.app_name
  container_image               = var.ocr_service_image
  service_account_email         = module.iam.backend_service_account_email
  backend_service_account_email = module.iam.backend_service_account_email
  
  # PaddleOCR resource requirements
  cpu_limit     = "2"
  memory_limit  = "4Gi"
  min_instances = 0
  max_instances = 5
  concurrency   = 10

  depends_on = [module.iam]
}

# Monitoring and Alerting
module "monitoring" {
  source = "../../modules/monitoring"

  project_id           = var.project_id
  environment          = var.environment
  app_name             = var.app_name
  cloud_run_service    = module.cloud_run.service_name
  db_instance_name     = module.database.db_instance_name
  notification_email   = var.notification_email

  depends_on = [module.cloud_run, module.database]
}