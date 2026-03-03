package com.perundhu.domain.model;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Domain model for admin user (NO framework annotations)
 * Pure business logic following hexagonal architecture
 */
public class AdminUser {
    private final Long id;
    private final String username;
    private final String passwordHash;
    private final String email;
    private final String fullName;
    private final boolean enabled;
    private final List<String> roles;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final LocalDateTime lastLoginAt;
    private final String createdBy;

    public AdminUser(Long id, String username, String passwordHash, String email,
                     String fullName, boolean enabled, List<String> roles,
                     LocalDateTime createdAt, LocalDateTime updatedAt,
                     LocalDateTime lastLoginAt, String createdBy) {
        // Validation
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username cannot be blank");
        }
        if (passwordHash == null || passwordHash.isBlank()) {
            throw new IllegalArgumentException("Password hash cannot be blank");
        }
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Valid email is required");
        }
        
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.email = email;
        this.fullName = fullName;
        this.enabled = enabled;
        this.roles = roles != null ? List.copyOf(roles) : List.of();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.lastLoginAt = lastLoginAt;
        this.createdBy = createdBy;
    }

    // Business logic methods
    public boolean hasRole(String role) {
        return roles.contains(role);
    }

    public boolean isActive() {
        return enabled;
    }

    public boolean isAdministrator() {
        return hasRole("ROLE_ADMIN");
    }

    // Getters only (immutable domain model)
    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getEmail() {
        return email;
    }

    public String getFullName() {
        return fullName;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public List<String> getRoles() {
        return roles;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public LocalDateTime getLastLoginAt() {
        return lastLoginAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    // Factory methods for creating new instances with changes
    public AdminUser withPassword(String newPasswordHash) {
        return new AdminUser(id, username, newPasswordHash, email, fullName,
                enabled, roles, createdAt, LocalDateTime.now(), lastLoginAt, createdBy);
    }

    public AdminUser withEnabled(boolean newEnabled) {
        return new AdminUser(id, username, passwordHash, email, fullName,
                newEnabled, roles, createdAt, LocalDateTime.now(), lastLoginAt, createdBy);
    }

    public AdminUser withLastLogin(LocalDateTime loginTime) {
        return new AdminUser(id, username, passwordHash, email, fullName,
                enabled, roles, createdAt, updatedAt, loginTime, createdBy);
    }
}
