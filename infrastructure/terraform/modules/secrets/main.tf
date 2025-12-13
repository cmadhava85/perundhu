# Secret Manager for storing sensitive configuration
# ============================================
# NAMING CONVENTION: {environment}-{secret-name}
# This matches the sm:// references in application-{profile}.properties
# ============================================
# NOTE: Shared secrets (gemini-api-key, PUBLIC_API_KEY, recaptcha-*)
# are managed by the shared-secrets module, not here.
# ============================================

# Database URL secret
resource "google_secret_manager_secret" "db_url" {
  secret_id = "${var.environment}-db-url"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_url" {
  secret      = google_secret_manager_secret.db_url.id
  secret_data = var.db_url
}

# Database username secret
resource "google_secret_manager_secret" "db_username" {
  secret_id = "${var.environment}-db-username"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_username" {
  secret      = google_secret_manager_secret.db_username.id
  secret_data = var.db_username
}

# Database password secret
resource "google_secret_manager_secret" "db_password" {
  secret_id = "${var.environment}-db-password"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = var.db_password
}

# JWT secret for authentication
resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "${var.environment}-jwt-secret"

  replication {
    auto {}
  }
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = false # Avoid special chars that may cause issues in env vars
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = random_password.jwt_secret.result
}

# Data encryption key (AES-256)
resource "google_secret_manager_secret" "data_encryption_key" {
  secret_id = "${var.environment}-data-encryption-key"

  replication {
    auto {}
  }
}

resource "random_password" "data_encryption_key" {
  length  = 32 # 256 bits for AES-256
  special = false
}

resource "google_secret_manager_secret_version" "data_encryption_key" {
  secret      = google_secret_manager_secret.data_encryption_key.id
  secret_data = random_password.data_encryption_key.result
}

# Redis auth string secret (optional, for caching)
resource "google_secret_manager_secret" "redis_auth" {
  count     = var.redis_auth != "" ? 1 : 0
  secret_id = "${var.environment}-redis-auth"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "redis_auth" {
  count       = var.redis_auth != "" ? 1 : 0
  secret      = google_secret_manager_secret.redis_auth[0].id
  secret_data = var.redis_auth
}