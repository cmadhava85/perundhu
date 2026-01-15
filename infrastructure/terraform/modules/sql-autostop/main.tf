# Cloud Function for Auto-stopping Idle Cloud SQL Instances
# =============================================================
# This module manages the Cloud Function that monitors and automatically
# stops Cloud SQL instances when they are idle (no active connections).

# Service Account for Cloud Function
resource "google_service_account" "sql_autostop_sa" {
  account_id   = "sql-auto-stop-sa"
  display_name = "SQL Auto-Stop Service Account"
  description  = "Service account for Cloud Function to auto-stop idle SQL instances"
  project      = var.project_id
}

# IAM Role: Cloud SQL Admin (for stopping SQL instances)
resource "google_project_iam_member" "sql_autostop_cloudsql_admin" {
  project = var.project_id
  role    = "roles/cloudsql.admin"
  member  = "serviceAccount:${google_service_account.sql_autostop_sa.email}"
}

# IAM Role: Monitoring Viewer (for checking active connections)
resource "google_project_iam_member" "sql_autostop_monitoring_viewer" {
  project = var.project_id
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:${google_service_account.sql_autostop_sa.email}"
}

# Cloud Function (Gen 2)
resource "google_cloudfunctions2_function" "sql_autostop" {
  name            = "sql-auto-stop"
  location        = var.region
  description     = "Auto-stop idle Cloud SQL instances"
  build_config {
    runtime           = "python311"
    entry_point       = "auto_stop_idle_sql"
    docker_repository = "projects/${var.project_id}/locations/${var.region}/repositories/cloud-functions"
    source {
      storage_source {
        bucket = google_storage_bucket.function_source.name
        object = google_storage_object.function_zip.name
      }
    }
  }

  service_config {
    max_instance_count             = 1
    available_memory_mb            = 256
    timeout_seconds                = 540
    service_account_email          = google_service_account.sql_autostop_sa.email
    all_traffic_on_latest_revision = true
    ingress_settings               = "ALLOW_PUBLIC"

    environment_variables = {
      PROJECT_ID         = var.project_id
      SQL_INSTANCE_NAME  = var.sql_instance_name
      IDLE_MINUTES       = var.idle_minutes_threshold
      DRY_RUN            = var.dry_run_mode ? "true" : "false"
    }
  }

  depends_on = [
    google_project_iam_member.sql_autostop_cloudsql_admin,
    google_project_iam_member.sql_autostop_monitoring_viewer,
    google_storage_object.function_zip
  ]
}

# Cloud Storage Bucket for Cloud Function source code
resource "google_storage_bucket" "function_source" {
  name          = "${var.project_id}-sql-autostop-source"
  location      = var.region
  project       = var.project_id
  force_destroy = true

  uniform_bucket_level_access = true

  lifecycle {
    ignore_changes = [labels]
  }
}

# Upload function source code to Cloud Storage
# NOTE: In a real scenario, you would archive the function code and upload it
# For now, we create a placeholder that can be manually uploaded or replaced
resource "google_storage_object" "function_zip" {
  name   = "sql-auto-stop-${formatdate("YYYY-MM-DD-hhmm", timestamp())}.zip"
  bucket = google_storage_bucket.function_source.name
  source = var.function_source_path

  depends_on = [google_storage_bucket.function_source]
}

# Cloud Scheduler Job - Triggers the Cloud Function every 30 minutes
resource "google_cloud_scheduler_job" "sql_autostop_scheduler" {
  name             = "sql-auto-stop-scheduler"
  description      = "Auto-stop idle Cloud SQL instances every ${var.schedule_interval_minutes} minutes"
  schedule         = var.cron_schedule
  time_zone        = var.time_zone
  attempt_deadline = "600s"
  region           = var.region
  project          = var.project_id

  http_target {
    http_method = "GET"
    uri         = "${trimprefix(google_cloudfunctions2_function.sql_autostop.service_config[0].uri, "https://")}"

    oidc_token {
      service_account_email = google_service_account.sql_autostop_sa.email
    }
  }

  depends_on = [google_cloudfunctions2_function.sql_autostop]
}
