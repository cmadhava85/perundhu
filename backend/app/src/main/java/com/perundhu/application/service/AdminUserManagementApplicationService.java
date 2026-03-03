package com.perundhu.application.service;

import com.perundhu.domain.model.AdminUser;
import com.perundhu.domain.port.in.AdminUserManagementInputPort;
import com.perundhu.domain.port.out.AdminUserManagementOutputPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Application service for admin user management
 * Implements business logic using only domain ports
 */
@Service
@Transactional
public class AdminUserManagementApplicationService implements AdminUserManagementInputPort {

    private final AdminUserManagementOutputPort persistencePort;
    private final PasswordEncoder passwordEncoder;

    public AdminUserManagementApplicationService(
            AdminUserManagementOutputPort persistencePort,
            PasswordEncoder passwordEncoder) {
        this.persistencePort = persistencePort;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public List<AdminUser> listAllUsers() {
        return persistencePort.findAll();
    }

    @Override
    public Optional<AdminUser> getUserByUsername(String username) {
        return persistencePort.findByUsername(username);
    }

    @Override
    public AdminUser createUser(String username, String password, String email,
                                String fullName, String roles, String createdBy) {
        // Validate username is unique
        if (persistencePort.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("Username already exists: " + username);
        }

        // Hash password
        String passwordHash = passwordEncoder.encode(password);

        // Parse roles
        List<String> roleList = parseRoles(roles);

        // Create domain model
        AdminUser newUser = new AdminUser(
                null,  // ID will be generated
                username,
                passwordHash,
                email,
                fullName,
                true,  // enabled by default
                roleList,
                LocalDateTime.now(),
                LocalDateTime.now(),
                null,  // lastLoginAt
                createdBy
        );

        // Save and log
        AdminUser saved = persistencePort.save(newUser);
        persistencePort.logAuthEvent(username, "USER_CREATED", true, "Created by: " + createdBy);

        return saved;
    }

    @Override
    public AdminUser updatePassword(String username, String newPassword, String updatedBy) {
        AdminUser user = persistencePort.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        // Hash new password
        String passwordHash = passwordEncoder.encode(newPassword);

        // Update using factory method
        AdminUser updated = user.withPassword(passwordHash);

        // Save and log
        AdminUser saved = persistencePort.save(updated);
        persistencePort.logAuthEvent(username, "PASSWORD_CHANGED", true, "Changed by: " + updatedBy);

        return saved;
    }

    @Override
    public AdminUser updateUser(String username, String email, String fullName,
                                String roles, Boolean enabled, String updatedBy) {
        AdminUser user = persistencePort.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        // Apply updates using factory methods
        AdminUser updated = user;

        if (enabled != null && enabled != user.isEnabled()) {
            // Safety check: cannot disable last enabled admin
            if (!enabled && persistencePort.countEnabledUsers() <= 1) {
                throw new IllegalStateException("Cannot disable the last enabled admin user");
            }
            updated = updated.withEnabled(enabled);
        }

        if (roles != null) {
            List<String> roleList = parseRoles(roles);
            updated = new AdminUser(
                    updated.getId(),
                    updated.getUsername(),
                    updated.getPasswordHash(),
                    email != null ? email : updated.getEmail(),
                    fullName != null ? fullName : updated.getFullName(),
                    updated.isEnabled(),
                    roleList,
                    updated.getCreatedAt(),
                    LocalDateTime.now(),
                    updated.getLastLoginAt(),
                    updated.getCreatedBy()
            );
        } else if (email != null || fullName != null) {
            updated = new AdminUser(
                    updated.getId(),
                    updated.getUsername(),
                    updated.getPasswordHash(),
                    email != null ? email : updated.getEmail(),
                    fullName != null ? fullName : updated.getFullName(),
                    updated.isEnabled(),
                    updated.getRoles(),
                    updated.getCreatedAt(),
                    LocalDateTime.now(),
                    updated.getLastLoginAt(),
                    updated.getCreatedBy()
            );
        }

        // Save and log
        AdminUser saved = persistencePort.save(updated);
        persistencePort.logAuthEvent(username, "USER_UPDATED", true, "Updated by: " + updatedBy);

        return saved;
    }

    @Override
    public void deleteUser(String username, String performedBy) {
        AdminUser user = persistencePort.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        // Safety check: cannot delete last enabled admin
        if (user.isEnabled() && persistencePort.countEnabledUsers() <= 1) {
            throw new IllegalStateException("Cannot delete the last enabled admin user");
        }

        // Delete and log
        persistencePort.deleteById(user.getId());
        persistencePort.logAuthEvent(username, "USER_DELETED", true, "Deleted by: " + performedBy);
    }

    @Override
    public boolean validateCredentials(String username, String password) {
        Optional<AdminUser> userOpt = persistencePort.findByUsername(username);

        if (userOpt.isEmpty()) {
            persistencePort.logAuthEvent(username, "LOGIN_FAILURE", false, "User not found");
            return false;
        }

        AdminUser user = userOpt.get();

        if (!user.isEnabled()) {
            persistencePort.logAuthEvent(username, "LOGIN_FAILURE", false, "User disabled");
            return false;
        }

        boolean matches = passwordEncoder.matches(password, user.getPasswordHash());

        if (matches) {
            // Update last login time
            AdminUser updated = user.withLastLogin(LocalDateTime.now());
            persistencePort.save(updated);
            persistencePort.logAuthEvent(username, "LOGIN_SUCCESS", true, "Successful login");
        } else {
            persistencePort.logAuthEvent(username, "LOGIN_FAILURE", false, "Invalid password");
        }

        return matches;
    }

    @Override
    public long countEnabledUsers() {
        return persistencePort.countEnabledUsers();
    }

    /**
     * Parse comma-separated roles string into list
     */
    private List<String> parseRoles(String roles) {
        if (roles == null || roles.isBlank()) {
            return List.of("ROLE_USER");
        }
        return Arrays.stream(roles.split(","))
                .map(String::trim)
                .filter(r -> !r.isEmpty())
                .toList();
    }
}
