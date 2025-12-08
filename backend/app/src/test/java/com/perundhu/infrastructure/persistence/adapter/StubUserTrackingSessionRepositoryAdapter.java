package com.perundhu.infrastructure.persistence.adapter;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import com.perundhu.domain.model.UserTrackingSession;
import com.perundhu.domain.port.UserTrackingSessionRepository;

/**
 * Stub implementation of UserTrackingSessionRepository for testing.
 * Uses in-memory storage instead of database.
 */
@Repository
@Profile("test")
public class StubUserTrackingSessionRepositoryAdapter implements UserTrackingSessionRepository {

    private final Map<Long, UserTrackingSession> sessions = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    @Override
    public UserTrackingSession save(UserTrackingSession session) {
        Long id = session.id() != null ? session.id() : idGenerator.getAndIncrement();
        UserTrackingSession savedSession = new UserTrackingSession(
            id,
            session.sessionId(),
            session.userId(),
            session.busId(),
            session.startLocationId(),
            session.deviceInfo(),
            session.ipAddress(),
            session.startTime(),
            session.endTime(),
            session.userAgent(),
            session.endLocationId()
        );
        sessions.put(id, savedSession);
        return savedSession;
    }

    @Override
    public Optional<UserTrackingSession> findById(Long id) {
        return Optional.ofNullable(sessions.get(id));
    }

    @Override
    public Optional<UserTrackingSession> findBySessionId(String sessionId) {
        return sessions.values().stream()
            .filter(s -> sessionId.equals(s.sessionId()))
            .findFirst();
    }

    @Override
    public List<UserTrackingSession> findAll() {
        return new ArrayList<>(sessions.values());
    }

    @Override
    public void deleteById(Long id) {
        sessions.remove(id);
    }

    @Override
    public List<UserTrackingSession> findByUserId(String userId) {
        return sessions.values().stream()
            .filter(s -> userId.equals(s.userId()))
            .toList();
    }

    /**
     * Clear all sessions - useful for test cleanup
     */
    public void clear() {
        sessions.clear();
        idGenerator.set(1);
    }
}
