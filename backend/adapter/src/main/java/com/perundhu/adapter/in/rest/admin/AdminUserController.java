package com.perundhu.adapter.in.rest.admin;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Admin User Management API
 * 
 * Provides CRUD operations for admin users without requiring redeployment.
 * All endpoints require ROLE_ADMIN authentication.
 * 
 * Key Features:
 * - Create new admin users with BCrypt hashed passwords
 * - Update user details and passwords
 * - List all admin users (passwords excluded for security)
 * - Enable/disable users without deletion
 * - Delete admin users
 * - Test credentials without logging in
 * 
 * Security:
 * - All operations audit logged to admin_auth_events table
 * - Passwords hashed with BCrypt (strength 10)
 * - Cannot delete last enabled admin user (safety check)
 * - Credentials tested using constant-time comparison
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final DataSource dataSource;
    private final PasswordEncoder passwordEncoder;

    /**
     * List all admin users (excludes password hashes for security)
     */
    @GetMapping
    public ResponseEntity<?> listUsers() {
        try {
            JdbcTemplate jdbc = new JdbcTemplate(dataSource);
            List<Map<String, Object>> users = jdbc.queryForList(
                "SELECT id, username, email, full_name, enabled, roles, " +
                "created_at, updated_at, last_login_at " +
                "FROM admin_users ORDER BY username"
            );
            
            log.info("Listed {} admin users", users.size());
            return ResponseEntity.ok(Map.of("users", users));
            
        } catch (Exception e) {
            log.error("Failed to list admin users", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to list users: " + e.getMessage()));
        }
    }

    /**
     * Get specific admin user by username
     */
    @GetMapping("/{username}")
    public ResponseEntity<?> getUser(@PathVariable String username) {
        try {
            JdbcTemplate jdbc = new JdbcTemplate(dataSource);
            List<Map<String, Object>> users = jdbc.queryForList(
                "SELECT id, username, email, full_name, enabled, roles, " +
                "created_at, updated_at, last_login_at " +
                "FROM admin_users WHERE username = ?",
                username
            );
            
            if (users.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
            }
            
            return ResponseEntity.ok(users.get(0));
            
        } catch (Exception e) {
            log.error("Failed to get user: {}", username, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get user: " + e.getMessage()));
        }
    }

    /**
     * Create new admin user
     */
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody CreateUserRequest request) {
        try {
            // Validate request
            if (isBlank(request.username) || isBlank(request.password)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Username and password are required"));
            }

            JdbcTemplate jdbc = new JdbcTemplate(dataSource);
            
            // Check if username already exists
            Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM admin_users WHERE username = ?",
                Integer.class,
                request.username
            );
            
            if (count != null && count > 0) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Username already exists"));
            }

            // Hash password with BCrypt
            String passwordHash = passwordEncoder.encode(request.password);

            // Insert new user
            jdbc.update(
                "INSERT INTO admin_users (username, password_hash, email, full_name, enabled, roles, created_by) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                request.username,
                passwordHash,
                request.email != null ? request.email : "admin@perundhu.com",
                request.fullName != null ? request.fullName : request.username,
                request.enabled != null ? request.enabled : true,
                request.roles != null ? request.roles : "ROLE_ADMIN,ROLE_USER",
                "ADMIN_API"
            );

            log.info("✅ Created admin user: {}", request.username);
            auditLog(request.username, "USER_CREATED", "Created via API");

            return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                    "message", "User created successfully",
                    "username", request.username
                ));
            
        } catch (Exception e) {
            log.error("Failed to create user", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to create user: " + e.getMessage()));
        }
    }

    /**
     * Update admin user (password, email, roles, etc.)
     */
    @PutMapping("/{username}")
    public ResponseEntity<?> updateUser(
            @PathVariable String username,
            @RequestBody UpdateUserRequest request) {
        try {
            JdbcTemplate jdbc = new JdbcTemplate(dataSource);
            
            // Check if user exists
            Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM admin_users WHERE username = ?",
                Integer.class,
                username
            );
            
            if (count == null || count == 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
            }

            // Build dynamic update query
            StringBuilder sql = new StringBuilder("UPDATE admin_users SET updated_at = ?, updated_by = ?");
            List<Object> params = new java.util.ArrayList<>();
            params.add(new Timestamp(System.currentTimeMillis()));
            params.add("ADMIN_API");

            if (request.password != null && !request.password.isBlank()) {
                sql.append(", password_hash = ?");
                params.add(passwordEncoder.encode(request.password));
            }

            if (request.email != null) {
                sql.append(", email = ?");
                params.add(request.email);
            }

            if (request.fullName != null) {
                sql.append(", full_name = ?");
                params.add(request.fullName);
            }

            if (request.enabled != null) {
                sql.append(", enabled = ?");
                params.add(request.enabled);
            }

            if (request.roles != null) {
                sql.append(", roles = ?");
                params.add(request.roles);
            }

            sql.append(" WHERE username = ?");
            params.add(username);

            jdbc.update(sql.toString(), params.toArray());

            log.info("✅ Updated admin user: {}", username);
            auditLog(username, "USER_UPDATED", "Updated via API");

            return ResponseEntity.ok(Map.of(
                "message", "User updated successfully",
                "username", username
            ));
            
        } catch (Exception e) {
            log.error("Failed to update user: {}", username, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to update user: " + e.getMessage()));
        }
    }

    /**
     * Delete admin user (with safety check - cannot delete last enabled admin)
     */
    @DeleteMapping("/{username}")
    public ResponseEntity<?> deleteUser(@PathVariable String username) {
        try {
            JdbcTemplate jdbc = new JdbcTemplate(dataSource);
            
            // Safety check: Don't delete last enabled admin user
            Integer enabledCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM admin_users WHERE enabled = true",
                Integer.class
            );
            
            if (enabledCount != null && enabledCount <= 1) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Cannot delete last enabled admin user"));
            }

            int deleted = jdbc.update("DELETE FROM admin_users WHERE username = ?", username);
            
            if (deleted == 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
            }

            log.info("✅ Deleted admin user: {}", username);
            auditLog(username, "USER_DELETED", "Deleted via API");

            return ResponseEntity.ok(Map.of(
                "message", "User deleted successfully",
                "username", username
            ));
            
        } catch (Exception e) {
            log.error("Failed to delete user: {}", username, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to delete user: " + e.getMessage()));
        }
    }

    /**
     * Test credentials without logging in (useful for validation)
     */
    @PostMapping("/test-credentials")
    public ResponseEntity<?> testCredentials(@RequestBody TestCredentialsRequest request) {
        try {
            if (isBlank(request.username) || isBlank(request.password)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Username and password are required"));
            }

            JdbcTemplate jdbc = new JdbcTemplate(dataSource);
            
            // Get user's password hash
            List<Map<String, Object>> users = jdbc.queryForList(
                "SELECT password_hash, enabled FROM admin_users WHERE username = ?",
                request.username
            );
            
            if (users.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "valid", false,
                    "reason", "User not found"
                ));
            }

            Map<String, Object> user = users.get(0);
            String storedHash = (String) user.get("password_hash");
            Boolean enabled = (Boolean) user.get("enabled");

            // Check password using BCrypt constant-time comparison
            boolean passwordMatches = passwordEncoder.matches(request.password, storedHash);

            if (!passwordMatches) {
                auditLog(request.username, "CREDENTIAL_TEST_FAILED", "Invalid password");
                return ResponseEntity.ok(Map.of(
                    "valid", false,
                    "reason", "Invalid password"
                ));
            }

            if (Boolean.FALSE.equals(enabled)) {
                auditLog(request.username, "CREDENTIAL_TEST_FAILED", "Account disabled");
                return ResponseEntity.ok(Map.of(
                    "valid", false,
                    "reason", "Account is disabled"
                ));
            }

            auditLog(request.username, "CREDENTIAL_TEST_SUCCESS", "Valid credentials");
            return ResponseEntity.ok(Map.of(
                "valid", true,
                "username", request.username,
                "message", "Credentials are valid"
            ));
            
        } catch (Exception e) {
            log.error("Failed to test credentials", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to test credentials: " + e.getMessage()));
        }
    }

    /**
     * Log admin authentication event to audit table
     */
    private void auditLog(String username, String eventType, String details) {
        try {
            JdbcTemplate jdbc = new JdbcTemplate(dataSource);
            jdbc.update(
                "INSERT INTO admin_auth_events (username, event_type, details) VALUES (?, ?, ?)",
                username, eventType, details
            );
        } catch (Exception e) {
            log.error("Failed to log audit event", e);
        }
    }

    private boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }

    @Data
    public static class CreateUserRequest {
        private String username;
        private String password;
        private String email;
        private String fullName;
        private String roles;
        private Boolean enabled;
    }

    @Data
    public static class UpdateUserRequest {
        private String password;
        private String email;
        private String fullName;
        private String roles;
        private Boolean enabled;
    }

    @Data
    public static class TestCredentialsRequest {
        private String username;
        private String password;
    }
}
