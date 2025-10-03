# Cloud SQL MySQL Database Module for Perundhu

# Generate random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Cloud SQL instance
resource "google_sql_database_instance" "mysql_instance" {
  name             = "${var.app_name}-${var.environment}-mysql"
  database_version = var.db_version
  region           = var.region
  
  deletion_protection = false  # Set to true for production

  settings {
    tier      = var.db_instance_tier
    disk_type = "PD_SSD"
    disk_size = 20
    
    availability_type = "ZONAL"  # Use REGIONAL for high availability in production
    
    backup_configuration {
      enabled    = true
      start_time = "02:00"
      
      backup_retention_settings {
        retained_backups = 7
        retention_unit   = "COUNT"
      }
      
      transaction_log_retention_days = 7
      binary_log_enabled            = true
    }
    
    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = var.vpc_network
      enable_private_path_for_google_cloud_services = true
    }
    
    database_flags {
      name  = "slow_query_log"
      value = "on"
    }
    
    database_flags {
      name  = "general_log"
      value = "on"
    }
    
    database_flags {
      name  = "log_output"
      value = "FILE"
    }
    
    maintenance_window {
      day  = 7
      hour = 3
    }
  }

  depends_on = [var.depends_on]
}

# Database
resource "google_sql_database" "database" {
  name     = var.database_name
  instance = google_sql_database_instance.mysql_instance.name
  charset  = "utf8mb4"
  collation = "utf8mb4_unicode_ci"
}

# Database user
resource "google_sql_user" "users" {
  name     = var.database_user
  instance = google_sql_database_instance.mysql_instance.name
  password = random_password.db_password.result
  host     = "%"
}

# Additional database user for read-only access
resource "google_sql_user" "readonly_user" {
  name     = "${var.database_user}_readonly"
  instance = google_sql_database_instance.mysql_instance.name
  password = random_password.db_password.result
  host     = "%"
}

# Database for testing (optional)
resource "google_sql_database" "test_database" {
  count    = var.create_test_database ? 1 : 0
  name     = "${var.database_name}_test"
  instance = google_sql_database_instance.mysql_instance.name
  charset  = "utf8mb4"
  collation = "utf8mb4_unicode_ci"
}