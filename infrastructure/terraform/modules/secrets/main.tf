# Secret Manager for storing sensitive configuration

# Database password secret
resource "google_secret_manager_secret" "db_password" {
  secret_id = "${var.app_name}-${var.environment}-db-password"
  
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = var.db_password
}

# Redis auth string secret
resource "google_secret_manager_secret" "redis_auth" {
  secret_id = "${var.app_name}-${var.environment}-redis-auth"
  
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "redis_auth" {
  secret      = google_secret_manager_secret.redis_auth.id
  secret_data = var.redis_auth
}

# JWT secret for authentication
resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "${var.app_name}-${var.environment}-jwt-secret"
  
  replication {
    automatic = true
  }
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = random_password.jwt_secret.result
}

# API keys for external services
resource "google_secret_manager_secret" "api_keys" {
  secret_id = "${var.app_name}-${var.environment}-api-keys"
  
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "api_keys" {
  secret      = google_secret_manager_secret.api_keys.id
  secret_data = jsonencode({
    google_maps_api_key = var.google_maps_api_key
    oauth_client_secret = var.oauth_client_secret
  })
}