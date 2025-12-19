# Logging optimization for cost savings
# Reduces log retention to minimize storage costs

# Configure default log bucket retention
resource "google_logging_project_bucket_config" "default" {
  project        = var.project_id
  location       = "global"
  retention_days = var.log_retention_days
  bucket_id      = "_Default"

  description = "Default log bucket with reduced retention for ${var.environment}"
}

# NOTE: The _Required bucket is locked by Google and cannot be modified via Terraform
# It maintains a fixed 400-day retention for compliance/audit logs
# See: https://cloud.google.com/logging/docs/buckets#required-bucket

# Log exclusion filter to reduce unnecessary logs
resource "google_logging_project_exclusion" "exclude_debug_logs" {
  count = var.exclude_debug_logs ? 1 : 0

  name        = "${var.app_name}-${var.environment}-exclude-debug"
  description = "Exclude debug and trace level logs to reduce costs"

  filter = "severity < WARNING AND NOT resource.type=\"cloud_run_revision\""
}

# Exclude health check logs (very noisy, not useful)
resource "google_logging_project_exclusion" "exclude_health_checks" {
  count = var.exclude_health_check_logs ? 1 : 0

  name        = "${var.app_name}-${var.environment}-exclude-healthchecks"
  description = "Exclude health check logs to reduce log volume"

  filter = <<-EOT
    resource.type="cloud_run_revision"
    AND httpRequest.requestUrl:"/health" OR httpRequest.requestUrl:"/actuator/health"
  EOT
}
