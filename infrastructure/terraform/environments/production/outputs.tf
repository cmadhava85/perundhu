# Production Environment Outputs
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
  description = "The environment name"
  value       = var.environment
}

# Network Outputs
output "vpc_network_name" {
  description = "The VPC network name"
  value       = module.vpc.network_name
}

output "vpc_network_id" {
  description = "The VPC network ID"
  value       = module.vpc.network_id
}

output "vpc_connector_name" {
  description = "The VPC connector name"
  value       = module.vpc.vpc_connector_name
}

# Database Outputs
output "db_connection_name" {
  description = "The Cloud SQL connection name"
  value       = module.database.db_connection_name
}

output "db_instance_name" {
  description = "The Cloud SQL instance name"
  value       = module.database.db_instance_name
}

output "db_name" {
  description = "The database name"
  value       = module.database.db_name
}

output "db_user" {
  description = "The database user"
  value       = module.database.db_user
}

# Storage Outputs
output "images_bucket_name" {
  description = "The Cloud Storage bucket for images"
  value       = module.storage.images_bucket_name
}

# Cloud Run Outputs
output "cloud_run_service_url" {
  description = "The Cloud Run service URL"
  value       = module.cloud_run.service_url
}

output "cloud_run_service_name" {
  description = "The Cloud Run service name"
  value       = module.cloud_run.service_name
}

# IAM Outputs
output "backend_service_account_email" {
  description = "The backend service account email"
  value       = module.iam.backend_service_account_email
}

# Application Configuration (for CI/CD pipelines)
output "application_config" {
  description = "Application configuration for deployment"
  value = {
    CLOUD_RUN_SERVICE_URL = module.cloud_run.service_url
    DB_CONNECTION_NAME    = module.database.db_connection_name
    IMAGES_BUCKET         = module.storage.images_bucket_name
  }
  sensitive = false
}
