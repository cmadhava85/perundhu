# Cloud Storage buckets for Perundhu

# Bucket for storing uploaded images
resource "google_storage_bucket" "images_bucket" {
  name     = "${var.app_name}-${var.environment}-images-${random_string.bucket_suffix.result}"
  location = var.region
  
  # Prevent accidental deletion
  force_destroy = false
  
  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }
  
  lifecycle_rule {
    condition {
      age = 30
      num_newer_versions = 3
    }
    action {
      type = "Delete"
    }
  }
  
  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# Bucket for storing database backups
resource "google_storage_bucket" "backup_bucket" {
  name     = "${var.app_name}-${var.environment}-backups-${random_string.bucket_suffix.result}"
  location = var.region
  
  # Cost optimization: Use NEARLINE for backups (accessed < 1x/month)
  storage_class = "NEARLINE"
  
  # Prevent accidental deletion
  force_destroy = false
  
  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }
  
  # Cost optimization: Delete old backups after 90 days
  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }
  
  # Move to COLDLINE after 30 days for older backups
  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }
}

# Bucket for storing application logs
resource "google_storage_bucket" "logs_bucket" {
  name     = "${var.app_name}-${var.environment}-logs-${random_string.bucket_suffix.result}"
  location = var.region
  
  force_destroy = true  # Logs can be safely deleted
  
  uniform_bucket_level_access = true
  
  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }
}

# Bucket for storing static assets (CSS, JS, images)
resource "google_storage_bucket" "static_assets_bucket" {
  name     = "${var.app_name}-${var.environment}-static-${random_string.bucket_suffix.result}"
  location = var.region
  
  force_destroy = false
  
  uniform_bucket_level_access = true
  
  # Make bucket publicly readable for static assets
  versioning {
    enabled = true
  }
  
  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD"]
    response_header = ["Content-Type", "Cache-Control"]
    max_age_seconds = 3600
  }
  
  lifecycle_rule {
    condition {
      age = 90
      num_newer_versions = 5
    }
    action {
      type = "Delete"
    }
  }
}

# Random string for bucket name uniqueness
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# IAM policy for public read access to static assets
resource "google_storage_bucket_iam_member" "static_assets_public_read" {
  bucket = google_storage_bucket.static_assets_bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Notification for image bucket (triggers when new images are uploaded)
resource "google_storage_notification" "image_notification" {
  bucket         = google_storage_bucket.images_bucket.name
  payload_format = "JSON_API_V1"
  topic          = var.pubsub_topic_image_processing
  event_types    = ["OBJECT_FINALIZE"]
}