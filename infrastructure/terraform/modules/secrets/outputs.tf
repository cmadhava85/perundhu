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