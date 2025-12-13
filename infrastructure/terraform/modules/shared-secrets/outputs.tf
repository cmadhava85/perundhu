# Shared Secret Names
# Use these in application properties with sm:// prefix

output "gemini_api_key_secret_name" {
  description = "Gemini API key secret name"
  value       = var.gemini_api_key != "" ? google_secret_manager_secret.gemini_api_key[0].secret_id : null
}

output "public_api_key_secret_name" {
  description = "Public API key secret name"
  value       = google_secret_manager_secret.public_api_key.secret_id
}

output "recaptcha_site_key_secret_name" {
  description = "reCAPTCHA site key secret name"
  value       = var.recaptcha_site_key != "" ? google_secret_manager_secret.recaptcha_site_key[0].secret_id : null
}

output "recaptcha_secret_key_secret_name" {
  description = "reCAPTCHA secret key secret name"
  value       = var.recaptcha_secret_key != "" ? google_secret_manager_secret.recaptcha_secret_key[0].secret_id : null
}

output "public_api_key_value" {
  description = "Public API key value (auto-generated)"
  value       = random_password.public_api_key.result
  sensitive   = true
}
