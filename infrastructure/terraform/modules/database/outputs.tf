output "db_instance_name" {
  description = "The name of the database instance"
  value       = google_sql_database_instance.mysql_instance.name
}

output "db_connection_name" {
  description = "The connection name of the database instance"
  value       = google_sql_database_instance.mysql_instance.connection_name
}

output "db_private_ip" {
  description = "The private IP address of the database instance"
  value       = google_sql_database_instance.mysql_instance.private_ip_address
}

output "db_name" {
  description = "The name of the database"
  value       = google_sql_database.database.name
}

output "db_user" {
  description = "The database user name"
  value       = google_sql_user.users.name
}

output "db_password" {
  description = "The database password"
  value       = random_password.db_password.result
  sensitive   = true
}

output "readonly_user" {
  description = "The read-only database user name"
  value       = google_sql_user.readonly_user.name
}

output "test_database_name" {
  description = "The name of the test database"
  value       = var.create_test_database ? google_sql_database.test_database[0].name : null
}

output "database_url" {
  description = "JDBC URL for connecting to the database"
  value       = "jdbc:mysql://google/${google_sql_database.database.name}?socketFactory=com.google.cloud.sql.mysql.SocketFactory&cloudSqlInstance=${google_sql_database_instance.mysql_instance.connection_name}"
  sensitive   = true
}