# Cloud Run service for backend application

resource "google_cloud_run_service" "backend" {
  name     = var.backend_service_name != "" ? var.backend_service_name : "${var.app_name}-${var.environment}-backend"
  location = var.region

  template {
    metadata {
      annotations = merge(
        {
          "autoscaling.knative.dev/maxScale"         = tostring(var.max_instances)
          "autoscaling.knative.dev/minScale"         = tostring(var.min_instances)
          "run.googleapis.com/cloudsql-instances"    = var.db_connection_name
          # Cost optimization: CPU throttling and Gen2
          "run.googleapis.com/cpu-throttling"        = "true"
          "run.googleapis.com/startup-cpu-boost"     = "true"
          "run.googleapis.com/execution-environment" = "gen2"
        },
        # VPC connector is optional - only set if provided (saves $14/month when disabled)
        var.vpc_connector_name != "" ? {
          "run.googleapis.com/vpc-access-connector" = var.vpc_connector_name
          "run.googleapis.com/vpc-access-egress"    = "private-ranges-only"
        } : {}
      )
    }

    spec {
      service_account_name  = var.service_account_email
      container_concurrency = var.container_concurrency
      # Lower timeout reduces cost from hung/long requests billed against Cloud Run.
      timeout_seconds       = var.timeout_seconds

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
          value = var.environment # Uses "production" or "preprod" based on environment
        }

        # Flyway migration flags
        env {
          name  = "FLYWAY_ENABLED"
          value = tostring(var.flyway_enabled)
        }

        env {
          name  = "SPRING_FLYWAY_ENABLED"
          value = tostring(var.spring_flyway_enabled)
        }

        # Restart trigger for forcing Cloud Run revision updates
        dynamic "env" {
          for_each = var.restart_trigger != "" ? [1] : []
          content {
            name  = "RESTART_TRIGGER"
            value = var.restart_trigger
          }
        }

        env {
          name  = "GCP_PROJECT_ID"
          value = var.project_id
        }

        env {
          name  = "GCP_INSTANCE_CONNECTION_NAME"
          value = var.db_connection_name
        }

        # Database URL secret (new format) - optional
        dynamic "env" {
          for_each = var.db_url_secret_name != "" ? [1] : []
          content {
            name = "DB_URL"
            value_from {
              secret_key_ref {
                name = var.db_url_secret_name
                key  = "latest"
              }
            }
          }
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
              name = "db-password"
              key  = "latest"
            }
          }
        }

        # DB_USERNAME secret (new format) - for consistency with DB_URL
        env {
          name = "DB_USERNAME"
          value_from {
            secret_key_ref {
              name = "db-username"
              key  = "latest"
            }
          }
        }

        # DB_PASSWORD secret (new format) - for consistency with DB_URL
        env {
          name = "DB_PASSWORD"
          value_from {
            secret_key_ref {
              name = "db-password"
              key  = "latest"
            }
          }
        }

        # Admin credentials
        env {
          name = "ADMIN_USERNAME"
          value_from {
            secret_key_ref {
              name = var.admin_username_secret_name
              key  = "latest"
            }
          }
        }

        env {
          name = "ADMIN_PASSWORD"
          value_from {
            secret_key_ref {
              name = var.admin_password_secret_name
              key  = "latest"
            }
          }
        }

        # Data encryption key (for sensitive data at rest)
        dynamic "env" {
          for_each = var.data_encryption_key_secret_name != "" ? [1] : []
          content {
            name = "SECURITY_DATA_ENCRYPTION_KEY"
            value_from {
              secret_key_ref {
                name = var.data_encryption_key_secret_name
                key  = "latest"
              }
            }
          }
        }

        # Gemini API key
        env {
          name = "GEMINI_API_KEY"
          value_from {
            secret_key_ref {
              name = var.gemini_api_key_secret_name
              key  = "latest"
            }
          }
        }

        # reCAPTCHA keys
        env {
          name = "RECAPTCHA_SECRET_KEY"
          value_from {
            secret_key_ref {
              name = var.recaptcha_secret_key_secret_name
              key  = "latest"
            }
          }
        }

        env {
          name = "RECAPTCHA_SITE_KEY"
          value_from {
            secret_key_ref {
              name = var.recaptcha_site_key_secret_name
              key  = "latest"
            }
          }
        }

        # Redis is optional - only set if redis_host is provided
        dynamic "env" {
          for_each = var.redis_host != "" ? [1] : []
          content {
            name  = "REDIS_HOST"
            value = var.redis_host
          }
        }

        dynamic "env" {
          for_each = var.redis_host != "" ? [1] : []
          content {
            name  = "REDIS_PORT"
            value = tostring(var.redis_port)
          }
        }

        dynamic "env" {
          for_each = var.redis_host != "" ? [1] : []
          content {
            name = "REDIS_AUTH"
            value_from {
              secret_key_ref {
                name = "${var.app_name}-${var.environment}-redis-auth"
                key  = "latest"
              }
            }
          }
        }

        env {
          name  = "STORAGE_BUCKET_IMAGES"
          value = var.storage_bucket_name
        }

        # JWT secret is optional - only set if jwt_secret_name is provided
        dynamic "env" {
          for_each = var.jwt_secret_name != "" ? [1] : []
          content {
            name = "JWT_SECRET"
            value_from {
              secret_key_ref {
                name = var.jwt_secret_name
                key  = "latest"
              }
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

        # COST OPTIMIZATION: HikariCP pool size managed via application properties
        # Production: max=10, min_idle=2 (application-production.properties)
        # Preprod: max=5, min_idle=1 (can override here if needed)
        # Do NOT set here to avoid conflicts with application.properties
        # env {
        #   name  = "HIKARI_MAX_POOL_SIZE"
        #   value = "5"
        # }
        #
        # env {
        #   name  = "HIKARI_MIN_IDLE"
        #   value = "1"
        # }

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
          failure_threshold     = 90
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  lifecycle {
    ignore_changes = [
      # CI/CD pipeline manages the container image — do not reset it on Terraform apply
      template[0].spec[0].containers[0].image,
      # gcloud adds client-name/version and revision name annotations on each deploy
      template[0].metadata[0].annotations["run.googleapis.com/client-name"],
      template[0].metadata[0].annotations["run.googleapis.com/client-version"],
      template[0].metadata[0].name,
      # gcloud adds service-level annotations (ingress, etc.) outside our control
      metadata[0].annotations,
    ]
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