output "service_name" {
  description = "Name of the Cloud Run service"
  value       = google_cloud_run_service.backend.name
}

output "service_url" {
  description = "URL of the Cloud Run service"
  value       = google_cloud_run_service.backend.status[0].url
}

output "service_location" {
  description = "Location of the Cloud Run service"
  value       = google_cloud_run_service.backend.location
}

output "latest_revision" {
  description = "Latest revision name"
  value       = google_cloud_run_service.backend.status[0].latest_revision_name
}