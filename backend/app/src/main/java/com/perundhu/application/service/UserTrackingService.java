package com.perundhu.application.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.domain.model.UserTrackingSession;
import com.perundhu.domain.port.UserTrackingSessionRepository;

/**
 * Service for user tracking session management
 */
@Service
public class UserTrackingService {

    private static final Logger log = LoggerFactory.getLogger(UserTrackingService.class);

    private final UserTrackingSessionRepository userTrackingSessionRepository;

    /**
     * Constructor for dependency injection
     * Replaces Lombok's @RequiredArgsConstructor
     */
    public UserTrackingService(UserTrackingSessionRepository userTrackingSessionRepository) {
        this.userTrackingSessionRepository = userTrackingSessionRepository;
    }

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
                session.userId(), session.busId());

        // Since the session is immutable, we ensure it has a start time by creating a
        // new instance if needed
        UserTrackingSession sessionToSave = (session.startTime() == null) ? UserTrackingSession.builder()
                .sessionId(session.sessionId())
                .userId(session.userId())
                .busId(session.busId())
                .startLocationId(session.startLocationId())
                .deviceInfo(session.deviceInfo())
                .ipAddress(session.ipAddress())
                .userAgent(session.userAgent())
                .startTime(LocalDateTime.now()) // Set the start time
                .build()
                : session;

        return userTrackingSessionRepository.save(sessionToSave);
    }

    /**
     * End an existing tracking session
     *
     * @param sessionId     The ID of the session to end
     * @param endLocationId The ID of the end location
     * @return The updated session, or empty if not found
     */
    @Transactional
    public Optional<UserTrackingSession> endSession(Long sessionId, Long endLocationId) {
        log.info("Ending tracking session: {} at location: {}", sessionId, endLocationId);

        Optional<UserTrackingSession> existingSession = userTrackingSessionRepository.findById(sessionId);

        if (existingSession.isPresent()) {
            UserTrackingSession session = existingSession.get();

            // Create a new session with the end data (immutable pattern)
            UserTrackingSession updatedSession = UserTrackingSession.builder()
                    .id(session.id())
                    .sessionId(session.sessionId())
                    .userId(session.userId())
                    .busId(session.busId())
                    .startLocationId(session.startLocationId())
                    .deviceInfo(session.deviceInfo())
                    .ipAddress(session.ipAddress())
                    .userAgent(session.userAgent())
                    .startTime(session.startTime())
                    .endTime(LocalDateTime.now())
                    .endLocationId(endLocationId)
                    .build();

            return Optional.of(userTrackingSessionRepository.save(updatedSession));
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
