# Database Secret Names
# Use these in deployment scripts and Cloud Run configurations

output "db_username_secret_name" {
  description = "Database username secret name"
  value       = google_secret_manager_secret.db_username.secret_id
}

output "db_password_secret_name" {
  description = "Database password secret name"
  value       = google_secret_manager_secret.db_password.secret_id
}

output "db_url_secret_name" {
  description = "Database URL secret name (environment-specific)"
  value       = var.db_url != "" ? google_secret_manager_secret.db_url[0].secret_id : ""
}

output "data_encryption_key_secret_name" {
  description = "Data encryption key secret name (environment-specific)"
  value       = var.data_encryption_key != "" ? google_secret_manager_secret.data_encryption_key[0].secret_id : ""
}

output "jwt_secret_name" {
  description = "JWT secret name (environment-specific)"
  value       = var.jwt_secret != "" ? google_secret_manager_secret.jwt_secret[0].secret_id : ""
}