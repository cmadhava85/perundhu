package com.perundhu.application.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.domain.model.UserTrackingSession;
import com.perundhu.domain.port.UserTrackingSessionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for user tracking session management
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserTrackingService {

    private final UserTrackingSessionRepository userTrackingSessionRepository;

    /**
     * Get all tracking sessions for a user
     *
     * @param userId The ID of the user
     * @return List of user tracking sessions
     */
    public List<UserTrackingSession> getUserSessions(String userId) {
        return userTrackingSessionRepository.findByUserId(userId);
    }

    /**
     * Start a new tracking session
     *
     * @param session The session to start
     * @return The saved session with ID
     */
    @Transactional
    public UserTrackingSession startSession(UserTrackingSession session) {
        log.info("Starting new tracking session for user: {}, bus: {}",
                session.getUserId(), session.getBusId());

        // Ensure start time is set
        if (session.getStartTime() == null) {
            session.setStartTime(LocalDateTime.now());
        }

        return userTrackingSessionRepository.save(session);
    }

    /**
     * End an existing tracking session
     *
     * @param sessionId The ID of the session to end
     * @param endLocationId The ID of the end location
     * @return The updated session, or empty if not found
     */
    @Transactional
    public Optional<UserTrackingSession> endSession(Long sessionId, Long endLocationId) {
        log.info("Ending tracking session: {} at location: {}", sessionId, endLocationId);

        Optional<UserTrackingSession> existingSession = userTrackingSessionRepository.findById(sessionId);

        if (existingSession.isPresent()) {
            UserTrackingSession session = existingSession.get();
            session.setEndLocationId(endLocationId);
            session.setEndTime(LocalDateTime.now());

            return Optional.of(userTrackingSessionRepository.save(session));
        }

        return Optional.empty();
    }

    /**
     * Get a session by ID
     *
     * @param id The session ID
     * @return The session if found
     */
    public Optional<UserTrackingSession> getSessionById(Long id) {
        return userTrackingSessionRepository.findById(id);
    }
}
