# ============================================
# IAM Module Variables
# Manages service accounts and IAM role assignments
# ============================================

variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., preprod, production)"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
}

# ============================================
# Backend Service Account Roles
# ============================================

variable "backend_roles" {
  description = "IAM roles to assign to backend service account"
  type        = list(string)
  default = [
    "roles/cloudsql.client",              # Cloud SQL access
    "roles/storage.objectAdmin",          # Cloud Storage access
    "roles/secretmanager.secretAccessor", # Secret Manager access
    "roles/monitoring.metricWriter",      # Cloud Monitoring
    "roles/logging.logWriter",            # Cloud Logging
  ]
}

variable "backend_optional_roles" {
  description = "Optional IAM roles for backend (if features are enabled)"
  type = map(object({
    role    = string
    enabled = bool
  }))
  default = {
    pubsub_publisher = {
      role    = "roles/pubsub.publisher"
      enabled = false # Enable when async messaging is needed
    }
    pubsub_subscriber = {
      role    = "roles/pubsub.subscriber"
      enabled = false # Enable when async messaging is needed
    }
    redis_editor = {
      role    = "roles/redis.editor"
      enabled = false # Enable when caching is needed
    }
  }
}

# ============================================
# Cloud Build Service Account Roles
# ============================================

variable "cloudbuild_roles" {
  description = "IAM roles to assign to Cloud Build service account"
  type        = list(string)
  default = [
    "roles/logging.logWriter",      # Cloud Logging
    "roles/storage.admin",          # Cloud Storage (artifacts)
    "roles/run.developer",          # Cloud Run deployment
    "roles/iam.serviceAccountUser", # Service account impersonation
  ]
}

# ============================================
# Custom Application Role Permissions
# ============================================

variable "custom_role_permissions" {
  description = "Custom permissions for application role"
  type        = list(string)
  default = [
    "pubsub.topics.publish",
    "pubsub.subscriptions.consume",
    "storage.objects.create",
    "storage.objects.get",
    "storage.objects.list",
    "secretmanager.versions.access",
    "cloudsql.instances.connect",
    "redis.instances.get",
  ]
}

variable "enable_custom_role" {
  description = "Whether to create and assign custom application role"
  type        = bool
  default     = true
}

# ============================================
# Deployer Service Account (GitHub Actions / Terraform runner)
# ============================================

variable "deployer_sa_email" {
  description = "Email of the SA used to run terraform apply (e.g. GitHub Actions SA). Granted roles/iam.serviceAccountUser on the backend SA so it can deploy Cloud Run revisions using that identity."
  type        = string
  default     = ""
}