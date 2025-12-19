# Perundhu PreProd Environment Outputs
# Simplified - removed outputs for Pub/Sub, Redis, Budget, Monitoring

output "project_id" {
  description = "The GCP project ID"
  value       = var.project_id
}

output "region" {
  description = "The GCP region"
  value       = var.region
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

# Database Outputs
output "db_connection_name" {
  description = "Cloud SQL connection name"
  value       = module.database.db_connection_name
  sensitive   = true
}

output "db_private_ip" {
  description = "Database private IP address"
  value       = module.database.db_private_ip
  sensitive   = true
}

output "db_name" {
  description = "Database name"
  value       = module.database.db_name
}

output "db_user" {
  description = "Database user"
  value       = module.database.db_user
}

# Cloud Run Outputs
output "backend_service_url" {
  description = "Backend Cloud Run service URL"
  value       = module.cloud_run.service_url
}

output "backend_service_name" {
  description = "Backend Cloud Run service name"
  value       = module.cloud_run.service_name
}

# Storage Outputs
output "images_bucket_name" {
  description = "Cloud Storage bucket for images"
  value       = module.storage.images_bucket_name
}

# VPC Outputs
output "vpc_network_name" {
  description = "VPC network name"
  value       = module.vpc.network_name
}

output "vpc_connector_name" {
  description = "VPC connector name for Cloud Run"
  value       = module.vpc.vpc_connector_name
}

# Service Account Outputs
output "backend_service_account_email" {
  description = "Backend service account email"
  value       = module.iam.backend_service_account_email
}

# Secret Manager Outputs
output "db_password_secret_name" {
  description = "Database password secret name"
  value       = module.secrets.db_password_secret_name
  sensitive   = true
}

# Configuration for application
output "application_config" {
  description = "Application configuration for deployment"
  value = {
    GCP_PROJECT_ID               = var.project_id
    GCP_REGION                   = var.region
    GCP_INSTANCE_CONNECTION_NAME = module.database.db_connection_name
    MYSQL_DATABASE               = module.database.db_name
    MYSQL_USERNAME               = module.database.db_user
    STORAGE_BUCKET_IMAGES        = module.storage.images_bucket_name
    SERVICE_ACCOUNT_EMAIL        = module.iam.backend_service_account_email
    GEMINI_API_ENABLED           = true
  }
  sensitive = true
}