output "backend_service_account_email" {
  description = "Email of the backend service account"
  value       = google_service_account.backend_service_account.email
}

output "backend_service_account_id" {
  description = "ID of the backend service account"
  value       = google_service_account.backend_service_account.unique_id
}

output "cloudbuild_service_account_email" {
  description = "Email of the Cloud Build service account"
  value       = google_service_account.cloudbuild_service_account.email
}

output "cloudbuild_service_account_id" {
  description = "ID of the Cloud Build service account"
  value       = google_service_account.cloudbuild_service_account.unique_id
}

output "custom_role_id" {
  description = "ID of the custom application role"
  value       = google_project_iam_custom_role.app_role.role_id
}