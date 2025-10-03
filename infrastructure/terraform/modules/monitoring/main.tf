# Monitoring and alerting for Perundhu

# Notification channel for email alerts
resource "google_monitoring_notification_channel" "email" {
  display_name = "${var.app_name}-${var.environment}-email-alerts"
  type         = "email"
  labels = {
    email_address = var.notification_email
  }
  enabled = true
}

# Uptime check for the Cloud Run service
resource "google_monitoring_uptime_check_config" "http_check" {
  display_name = "${var.app_name}-${var.environment}-uptime-check"
  timeout      = "10s"
  period       = "60s"

  http_check {
    path         = "/actuator/health"
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = replace(var.cloud_run_url, "https://", "")
    }
  }

  content_matchers {
    content = "UP"
    matcher = "CONTAINS_STRING"
  }
}

# Alert policy for uptime check failures
resource "google_monitoring_alert_policy" "uptime_alert" {
  display_name = "${var.app_name}-${var.environment}-uptime-alert"
  combiner     = "OR"
  enabled      = true

  conditions {
    display_name = "Uptime check failure"
    
    condition_threshold {
      filter          = "metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\" resource.type=\"uptime_url\""
      duration        = "300s"
      comparison      = "COMPARISON_EQUAL"
      threshold_value = 0
      
      trigger {
        count = 1
      }
      
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_FRACTION_TRUE"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.name]

  alert_strategy {
    auto_close = "1800s"
  }
}

# Alert policy for high error rate
resource "google_monitoring_alert_policy" "error_rate_alert" {
  display_name = "${var.app_name}-${var.environment}-error-rate-alert"
  combiner     = "OR"
  enabled      = true

  conditions {
    display_name = "High error rate"
    
    condition_threshold {
      filter          = "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" metric.label.response_code_class=\"5xx\""
      duration        = "300s"
      comparison      = "COMPARISON_GREATER_THAN"
      threshold_value = 10
      
      trigger {
        count = 1
      }
      
      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
        group_by_fields      = ["resource.label.service_name"]
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.name]
}

# Alert policy for high database connections
resource "google_monitoring_alert_policy" "db_connections_alert" {
  display_name = "${var.app_name}-${var.environment}-db-connections-alert"
  combiner     = "OR"
  enabled      = true

  conditions {
    display_name = "High database connections"
    
    condition_threshold {
      filter          = "metric.type=\"cloudsql.googleapis.com/database/postgresql/num_backends\" resource.type=\"cloudsql_database\""
      duration        = "300s"
      comparison      = "COMPARISON_GREATER_THAN"
      threshold_value = 80
      
      trigger {
        count = 1
      }
      
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.name]
}

# Alert policy for Redis memory usage
resource "google_monitoring_alert_policy" "redis_memory_alert" {
  display_name = "${var.app_name}-${var.environment}-redis-memory-alert"
  combiner     = "OR"
  enabled      = true

  conditions {
    display_name = "High Redis memory usage"
    
    condition_threshold {
      filter          = "metric.type=\"redis.googleapis.com/stats/memory/usage_ratio\" resource.type=\"redis_instance\""
      duration        = "300s"
      comparison      = "COMPARISON_GREATER_THAN"
      threshold_value = 0.8
      
      trigger {
        count = 1
      }
      
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.name]
}

# Custom dashboard
resource "google_monitoring_dashboard" "main" {
  dashboard_json = jsonencode({
    displayName = "${var.app_name}-${var.environment}-dashboard"
    
    gridLayout = {
      widgets = [
        {
          title = "Cloud Run Request Count"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\""
                  aggregation = {
                    alignmentPeriod    = "60s"
                    perSeriesAligner   = "ALIGN_RATE"
                    crossSeriesReducer = "REDUCE_SUM"
                    groupByFields      = ["resource.label.service_name"]
                  }
                }
              }
              plotType = "LINE"
            }]
            yAxis = {
              label = "Requests per second"
              scale = "LINEAR"
            }
          }
        },
        {
          title = "Cloud Run Instance Count"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"run.googleapis.com/container/instance_count\" resource.type=\"cloud_run_revision\""
                  aggregation = {
                    alignmentPeriod    = "60s"
                    perSeriesAligner   = "ALIGN_MEAN"
                    crossSeriesReducer = "REDUCE_SUM"
                    groupByFields      = ["resource.label.service_name"]
                  }
                }
              }
              plotType = "LINE"
            }]
            yAxis = {
              label = "Instance count"
              scale = "LINEAR"
            }
          }
        },
        {
          title = "Database Connections"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"cloudsql.googleapis.com/database/postgresql/num_backends\" resource.type=\"cloudsql_database\""
                  aggregation = {
                    alignmentPeriod  = "60s"
                    perSeriesAligner = "ALIGN_MEAN"
                  }
                }
              }
              plotType = "LINE"
            }]
            yAxis = {
              label = "Active connections"
              scale = "LINEAR"
            }
          }
        },
        {
          title = "Redis Memory Usage"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"redis.googleapis.com/stats/memory/usage_ratio\" resource.type=\"redis_instance\""
                  aggregation = {
                    alignmentPeriod  = "60s"
                    perSeriesAligner = "ALIGN_MEAN"
                  }
                }
              }
              plotType = "LINE"
            }]
            yAxis = {
              label = "Memory usage ratio"
              scale = "LINEAR"
            }
          }
        }
      ]
    }
  })
}