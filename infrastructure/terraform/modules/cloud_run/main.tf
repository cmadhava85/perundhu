# Cloud Run service for backend application

resource "google_cloud_run_service" "backend" {
  name     = "${var.app_name}-${var.environment}-backend"
  location = var.region

  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"        = tostring(var.max_instances)
        "autoscaling.knative.dev/minScale"        = tostring(var.min_instances)
        "run.googleapis.com/cloudsql-instances"   = var.db_connection_name
        "run.googleapis.com/vpc-access-connector" = var.vpc_connector_name
        "run.googleapis.com/vpc-access-egress"    = "private-ranges-only"
      }
    }

    spec {
      service_account_name = var.service_account_email
      timeout_seconds      = 300
      
      containers {
        image = var.container_image
        
        ports {
          container_port = 8080
        }
        
        resources {
          limits = {
            cpu    = var.cpu_limit
            memory = var.memory_limit
          }
        }
        
        env {
          name  = "SPRING_PROFILES_ACTIVE"
          value = "preprod"
        }
        
        env {
          name  = "GCP_PROJECT_ID"
          value = var.project_id
        }
        
        env {
          name  = "GCP_INSTANCE_CONNECTION_NAME"
          value = var.db_connection_name
        }
        
        env {
          name  = "MYSQL_DATABASE"
          value = var.db_name
        }
        
        env {
          name  = "MYSQL_USERNAME"
          value = var.db_user
        }
        
        env {
          name = "MYSQL_PASSWORD"
          value_from {
            secret_key_ref {
              name = "${var.app_name}-${var.environment}-db-password"
              key  = "latest"
            }
          }
        }
        
        env {
          name  = "REDIS_HOST"
          value = var.redis_host
        }
        
        env {
          name  = "REDIS_PORT"
          value = tostring(var.redis_port)
        }
        
        env {
          name = "REDIS_AUTH"
          value_from {
            secret_key_ref {
              name = "${var.app_name}-${var.environment}-redis-auth"
              key  = "latest"
            }
          }
        }
        
        env {
          name  = "STORAGE_BUCKET_IMAGES"
          value = var.storage_bucket_name
        }
        
        env {
          name = "JWT_SECRET"
          value_from {
            secret_key_ref {
              name = "${var.app_name}-${var.environment}-jwt-secret"
              key  = "latest"
            }
          }
        }
        
        env {
          name  = "CORS_ALLOWED_ORIGINS"
          value = var.cors_allowed_origins
        }
        
        env {
          name  = "LOG_LEVEL_ROOT"
          value = "INFO"
        }
        
        env {
          name  = "LOG_LEVEL_APP"
          value = "INFO"
        }
        
        env {
          name  = "HIKARI_MAX_POOL_SIZE"
          value = "5"
        }
        
        env {
          name  = "HIKARI_MIN_IDLE"
          value = "2"
        }
        
        # Health check
        liveness_probe {
          http_get {
            path = "/actuator/health"
            port = 8080
          }
          initial_delay_seconds = 30
          period_seconds        = 10
          timeout_seconds       = 5
          failure_threshold     = 3
        }
        
        startup_probe {
          http_get {
            path = "/actuator/health"
            port = 8080
          }
          initial_delay_seconds = 0
          period_seconds        = 10
          timeout_seconds       = 5
          failure_threshold     = 30
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# IAM policy to allow public access (you may want to restrict this)
resource "google_cloud_run_service_iam_member" "public_access" {
  count = var.allow_public_access ? 1 : 0
  
  service  = google_cloud_run_service.backend.name
  location = google_cloud_run_service.backend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Custom domain mapping (optional)
resource "google_cloud_run_domain_mapping" "domain" {
  count = var.custom_domain != "" ? 1 : 0
  
  location = var.region
  name     = var.custom_domain

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_service.backend.name
  }
}