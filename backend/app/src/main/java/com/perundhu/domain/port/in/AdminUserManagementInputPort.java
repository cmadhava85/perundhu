package com.perundhu.domain.port.in;

import com.perundhu.domain.model.AdminUser;

import java.util.List;
import java.util.Optional;

/**
 * Input port for admin user management use cases
 * Following hexagonal architecture - defines what the application can do
 */
public interface AdminUserManagementInputPort {

    /**
     * List all admin users
     */
    List<AdminUser> listAllUsers();

    /**
     * Get admin user by username
     */
    Optional<AdminUser> getUserByUsername(String username);

    /**
     * Create new admin user
     *
     * @param username    Unique username
     * @param password    Plain text password (will be hashed)
     * @param email       User email
     * @param fullName    Full name
     * @param roles       Comma-separated roles (e.g., "ROLE_ADMIN,ROLE_USER")
     * @param createdBy   Username of creator
     * @return Created admin user
     */
    AdminUser createUser(String username, String password, String email,
                        String fullName, String roles, String createdBy);

    /**
     * Update admin user password
     *
     * @param username    Username
     * @param newPassword Plain text new password (will be hashed)
     * @param updatedBy   Username of updater
     * @return Updated admin user
     */
    AdminUser updatePassword(String username, String newPassword, String updatedBy);

    /**
     * Update admin user details
     *
     * @param username  Username
     * @param email     New email (optional)
     * @param fullName  New full name (optional)
     * @param roles     New roles (optional)
     * @param enabled   New enabled status (optional)
     * @param updatedBy Username of updater
     * @return Updated admin user
     */
    AdminUser updateUser(String username, String email, String fullName,
                        String roles, Boolean enabled, String updatedBy);

    /**
     * Delete admin user
     *
     * @param username   Username to delete
     * @param performedBy Username of person performing deletion
     * @throws IllegalStateException if this is the last enabled admin user
     */
    void deleteUser(String username, String performedBy);

    /**
     * Test if credentials are valid
     *
     * @param username Username
     * @param password Plain text password
     * @return true if credentials are valid
     */
    boolean validateCredentials(String username, String password);

    /**
     * Count enabled admin users
     */
    long countEnabledUsers();
}
