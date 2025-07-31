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
}
