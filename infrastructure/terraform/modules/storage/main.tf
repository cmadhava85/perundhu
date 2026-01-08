# Cloud Storage bucket for Perundhu
# ============================================
# Stores uploaded images with configurable lifecycle policies

# Random string for bucket name uniqueness
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Bucket for storing uploaded images (user contributions, bus photos, etc.)
resource "google_storage_bucket" "images_bucket" {
  name          = "${var.app_name}-${var.environment}-images-${random_string.bucket_suffix.result}"
  location      = var.region
  force_destroy = var.images_bucket_force_destroy

  uniform_bucket_level_access = true

  versioning {
    enabled = var.images_bucket_versioning_enabled
  }

  # Lifecycle rules (configurable via variables)
  dynamic "lifecycle_rule" {
    for_each = var.images_bucket_lifecycle_rules
    content {
      condition {
        age = lifecycle_rule.value.age_days
      }
      action {
        type          = lifecycle_rule.value.action
        storage_class = lifecycle_rule.value.storage_class
      }
    }
  }

  # CORS configuration (optional)
  dynamic "cors" {
    for_each = var.images_bucket_cors_enabled ? [1] : []
    content {
      origin          = var.images_bucket_cors_origins
      method          = var.images_bucket_cors_methods
      response_header = var.images_bucket_cors_headers
      max_age_seconds = var.images_bucket_cors_max_age_seconds
    }
  }
}

# NOTE: Backup, logs, and static assets buckets removed
# - Backups: Use Cloud SQL automated backups instead
# - Logs: Use default Cloud Logging (30-day free retention)
# - Static assets: Served from Cloud Run / CDN
