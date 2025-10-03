output "images_bucket_name" {
  description = "The name of the images storage bucket"
  value       = google_storage_bucket.images_bucket.name
}

output "images_bucket_url" {
  description = "The URL of the images storage bucket"
  value       = google_storage_bucket.images_bucket.url
}

output "backup_bucket_name" {
  description = "The name of the backup storage bucket"
  value       = google_storage_bucket.backup_bucket.name
}

output "backup_bucket_url" {
  description = "The URL of the backup storage bucket"
  value       = google_storage_bucket.backup_bucket.url
}

output "logs_bucket_name" {
  description = "The name of the logs storage bucket"
  value       = google_storage_bucket.logs_bucket.name
}

output "logs_bucket_url" {
  description = "The URL of the logs storage bucket"
  value       = google_storage_bucket.logs_bucket.url
}

output "static_assets_bucket_name" {
  description = "The name of the static assets storage bucket"
  value       = google_storage_bucket.static_assets_bucket.name
}

output "static_assets_bucket_url" {
  description = "The URL of the static assets storage bucket"
  value       = google_storage_bucket.static_assets_bucket.url
}

output "bucket_suffix" {
  description = "Random suffix used for bucket names"
  value       = random_string.bucket_suffix.result
}