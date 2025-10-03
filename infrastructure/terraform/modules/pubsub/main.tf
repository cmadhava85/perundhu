# Pub/Sub Topics and Subscriptions for Perundhu

# Topic for image processing events
resource "google_pubsub_topic" "image_processing" {
  name = "${var.app_name}-${var.environment}-image-processing"

  message_retention_duration = "86400s" # 24 hours
  
  message_storage_policy {
    allowed_persistence_regions = [var.region]
  }
}

# Subscription for image processing
resource "google_pubsub_subscription" "image_processing_subscription" {
  name  = "${var.app_name}-${var.environment}-image-processing-sub"
  topic = google_pubsub_topic.image_processing.name

  ack_deadline_seconds       = 30
  message_retention_duration = "86400s"
  retain_acked_messages      = false
  
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
  
  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }
}

# Topic for user notifications
resource "google_pubsub_topic" "notifications" {
  name = "${var.app_name}-${var.environment}-notifications"

  message_retention_duration = "86400s" # 24 hours
  
  message_storage_policy {
    allowed_persistence_regions = [var.region]
  }
}

# Subscription for notifications
resource "google_pubsub_subscription" "notifications_subscription" {
  name  = "${var.app_name}-${var.environment}-notifications-sub"
  topic = google_pubsub_topic.notifications.name

  ack_deadline_seconds       = 20
  message_retention_duration = "86400s"
  retain_acked_messages      = false
  
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "300s"
  }
}

# Topic for route contribution events
resource "google_pubsub_topic" "route_contributions" {
  name = "${var.app_name}-${var.environment}-route-contributions"

  message_retention_duration = "604800s" # 7 days
  
  message_storage_policy {
    allowed_persistence_regions = [var.region]
  }
}

# Subscription for route contributions
resource "google_pubsub_subscription" "route_contributions_subscription" {
  name  = "${var.app_name}-${var.environment}-route-contributions-sub"
  topic = google_pubsub_topic.route_contributions.name

  ack_deadline_seconds       = 60
  message_retention_duration = "604800s"
  retain_acked_messages      = false
  
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
  
  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 3
  }
}

# Topic for bus location updates
resource "google_pubsub_topic" "bus_locations" {
  name = "${var.app_name}-${var.environment}-bus-locations"

  message_retention_duration = "3600s" # 1 hour (location updates are frequent)
  
  message_storage_policy {
    allowed_persistence_regions = [var.region]
  }
}

# Subscription for bus location updates
resource "google_pubsub_subscription" "bus_locations_subscription" {
  name  = "${var.app_name}-${var.environment}-bus-locations-sub"
  topic = google_pubsub_topic.bus_locations.name

  ack_deadline_seconds       = 10
  message_retention_duration = "3600s"
  retain_acked_messages      = false
  
  retry_policy {
    minimum_backoff = "5s"
    maximum_backoff = "60s"
  }
}

# Dead letter topic for failed messages
resource "google_pubsub_topic" "dead_letter" {
  name = "${var.app_name}-${var.environment}-dead-letter"

  message_retention_duration = "604800s" # 7 days
  
  message_storage_policy {
    allowed_persistence_regions = [var.region]
  }
}

# Subscription for dead letter topic (for monitoring)
resource "google_pubsub_subscription" "dead_letter_subscription" {
  name  = "${var.app_name}-${var.environment}-dead-letter-sub"
  topic = google_pubsub_topic.dead_letter.name

  ack_deadline_seconds       = 600 # 10 minutes
  message_retention_duration = "604800s"
  retain_acked_messages      = false
}

# Topic for analytics events
resource "google_pubsub_topic" "analytics" {
  name = "${var.app_name}-${var.environment}-analytics"

  message_retention_duration = "259200s" # 3 days
  
  message_storage_policy {
    allowed_persistence_regions = [var.region]
  }
}

# Subscription for analytics events
resource "google_pubsub_subscription" "analytics_subscription" {
  name  = "${var.app_name}-${var.environment}-analytics-sub"
  topic = google_pubsub_topic.analytics.name

  ack_deadline_seconds       = 30
  message_retention_duration = "259200s"
  retain_acked_messages      = false
  
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "300s"
  }
}