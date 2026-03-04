#!/usr/bin/env python3
"""Run V100 migration directly against production database"""
import mysql.connector
import os

config = {
    'host': '127.0.0.1',
    'port': 3307,
    'user': os.getenv('DB_USER', 'perundhu_user'),
    'password': os.getenv('DB_PASS'),
    'database': 'perundhu',
    'autocommit': False,
}

# V100 migration SQL
MIGRATION_SQL = [
    """
    CREATE TABLE IF NOT EXISTS admin_users (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        full_name VARCHAR(255),
        enabled BOOLEAN DEFAULT TRUE,
        account_non_expired BOOLEAN DEFAULT TRUE,
        account_non_locked BOOLEAN DEFAULT TRUE,
        credentials_non_expired BOOLEAN DEFAULT TRUE,
        roles VARCHAR(500) DEFAULT 'ROLE_ADMIN',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP NULL,
        created_by VARCHAR(100),
        updated_by VARCHAR(100),
        INDEX idx_username (username),
        INDEX idx_enabled (enabled),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
    """
    CREATE TABLE IF NOT EXISTS admin_auth_events (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_event_type (event_type),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
    """
    INSERT INTO admin_users (username, password_hash, email, full_name, enabled, roles, created_by)
    VALUES (
        'perundhu_admin',
        '$2a$10$cFAUxRHutOd7IVOLFBgJtuFDuGhTNzuZ4v.8uvVvpAIL.dRjhL03u',
        'admin@perundhu.com',
        'Perundhu Administrator',
        TRUE,
        'ROLE_ADMIN,ROLE_USER',
        'DB_MIGRATION'
    ) ON DUPLICATE KEY UPDATE password_hash = password_hash
    """,
    """
    INSERT INTO flyway_schema_history
        (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
    SELECT
        (SELECT COALESCE(MAX(installed_rank), 0) + 1 FROM flyway_schema_history AS fsh2),
        '100',
        'create admin users table',
        'SQL',
        'V100__create_admin_users_table.sql',
        0,
        'manual',
        NOW(),
        100,
        TRUE
    WHERE NOT EXISTS (SELECT 1 FROM flyway_schema_history WHERE version = '100')
    """,
]

try:
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    print("Connected to production database")

    steps = [
        "Create admin_users table",
        "Create admin_auth_events table",
        "Insert default admin user (perundhu_admin)",
        "Record V100 in flyway_schema_history",
    ]

    for i, sql in enumerate(MIGRATION_SQL):
        print(f"Step {i+1}: {steps[i]} ...", end=" ")
        cursor.execute(sql)
        print("OK")

    conn.commit()
    print("\nMigration V100 applied successfully!")
    print("\nAdmin credentials:")
    print("  Username: perundhu_admin")
    print("  Password: Admin123!@#Change")
    print("\nPlease change the password immediately after first login.")

except Exception as e:
    if 'conn' in locals():
        conn.rollback()
    print(f"\nERROR: {e}")
    raise
finally:
    if 'conn' in locals() and conn.is_connected():
        cursor.close()
        conn.close()
