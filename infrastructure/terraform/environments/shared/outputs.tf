# Shared Outputs

output "gemini_api_key_secret_name" {
  description = "Gemini API key secret name (use with sm:// prefix)"
  value       = module.shared_secrets.gemini_api_key_secret_name
}

output "public_api_key_secret_name" {
  description = "Public API key secret name (use with sm:// prefix)"
  value       = module.shared_secrets.public_api_key_secret_name
}

output "recaptcha_site_key_secret_name" {
  description = "reCAPTCHA site key secret name (use with sm:// prefix)"
  value       = module.shared_secrets.recaptcha_site_key_secret_name
}

output "recaptcha_secret_key_secret_name" {
  description = "reCAPTCHA secret key secret name (use with sm:// prefix)"
  value       = module.shared_secrets.recaptcha_secret_key_secret_name
}
