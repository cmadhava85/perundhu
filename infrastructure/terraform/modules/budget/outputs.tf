output "budget_name" {
  description = "Name of the budget"
  value       = google_billing_budget.monthly_budget.display_name
}

output "budget_id" {
  description = "ID of the budget"
  value       = google_billing_budget.monthly_budget.name
}

output "notification_channel_id" {
  description = "ID of the email notification channel"
  value       = length(google_monitoring_notification_channel.email) > 0 ? google_monitoring_notification_channel.email[0].name : null
}
