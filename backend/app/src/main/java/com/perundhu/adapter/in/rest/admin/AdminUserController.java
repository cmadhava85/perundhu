package com.perundhu.adapter.in.rest.admin;

import com.perundhu.domain.model.AdminUser;
import com.perundhu.domain.port.in.AdminUserManagementInputPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Admin User Management REST API
 * 
 * Following hexagonal architecture - depends ONLY on InputPort interface
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
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserManagementInputPort adminUserManagement;

    /**
     * List all admin users (excludes password hashes for security)
     */
    @GetMapping
    public ResponseEntity<?> listUsers() {
        try {
            List<AdminUser> users = adminUserManagement.listAllUsers();
            
            // Map to DTOs (exclude password hashes)
            List<AdminUserDTO> dtos = users.stream()
                    .map(this::toDTO)
                    .toList();
            
            log.info("Listed {} admin users", dtos.size());
            return ResponseEntity.ok(Map.of("users", dtos));
            
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
            Optional<AdminUser> userOpt = adminUserManagement.getUserByUsername(username);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
            }
            
            return ResponseEntity.ok(toDTO(userOpt.get()));
            
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

            // Create user using application service
            AdminUser created = adminUserManagement.createUser(
                    request.username,
                    request.password,
                    request.email != null ? request.email : "admin@perundhu.com",
                    request.fullName != null ? request.fullName : request.username,
                    request.roles != null ? request.roles : "ROLE_ADMIN,ROLE_USER",
                    "ADMIN_API"
            );

            log.info("✅ Created admin user: {}", created.getUsername());

            return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                    "message", "User created successfully",
                    "username", created.getUsername()
                ));
            
        } catch (IllegalArgumentException e) {
            log.warn("Failed to create user: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", e.getMessage()));
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
            // Update using application service
            AdminUser updated;
            
            if (request.password != null && !request.password.isBlank()) {
                // Password update
                updated = adminUserManagement.updatePassword(username, request.password, "ADMIN_API");
                
                // Also update other fields if provided
                if (request.email != null || request.fullName != null || 
                    request.roles != null || request.enabled != null) {
                    updated = adminUserManagement.updateUser(
                            username,
                            request.email,
                            request.fullName,
                            request.roles,
                            request.enabled,
                            "ADMIN_API"
                    );
                }
            } else {
                // Non-password update
                updated = adminUserManagement.updateUser(
                        username,
                        request.email,
                        request.fullName,
                        request.roles,
                        request.enabled,
                        "ADMIN_API"
                );
            }

            log.info("✅ Updated admin user: {}", username);

            return ResponseEntity.ok(Map.of(
                "message", "User updated successfully",
                "username", updated.getUsername()
            ));
            
        } catch (IllegalArgumentException e) {
            log.warn("User not found: {}", username);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Cannot update user: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", e.getMessage()));
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
            // Delete using application service (includes safety check)
            adminUserManagement.deleteUser(username, "ADMIN_API");

            log.info("✅ Deleted admin user: {}", username);

            return ResponseEntity.ok(Map.of(
                "message", "User deleted successfully",
                "username", username
            ));
            
        } catch (IllegalArgumentException e) {
            log.warn("User not found: {}", username);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Cannot delete user: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", e.getMessage()));
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

            // Validate using application service (includes audit logging)
            boolean isValid = adminUserManagement.validateCredentials(
                    request.username,
                    request.password
            );

            if (!isValid) {
                return ResponseEntity.ok(Map.of(
                    "valid", false,
                    "reason", "Invalid credentials or account disabled"
                ));
            }

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
     * Map domain model to DTO (exclude password hash)
     */
    private AdminUserDTO toDTO(AdminUser user) {
        AdminUserDTO dto = new AdminUserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setEnabled(user.isEnabled());
        dto.setRoles(String.join(",", user.getRoles()));
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setLastLoginAt(user.getLastLoginAt());
        return dto;
    }

    private boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }

    /**
     * DTO for exposing admin user data (excludes password hash)
     */
    @Data
    public static class AdminUserDTO {
        private Long id;
        private String username;
        private String email;
        private String fullName;
        private boolean enabled;
        private String roles;  // Comma-separated
        private java.time.LocalDateTime createdAt;
        private java.time.LocalDateTime updatedAt;
        private java.time.LocalDateTime lastLoginAt;
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
