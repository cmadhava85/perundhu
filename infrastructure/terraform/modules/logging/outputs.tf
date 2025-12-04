output "default_bucket_name" {
  description = "Name of the default log bucket"
  value       = google_logging_project_bucket_config.default.name
}

output "log_retention_days" {
  description = "Configured log retention in days"
  value       = var.log_retention_days
}
