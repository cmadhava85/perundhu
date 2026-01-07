# Secret Manager for storing sensitive configuration
# ============================================
# NAMING CONVENTION: Core names (db-password, db-username, etc)
# These are shared across environments and managed centrally
# ============================================
# NOTE: Shared secrets (gemini-api-key, PUBLIC_API_KEY, recaptcha-*)
# are managed by the shared-secrets module, not here.
# ============================================

# Database username secret (shared, not environment-specific)
resource "google_secret_manager_secret" "db_username" {
  secret_id = "db-username"

  replication {
    auto {}
  }

  labels = {
    scope = "database"
    app   = var.app_name
  }

  lifecycle {
    ignore_changes = [replication]
  }
}

resource "google_secret_manager_secret_version" "db_username" {
  secret      = google_secret_manager_secret.db_username.id
  secret_data = var.db_username
}

# Database password secret (shared, not environment-specific)
resource "google_secret_manager_secret" "db_password" {
  secret_id = "db-password"

  replication {
    auto {}
  }

  labels = {
    scope = "database"
    app   = var.app_name
  }

  lifecycle {
    ignore_changes = [replication]
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = var.db_password
}