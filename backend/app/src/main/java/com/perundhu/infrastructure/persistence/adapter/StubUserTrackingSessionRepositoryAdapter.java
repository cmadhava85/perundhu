package com.perundhu.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import com.perundhu.domain.model.UserTrackingSession;
import com.perundhu.domain.port.UserTrackingSessionRepository;

/**
 * Stub implementation of UserTrackingSessionRepository to satisfy dependency
 * injection
 * This is a temporary implementation to allow tests to pass
 */
@Repository
@Profile("test")
public class StubUserTrackingSessionRepositoryAdapter implements UserTrackingSessionRepository {

  @Override
  public UserTrackingSession save(UserTrackingSession session) {
    // Return the session with a generated ID if it doesn't have one
    if (session.id() == null) {
      return new UserTrackingSession(
          1L, // Generate a simple ID
          session.sessionId(),
          session.userId(),
          session.busId(),
          session.startLocationId(),
          session.deviceInfo(),
          session.ipAddress(),
          session.startTime(),
          session.endTime(),
          session.userAgent(),
          session.endLocationId());
    }
    return session;
  }

  @Override
  public Optional<UserTrackingSession> findById(Long id) {
    return Optional.empty();
  }

  @Override
  public Optional<UserTrackingSession> findBySessionId(String sessionId) {
    return Optional.empty();
  }

  @Override
  public List<UserTrackingSession> findAll() {
    return List.of();
  }

  @Override
  public void deleteById(Long id) {
    // No-op
  }

  @Override
  public List<UserTrackingSession> findByUserId(String userId) {
    return List.of();
  }
}