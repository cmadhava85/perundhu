output "function_name" {
  description = "Name of the Cloud Function"
  value       = google_cloudfunctions2_function.sql_autostop.name
}

output "function_uri" {
  description = "URI of the Cloud Function"
  value       = google_cloudfunctions2_function.sql_autostop.service_config[0].uri
}

output "service_account_email" {
  description = "Email of the service account used by the Cloud Function"
  value       = google_service_account.sql_autostop_sa.email
}

output "scheduler_job_name" {
  description = "Name of the Cloud Scheduler job"
  value       = google_cloud_scheduler_job.sql_autostop_scheduler.name
}

output "scheduler_job_state" {
  description = "State of the Cloud Scheduler job"
  value       = google_cloud_scheduler_job.sql_autostop_scheduler.state
}

output "source_bucket_name" {
  description = "Cloud Storage bucket containing the function source code"
  value       = google_storage_bucket.function_source.name
}
