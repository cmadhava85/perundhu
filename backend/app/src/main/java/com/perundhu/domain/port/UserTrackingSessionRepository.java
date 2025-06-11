package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.UserTrackingSession;

/**
 * Repository port interface for UserTrackingSession entity
 */
public interface UserTrackingSessionRepository {

    /**
     * Save a user tracking session
     *
     * @param session The session to save
     * @return The saved session with ID
     */
    UserTrackingSession save(UserTrackingSession session);

    /**
     * Find a user tracking session by ID
     *
     * @param id The ID to search for
     * @return An Optional containing the session if found
     */
    Optional<UserTrackingSession> findById(Long id);

    /**
     * Find all tracking sessions for a specific user
     *
     * @param userId The user ID
     * @return List of tracking sessions for the user
     */
    List<UserTrackingSession> findByUserId(String userId);

    /**
     * Find all user tracking sessions
     *
     * @return List of all tracking sessions
     */
    List<UserTrackingSession> findAll();

    /**
     * Delete a user tracking session by ID
     *
     * @param id The ID of the session to delete
     */
    void deleteById(Long id);
}
