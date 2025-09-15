package com.perundhu.infrastructure.persistence.jpa;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.UserTrackingSessionEntity;

@Repository
public interface UserTrackingSessionJpaRepository extends JpaRepository<UserTrackingSessionEntity, Long> {

  /**
   * Find tracking session by session ID
   */
  Optional<UserTrackingSessionEntity> findBySessionId(String sessionId);

  /**
   * Find all tracking sessions for a user
   */
  List<UserTrackingSessionEntity> findByUserId(String userId);

  /**
   * Find tracking sessions by bus ID
   */
  List<UserTrackingSessionEntity> findByBusId(Long busId);

  /**
   * Find active tracking sessions (no end time)
   */
  @Query("SELECT uts FROM UserTrackingSessionEntity uts WHERE uts.endTime IS NULL")
  List<UserTrackingSessionEntity> findActiveSessions();

  /**
   * Find tracking sessions within a time range
   */
  @Query("SELECT uts FROM UserTrackingSessionEntity uts WHERE " +
      "uts.startTime BETWEEN :startTime AND :endTime")
  List<UserTrackingSessionEntity> findByStartTimeBetween(
      @Param("startTime") LocalDateTime startTime,
      @Param("endTime") LocalDateTime endTime);

  /**
   * Find tracking sessions for a user and bus
   */
  List<UserTrackingSessionEntity> findByUserIdAndBusId(String userId, Long busId);

  /**
   * Find tracking sessions by start location
   */
  List<UserTrackingSessionEntity> findByStartLocationId(Long startLocationId);

  /**
   * Find tracking sessions by end location
   */
  List<UserTrackingSessionEntity> findByEndLocationId(Long endLocationId);

  /**
   * Count active sessions for a user
   */
  @Query("SELECT COUNT(uts) FROM UserTrackingSessionEntity uts WHERE " +
      "uts.userId = :userId AND uts.endTime IS NULL")
  long countActiveSessionsByUserId(@Param("userId") String userId);

  /**
   * Find sessions by IP address (for analytics)
   */
  List<UserTrackingSessionEntity> findByIpAddress(String ipAddress);

  /**
   * Delete old completed sessions before a certain date
   */
  @Query("DELETE FROM UserTrackingSessionEntity uts WHERE " +
      "uts.endTime IS NOT NULL AND uts.endTime < :cutoffDate")
  void deleteCompletedSessionsBefore(@Param("cutoffDate") LocalDateTime cutoffDate);

  /**
   * Find sessions that have been active for too long (potential cleanup)
   */
  @Query("SELECT uts FROM UserTrackingSessionEntity uts WHERE " +
      "uts.endTime IS NULL AND uts.startTime < :cutoffTime")
  List<UserTrackingSessionEntity> findStaleActiveSessions(@Param("cutoffTime") LocalDateTime cutoffTime);
}