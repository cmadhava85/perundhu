variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region for Cloud Function and Cloud Scheduler"
  type        = string
  default     = "asia-south1"
}

variable "sql_instance_name" {
  description = "Name of the Cloud SQL instance to monitor and auto-stop"
  type        = string
  default     = "perundhu-preprod-mysql"
}

variable "idle_minutes_threshold" {
  description = "Number of minutes of inactivity before auto-stopping the SQL instance"
  type        = number
  default     = 30
}

variable "dry_run_mode" {
  description = "If true, function will report what it would do without actually stopping the instance"
  type        = bool
  default     = false
}

variable "cron_schedule" {
  description = "Cron schedule for running the Cloud Function (in crontab format)"
  type        = string
  default     = "*/30 * * * *"
}

variable "schedule_interval_minutes" {
  description = "Interval in minutes for the scheduler (for display purposes)"
  type        = number
  default     = 30
}

variable "time_zone" {
  description = "Time zone for the scheduler (IANA Time Zone format)"
  type        = string
  default     = "Asia/Kolkata"
}

variable "function_source_path" {
  description = "Path to the zipped Cloud Function source code"
  type        = string
}
