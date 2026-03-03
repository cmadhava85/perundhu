package com.perundhu.domain.port.out;

import com.perundhu.domain.model.AdminUser;

import java.util.List;
import java.util.Optional;

/**
 * Output port for admin user persistence
 * Following hexagonal architecture - defines how the application accesses data
 */
public interface AdminUserManagementOutputPort {

    /**
     * Find admin user by ID
     */
    Optional<AdminUser> findById(Long id);

    /**
     * Find admin user by username
     */
    Optional<AdminUser> findByUsername(String username);

    /**
     * Find all admin users
     */
    List<AdminUser> findAll();

    /**
     * Save admin user (create or update)
     */
    AdminUser save(AdminUser user);

    /**
     * Delete admin user by ID
     */
    void deleteById(Long id);

    /**
     * Count enabled admin users
     */
    long countEnabledUsers();

    /**
     * Log authentication event
     *
     * @param username Username
     * @param event    Event type (LOGIN_SUCCESS, LOGIN_FAILURE, PASSWORD_CHANGE, etc.)
     * @param success  Whether the event was successful
     * @param details  Additional details
     */
    void logAuthEvent(String username, String event, boolean success, String details);
}
