# Topic outputs
output "image_processing_topic" {
  description = "The name of the image processing topic"
  value       = google_pubsub_topic.image_processing.name
}

output "notification_topic" {
  description = "The name of the notification topic"
  value       = google_pubsub_topic.notifications.name
}

output "route_contributions_topic" {
  description = "The name of the route contributions topic"
  value       = google_pubsub_topic.route_contributions.name
}

output "bus_locations_topic" {
  description = "The name of the bus locations topic"
  value       = google_pubsub_topic.bus_locations.name
}

output "analytics_topic" {
  description = "The name of the analytics topic"
  value       = google_pubsub_topic.analytics.name
}

output "dead_letter_topic" {
  description = "The name of the dead letter topic"
  value       = google_pubsub_topic.dead_letter.name
}

# Subscription outputs
output "image_processing_subscription" {
  description = "The name of the image processing subscription"
  value       = google_pubsub_subscription.image_processing_subscription.name
}

output "notifications_subscription" {
  description = "The name of the notifications subscription"
  value       = google_pubsub_subscription.notifications_subscription.name
}

output "route_contributions_subscription" {
  description = "The name of the route contributions subscription"
  value       = google_pubsub_subscription.route_contributions_subscription.name
}

output "bus_locations_subscription" {
  description = "The name of the bus locations subscription"
  value       = google_pubsub_subscription.bus_locations_subscription.name
}

output "analytics_subscription" {
  description = "The name of the analytics subscription"
  value       = google_pubsub_subscription.analytics_subscription.name
}

output "dead_letter_subscription" {
  description = "The name of the dead letter subscription"
  value       = google_pubsub_subscription.dead_letter_subscription.name
}

# Topic IDs for IAM policies
output "image_processing_topic_id" {
  description = "The ID of the image processing topic"
  value       = google_pubsub_topic.image_processing.id
}

output "notification_topic_id" {
  description = "The ID of the notification topic"
  value       = google_pubsub_topic.notifications.id
}

output "route_contributions_topic_id" {
  description = "The ID of the route contributions topic"
  value       = google_pubsub_topic.route_contributions.id
}

output "bus_locations_topic_id" {
  description = "The ID of the bus locations topic"
  value       = google_pubsub_topic.bus_locations.id
}

output "analytics_topic_id" {
  description = "The ID of the analytics topic"
  value       = google_pubsub_topic.analytics.id
}