# Cloud Run service for OCR (PaddleOCR) microservice

resource "google_cloud_run_service" "ocr_service" {
  name     = "${var.app_name}-${var.environment}-ocr-service"
  location = var.region

  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = tostring(var.max_instances)
        "autoscaling.knative.dev/minScale" = tostring(var.min_instances)
        # Cost optimization: Only charge for CPU during active requests
        "run.googleapis.com/cpu-throttling" = var.cpu_throttling ? "true" : "false"
        # Startup CPU boost for faster cold starts (free)
        "run.googleapis.com/startup-cpu-boost" = "true"
        # Gen2 execution environment - more efficient, faster cold starts
        "run.googleapis.com/execution-environment" = "gen2"
        # OCR service doesn't need VPC access or Cloud SQL
      }
    }

    spec {
      service_account_name  = var.service_account_email
      timeout_seconds       = 120
      container_concurrency = var.concurrency  # Low concurrency for ML workload

      containers {
        image = var.container_image

        ports {
          container_port = 8081
        }

        resources {
          limits = {
            cpu    = var.cpu_limit     # "2" recommended for ML
            memory = var.memory_limit  # "4Gi" recommended for PaddleOCR
          }
        }

        env {
          name  = "HOST"
          value = "0.0.0.0"
        }

        env {
          name  = "PORT"
          value = "8081"
        }

        # Health check
        liveness_probe {
          http_get {
            path = "/health"
            port = 8081
          }
          initial_delay_seconds = 60  # PaddleOCR needs time to load models
          period_seconds        = 30
          timeout_seconds       = 10
          failure_threshold     = 3
        }

        startup_probe {
          http_get {
            path = "/health"
            port = 8081
          }
          initial_delay_seconds = 0
          period_seconds        = 10
          timeout_seconds       = 10
          failure_threshold     = 30  # Allow up to 5 minutes for model download
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# IAM policy - Internal only (backend can call, but not public)
# This uses Cloud Run's built-in service-to-service authentication
resource "google_cloud_run_service_iam_member" "backend_invoker" {
  service  = google_cloud_run_service.ocr_service.name
  location = google_cloud_run_service.ocr_service.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${var.backend_service_account_email}"
}

# Output the service URL for backend configuration
output "ocr_service_url" {
  description = "URL of the OCR service"
  value       = google_cloud_run_service.ocr_service.status[0].url
}

output "ocr_service_name" {
  description = "Name of the OCR Cloud Run service"
  value       = google_cloud_run_service.ocr_service.name
}
