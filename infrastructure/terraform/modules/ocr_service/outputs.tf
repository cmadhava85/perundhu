output "service_url" {
  description = "URL of the OCR service"
  value       = google_cloud_run_service.ocr_service.status[0].url
}

output "service_name" {
  description = "Name of the OCR Cloud Run service"
  value       = google_cloud_run_service.ocr_service.name
}

output "service_id" {
  description = "ID of the OCR Cloud Run service"
  value       = google_cloud_run_service.ocr_service.id
}
