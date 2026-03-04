package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.UserTrackingSession;

public interface UserTrackingSessionRepository {
    UserTrackingSession save(UserTrackingSession session);
    Optional<UserTrackingSession> findById(Long id);
    Optional<UserTrackingSession> findBySessionId(String sessionId);
    List<UserTrackingSession> findAll();
    void deleteById(Long id);

    List<UserTrackingSession> findByUserId(String userId);

    /**
     * Count distinct sessions that started after the given time.
     * Used for real daily-user stats on the public stats endpoint.
     *
     * @param since lower bound (exclusive) for session start time
     * @return count of distinct sessions
     */
    long countDistinctSessionsAfter(java.time.LocalDateTime since);
}
