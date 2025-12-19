# Storage module outputs - simplified to images bucket only

output "images_bucket_name" {
  description = "The name of the images storage bucket"
  value       = google_storage_bucket.images_bucket.name
}

output "images_bucket_url" {
  description = "The URL of the images storage bucket"
  value       = google_storage_bucket.images_bucket.url
}

output "bucket_suffix" {
  description = "Random suffix used for bucket names"
  value       = random_string.bucket_suffix.result
}