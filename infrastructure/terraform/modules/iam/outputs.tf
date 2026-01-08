# ============================================
# IAM Module Outputs
# ============================================

output "backend_service_account_email" {
  description = "Email of the backend service account"
  value       = google_service_account.backend_service_account.email
}

output "backend_service_account_id" {
  description = "Unique ID of the backend service account"
  value       = google_service_account.backend_service_account.unique_id
}

output "backend_service_account_name" {
  description = "Name of the backend service account"
  value       = google_service_account.backend_service_account.account_id
}

output "cloudbuild_service_account_email" {
  description = "Email of the Cloud Build service account"
  value       = google_service_account.cloudbuild_service_account.email
}

output "cloudbuild_service_account_id" {
  description = "Unique ID of the Cloud Build service account"
  value       = google_service_account.cloudbuild_service_account.unique_id
}

output "cloudbuild_service_account_name" {
  description = "Name of the Cloud Build service account"
  value       = google_service_account.cloudbuild_service_account.account_id
}

output "custom_role_id" {
  description = "ID of the custom application role"
  value       = var.enable_custom_role ? google_project_iam_custom_role.app_role[0].role_id : null
}

output "custom_role_name" {
  description = "Name of the custom application role"
  value       = var.enable_custom_role ? google_project_iam_custom_role.app_role[0].name : null
}

output "backend_roles_assigned" {
  description = "List of all roles assigned to backend service account"
  value       = concat(var.backend_roles, [for k, v in var.backend_optional_roles : v.role if v.enabled])
}

output "cloudbuild_roles_assigned" {
  description = "List of all roles assigned to Cloud Build service account"
  value       = var.cloudbuild_roles
}