package com.perundhu.infrastructure.config;

import javax.sql.DataSource;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Admin User Database Validator
 * 
 * IMPORTANT: This component does NOT sync from environment variables.
 * Admin credentials are managed ONLY through the database (admin_users table).
 * 
 * Purpose:
 * - Validates that admin_users table exists and has at least one enabled admin
 * - Logs helpful messages if no admin users found
 * - Provides instructions for creating admin users via database
 * 
 * Database is the ONLY source of truth for authentication.
 * No environment variables or properties files control admin passwords.
 * 
 * To manage admin users:
 * 1. Default admin created by V100 migration: perundhu_admin / Admin123!@#Change
 * 2. Change password via API: PUT /api/admin/users/perundhu_admin
 * 3. Create new admins via API: POST /api/admin/users
 * 4. Or insert directly into admin_users table with BCrypt hashed password
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminUserInitializer implements ApplicationRunner {

    private final DataSource dataSource;

    @Override
    public void run(ApplicationArguments args) {
        try {
            JdbcTemplate jdbc = new JdbcTemplate(dataSource);
            
            // Check if admin_users table exists and has enabled users
            Integer enabledCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM admin_users WHERE enabled = true",
                Integer.class
            );

            if (enabledCount == null || enabledCount == 0) {
                log.error("⚠️  CRITICAL: No enabled admin users found in database!");
                log.error("⚠️  Admin authentication will NOT work until you create an admin user.");
                log.error("");
                log.error("📋 To create an admin user, run this SQL:");
                log.error("   INSERT INTO admin_users (username, password_hash, enabled, roles, created_by)");
                log.error("   VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, 'ROLE_ADMIN,ROLE_USER', 'MANUAL');");
                log.error("   -- Password: 'password' (change immediately!)");
                log.error("");
                log.error("🔐 Or use the admin API after first boot to create users.");
            } else {
                log.info("✅ Found {} enabled admin user(s) in database", enabledCount);
                log.info("✅ Admin authentication using database-backed storage (JdbcUserDetailsManager)");
                log.info("✅ Manage users via /api/admin/users API (no redeployment needed)");
                
                // Log usernames for visibility (not passwords!)
                var users = jdbc.queryForList(
                    "SELECT username FROM admin_users WHERE enabled = true ORDER BY username"
                );
                log.info("📋 Enabled admin users: {}", 
                    users.stream()
                        .map(row -> row.get("username").toString())
                        .toList()
                );
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to validate admin users in database", e);
            log.error("⚠️  Admin authentication may not work!");
        }
    }
}
