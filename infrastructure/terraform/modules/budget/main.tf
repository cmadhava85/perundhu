# Budget alerts for cost monitoring

resource "google_billing_budget" "monthly_budget" {
  billing_account = var.billing_account_id
  display_name    = "${var.app_name}-${var.environment}-monthly-budget"

  budget_filter {
    projects = ["projects/${var.project_id}"]

    # Optional: Filter by specific services
    # services = ["services/24E6-581D-38E5"]  # Cloud Run
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = tostring(var.budget_amount)
    }
  }

  # Alert at 50% of budget
  threshold_rules {
    threshold_percent = 0.5
    spend_basis       = "CURRENT_SPEND"
  }

  # Alert at 75% of budget
  threshold_rules {
    threshold_percent = 0.75
    spend_basis       = "CURRENT_SPEND"
  }

  # Alert at 90% of budget
  threshold_rules {
    threshold_percent = 0.9
    spend_basis       = "CURRENT_SPEND"
  }

  # Alert at 100% of budget
  threshold_rules {
    threshold_percent = 1.0
    spend_basis       = "CURRENT_SPEND"
  }

  # Forecasted to exceed budget
  threshold_rules {
    threshold_percent = 1.0
    spend_basis       = "FORECASTED_SPEND"
  }

  # Send notifications to email and Pub/Sub
  all_updates_rule {
    monitoring_notification_channels = var.notification_channels
    disable_default_iam_recipients   = false

    # Optional: Pub/Sub topic for programmatic handling
    # pubsub_topic = var.budget_pubsub_topic
  }
}

# Notification channel for email alerts
resource "google_monitoring_notification_channel" "email" {
  count        = var.notification_email != "" ? 1 : 0
  display_name = "${var.app_name}-${var.environment}-budget-email"
  type         = "email"

  labels = {
    email_address = var.notification_email
  }
}
