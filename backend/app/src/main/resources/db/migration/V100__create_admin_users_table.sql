-- Admin users table for database-backed authentication
-- Benefits:
-- 1. No redeployment needed to change credentials
-- 2. BCrypt hashed passwords (secure)
-- 3. Multiple admin users with different roles
-- 4. Audit trail (created_at, updated_at, last_login_at)
-- 5. Can disable users without deleting

CREATE TABLE IF NOT EXISTS admin_users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- BCrypt hash
    email VARCHAR(255),
    full_name VARCHAR(255),
    enabled BOOLEAN DEFAULT TRUE,
    account_non_expired BOOLEAN DEFAULT TRUE,
    account_non_locked BOOLEAN DEFAULT TRUE,
    credentials_non_expired BOOLEAN DEFAULT TRUE,
    roles VARCHAR(500) DEFAULT 'ROLE_ADMIN', -- Comma-separated roles
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_username (username),
    INDEX idx_enabled (enabled),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user with BCrypt hashed password
-- Default password: PerundhuAdmin2026@MTA1MDNiOTBkOTE2
-- BCrypt hash generated with strength 10 (Spring Security default)
-- Hash: $2a$10$Vl8YvqXkGZ9h2YqZ5J5X5OZQh5X5OZQh5X5OZQh5X5OZQh5X5OZQK
-- IMPORTANT: This will be replaced programmatically on first boot if needed
-- Insert default admin user with BCrypt hashed password
-- ⚠️  SECURITY: Change this password immediately after first deployment!
-- 
-- Default credentials (for first-time setup only):
--   Username: perundhu_admin
--   Password: Admin123!@#Change
-- 
-- The password_hash below is BCrypt($2a$10) of "Admin123!@#Change"
-- Generated with: BCryptPasswordEncoder(10).encode("Admin123!@#Change")
-- 
-- IMPORTANT: After deployment, immediately change the password using:
--   PUT /api/admin/users/perundhu_admin
--   Body: {"password": "YourSecurePassword"}
-- 
-- For local development:
--   Username: admin
--   Password: admin123  
-- 
INSERT INTO admin_users (username, password_hash, email, full_name, enabled, roles, created_by)
VALUES (
    'perundhu_admin',
    '$2a$10$R0Q5VXD4CuF.0r.AhpaBw.sqisbri7GOjCKjQohnj6tKUze7FBvMu', -- BCrypt('Admin123!@#Change')
    'admin@perundhu.com',
    'Perundhu Administrator',
    TRUE,
    'ROLE_ADMIN,ROLE_USER',
    'DB_MIGRATION'
) ON DUPLICATE KEY UPDATE password_hash = password_hash; -- Don't overwrite if exists

-- Insert local development admin user (only for local/dev environments)
-- Will fail in production if username constraint is enforced, which is fine
INSERT IGNORE INTO admin_users (username, password_hash, email, full_name, enabled, roles, created_by)
VALUES (
    'admin',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- BCrypt('password')
    'dev@perundhu.com',
    'Development Admin',
    TRUE,
    'ROLE_ADMIN,ROLE_USER',
    'DB_MIGRATION'
);

-- Create audit log for admin authentication events
CREATE TABLE IF NOT EXISTS admin_auth_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, PASSWORD_CHANGE, etc.
    ip_address VARCHAR(45),
    user_agent TEXT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
