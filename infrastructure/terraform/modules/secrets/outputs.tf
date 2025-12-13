# Environment-specific Secret Names
# Use these in application properties with sm:// prefix
# NOTE: Shared secrets (gemini-api-key, PUBLIC_API_KEY, recaptcha-*)
# are output by the shared-secrets module, not here.

output "db_url_secret_name" {
  description = "Database URL secret name"
  value       = google_secret_manager_secret.db_url.secret_id
}

output "db_username_secret_name" {
  description = "Database username secret name"
  value       = google_secret_manager_secret.db_username.secret_id
}

output "db_password_secret_name" {
  description = "Database password secret name"
  value       = google_secret_manager_secret.db_password.secret_id
}

output "jwt_secret_name" {
  description = "JWT secret name"
  value       = google_secret_manager_secret.jwt_secret.secret_id
}

output "data_encryption_key_secret_name" {
  description = "Data encryption key secret name"
  value       = google_secret_manager_secret.data_encryption_key.secret_id
}

output "redis_auth_secret_name" {
  description = "Redis auth secret name"
  value       = var.redis_auth != "" ? google_secret_manager_secret.redis_auth[0].secret_id : null
}

# Auto-generated secret values
output "jwt_secret_value" {
  description = "JWT secret value (auto-generated)"
  value       = random_password.jwt_secret.result
  sensitive   = true
}

output "data_encryption_key_value" {
  description = "Data encryption key value (auto-generated)"
  value       = random_password.data_encryption_key.result
  sensitive   = true
}