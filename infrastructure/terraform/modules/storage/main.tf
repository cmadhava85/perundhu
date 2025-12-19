# Cloud Storage bucket for Perundhu
# Simplified: Only images bucket (the only one actually used)

# Random string for bucket name uniqueness
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Bucket for storing uploaded images (user contributions, bus photos, etc.)
resource "google_storage_bucket" "images_bucket" {
  name     = "${var.app_name}-${var.environment}-images-${random_string.bucket_suffix.result}"
  location = var.region

  # Prevent accidental deletion
  force_destroy = false

  uniform_bucket_level_access = true

  versioning {
    enabled = false # No versioning needed for images
  }

  # Delete old images after 1 year to save costs
  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type = "Delete"
    }
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST"]
    response_header = ["Content-Type", "Content-Length"]
    max_age_seconds = 3600
  }
}

# NOTE: Backup, logs, and static assets buckets removed
# - Backups: Use Cloud SQL automated backups instead
# - Logs: Use default Cloud Logging (30-day free retention)
# - Static assets: Served from Cloud Run / CDN