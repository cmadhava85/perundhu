# IAM service accounts and roles for Perundhu

# Service account for backend application
resource "google_service_account" "backend_service_account" {
  account_id   = "${var.app_name}-${var.environment}-backend"
  display_name = "${var.app_name} ${var.environment} Backend Service Account"
  description  = "Service account for ${var.app_name} backend application in ${var.environment}"
}

# Service account for Cloud Build
resource "google_service_account" "cloudbuild_service_account" {
  account_id   = "${var.app_name}-${var.environment}-build"
  display_name = "${var.app_name} ${var.environment} Cloud Build Service Account"
  description  = "Service account for ${var.app_name} Cloud Build in ${var.environment}"
}

# IAM roles for backend service account
resource "google_project_iam_member" "backend_cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.backend_service_account.email}"
}

resource "google_project_iam_member" "backend_storage_admin" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.backend_service_account.email}"
}

resource "google_project_iam_member" "backend_pubsub_publisher" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.backend_service_account.email}"
}

resource "google_project_iam_member" "backend_pubsub_subscriber" {
  project = var.project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.backend_service_account.email}"
}

resource "google_project_iam_member" "backend_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.backend_service_account.email}"
}

resource "google_project_iam_member" "backend_redis_editor" {
  project = var.project_id
  role    = "roles/redis.editor"
  member  = "serviceAccount:${google_service_account.backend_service_account.email}"
}

resource "google_project_iam_member" "backend_monitoring_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.backend_service_account.email}"
}

resource "google_project_iam_member" "backend_logging_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.backend_service_account.email}"
}

# IAM roles for Cloud Build service account
resource "google_project_iam_member" "cloudbuild_logs_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.cloudbuild_service_account.email}"
}

resource "google_project_iam_member" "cloudbuild_storage_admin" {
  project = var.project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.cloudbuild_service_account.email}"
}

resource "google_project_iam_member" "cloudbuild_run_developer" {
  project = var.project_id
  role    = "roles/run.developer"
  member  = "serviceAccount:${google_service_account.cloudbuild_service_account.email}"
}

resource "google_project_iam_member" "cloudbuild_iam_service_account_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.cloudbuild_service_account.email}"
}

# Custom role for application-specific permissions
resource "google_project_iam_custom_role" "app_role" {
  role_id     = "${var.app_name}_${var.environment}_app_role"
  title       = "${var.app_name} ${var.environment} Application Role"
  description = "Custom role for ${var.app_name} application in ${var.environment}"

  permissions = [
    "pubsub.topics.publish",
    "pubsub.subscriptions.consume",
    "storage.objects.create",
    "storage.objects.get",
    "storage.objects.list",
    "secretmanager.versions.access",
    "cloudsql.instances.connect",
    "redis.instances.get"
  ]
}

resource "google_project_iam_member" "backend_custom_role" {
  project = var.project_id
  role    = google_project_iam_custom_role.app_role.name
  member  = "serviceAccount:${google_service_account.backend_service_account.email}"
}