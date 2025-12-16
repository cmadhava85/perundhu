# Shared Secrets Module
# ============================================
# These secrets are shared across ALL environments (preprod, production)
# This module should be applied ONCE at the project level, not per-environment
# ============================================

# Gemini API key (same for all environments)
resource "google_secret_manager_secret" "gemini_api_key" {
  count     = var.gemini_api_key != "" ? 1 : 0
  secret_id = "gemini-api-key"

  replication {
    auto {}
  }

  labels = {
    scope = "global"
    app   = var.app_name
  }
}

resource "google_secret_manager_secret_version" "gemini_api_key" {
  count       = var.gemini_api_key != "" ? 1 : 0
  secret      = google_secret_manager_secret.gemini_api_key[0].id
  secret_data = var.gemini_api_key
}

# Public API key for frontend (same for all environments)
resource "google_secret_manager_secret" "public_api_key" {
  secret_id = "PUBLIC_API_KEY"

  replication {
    auto {}
  }

  labels = {
    scope = "global"
    app   = var.app_name
  }
}

resource "random_password" "public_api_key" {
  length  = 32
  special = false
}

resource "google_secret_manager_secret_version" "public_api_key" {
  secret      = google_secret_manager_secret.public_api_key.id
  secret_data = random_password.public_api_key.result
}

# reCAPTCHA site key (same for all environments - tied to domain)
resource "google_secret_manager_secret" "recaptcha_site_key" {
  count     = var.recaptcha_site_key != "" ? 1 : 0
  secret_id = "recaptcha-site-key"

  replication {
    auto {}
  }

  labels = {
    scope = "global"
    app   = var.app_name
  }
}

resource "google_secret_manager_secret_version" "recaptcha_site_key" {
  count       = var.recaptcha_site_key != "" ? 1 : 0
  secret      = google_secret_manager_secret.recaptcha_site_key[0].id
  secret_data = var.recaptcha_site_key
}

# reCAPTCHA secret key (same for all environments)
resource "google_secret_manager_secret" "recaptcha_secret_key" {
  count     = var.recaptcha_secret_key != "" ? 1 : 0
  secret_id = "recaptcha-secret-key"

  replication {
    auto {}
  }

  labels = {
    scope = "global"
    app   = var.app_name
  }
}

resource "google_secret_manager_secret_version" "recaptcha_secret_key" {
  count       = var.recaptcha_secret_key != "" ? 1 : 0
  secret      = google_secret_manager_secret.recaptcha_secret_key[0].id
  secret_data = var.recaptcha_secret_key
}

# ============================================
# ADMIN PANEL AUTHENTICATION
# ============================================

# Admin username for admin panel access
resource "google_secret_manager_secret" "admin_username" {
  count     = var.admin_username != "" ? 1 : 0
  secret_id = "admin-username"

  replication {
    auto {}
  }

  labels = {
    scope = "global"
    app   = var.app_name
  }
}

resource "google_secret_manager_secret_version" "admin_username" {
  count       = var.admin_username != "" ? 1 : 0
  secret      = google_secret_manager_secret.admin_username[0].id
  secret_data = var.admin_username
}

# Admin password for admin panel access
resource "google_secret_manager_secret" "admin_password" {
  count     = var.admin_password != "" ? 1 : 0
  secret_id = "admin-password"

  replication {
    auto {}
  }

  labels = {
    scope = "global"
    app   = var.app_name
  }
}

resource "google_secret_manager_secret_version" "admin_password" {
  count       = var.admin_password != "" ? 1 : 0
  secret      = google_secret_manager_secret.admin_password[0].id
  secret_data = var.admin_password
}
