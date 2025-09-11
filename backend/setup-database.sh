#!/bin/bash

# Database setup script with password prompt
# This script will create the database and run migrations

echo "=== Perundhu Database Setup ==="
echo ""

# Prompt for MySQL password
echo -n "Enter MySQL root password: "
read -s MYSQL_PASSWORD
echo ""

# Export the password for Flyway to use
export DB_PASSWORD="$MYSQL_PASSWORD"
export DB_USERNAME="root"
export DB_URL="jdbc:mysql://localhost:3306/perundhu?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true"

echo "Testing MySQL connection..."
mysql -u root -p"$MYSQL_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Failed to connect to MySQL. Please check your password and try again."
    exit 1
fi

echo "✅ MySQL connection successful!"
echo ""

echo "Creating database if it doesn't exist..."
mysql -u root -p"$MYSQL_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS perundhu;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Database 'perundhu' is ready"
else
    echo "❌ Failed to create database"
    exit 1
fi

echo ""
echo "Running Flyway migrations..."
./gradlew --no-configuration-cache flywayMigrate -Pflyway.password="$MYSQL_PASSWORD" -Pflyway.user="root"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup completed successfully!"
    echo "🚀 You can now start the application with: ./gradlew bootRun"
else
    echo ""
    echo "❌ Migration failed. Check the output above for details."
    exit 1
fi