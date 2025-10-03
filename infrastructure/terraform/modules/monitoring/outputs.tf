output "notification_channel_name" {
  description = "Name of the email notification channel"
  value       = google_monitoring_notification_channel.email.name
}

output "uptime_check_id" {
  description = "ID of the uptime check"
  value       = google_monitoring_uptime_check_config.http_check.uptime_check_id
}

output "dashboard_url" {
  description = "URL to the monitoring dashboard"
  value       = "https://console.cloud.google.com/monitoring/dashboards/custom/${google_monitoring_dashboard.main.id}?project=${var.project_id}"
}

output "alert_policies" {
  description = "List of alert policy names"
  value = [
    google_monitoring_alert_policy.uptime_alert.name,
    google_monitoring_alert_policy.error_rate_alert.name,
    google_monitoring_alert_policy.db_connections_alert.name,
    google_monitoring_alert_policy.redis_memory_alert.name
  ]
}