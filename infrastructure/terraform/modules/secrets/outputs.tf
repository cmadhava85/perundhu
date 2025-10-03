output "db_password_secret_name" {
  description = "Database password secret name"
  value       = google_secret_manager_secret.db_password.secret_id
}

output "redis_auth_secret_name" {
  description = "Redis auth secret name"
  value       = google_secret_manager_secret.redis_auth.secret_id
}

output "jwt_secret_name" {
  description = "JWT secret name"
  value       = google_secret_manager_secret.jwt_secret.secret_id
}

output "api_keys_secret_name" {
  description = "API keys secret name"
  value       = google_secret_manager_secret.api_keys.secret_id
}

output "jwt_secret_value" {
  description = "JWT secret value"
  value       = random_password.jwt_secret.result
  sensitive   = true
}