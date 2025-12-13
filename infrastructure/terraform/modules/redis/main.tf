# Redis instance for caching

resource "random_string" "redis_auth" {
  length  = 32
  special = true
}

resource "google_redis_instance" "cache" {
  name           = "${var.app_name}-${var.environment}-redis"
  memory_size_gb = var.memory_size_gb
  region         = var.region

  tier          = var.tier
  redis_version = var.redis_version
  display_name  = "${var.app_name}-${var.environment} Redis Cache"

  authorized_network = var.authorized_network

  auth_enabled = true

  redis_configs = {
    maxmemory-policy       = "allkeys-lru"
    notify-keyspace-events = "Ex"
    timeout                = "300"
  }

  maintenance_policy {
    weekly_maintenance_window {
      day = "SUNDAY"
      start_time {
        hours   = 3
        minutes = 0
        seconds = 0
        nanos   = 0
      }
    }
  }
}