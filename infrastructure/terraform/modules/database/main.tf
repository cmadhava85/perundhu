# Cloud SQL MySQL Database Module for Perundhu

# Generate random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# NOTE: Secrets (db-password, db-username) are managed by the secrets module
# This prevents duplicate secret creation across modules

# Cloud SQL instance
resource "google_sql_database_instance" "mysql_instance" {
  name             = "${var.app_name}-${var.environment}-mysql${var.db_instance_name_suffix}"
  database_version = var.db_version
  region           = var.region

  deletion_protection = false # Set to true for production

  settings {
    tier              = var.db_instance_tier
    activation_policy = var.db_activation_policy # ALWAYS or NEVER
    disk_type         = var.db_disk_type
    disk_size         = var.db_disk_size
    disk_autoresize   = true
    disk_autoresize_limit = var.db_disk_autoresize_limit

    availability_type = var.db_availability_type

    # Backup configuration based on variables
    backup_configuration {
      enabled    = var.db_backup_enabled
      start_time = var.db_backup_start_time

      backup_retention_settings {
        retained_backups = var.db_retained_backups_count
        retention_unit   = "COUNT"
      }

      transaction_log_retention_days = var.db_transaction_log_retention_days
      binary_log_enabled             = var.db_binary_log_enabled
    }

    ip_configuration {
      ipv4_enabled                                  = true
      private_network                               = var.use_public_ip ? null : var.vpc_network
      ssl_mode                                      = "ENCRYPTED_ONLY"
      enable_private_path_for_google_cloud_services = !var.use_public_ip
    }

    # Logging configuration based on variables
    database_flags {
      name  = "slow_query_log"
      value = var.db_slow_query_log_enabled ? "on" : "off"
    }

    database_flags {
      name  = "general_log"
      value = var.db_general_log_enabled ? "on" : "off"
    }

    database_flags {
      name  = "log_output"
      value = "FILE"
    }

    maintenance_window {
      day  = 7
      hour = 3
    }

    user_labels = {
      environment = var.environment
      cost_center = "perundhu"
    }
  }

  # Ignore differences from manually created instances to allow for graceful management
  lifecycle {
    ignore_changes = [
      settings[0].backup_configuration,
      settings[0].disk_type,
      settings[0].disk_size,
      settings[0].activation_policy
    ]
  }
}

# Database
resource "google_sql_database" "database" {
  name      = var.database_name
  instance  = google_sql_database_instance.mysql_instance.name
  charset   = "utf8mb4"
  collation = "utf8mb4_unicode_ci"
}

# Database user
# IMPORTANT: Always specify host = "%" to prevent malformed user entries
# Malformed entries (user without host) can occur from manual gcloud commands
# and will cause authentication failures
resource "google_sql_user" "users" {
  name     = var.database_user
  instance = google_sql_database_instance.mysql_instance.name
  password = random_password.db_password.result
  host     = "%"  # REQUIRED: Prevents creation of malformed user entries
  type     = "BUILT_IN"

  # Ignore changes to password since we manage it via Secret Manager and sync script
  # This prevents Terraform from trying to recreate the user with each apply
  lifecycle {
    ignore_changes = [password]
  }
}

# Additional database user for read-only access
# IMPORTANT: Always specify host = "%" to prevent malformed entries
resource "google_sql_user" "readonly_user" {
  name     = "${var.database_user}_readonly"
  instance = google_sql_database_instance.mysql_instance.name
  password = random_password.db_password.result
  host     = "%"  # REQUIRED: Prevents creation of malformed user entries
}

# Database for testing (optional)
resource "google_sql_database" "test_database" {
  count     = var.create_test_database ? 1 : 0
  name      = "${var.database_name}_test"
  instance  = google_sql_database_instance.mysql_instance.name
  charset   = "utf8mb4"
  collation = "utf8mb4_unicode_ci"
}

# ============================================
# READ REPLICA for 100k users scale optimization
# ============================================
# Cost-effective scaling: Routes read queries to replica
# Primary handles writes, replica handles 80-90% read traffic
# Estimated cost savings: $40-180/month vs scaling primary instance

resource "google_sql_database_instance" "read_replica" {
  count                = var.create_read_replica ? 1 : 0
  name                 = "${var.app_name}-${var.environment}-mysql${var.db_instance_name_suffix}-replica"
  database_version     = var.db_version
  region               = var.region
  master_instance_name = google_sql_database_instance.mysql_instance.name

  deletion_protection = false # Set to true for production

  replica_configuration {
    failover_target = false # Set to true if you want automatic failover
  }

  settings {
    tier              = var.read_replica_tier
    availability_type = "ZONAL" # Replicas are always zonal
    disk_autoresize   = true

    # Replicas inherit most settings from primary
    # Only specify settings that should be different
    
    ip_configuration {
      ipv4_enabled                                  = true
      private_network                               = var.use_public_ip ? null : var.vpc_network
      ssl_mode                                      = "ENCRYPTED_ONLY"
      enable_private_path_for_google_cloud_services = !var.use_public_ip
    }

    user_labels = {
      environment = var.environment
      cost_center = "perundhu"
      type        = "read-replica"
    }
  }

  depends_on = [google_sql_database_instance.mysql_instance]
}